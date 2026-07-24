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
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'sipar20_super_secret_dev_key_jwt_token_auth';

export function isAdminUser(userRole: string): boolean {
  return [
    'gabinete_pca', 'gabinete_pce', 'gabinete_administrador', 'gabinete_director',
    'gabinete_ministro', 'gabinete_secretario_estado_1', 'gabinete_secretario_estado_2',
    'gabinete_vice_governador_1', 'gabinete_vice_governador_2',
    'gestao', 'admin'
  ].includes(userRole);
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

    if (authHeader.startsWith('Fornecedor ')) {
      const token = authHeader.split(' ')[1];
      const providerId = token.startsWith('fornecedor:') ? token.split(':')[1] : token;
      req.user = {
        id: providerId,
        email: `fornecedor_${providerId}@sistema.com`,
        name: 'Fornecedor Externo',
        role: 'externo'
      };
      return next();
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token nao fornecido' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };

    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!dbUser || dbUser.status !== 'active') {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Utilizador nao encontrado ou inativo' });
    }

    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      department: dbUser.department || undefined
    };

    next();
  } catch (error) {
    logger.warn('Token JWT invalido ou expirado:', error);
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token invalido ou expirado' });
  }
};

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || !isAdminUser(req.user.role)) {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Acesso negado - requer privilegios de administrador'
    });
  }
  next();
};

export const requireIT = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const isIT = req.user && (
    req.user.role === 'tecnologia_informacao' ||
    req.user.role === 'admin' ||
    req.user.department === 'Tecnologia da Informacao' ||
    req.user.department === 'Tecnologia da Informação' ||
    req.user.department === 'tecnologia_informacao'
  );

  if (!isIT) {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Acesso negado - requer acesso do departamento de TI'
    });
  }
  next();
};
