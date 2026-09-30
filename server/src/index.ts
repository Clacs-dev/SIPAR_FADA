import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
// @ts-ignore
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import path from 'path';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

import logger from './config/logger';
import { errorHandler } from './middlewares/errors';
import { requestContext, getRequestId } from './middlewares/request-context';
import { requireAuth, requireSystemAdmin } from './middlewares/auth';
import prisma from './config/database';
import { StorageService } from './services/storage.service';

// Importar rotas
import authRoutes from './routes/auth.routes';
import storageRoutes from './routes/storage.routes';
import usersRoutes from './routes/users.routes';
import internalMeetingsRoutes from './routes/internal-meetings.routes';
import modulesRoutes from './routes/modules.routes';
import emailRoutes from './routes/email.routes';
import notificationsRoutes from './routes/notifications.routes';
import auditRoutes from './routes/audit.routes';
import messagesRoutes from './routes/messages.routes';
import pushRoutes from './routes/push.routes';
import dashboardRoutes from './routes/dashboard.routes';
import documentsRoutes from './routes/documents.routes';
import phase4Routes from './routes/phase4.routes';
import departmentsRoutes from './routes/departments.routes';
import rolesRoutes from './routes/roles.routes';
import areasRoutes from './routes/areas.routes';
import trashRoutes from './routes/trash.routes';
import systemRoutes from './routes/system.routes';
import meetingRoomsRoutes from './routes/meeting-rooms.routes';
import internalPaymentOrdersRoutes from './routes/internal-payment-orders.routes';
import licenseRoutes from './routes/license.routes';
import meetingIntegrationsRoutes from './routes/meeting-integrations.routes';
import nifRoutes from './routes/nif.routes';
import { licenseService } from './services/license.service';
import { SettingsService } from './services/settings.service';

export const app = express();
const PORT = Number(process.env.PORT || 5000);

function parseAllowedOrigins() {
  const value = process.env.CORS_ORIGINS || process.env.FRONTEND_URL || '';
  if (!value) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CORS_ORIGINS ou FRONTEND_URL deve ser definido em producao (CORS aberto para "*" nao e permitido).');
    }
    return '*';
  }
  return value.split(',').map((origin) => origin.trim()).filter(Boolean);
}

// Configurar Winston + Morgan para logs de requisições HTTP
const morganStream = {
  write: (message: string) => logger.info(message.trim())
};
app.use(requestContext);
morgan.token('request-id', (req) => getRequestId(req));
app.use(morgan(':request-id :method :url :status :res[content-length] - :response-time ms', { stream: morganStream }));

// Middlewares de Segurança
app.use(helmet({
  crossOriginResourcePolicy: false, // Permitir carregar imagens de upload de forma cross-origin no front
}));
app.use(cors({
  origin: parseAllowedOrigins(),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'x-user-id'],
  exposedHeaders: ['x-request-id', 'x-user-id'],
  maxAge: 86400
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(hpp());

// Rate Limiting (Proteção contra força bruta)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // limite de 500 requisições por janela
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Muitas requisições originadas deste IP, tente novamente em 15 minutos.'
  }
});
app.use(limiter);

// Servir arquivos estáticos da pasta local de uploads de Multer
const uploadDir = StorageService.ensureUploadDirectoryExists();
app.use('/uploads', express.static(uploadDir));
logger.info(`[Static] Servindo uploads estaticos em: /uploads`);

// ==========================================
// ROTAS DO SISTEMA
// ==========================================

// Endpoint de Health Check — verifica ligacao real a base de dados, nao so
// que o processo Express responde. Usado por supervisao de processo (ex.:
// reinicio automatico) e nao deve devolver 200 quando a BD esta inacessivel.
const handleHealthCheck = async (req: express.Request, res: express.Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('[Health] Falha na ligacao a base de dados:', error);
    res.status(503).json({ status: 'error', message: 'Base de dados inacessivel', timestamp: new Date().toISOString() });
  }
};
app.get('/api/health', handleHealthCheck);
app.get('/api/v1/health', handleHealthCheck);

// Endpoint de Inicialização Falsa (sincronizada com o banco)
const handleInitialize = async (req: express.Request, res: express.Response) => {
  try {
    logger.info('[Initialize] Sistema inicializado com sucesso.');
    res.status(200).json({ success: true, message: 'System initialized with SQLite database' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
app.post('/api/v1/initialize', handleInitialize);

// Registro de rotas da API Express
const registerRoutes = (prefix: string) => {
  app.use(prefix, (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/license`, licenseRoutes);
  app.use(`${prefix}/storage`, storageRoutes);
  app.use(`${prefix}/users`, usersRoutes);
  app.use(`${prefix}/internal-meetings`, internalMeetingsRoutes);
  app.use(`${prefix}/email`, emailRoutes);
  app.use(`${prefix}/notifications`, notificationsRoutes);
  app.use(`${prefix}/audit`, auditRoutes);
  app.use(`${prefix}/messages`, messagesRoutes);
  app.use(`${prefix}/push`, pushRoutes);
  app.use(`${prefix}/dashboard`, dashboardRoutes);
  app.use(`${prefix}/documents`, documentsRoutes);
  app.use(`${prefix}/departments`, departmentsRoutes);
  app.use(`${prefix}/roles`, rolesRoutes);
  app.use(`${prefix}/areas`, areasRoutes);
  app.use(`${prefix}/trash`, trashRoutes);
  app.use(`${prefix}/system`, systemRoutes);
  app.use(`${prefix}/meeting-rooms`, meetingRoomsRoutes);
  app.use(`${prefix}/internal-payment-orders`, internalPaymentOrdersRoutes);
  app.use(`${prefix}/meeting-integrations`, meetingIntegrationsRoutes);
  app.use(`${prefix}/nif`, nifRoutes);
  app.use(`${prefix}/phase4`, phase4Routes);
  app.use(`${prefix}/compras-avancadas`, phase4Routes);
  app.use(`${prefix}/orcamentos`, phase4Routes);
  app.use(`${prefix}/financeiro`, phase4Routes);
  app.get(`${prefix}/stats`, requireAuth, requireSystemAdmin, async (_req, res, next) => {
    try {
      const [users, notifications, auditLogs] = await Promise.all([
        prisma.user.count(),
        prisma.notification.count(),
        prisma.auditLog.count(),
      ]);
      res.status(200).json({ success: true, stats: { users, notifications, auditLogs } });
    } catch (error) {
      next(error);
    }
  });
  app.post(`${prefix}/sync-all-users`, requireAuth, requireSystemAdmin, (_req, res) => res.status(200).json({ success: true, synced: 0 }));
  app.post(`${prefix}/create-additional-users`, requireAuth, requireSystemAdmin, (_req, res) => res.status(200).json({ success: true, created: 0 }));
  app.post(`${prefix}/admin/reset-admin-user`, requireAuth, requireSystemAdmin, (_req, res) => res.status(200).json({ success: true, message: 'Admin local mantido pelo seed.' }));
  app.get(`${prefix}/list-all-users`, requireAuth, requireSystemAdmin, async (_req, res, next) => {
    try {
      const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, select: {
        id: true, email: true, name: true, role: true, status: true, department: true,
        departmentId: true, position: true, phone: true, organization: true, document: true,
        createdAt: true, updatedAt: true, lastLogin: true,
      } });
      res.status(200).json({ success: true, users });
    } catch (error) {
      next(error);
    }
  });
  app.use(`${prefix}`, modulesRoutes);
};

registerRoutes('/api/v1');

// Tratamento de rotas não encontradas (404)
app.use((req, res, next) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `A rota ${req.method} ${req.originalUrl} nao foi encontrada neste servidor.`,
    requestId: getRequestId(req),
    timestamp: new Date().toISOString(),
  });
});

// Middleware Global de Tratamento de Erros
app.use(errorHandler);

// Iniciar o Servidor Express
export function startServer(port = PORT) {
  // Validacao silenciosa no arranque: aquece a cache em memoria do
  // LicenseService e tenta atualizar a CRL se houver conectividade. Nunca
  // bloqueia o arranque do servidor (falha e apenas registada em log).
  licenseService
    .validate()
    .then(() => licenseService.fetchRevocationList())
    .catch((error) => logger.warn('[License] Falha na validacao inicial da licenca:', error));

  // Aquece a cache das definicoes de integracao (email, plataformas de
  // reuniao) geridas pelo admin_sistema - sem isto, a primeira leitura
  // sincrona (SettingsService.get) veria a cache vazia e cairia sempre no
  // fallback de .env ate ao primeiro refresh automatico (5 min depois).
  SettingsService.refresh().catch((error) => logger.warn('[Settings] Falha ao carregar definicoes de integracao:', error));

  return app.listen(port, () => {
    logger.info(`Servidor Express do SIPAR20 rodando de forma estavel na porta: ${port}`);
    logger.info(`Base API URL: http://localhost:${port}/api/v1`);
  });
}

if (require.main === module) {
  startServer();
}
