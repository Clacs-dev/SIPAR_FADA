import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { StorageService } from '../services/storage.service';
import logger from '../config/logger';
import prisma from '../config/database';
import { AuthenticatedRequest, isAdminUser } from '../middlewares/auth';

// Garantir que a pasta existe
const uploadDir = StorageService.ensureUploadDirectoryExists();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const fileExt = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
    cb(null, uniqueName);
  }
});

// Allowlist de tipos aceites: documentos e imagens usados nos anexos do
// sistema (facturas, actas, assinaturas, comprovativos). Bloqueia
// especificamente HTML/SVG/scripts, que poderiam ser alojados sob o dominio
// confiavel da aplicacao (/uploads) e usados para phishing/spoofing.
const ALLOWED_MIMETYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
]);

function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (!ALLOWED_MIMETYPES.has(file.mimetype)) {
    const error: any = new Error(`Tipo de ficheiro nao permitido: ${file.mimetype}`);
    error.status = 400;
    error.code = 'INVALID_FILE_TYPE';
    return cb(error);
  }
  cb(null, true);
}

// Middleware Multer exposto
export const multerUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10MB
  fileFilter,
});

/**
 * Controller de Upload local de Ficheiros
 */
export class StorageController {
  /**
   * Endpoint de Upload de Ficheiro
   * @route POST /api/v1/storage/upload
   */
  static async uploadFile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'BAD_REQUEST', message: 'Nenhum ficheiro fornecido' });
      }

      logger.info(`Upload recebido localmente: ${req.file.originalname} (${(req.file.size / 1024).toFixed(2)} KB)`);

      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      await prisma.uploadedFile.create({
        data: {
          id: req.file.filename,
          userId: req.user?.id,
          originalName: req.file.originalname,
          filename: req.file.filename,
          path: req.file.path,
          url: fileUrl,
          mimetype: req.file.mimetype,
          size: req.file.size,
          module: req.body.module,
          resourceId: req.body.resourceId,
        }
      }).catch((error) => logger.error('Falha ao registrar upload no banco:', error));

      return res.status(200).json({
        success: true,
        file: {
          id: req.file.filename,
          name: req.file.originalname,
          size: req.file.size,
          url: fileUrl,
          tipo: req.file.mimetype,
        }
      });
    } catch (error) {
      logger.error('Erro no upload local de ficheiro:', error);
      next(error);
    }
  }

  /**
   * Endpoint de Exclusão de Ficheiro
   * @route DELETE /api/v1/storage/delete
   */
  static async deleteFile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const filePath = req.body?.filePath || req.query.filePath;
      const fileName = filePath ? path.basename(String(filePath)) : (req.body?.fileName || req.query.fileName);

      if (!fileName) {
        return res.status(400).json({ error: 'BAD_REQUEST', message: 'Caminho ou nome do ficheiro é obrigatório' });
      }

      // So o dono do ficheiro (ou um administrador) pode apagar - sem isto,
      // qualquer utilizador autenticado conseguia apagar o upload de outro
      // bastando adivinhar/conhecer o nome do ficheiro.
      const record = await prisma.uploadedFile.findUnique({ where: { id: String(fileName) } });
      if (record) {
        const isOwner = record.userId && record.userId === req.user?.id;
        const isAdmin = req.user?.role === 'admin_sistema' || await isAdminUser(req.user?.role || '');
        if (!isOwner && !isAdmin) {
          return res.status(403).json({ error: 'FORBIDDEN', message: 'Não tem permissão para eliminar este ficheiro' });
        }
      }

      const deleted = await StorageService.deleteFile(fileName);

      if (deleted) {
        return res.status(200).json({ success: true });
      } else {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Ficheiro não encontrado no servidor' });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Inicializa buckets de storage
   */
  static async initBuckets(req: Request, res: Response) {
    await StorageService.initializeStorageBuckets();
    return res.status(200).json({ success: true, message: 'Storage local pronto para uso' });
  }
}
