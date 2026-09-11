import prisma from '../config/database';

/**
 * Definicoes de integracao (email, plataformas de reuniao, e outras que
 * venham a precisar de ser configuraveis) geridas pelo admin_sistema em vez
 * de viverem no .env do servidor. Reutiliza SystemSetting (ja existe, ja usada
 * para modo de manutencao e relogio anti-recuo da licenca) - sem tabela nova.
 *
 * O .env continua a ser o fallback para instalacoes que ainda nao configuraram
 * nada pelo admin (ou para quem prefere gerir por ficheiro) - nunca e
 * obrigatorio migrar. Ver docs/developer/configuration-environment.md.
 */

const KEY_PREFIX = 'integration_';
const CACHE_TTL_MS = 5 * 60 * 1000;

let cache: Map<string, string> = new Map();
let cachedAt = 0;

export class SettingsService {
  static async refresh(): Promise<void> {
    const rows = await prisma.systemSetting.findMany({
      where: { key: { startsWith: KEY_PREFIX } },
    });
    cache = new Map(rows.map((row) => [row.key, row.value]));
    cachedAt = Date.now();
  }

  private static async ensureFresh(): Promise<void> {
    if (Date.now() - cachedAt > CACHE_TTL_MS) {
      await this.refresh();
    }
  }

  /**
   * Leitura sincrona a partir da cache em memoria (atualizada no arranque do
   * servidor e a cada escrita) - usar dentro de codigo que nao pode ser
   * async sem alterar toda a cadeia de chamadas (ex.: meeting-link.service.ts).
   * Cai para a variavel de ambiente indicada se nao houver valor guardado.
   */
  static get(key: string, envFallback?: string): string | undefined {
    const stored = cache.get(KEY_PREFIX + key);
    if (stored !== undefined && stored !== '') return stored;
    return envFallback ? process.env[envFallback] : undefined;
  }

  /** Igual a get(), mas garante que a cache nao esta desatualizada (> 5 min) antes de ler. */
  static async getAsync(key: string, envFallback?: string): Promise<string | undefined> {
    await this.ensureFresh();
    return this.get(key, envFallback);
  }

  static async set(key: string, value: string, ctx: { userId: string; userName: string }): Promise<void> {
    const fullKey = KEY_PREFIX + key;
    const trimmed = value.trim();
    if (!trimmed) {
      await this.delete(key);
      return;
    }
    await prisma.systemSetting.upsert({
      where: { key: fullKey },
      update: { value: trimmed, updatedById: ctx.userId, updatedByName: ctx.userName },
      create: { key: fullKey, value: trimmed, updatedById: ctx.userId, updatedByName: ctx.userName },
    });
    cache.set(fullKey, trimmed);
  }

  static async delete(key: string): Promise<void> {
    const fullKey = KEY_PREFIX + key;
    await prisma.systemSetting.deleteMany({ where: { key: fullKey } });
    cache.delete(fullKey);
  }

  /** true se o valor vier de uma definicao guardada pelo admin (nao do .env). */
  static hasOverride(key: string): boolean {
    const stored = cache.get(KEY_PREFIX + key);
    return stored !== undefined && stored !== '';
  }
}
