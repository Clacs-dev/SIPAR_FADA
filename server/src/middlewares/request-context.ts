import { randomUUID } from 'crypto';
import { IncomingMessage } from 'http';
import { Request, Response, NextFunction } from 'express';

export interface RequestWithContext extends Request {
  requestId?: string;
}

export function requestContext(req: RequestWithContext, res: Response, next: NextFunction) {
  const requestId = req.header('x-request-id') || randomUUID();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}

export function getRequestId(req: Request | IncomingMessage) {
  const request = req as RequestWithContext;
  const header = typeof request.header === 'function'
    ? request.header('x-request-id')
    : req.headers?.['x-request-id'];
  return request.requestId || (Array.isArray(header) ? header[0] : header) || 'unknown';
}
