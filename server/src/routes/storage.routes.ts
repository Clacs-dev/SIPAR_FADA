import { Router } from 'express';
import { StorageController, multerUpload } from '../controllers/storage.controller';
import { requireAuth } from '../middlewares/auth';

const router = Router();

// Rota de upload de ficheiro local (com Multer)
router.post('/upload', requireAuth as any, multerUpload.single('file'), StorageController.uploadFile as any);

// Rota de remoção de ficheiro local
router.delete('/delete', requireAuth as any, StorageController.deleteFile as any);

// Rota de inicialização
router.post('/init-buckets', requireAuth as any, StorageController.initBuckets as any);

export default router;
