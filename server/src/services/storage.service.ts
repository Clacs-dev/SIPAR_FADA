import fs from 'fs';
import path from 'path';
import logger from '../config/logger';

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

/**
 * Serviço auxiliar de armazenamento local (Express + Multer)
 */
export class StorageService {
  /**
   * Garante que a pasta de uploads existe
   */
  static ensureUploadDirectoryExists(): string {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      logger.info(`[StorageService] Pasta de uploads criada: ${UPLOAD_DIR}`);
    }
    return UPLOAD_DIR;
  }

  /**
   * Caminho no disco de um ficheiro carregado (aceita o id/nome do ficheiro ou
   * o URL ".../uploads/<nome>"). null se nao existir.
   */
  static caminhoDoUpload(idOuUrl: string | null | undefined): string | null {
    if (!idOuUrl) return null;
    const nome = path.basename(String(idOuUrl).split('?')[0]);
    if (!nome || nome === '.' || nome === '..') return null;
    const filePath = path.join(UPLOAD_DIR, nome);
    return fs.existsSync(filePath) ? filePath : null;
  }

  /**
   * Remove um ficheiro da pasta de uploads local
   */
  static async deleteFile(fileName: string): Promise<boolean> {
    try {
      const filePath = path.join(UPLOAD_DIR, path.basename(fileName));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`[StorageService] Ficheiro removido localmente: ${fileName}`);
        return true;
      }
      logger.warn(`[StorageService] Ficheiro nao encontrado para exclusao: ${fileName}`);
      return false;
    } catch (error) {
      logger.error(`[StorageService] Erro ao deletar o ficheiro ${fileName}:`, error);
      return false;
    }
  }

  /**
   * Inicializa buckets virtuais de demonstração
   */
  static async initializeStorageBuckets() {
    this.ensureUploadDirectoryExists();
    return { success: true };
  }
}
