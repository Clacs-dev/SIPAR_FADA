import fs from 'fs';
import path from 'path';
import logger from '../config/logger';

// A base de dados de cada instalacao e um unico ficheiro SQLite local (nao ha
// servidor central). "file:./dev.db" no DATABASE_URL e sempre relativo a
// pasta prisma/ (convencao do Prisma), independentemente do cwd do processo.
const DB_FILE = path.join(__dirname, '../../prisma/dev.db');
const BACKUP_DIR = path.join(__dirname, '../../backups');

export interface BackupInfo {
  filename: string;
  sizeBytes: number;
  createdAt: string;
}

export class BackupService {
  static ensureBackupDir() {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    return BACKUP_DIR;
  }

  static async create(): Promise<BackupInfo> {
    this.ensureBackupDir();
    if (!fs.existsSync(DB_FILE)) {
      throw new Error('Ficheiro de base de dados nao encontrado — nada para copiar.');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `dev-${timestamp}.db`;
    const destination = path.join(BACKUP_DIR, filename);

    await fs.promises.copyFile(DB_FILE, destination);
    const stats = await fs.promises.stat(destination);

    logger.info(`[Backup] Copia de seguranca criada: ${filename} (${stats.size} bytes)`);

    // Mantem apenas as 30 copias mais recentes, para nao encher o disco do
    // cliente indefinidamente (retencao simples baseada em contagem).
    await this.pruneOldBackups(30);

    return { filename, sizeBytes: stats.size, createdAt: new Date().toISOString() };
  }

  static async list(): Promise<BackupInfo[]> {
    this.ensureBackupDir();
    const files = await fs.promises.readdir(BACKUP_DIR);
    const infos = await Promise.all(
      files
        .filter((f) => f.endsWith('.db'))
        .map(async (filename) => {
          const stats = await fs.promises.stat(path.join(BACKUP_DIR, filename));
          return { filename, sizeBytes: stats.size, createdAt: stats.birthtime.toISOString() };
        })
    );
    return infos.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  static getFilePath(filename: string): string {
    // Impede path traversal - so nomes de ficheiro simples dentro de backups/
    const safeName = path.basename(filename);
    return path.join(BACKUP_DIR, safeName);
  }

  private static async pruneOldBackups(keep: number) {
    const backups = await this.list();
    const toDelete = backups.slice(keep);
    await Promise.all(
      toDelete.map((b) => fs.promises.unlink(path.join(BACKUP_DIR, b.filename)).catch(() => null))
    );
  }
}
