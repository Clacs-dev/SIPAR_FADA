import { Request, Response, NextFunction } from 'express';
import { validarIban, validarNib } from '../utils/bank-format';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import logger from '../config/logger';
import { auditService } from '../services/audit.service';
import { notifications } from '../services/notification.service';
import { emailService } from '../services/email.service';
import { AuthenticatedRequest } from '../middlewares/auth';

const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias, igual ao refresh_token

function sha256Hex(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Remove a password do registo de utilizador antes de o devolver ao cliente,
 * e converte "bankAccounts" (JSON guardado como texto) num array real -
 * varias coordenadas bancarias guardadas por um utilizador externo
 * (fornecedor), para escolher qual usar ao submeter cada factura.
 */
function serializeUser(user: Record<string, any>) {
  const { password: _password, bankAccounts, ...rest } = user;
  let contas: any[] = [];
  if (typeof bankAccounts === 'string') {
    try { contas = JSON.parse(bankAccounts) || []; } catch { contas = []; }
  } else if (Array.isArray(bankAccounts)) {
    contas = bankAccounts;
  }
  return { ...rest, bankAccounts: contas };
}

function resetPasswordEmailHtml(nome: string, link: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
      <h2 style="color: #1e293b;">Recuperação de password - SIPAR</h2>
      <p>Olá <strong>${nome}</strong>,</p>
      <p>Recebemos um pedido de recuperação de password para a sua conta. Clique no botão abaixo para definir uma nova password.</p>
      <p style="margin: 24px 0;">
        <a href="${link}" style="background:#1e293b; color:#fff; padding:12px 22px; border-radius:6px; text-decoration:none; font-weight:600;">Definir nova password</a>
      </p>
      <p style="font-size: 13px; color: #666;">Este link expira em 1 hora e só pode ser usado uma vez. Se não pediu esta recuperação, ignore este e-mail — a sua password atual continua válida.</p>
    </div>
  `;
}

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error('JWT_SECRET/JWT_REFRESH_SECRET nao definidos. Configure as variaveis de ambiente antes de iniciar o servidor.');
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

/**
 * Controller para tratar de todos os fluxos de autenticação (JWT)
 */
export class AuthController {
  
  /**
   * Registro de um novo utilizador
   * @route POST /api/v1/auth/register
   */
  static async register(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    try {
      const {
        name,
        email,
        password,
        role,
        organization,
        phone,
        department,
        position,
        address,
        document
      } = req.body;

      if (!name || !email || !password || !role || !organization || !phone || !document) {
        return res.status(400).json({ error: 'TODOS_CAMPOS_OBRIGATORIOS', message: 'Todos os campos obrigatórios devem ser preenchidos' });
      }

      // Validar role
      if (!['user', 'attendant', 'requester'].includes(role)) {
        return res.status(400).json({ error: 'ROLE_INVALIDA', message: 'Tipo de utilizador inválido' });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Verificar se email já existe
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      });

      if (existingUser) {
        return res.status(409).json({ error: 'EMAIL_DUPLICADO', message: 'Este e-mail já está registrado no sistema' });
      }

      // Hash da senha com bcrypt
      const hashedPassword = await bcrypt.hash(password, 10);

      // Criar o utilizador no banco
      const newUser = await prisma.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          name: name.trim(),
          role: role === 'user' ? 'requester' : role, // normalizar user para requester se necessário
          organization: organization.trim(),
          phone,
          department: department?.trim() || '',
          position: position?.trim() || '',
          address: address?.trim() || '',
          document,
          status: role === 'attendant' ? 'pending' : 'active', // atendentes precisam de aprovação de admin
        }
      });

      // Gravar auditoria
      await auditService.logAction(
        'user_created',
        'info',
        { role, organization, needsApproval: role === 'attendant', duration: Date.now() - startTime },
        { userId: newUser.id, userEmail: normalizedEmail, userRole: newUser.role, ipAddress, userAgent, success: true }
      );

      // Notificações
      if (newUser.status === 'pending') {
        await notifications.createNotification(
          normalizedEmail,
          'account_created_pending',
          'Sua conta foi criada com sucesso! Aguarde aprovação de um administrador.',
          newUser.id
        );
      } else {
        await notifications.createNotification(
          normalizedEmail,
          'account_created',
          'Sua conta foi criada com sucesso! Você já pode fazer login no sistema.',
          newUser.id
        );
      }

      return res.status(201).json({
        success: true,
        message: newUser.status === 'pending'
          ? 'Conta criada com sucesso! Aguarde aprovação de um administrador para ter acesso completo.'
          : 'Conta criada com sucesso! Você já pode fazer login.',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status
        }
      });

    } catch (error) {
      logger.error('Erro no registro de utilizador:', error);
      next(error);
    }
  }

  /**
   * Login do utilizador
   * @route POST /api/v1/auth/login
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'CREDENCIAIS_INCOMPLETAS', message: 'E-mail e senha são obrigatórios' });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Buscar utilizador no banco
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      });

      if (!user) {
        await auditService.logAction(
          'user_login',
          'warning',
          { reason: 'User not found', duration: Date.now() - startTime },
          { userEmail: normalizedEmail, ipAddress, userAgent, success: false }
        );
        return res.status(401).json({ error: 'CREDENCIAIS_INVALIDAS', message: 'Credenciais inválidas' });
      }

      // Validar senha
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        await auditService.logAction(
          'user_login',
          'warning',
          { reason: 'Invalid password', duration: Date.now() - startTime },
          { userId: user.id, userEmail: normalizedEmail, ipAddress, userAgent, success: false }
        );
        return res.status(401).json({ error: 'CREDENCIAIS_INVALIDAS', message: 'Credenciais inválidas' });
      }

      // Verificar status da conta
      if (user.status !== 'active') {
        return res.status(403).json({
          error: 'CONTA_INATIVA',
          message: user.status === 'pending'
            ? 'Sua conta ainda está pendente de aprovação por um administrador.'
            : 'Sua conta está inativa ou suspensa. Entre em contato com o suporte.'
        });
      }

      // Bloquear papeis sem nenhum modulo funcional no sistema actual (ex: o
      // papel "operacional_frota"/motorista, criado exclusivamente para o
      // modulo Frotas, que foi removido). Sem este bloqueio o utilizador entra
      // e ve um menu generico (Actas, Compras, Facturas) que nao lhe diz
      // respeito, em vez de ser avisado para contactar o administrador.
      const ROLES_SEM_MODULO = ['operacional_frota'];
      if (ROLES_SEM_MODULO.includes(user.role)) {
        await auditService.logAction(
          'user_login',
          'warning',
          { reason: 'Role sem modulo funcional atribuido', role: user.role, duration: Date.now() - startTime },
          { userId: user.id, userEmail: normalizedEmail, userRole: user.role, ipAddress, userAgent, success: false }
        );
        return res.status(403).json({
          error: 'CONTA_SEM_MODULO',
          message: 'A sua conta não tem nenhum módulo activo atribuído neste momento. Contacte o administrador do sistema para reatribuir o seu perfil.'
        });
      }

      // Gerar tokens JWT, ligados a uma sessao persistida (permite revogar/
      // detetar reutilizacao de refresh_token - ver refresh() e logout()).
      const sid = crypto.randomUUID();
      const accessToken = jwt.sign({ id: user.id, email: user.email, sid }, JWT_SECRET, { expiresIn: '1d' });
      const refreshToken = jwt.sign({ id: user.id, email: user.email, sid }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

      await prisma.userSession.create({
        data: {
          id: sid,
          userId: user.id,
          refreshTokenHash: sha256Hex(refreshToken),
          userAgent,
          ipAddress,
          expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        },
      });

      // Atualizar last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      // Gravar auditoria
      await auditService.logAction(
        'user_login',
        'info',
        { loginMethod: 'email_password', duration: Date.now() - startTime },
        { userId: user.id, userEmail: normalizedEmail, userRole: user.role, ipAddress, userAgent, success: true }
      );

      // Remover senha da resposta
      const userWithoutPassword = serializeUser(user);

      return res.status(200).json({
        user: userWithoutPassword,
        session: {
          access_token: accessToken,
          refresh_token: refreshToken
        }
      });

    } catch (error) {
      logger.error('Erro no login de utilizador:', error);
      next(error);
    }
  }

  /**
   * Troca um refresh_token valido por um novo par de tokens (access + refresh),
   * sem exigir que o utilizador reintroduza a senha. Usado pelo frontend quando
   * o access_token expira (rotacao silenciosa de sessao).
   * @route POST /api/v1/auth/refresh
   */
  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refresh_token } = req.body;
      if (!refresh_token) {
        return res.status(400).json({ error: 'REFRESH_TOKEN_REQUERIDO', message: 'refresh_token e obrigatorio' });
      }

      let decoded: { id: string; email: string; sid?: string };
      try {
        decoded = jwt.verify(refresh_token, JWT_REFRESH_SECRET) as { id: string; email: string; sid?: string };
      } catch (error) {
        return res.status(401).json({ error: 'REFRESH_TOKEN_INVALIDO', message: 'Sessão expirada. Por favor, faça login novamente.' });
      }

      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user || user.status !== 'active') {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Utilizador não encontrado ou inativo' });
      }

      // Tokens emitidos antes desta sessao persistida (sem "sid") continuam a
      // funcionar ate expirarem naturalmente, mas sem rotacao/deteccao de
      // reutilizacao - so sessoes novas (a partir de agora) ganham essa protecao.
      if (decoded.sid) {
        const session = await prisma.userSession.findUnique({ where: { id: decoded.sid } });

        if (!session || session.revokedAt || session.expiresAt < new Date()) {
          return res.status(401).json({ error: 'REFRESH_TOKEN_INVALIDO', message: 'Sessão expirada. Por favor, faça login novamente.' });
        }

        if (session.refreshTokenHash !== sha256Hex(refresh_token)) {
          // O token apresentado e valido (assinatura/exp) mas ja nao e o mais
          // recente da sessao - ou seja, foi reutilizado depois de uma rotacao
          // anterior (token roubado, ou dois separadores concorrentes). Por
          // seguranca, revoga a sessao inteira em vez de apenas rejeitar.
          await prisma.userSession.update({
            where: { id: session.id },
            data: { revokedAt: new Date(), revokedReason: 'refresh_token_reuse_detected' },
          });
          await auditService.logAction('REFRESH_TOKEN_REUSE_DETECTED', 'error', { sessionId: session.id }, {
            userId: user.id, userEmail: user.email, userRole: user.role,
            ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] as string,
            resource: 'session', resourceId: session.id, success: false,
          });
          return res.status(401).json({ error: 'REFRESH_TOKEN_INVALIDO', message: 'Sessão inválida. Por favor, faça login novamente.' });
        }

        const newRefreshToken = jwt.sign({ id: user.id, email: user.email, sid: session.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
        const accessToken = jwt.sign({ id: user.id, email: user.email, sid: session.id }, JWT_SECRET, { expiresIn: '1d' });

        await prisma.userSession.update({
          where: { id: session.id },
          data: { refreshTokenHash: sha256Hex(newRefreshToken), expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
        });

        return res.status(200).json({ session: { access_token: accessToken, refresh_token: newRefreshToken } });
      }

      const accessToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
      const newRefreshToken = jwt.sign({ id: user.id, email: user.email }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

      return res.status(200).json({
        session: {
          access_token: accessToken,
          refresh_token: newRefreshToken
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retorna os dados do utilizador logado
   * @route GET /api/v1/auth/me
   */
  static async me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Não autenticado' });
      }
      
      const dbUser = await prisma.user.findUnique({
        where: { id: req.user.id }
      });

      if (!dbUser) {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Perfil não encontrado' });
      }

      const userWithoutPassword = serializeUser(dbUser);
      return res.status(200).json({ user: userWithoutPassword });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Permite ao utilizador autenticado editar os seus proprios dados
   * (nome, telefone, morada, organizacao, e-mail e password).
   * A alteracao de password exige a password actual; a alteracao de
   * e-mail verifica que nao esta em uso por outra conta.
   * @route PUT /api/v1/auth/me
   */
  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Não autenticado' });
      }

      const { name, phone, address, organization, email, currentPassword, newPassword } = req.body;

      const dbUser = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!dbUser) {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Perfil não encontrado' });
      }

      const updateData: Record<string, any> = {};

      if (name !== undefined) {
        if (!String(name).trim()) {
          return res.status(400).json({ error: 'BAD_REQUEST', message: 'O nome não pode ficar vazio' });
        }
        updateData.name = String(name).trim();
      }
      if (phone !== undefined) updateData.phone = phone?.trim() || null;
      if (address !== undefined) updateData.address = address?.trim() || null;
      if (organization !== undefined) updateData.organization = organization?.trim() || null;

      if (email !== undefined) {
        const normalizedEmail = String(email).trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
          return res.status(400).json({ error: 'BAD_REQUEST', message: 'E-mail inválido' });
        }
        if (normalizedEmail !== dbUser.email) {
          const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
          if (existing && existing.id !== dbUser.id) {
            return res.status(409).json({ error: 'EMAIL_DUPLICADO', message: 'Este e-mail já está em uso por outra conta' });
          }
          updateData.email = normalizedEmail;
        }
      }

      if (newPassword !== undefined) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'BAD_REQUEST', message: 'Indique a password actual para definir uma nova' });
        }
        const passwordMatches = await bcrypt.compare(currentPassword, dbUser.password);
        if (!passwordMatches) {
          return res.status(401).json({ error: 'CREDENCIAIS_INVALIDAS', message: 'Password actual incorrecta' });
        }
        if (typeof newPassword !== 'string' || newPassword.length < 6) {
          return res.status(400).json({ error: 'BAD_REQUEST', message: 'A nova password deve ter pelo menos 6 caracteres' });
        }
        updateData.password = await bcrypt.hash(newPassword, 10);
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'BAD_REQUEST', message: 'Nenhum dado para actualizar' });
      }

      const updated = await prisma.user.update({ where: { id: dbUser.id }, data: updateData });

      await auditService.logAction(
        'user_profile_self_updated',
        'info',
        { changedFields: Object.keys(updateData).filter((field) => field !== 'password') },
        {
          userId: updated.id,
          userEmail: updated.email,
          userRole: updated.role,
          resource: 'user',
          resourceId: updated.id,
          success: true,
        }
      );

      const userWithoutPassword = serializeUser(updated);
      return res.status(200).json({ success: true, user: userWithoutPassword });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza as coordenadas bancarias do utilizador autenticado (reutilizaveis em futuras facturas)
   * @route PUT /api/v1/auth/me/bank-details
   */
  static async updateBankDetails(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Não autenticado' });
      }

      const { bankName, bankAccountHolder, bankIban, bankNib, bankSwift, bankCity, bankCountry, signatureImage } = req.body;
      const erroConta = validarIban(bankIban) || validarNib(bankNib);
      if (erroConta) return res.status(400).json({ error: 'VALIDATION_ERROR', message: erroConta });

      const updateData: Record<string, any> = {
        bankName: bankName?.trim() || null,
        bankAccountHolder: bankAccountHolder?.trim() || null,
        bankIban: bankIban?.trim() || null,
        bankNib: bankNib?.trim() || null,
        bankSwift: bankSwift?.trim() || null,
        bankCity: bankCity?.trim() || null,
        bankCountry: bankCountry?.trim() || null,
      };
      // signatureImage e opcional e so e alterado quando explicitamente enviado (upload de assinatura),
      // para nao apagar uma assinatura ja guardada ao gravar apenas os dados bancarios.
      if (signatureImage !== undefined) {
        updateData.signatureImage = signatureImage || null;
      }

      const updated = await prisma.user.update({
        where: { id: req.user.id },
        data: updateData
      });

      const userWithoutPassword = serializeUser(updated);
      return res.status(200).json({ success: true, user: userWithoutPassword });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lista as coordenadas bancarias guardadas pelo utilizador autenticado
   * (fornecedor externo) - pode ter varias, para escolher qual usar em cada factura.
   * @route GET /api/v1/auth/me/bank-accounts
   */
  static async listBankAccounts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Não autenticado' });
      }
      const dbUser = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!dbUser) return res.status(404).json({ error: 'NOT_FOUND', message: 'Utilizador não encontrado' });

      const { bankAccounts } = serializeUser(dbUser);
      return res.status(200).json({ success: true, bankAccounts });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Adiciona uma nova coordenada bancaria a lista de guardadas do utilizador
   * autenticado (nao substitui as existentes). Se for a primeira, ou se
   * "tornarActiva" vier true, tambem passa a ser a activa (as colunas
   * bankName/bankIban/... simples, usadas em todo o resto do sistema como
   * "a coordenada actual" - ex: Ordem de Pagamento).
   * @route POST /api/v1/auth/me/bank-accounts
   */
  static async addBankAccount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Não autenticado' });
      }
      const { label, bankName, bankAccountHolder, bankIban, bankNib, bankSwift, bankCity, bankCountry, tornarActiva } = req.body;
      if (!bankIban?.trim() && !bankNib?.trim()) {
        return res.status(400).json({ error: 'BAD_REQUEST', message: 'Indique o IBAN ou o NIB da conta' });
      }
      const erroConta = validarIban(bankIban) || validarNib(bankNib);
      if (erroConta) return res.status(400).json({ error: 'VALIDATION_ERROR', message: erroConta });

      const dbUser = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!dbUser) return res.status(404).json({ error: 'NOT_FOUND', message: 'Utilizador não encontrado' });

      const { bankAccounts: contasExistentes } = serializeUser(dbUser);
      const novaConta = {
        id: crypto.randomUUID(),
        label: label?.trim() || bankName?.trim() || 'Conta bancária',
        bankName: bankName?.trim() || null,
        bankAccountHolder: bankAccountHolder?.trim() || null,
        bankIban: bankIban?.trim() || null,
        bankNib: bankNib?.trim() || null,
        bankSwift: bankSwift?.trim() || null,
        bankCity: bankCity?.trim() || null,
        bankCountry: bankCountry?.trim() || null,
      };
      const contas = [...contasExistentes, novaConta];

      const updateData: Record<string, any> = { bankAccounts: JSON.stringify(contas) };
      if (tornarActiva || contasExistentes.length === 0) {
        Object.assign(updateData, {
          bankName: novaConta.bankName,
          bankAccountHolder: novaConta.bankAccountHolder,
          bankIban: novaConta.bankIban,
          bankNib: novaConta.bankNib,
          bankSwift: novaConta.bankSwift,
          bankCity: novaConta.bankCity,
          bankCountry: novaConta.bankCountry,
        });
      }

      const updated = await prisma.user.update({ where: { id: req.user.id }, data: updateData });
      return res.status(201).json({ success: true, user: serializeUser(updated), conta: novaConta });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Marca uma coordenada ja guardada como a "activa" - copia os seus campos
   * para as colunas simples (bankName/bankIban/...) usadas em todo o resto
   * do sistema (ex: ao gerar a Ordem de Pagamento).
   * @route PUT /api/v1/auth/me/bank-accounts/:id/select
   */
  static async selectBankAccount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Não autenticado' });
      }
      const dbUser = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!dbUser) return res.status(404).json({ error: 'NOT_FOUND', message: 'Utilizador não encontrado' });

      const { bankAccounts: contas } = serializeUser(dbUser);
      const conta = contas.find((c: any) => c.id === req.params.id);
      if (!conta) return res.status(404).json({ error: 'NOT_FOUND', message: 'Coordenada bancária não encontrada' });

      const updated = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          bankName: conta.bankName,
          bankAccountHolder: conta.bankAccountHolder,
          bankIban: conta.bankIban,
          bankNib: conta.bankNib,
          bankSwift: conta.bankSwift,
          bankCity: conta.bankCity,
          bankCountry: conta.bankCountry,
        },
      });
      return res.status(200).json({ success: true, user: serializeUser(updated) });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove uma coordenada bancaria guardada (nao mexe nas colunas simples
   * "activas", mesmo que seja essa a removida).
   * @route DELETE /api/v1/auth/me/bank-accounts/:id
   */
  static async removeBankAccount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Não autenticado' });
      }
      const dbUser = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!dbUser) return res.status(404).json({ error: 'NOT_FOUND', message: 'Utilizador não encontrado' });

      const { bankAccounts: contas } = serializeUser(dbUser);
      const restantes = contas.filter((c: any) => c.id !== req.params.id);

      const updated = await prisma.user.update({
        where: { id: req.user.id },
        data: { bankAccounts: JSON.stringify(restantes) },
      });
      return res.status(200).json({ success: true, user: serializeUser(updated) });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Carrega a assinatura do utilizador autenticado num unico pedido multipart
   * (upload + associacao ao perfil), para nao depender de dois fetch()
   * sequenciais no cliente.
   * @route POST /api/v1/auth/me/signature
   */
  static async uploadSignature(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Não autenticado' });
      }
      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ error: 'BAD_REQUEST', message: 'Nenhum ficheiro fornecido' });
      }

      const signatureUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
      const updated = await prisma.user.update({
        where: { id: req.user.id },
        data: { signatureImage: signatureUrl },
      });

      const userWithoutPassword = serializeUser(updated);
      return res.status(200).json({ success: true, user: userWithoutPassword, signatureImage: signatureUrl });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Realiza logout
   * @route POST /api/v1/auth/logout
   */
  static async logout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (req.user) {
        logger.info(`[AuthController] Logout efetuado para o utilizador: ${req.user.email}`);
        // Revoga a sessao (se o access_token usado foi emitido apos esta
        // funcionalidade existir - "sid" presente): o refresh_token associado
        // deixa de poder ser trocado por um novo par, mesmo que tenha sido
        // copiado antes do logout.
        if (req.user.sid) {
          await prisma.userSession.updateMany({
            where: { id: req.user.sid, revokedAt: null },
            data: { revokedAt: new Date(), revokedReason: 'logout' },
          });
        }
      }
      return res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset de senha (envio de email)
   * @route POST /api/v1/auth/reset-password
   */
  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'EMAIL_REQUERIDO', message: 'O e-mail é obrigatório' });
      }

      const normalizedEmail = email.toLowerCase().trim();

      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      });

      if (!user) {
        // Por seguranca, fingir sucesso mesmo se o e-mail nao existir (evita
        // enumeracao de contas registadas).
        return res.status(200).json({ success: true, message: 'Se o e-mail existir no sistema, você receberá instruções de recuperação.' });
      }

      // Invalidar pedidos de reset anteriores ainda por usar, para que so o
      // link mais recente enviado por e-mail continue valido.
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });

      const rawToken = crypto.randomBytes(32).toString('hex');
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: sha256Hex(rawToken),
          expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS),
        },
      });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const resetLink = `${frontendUrl}?resetToken=${rawToken}`;

      await emailService.sendEmail({
        to: normalizedEmail,
        subject: 'Recuperação de password - SIPAR',
        html: resetPasswordEmailHtml(user.name || 'Utilizador', resetLink),
      }).catch((error) => logger.error('Falha ao enviar e-mail de recuperacao de password:', error));

      await notifications.createNotification(
        normalizedEmail,
        'password_reset',
        'Uma solicitação de recuperação de password foi recebida. Verifique o seu e-mail para continuar.'
      ).catch(() => null);

      await auditService.logAction('PASSWORD_RESET_REQUESTED', 'info', {}, {
        userId: user.id, userEmail: user.email, resource: 'user', resourceId: user.id, success: true,
      });

      return res.status(200).json({ success: true, message: 'E-mail de recuperação de senha enviado com sucesso.' });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Confirmacao de reset de senha: consome o token de uso unico enviado por
   * e-mail e define a nova password.
   * @route POST /api/v1/auth/reset-password/confirm
   */
  static async confirmResetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ error: 'BAD_REQUEST', message: 'Token e nova password são obrigatórios' });
      }
      if (String(newPassword).length < 8) {
        return res.status(400).json({ error: 'PASSWORD_FRACA', message: 'A nova password deve ter pelo menos 8 caracteres' });
      }

      const tokenHash = sha256Hex(String(token));
      const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

      if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
        return res.status(400).json({
          error: 'TOKEN_INVALID',
          message: 'Este link de recuperação é inválido ou já expirou. Solicite um novo.',
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.$transaction([
        prisma.user.update({ where: { id: resetToken.userId }, data: { password: hashedPassword } }),
        prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
      ]);

      const user = await prisma.user.findUnique({ where: { id: resetToken.userId } });

      await auditService.logAction('PASSWORD_RESET_CONFIRMED', 'warning', {}, {
        userId: resetToken.userId, userEmail: user?.email, resource: 'user', resourceId: resetToken.userId, success: true,
      });

      return res.status(200).json({ success: true, message: 'Password redefinida com sucesso. Já pode iniciar sessão.' });
    } catch (error) {
      next(error);
    }
  }
}
