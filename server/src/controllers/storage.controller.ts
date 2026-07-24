import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { StorageService } from '../services/storage.service';
import logger from '../config/logger';
import prisma from '../config/database';
import { AuthenticatedRequest } from '../middlewares/auth';

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

// Middleware Multer exposto
export const multerUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Limite de 10MB
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
  static async deleteFile(req: Request, res: Response, next: NextFunction) {
    try {
      const filePath = req.body?.filePath || req.query.filePath;
      const fileName = filePath ? path.basename(String(filePath)) : (req.body?.fileName || req.query.fileName);

      if (!fileName) {
        return res.status(400).json({ error: 'BAD_REQUEST', message: 'Caminho ou nome do ficheiro é obrigatório' });
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
