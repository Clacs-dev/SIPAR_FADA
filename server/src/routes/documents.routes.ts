import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middlewares/auth';
import { multerUpload, StorageController } from '../controllers/storage.controller';

const router = Router();

router.post('/upload', requireAuth as any, multerUpload.single('file'), StorageController.uploadFile as any);

router.post('/signed-url', requireAuth as any, async (req: AuthenticatedRequest, res: Response) => {
  const path = req.body.path || req.body.filePath || req.body.url;
  res.status(200).json({
    success: true,
    signedUrl: path,
    url: path,
  });
});

router.get('/signed-url', requireAuth as any, async (req: AuthenticatedRequest, res: Response) => {
  const path = req.query.path || req.query.filePath || req.query.url;
  res.status(200).json({
    success: true,
    signedUrl: path,
    url: path,
  });
});

export default router;
