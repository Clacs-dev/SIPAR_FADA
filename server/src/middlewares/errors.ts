import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import { getRequestId } from './request-context';

export interface AppError extends Error {
  status?: number;
  code?: string;
  details?: any;
}

/**
 * Middleware global de tratamento de erros do Express
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = err.status || 500;
  const message = err.message || 'Erro interno do servidor';
  const requestId = getRequestId(req);
  
  logger.error('Erro capturado pelo middleware global:', {
    requestId,
    message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  return res.status(status).json({
    error: err.code || 'INTERNAL_SERVER_ERROR',
    message,
    requestId,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
    details: process.env.NODE_ENV === 'development' ? err.details || err.stack : undefined,
  });
};
