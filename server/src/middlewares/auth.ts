import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import logger from '../config/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    department?: string;
    departmentSlug?: string;
    sid?: string;
  };
}

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET nao definido. Configure a variavel de ambiente antes de iniciar o servidor.');
}

const JWT_SECRET = process.env.JWT_SECRET;

// Cache em memoria dos slugs de role marcados Role.executivo=true (ver
// schema.prisma e seed-rbac.ts). Substitui o array fixo de strings que
// existia antes - criar/marcar um role como executivo no admin real passa a
// refletir-se aqui sem alteracao de codigo, no maximo com um atraso de
// ate EXECUTIVE_ROLES_TTL_MS. Mesmo padrao de cache-com-TTL do
// LicenseService (ver license.service.ts).
const EXECUTIVE_ROLES_TTL_MS = 5 * 60 * 1000;
let executiveRolesCache: Set<string> | null = null;
let executiveRolesCachedAt = 0;

async function getExecutiveRoleSlugs(): Promise<Set<string>> {
  const now = Date.now();
  if (executiveRolesCache && now - executiveRolesCachedAt < EXECUTIVE_ROLES_TTL_MS) {
    return executiveRolesCache;
  }
  const rows = await prisma.role.findMany({ where: { executivo: true }, select: { slug: true } });
  executiveRolesCache = new Set(rows.map((r) => r.slug));
  executiveRolesCachedAt = now;
  return executiveRolesCache;
}

export async function isAdminUser(userRole: string): Promise<boolean> {
  const slugs = await getExecutiveRoleSlugs();
  return slugs.has(userRole);
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token nao fornecido' });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token nao fornecido' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; sid?: string };

    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { departmentRef: { select: { slug: true } } },
    });

    if (!dbUser || dbUser.status !== 'active') {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Utilizador nao encontrado ou inativo' });
    }

    // Tokens emitidos antes da sessao persistida existir (sem "sid") nao sao
    // verificados aqui - continuam validos ate expirarem naturalmente (no
    // maximo 1 dia, o TTL do access_token). Sessoes novas ganham revogacao
    // imediata: logout ou deteccao de reutilizacao de refresh_token cortam o
    // acesso no proximo pedido, nao so na proxima renovacao.
    if (decoded.sid) {
      const session = await prisma.userSession.findUnique({ where: { id: decoded.sid } });
      if (!session || session.revokedAt) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Sessão terminada. Por favor, faça login novamente.' });
      }
    }

    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      department: dbUser.department || undefined,
      departmentSlug: dbUser.departmentRef?.slug,
      sid: decoded.sid,
    };

    next();
  } catch (error) {
    logger.warn('Token JWT invalido ou expirado:', error);
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token invalido ou expirado' });
  }
};

export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || !(await isAdminUser(req.user.role))) {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Acesso negado - requer privilegios de administrador'
    });
  }
  next();
};

/**
 * Exclusivo do role tecnico "admin_sistema" - separa gestao de sistema
 * (utilizadores, departamentos, roles/permissoes, auditoria, base de dados,
 * configuracoes, email) do acesso dos executivos/gabinetes, que continuam
 * a gerir apenas os modulos de negocio.
 */
export const requireSystemAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== 'admin_sistema') {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Acesso negado - requer privilegios de administrador do sistema'
    });
  }
  next();
};

export const requireIT = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // Verifica pelo slug do departamento (imutavel, sobrevive a uma renomeacao
  // via o admin real), nao pelo nome livre - ver HC-07 na auditoria.
  const isIT = req.user && (
    req.user.role === 'tecnologia_informacao' ||
    req.user.role === 'admin' ||
    req.user.departmentSlug === 'tecnologia_informacao'
  );

  if (!isIT) {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Acesso negado - requer acesso do departamento de TI'
    });
  }
  next();
};
