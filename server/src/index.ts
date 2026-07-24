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
import prisma from './config/database';
import { StorageService } from './services/storage.service';

// Importar rotas
import authRoutes from './routes/auth.routes';
import storageRoutes from './routes/storage.routes';
import usersRoutes from './routes/users.routes';
import internalMeetingsRoutes from './routes/internal-meetings.routes';
import pedidosRoutes from './routes/pedidos.routes';
import modulesRoutes from './routes/modules.routes';
import emailRoutes from './routes/email.routes';
import notificationsRoutes from './routes/notifications.routes';
import auditRoutes from './routes/audit.routes';
import messagesRoutes from './routes/messages.routes';
import pushRoutes from './routes/push.routes';
import dashboardRoutes from './routes/dashboard.routes';
import documentsRoutes from './routes/documents.routes';
import phase4Routes from './routes/phase4.routes';

export const app = express();
const PORT = Number(process.env.PORT || 5000);

function parseAllowedOrigins() {
  const value = process.env.CORS_ORIGINS || process.env.FRONTEND_URL || '*';
  if (value === '*') return '*';
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

// Endpoint de Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

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
  app.use(`${prefix}/storage`, storageRoutes);
  app.use(`${prefix}/users`, usersRoutes);
  app.use(`${prefix}/internal-meetings`, internalMeetingsRoutes);
  app.use(`${prefix}/pedidos`, pedidosRoutes);
  app.use(`${prefix}/email`, emailRoutes);
  app.use(`${prefix}/notifications`, notificationsRoutes);
  app.use(`${prefix}/audit`, auditRoutes);
  app.use(`${prefix}/messages`, messagesRoutes);
  app.use(`${prefix}/push`, pushRoutes);
  app.use(`${prefix}/dashboard`, dashboardRoutes);
  app.use(`${prefix}/documents`, documentsRoutes);
  app.use(`${prefix}/phase4`, phase4Routes);
  app.use(`${prefix}/compras-avancadas`, phase4Routes);
  app.use(`${prefix}/orcamentos`, phase4Routes);
  app.use(`${prefix}/financeiro`, phase4Routes);
  app.get(`${prefix}/stats`, async (_req, res, next) => {
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
  app.post(`${prefix}/sync-all-users`, (_req, res) => res.status(200).json({ success: true, synced: 0 }));
  app.post(`${prefix}/create-additional-users`, (_req, res) => res.status(200).json({ success: true, created: 0 }));
  app.post(`${prefix}/admin/reset-admin-user`, (_req, res) => res.status(200).json({ success: true, message: 'Admin local mantido pelo seed.' }));
  app.get(`${prefix}/list-all-users`, async (_req, res, next) => {
    try {
      const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
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
  return app.listen(port, () => {
    logger.info(`Servidor Express do SIPAR20 rodando de forma estavel na porta: ${port}`);
    logger.info(`Base API URL: http://localhost:${port}/api/v1`);
  });
}

if (require.main === module) {
  startServer();
}
