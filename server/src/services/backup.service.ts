import fs from 'fs';
import path from 'path';
import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import logger from '../config/logger';

// Duas formas de base de dados:
// - SQLite (instalacao local antiga): "file:./dev.db" e sempre relativo a
//   pasta prisma/ (convencao do Prisma) - a copia e o proprio ficheiro .db.
// - PostgreSQL (producao): nao ha ficheiro para copiar e o pg_dump nao existe
//   no contentor - a copia e uma exportacao JSON de todas as tabelas, feita
//   pelo Prisma (restauravel com scripts/restaurar-backup-json.js).
const DB_FILE = path.join(__dirname, '../../prisma/dev.db');
const BACKUP_DIR = path.join(__dirname, '../../backups');
const EXTENSOES = ['.db', '.json'];

export interface BackupInfo {
  filename: string;
  sizeBytes: number;
  createdAt: string;
}

export function usaPostgres() {
  return /^postgres(ql)?:\/\//.test(process.env.DATABASE_URL || '');
}

/** Exportacao JSON de todas as tabelas (PostgreSQL). */
async function exportarJson(destino: string) {
  const tabelas: Record<string, unknown[]> = {};
  for (const modelo of Prisma.dmmf.datamodel.models) {
    const delegate = (prisma as any)[modelo.name.charAt(0).toLowerCase() + modelo.name.slice(1)];
    tabelas[modelo.name] = await delegate.findMany();
  }
  const conteudo = {
    formato: 'sipar-backup-json',
    versao: 1,
    criado_em: new Date().toISOString(),
    tabelas,
  };
  await fs.promises.writeFile(destino, JSON.stringify(conteudo, (_k, v) => (typeof v === 'bigint' ? v.toString() : v)));
}

export class BackupService {
  static ensureBackupDir() {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    return BACKUP_DIR;
  }

  static async create(): Promise<BackupInfo> {
    this.ensureBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    let filename: string;

    if (usaPostgres()) {
      filename = `sipar-${timestamp}.json`;
      await exportarJson(path.join(BACKUP_DIR, filename));
    } else {
      if (!fs.existsSync(DB_FILE)) {
        throw new Error('Ficheiro de base de dados nao encontrado — nada para copiar.');
      }
      filename = `dev-${timestamp}.db`;
      await fs.promises.copyFile(DB_FILE, path.join(BACKUP_DIR, filename));
    }

    const stats = await fs.promises.stat(path.join(BACKUP_DIR, filename));
    logger.info(`[Backup] Copia de seguranca criada: ${filename} (${stats.size} bytes)`);

    // Mantem apenas as 30 copias mais recentes, para nao encher o disco
    // indefinidamente (retencao simples baseada em contagem).
    await this.pruneOldBackups(30);

    return { filename, sizeBytes: stats.size, createdAt: new Date().toISOString() };
  }

  static async list(): Promise<BackupInfo[]> {
    this.ensureBackupDir();
    const files = await fs.promises.readdir(BACKUP_DIR);
    const infos = await Promise.all(
      files
        .filter((f) => EXTENSOES.some((ext) => f.endsWith(ext)))
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

  /** Tamanho da base de dados em bytes (ficheiro SQLite ou pg_database_size). */
  static async tamanhoBaseDados(): Promise<number | null> {
    try {
      if (usaPostgres()) {
        const linhas = await prisma.$queryRaw<{ tamanho: bigint }[]>`SELECT pg_database_size(current_database()) AS tamanho`;
        return Number(linhas[0]?.tamanho ?? 0);
      }
      return fs.statSync(DB_FILE).size;
    } catch {
      return null;
    }
  }

  private static async pruneOldBackups(keep: number) {
    const backups = await this.list();
    const toDelete = backups.slice(keep);
    await Promise.all(
      toDelete.map((b) => fs.promises.unlink(path.join(BACKUP_DIR, b.filename)).catch(() => null))
    );
  }
}
