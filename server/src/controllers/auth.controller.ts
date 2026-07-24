import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import logger from '../config/logger';
import { auditService } from '../services/audit.service';
import { notifications } from '../services/notification.service';
import { AuthenticatedRequest } from '../middlewares/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'sipar20_super_secret_dev_key_jwt_token_auth';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'sipar20_super_secret_refresh_dev_key';

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

      // Gerar tokens JWT
      const accessToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
      const refreshToken = jwt.sign({ id: user.id, email: user.email }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

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
      const { password: _, ...userWithoutPassword } = user;

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

      const { password: _, ...userWithoutPassword } = dbUser;
      return res.status(200).json({ user: userWithoutPassword });

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
        // Por segurança, fingir sucesso mesmo se e-mail não existir
        return res.status(200).json({ success: true, message: 'Se o e-mail existir no sistema, você receberá instruções de recuperação.' });
      }

      // Disparar e-mail simulado de reset de senha
      await notifications.createNotification(
        normalizedEmail,
        'password_reset',
        `Uma solicitação de recuperação de senha foi recebida. Utilize o link a seguir para recuperar sua senha: http://localhost:5173/reset-password?email=${normalizedEmail}`
      );

      return res.status(200).json({ success: true, message: 'E-mail de recuperação de senha enviado com sucesso.' });

    } catch (error) {
      next(error);
    }
  }
}
