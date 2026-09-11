import crypto from 'crypto';
import { machineId } from 'node-machine-id';
import prisma from '../config/database';
import logger from '../config/logger';
import { auditService } from './audit.service';
import { LICENSE_PUBLIC_KEY_PEM } from '../config/license-public-key';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type LicenseStatus =
  | 'UNLICENSED' // nenhuma licenca foi ativada ainda nesta instalacao — nao bloqueia, apenas avisa
  | 'PENDING'    // licenca carregada mas ainda nao ativada (falta o certificado), ou startsAt no futuro
  | 'ACTIVE'
  | 'EXPIRING'   // dentro da janela de aviso previo, ou ja expirada mas ainda dentro do grace period
  | 'EXPIRED'
  | 'SUSPENDED'
  | 'REVOKED'
  | 'INVALID';   // assinatura, certificado ou fingerprint nao batem — sinal de adulteracao

export interface LicensePayload {
  licenseId: string;
  customerName: string;
  licenseType: string;
  startsAt: string;
  expiresAt: string | null;
  maxUsers: number | null;
  maxAdmins: number | null;
  modules: string[];
  features: Record<string, boolean>;
  offlineGraceDays: number;
  minVersion: string | null;
  issuedAt: string;
}

export interface ActivationCertPayload {
  licenseId: string;
  installationFingerprint: string;
  activatedAt: string;
}

export interface CrlPayload {
  seq: number;
  revoked: string[];
  suspended?: string[];
  issuedAt: string;
}

export interface LicenseValidationResult {
  status: LicenseStatus;
  reason: string | null;
  effectiveNow: string;
  daysRemaining: number | null;
  license: {
    licenseId: string;
    customerName: string;
    licenseType: string;
    startsAt: string;
    expiresAt: string | null;
    maxUsers: number | null;
    maxAdmins: number | null;
    modules: string[];
    features: Record<string, boolean>;
    offlineGraceDays: number;
    activatedAt: string | null;
  } | null;
}

export class LicenseError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'LicenseError';
  }
}

// Janela de aviso previo antes de expiresAt (dias)
const WARNING_WINDOW_DAYS = 15;
const CLOCK_HWM_KEY = 'license_clock_hwm';
const FINGERPRINT_SALT_KEY = 'license_fingerprint_salt';
const CRL_CACHE_KEY = 'license_crl_cache';
const CACHE_TTL_MS = 5 * 60 * 1000;

const RESTRICTED_STATUSES: LicenseStatus[] = ['PENDING', 'EXPIRED', 'SUSPENDED', 'REVOKED', 'INVALID'];

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / (24 * 60 * 60 * 1000));
}

export class LicenseService {
  private static cachedResult: LicenseValidationResult | null = null;
  private static cachedAt = 0;

  // -------------------------------------------------------------------
  // Assinatura / parsing de ficheiros assinados
  // -------------------------------------------------------------------

  static parseSignedFile(raw: string, label: string): { payloadJson: string; signature: string } {
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new LicenseError('MALFORMED', `Ficheiro de ${label} invalido (nao e JSON valido).`);
    }
    if (!parsed || typeof parsed.payloadJson !== 'string' || typeof parsed.signature !== 'string') {
      throw new LicenseError('MALFORMED', `Ficheiro de ${label} invalido (formato inesperado).`);
    }
    return { payloadJson: parsed.payloadJson, signature: parsed.signature };
  }

  static verifySignature(payloadJson: string, signatureBase64: string, publicKeyPem: string = LICENSE_PUBLIC_KEY_PEM): boolean {
    try {
      const publicKey = crypto.createPublicKey(publicKeyPem);
      return crypto.verify(
        null,
        Buffer.from(payloadJson, 'utf-8'),
        publicKey,
        Buffer.from(signatureBase64, 'base64')
      );
    } catch (error) {
      logger.error('[LicenseService] Falha ao verificar assinatura:', error);
      return false;
    }
  }

  // -------------------------------------------------------------------
  // Identidade da instalacao
  // -------------------------------------------------------------------

  private static async getSetting(key: string): Promise<string | null> {
    const row = await prisma.systemSetting.findUnique({ where: { key } });
    return row?.value ?? null;
  }

  private static async setSetting(key: string, value: string): Promise<void> {
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  static async getOrCreateFingerprintSalt(): Promise<string> {
    const existing = await this.getSetting(FINGERPRINT_SALT_KEY);
    if (existing) return existing;
    const salt = crypto.randomBytes(32).toString('hex');
    await this.setSetting(FINGERPRINT_SALT_KEY, salt);
    return salt;
  }

  static async computeFingerprint(): Promise<string> {
    const [mid, salt] = await Promise.all([machineId(), this.getOrCreateFingerprintSalt()]);
    return crypto.createHash('sha256').update(`${mid}:${salt}`).digest('hex');
  }

  // -------------------------------------------------------------------
  // Relogio efetivo (marca d'agua anti-recuo)
  // -------------------------------------------------------------------

  static async getEffectiveNow(): Promise<Date> {
    const stored = await this.getSetting(CLOCK_HWM_KEY);
    const storedHwm = stored ? new Date(stored) : new Date(0);
    const systemNow = new Date();
    const rollbackDetected = systemNow.getTime() < storedHwm.getTime();
    const effective = rollbackDetected ? storedHwm : systemNow;

    if (rollbackDetected) {
      auditService
        .logAction(
          'LICENSE_CLOCK_ROLLBACK_DETECTED',
          'warning',
          { systemNow: systemNow.toISOString(), lastKnownGood: storedHwm.toISOString() },
          { resource: 'license' }
        )
        .catch(() => {});
    }

    await this.setSetting(CLOCK_HWM_KEY, effective.toISOString());
    return effective;
  }

  // -------------------------------------------------------------------
  // CRL (lista de revogacao) — best-effort, nunca bloqueante
  // -------------------------------------------------------------------

  private static async fetchUrl(url: string, timeoutMs = 5000): Promise<string> {
    const { get } = url.startsWith('https:') ? await import('https') : await import('http');
    return new Promise((resolve, reject) => {
      const req = get(url, { timeout: timeoutMs }, (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}`));
          res.resume();
          return;
        }
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve(body));
      });
      req.on('timeout', () => req.destroy(new Error('timeout')));
      req.on('error', reject);
    });
  }

  static async fetchRevocationList(): Promise<void> {
    const url = process.env.LICENSE_CRL_URL;
    if (!url) return;
    try {
      const raw = await this.fetchUrl(url);
      const { payloadJson, signature } = this.parseSignedFile(raw, 'CRL');
      if (!this.verifySignature(payloadJson, signature)) {
        logger.warn('[LicenseService] CRL recebida com assinatura invalida — ignorada.');
        return;
      }
      const payload: CrlPayload = JSON.parse(payloadJson);
      const cachedRaw = await this.getSetting(CRL_CACHE_KEY);
      if (cachedRaw) {
        const cached: CrlPayload = JSON.parse(cachedRaw);
        if (payload.seq <= cached.seq) return; // anti-replay: nunca aceitar CRL mais antiga que a ja vista
      }
      await this.setSetting(CRL_CACHE_KEY, JSON.stringify(payload));
      this.invalidateCache();
    } catch (error) {
      // Best-effort: falha de rede/offline nao deve afetar o funcionamento do sistema
      logger.info('[LicenseService] Nao foi possivel obter a CRL (modo offline?):', (error as Error).message);
    }
  }

  private static async getCachedCrl(): Promise<CrlPayload | null> {
    const raw = await this.getSetting(CRL_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  // -------------------------------------------------------------------
  // Ativacao / renovacao
  // -------------------------------------------------------------------

  static async uploadLicense(
    licenseFileRaw: string,
    ctx: { userId: string; userEmail: string; userRole: string }
  ) {
    const { payloadJson, signature } = this.parseSignedFile(licenseFileRaw, 'licenca');

    if (!this.verifySignature(payloadJson, signature)) {
      await auditService.logAction(
        'LICENSE_ACTIVATION_FAILED',
        'error',
        { reason: 'assinatura da licenca invalida' },
        { ...ctx, resource: 'license', success: false }
      );
      throw new LicenseError('SIGNATURE_INVALID', 'Assinatura da licenca invalida.');
    }

    const payload: LicensePayload = JSON.parse(payloadJson);
    if (!payload.licenseId || !payload.customerName || !payload.licenseType || !payload.startsAt || !payload.issuedAt) {
      throw new LicenseError('MALFORMED', 'Ficheiro de licenca com campos obrigatorios em falta.');
    }

    const existing = await prisma.license.findUnique({ where: { licenseId: payload.licenseId } });
    const isRenewal = !!existing;

    const commonData = {
      customerName: payload.customerName,
      licenseType: payload.licenseType,
      startsAt: new Date(payload.startsAt),
      expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
      maxUsers: payload.maxUsers ?? null,
      maxAdmins: payload.maxAdmins ?? null,
      modules: JSON.stringify(payload.modules || []),
      features: JSON.stringify(payload.features || {}),
      offlineGraceDays: payload.offlineGraceDays ?? 7,
      minVersion: payload.minVersion ?? null,
      issuedAt: new Date(payload.issuedAt),
      signedPayload: payloadJson,
      signature,
    };

    const row = await prisma.license.upsert({
      where: { licenseId: payload.licenseId },
      update: commonData,
      create: { licenseId: payload.licenseId, status: 'pending', ...commonData },
    });

    await auditService.logAction(
      isRenewal ? 'LICENSE_RENEWED' : 'LICENSE_CREATED',
      'info',
      { licenseId: payload.licenseId, customerName: payload.customerName, expiresAt: payload.expiresAt },
      { ...ctx, resource: 'license', resourceId: payload.licenseId, success: true }
    );

    this.invalidateCache();
    return row;
  }

  static async uploadActivationCertificate(
    certFileRaw: string,
    ctx: { userId: string; userEmail: string; userRole: string }
  ) {
    const { payloadJson, signature } = this.parseSignedFile(certFileRaw, 'certificado de ativacao');

    if (!this.verifySignature(payloadJson, signature)) {
      await auditService.logAction(
        'LICENSE_ACTIVATION_FAILED',
        'error',
        { reason: 'assinatura do certificado invalida' },
        { ...ctx, resource: 'license', success: false }
      );
      throw new LicenseError('SIGNATURE_INVALID', 'Assinatura do certificado de ativacao invalida.');
    }

    const certPayload: ActivationCertPayload = JSON.parse(payloadJson);
    const license = await prisma.license.findUnique({ where: { licenseId: certPayload.licenseId } });
    if (!license) {
      throw new LicenseError('LICENSE_NOT_FOUND', 'Carregue primeiro o ficheiro de licenca correspondente a este certificado.');
    }

    const fingerprint = await this.computeFingerprint();
    if (certPayload.installationFingerprint !== fingerprint) {
      await auditService.logAction(
        'INSTALLATION_CHANGED',
        'error',
        { expected: fingerprint, got: certPayload.installationFingerprint },
        { ...ctx, resource: 'license', resourceId: license.licenseId, success: false }
      );
      throw new LicenseError('FINGERPRINT_MISMATCH', 'Este certificado de ativacao foi emitido para outra instalacao.');
    }

    const row = await prisma.license.update({
      where: { licenseId: certPayload.licenseId },
      data: {
        activationCertPayload: payloadJson,
        activationCertSignature: signature,
        installationFingerprint: fingerprint,
        activatedAt: new Date(),
      },
    });

    await auditService.logAction(
      'LICENSE_ACTIVATED',
      'info',
      { licenseId: certPayload.licenseId },
      { ...ctx, resource: 'license', resourceId: certPayload.licenseId, success: true }
    );

    this.invalidateCache();
    return row;
  }

  // -------------------------------------------------------------------
  // Validacao
  // -------------------------------------------------------------------

  static invalidateCache() {
    this.cachedResult = null;
    this.cachedAt = 0;
  }

  static async getCachedValidation(): Promise<LicenseValidationResult> {
    const now = Date.now();
    if (this.cachedResult && now - this.cachedAt < CACHE_TTL_MS) return this.cachedResult;
    return this.validate();
  }

  static async getCurrentRow() {
    return prisma.license.findFirst({ orderBy: { updatedAt: 'desc' } });
  }

  static async validate(): Promise<LicenseValidationResult> {
    const result = await this.computeValidation();
    this.cachedResult = result;
    this.cachedAt = Date.now();

    if (result.license) {
      // Persiste a projecao cacheada (status/lastValidatedAt) so para listagem
      // rapida no admin — NUNCA lida como fonte de verdade na proxima validacao,
      // que recalcula sempre a partir do payload assinado.
      await prisma.license
        .update({ where: { licenseId: result.license.licenseId }, data: { status: result.status, lastValidatedAt: new Date() } })
        .catch(() => {});
    }

    return result;
  }

  private static async computeValidation(): Promise<LicenseValidationResult> {
    const row = await this.getCurrentRow();
    const effectiveNow = await this.getEffectiveNow();

    if (!row) {
      return { status: 'UNLICENSED', reason: null, effectiveNow: effectiveNow.toISOString(), daysRemaining: null, license: null };
    }

    // 1. Assinatura da licenca. A partir daqui, TODOS os campos usados na
    // logica de negocio vem do payload assinado (nunca das colunas soltas da
    // tabela, que sao so cache de leitura para listagem rapida no admin e
    // podem ter sido editadas diretamente na BD sem invalidar a assinatura —
    // e exatamente esse bypass que este passo existe para impedir).
    if (!this.verifySignature(row.signedPayload, row.signature)) {
      return { status: 'INVALID', reason: 'Assinatura da licenca invalida.', effectiveNow: effectiveNow.toISOString(), daysRemaining: null, license: null };
    }

    const payload: LicensePayload = JSON.parse(row.signedPayload);
    const licenseDto = {
      licenseId: payload.licenseId,
      customerName: payload.customerName,
      licenseType: payload.licenseType,
      startsAt: payload.startsAt,
      expiresAt: payload.expiresAt,
      maxUsers: payload.maxUsers,
      maxAdmins: payload.maxAdmins,
      modules: payload.modules || [],
      features: payload.features || {},
      offlineGraceDays: payload.offlineGraceDays ?? 7,
      activatedAt: row.activatedAt ? row.activatedAt.toISOString() : null,
    };
    const startsAt = new Date(payload.startsAt);
    const expiresAt = payload.expiresAt ? new Date(payload.expiresAt) : null;
    const graceDays = payload.offlineGraceDays ?? 7;

    // 2. Ativacao / certificado / fingerprint
    if (!row.activationCertPayload || !row.activationCertSignature) {
      return { status: 'PENDING', reason: 'Licenca carregada mas ainda nao ativada.', effectiveNow: effectiveNow.toISOString(), daysRemaining: null, license: licenseDto };
    }
    if (!this.verifySignature(row.activationCertPayload, row.activationCertSignature)) {
      return { status: 'INVALID', reason: 'Assinatura do certificado de ativacao invalida.', effectiveNow: effectiveNow.toISOString(), daysRemaining: null, license: licenseDto };
    }
    const cert: ActivationCertPayload = JSON.parse(row.activationCertPayload);
    const fingerprint = await this.computeFingerprint();
    if (cert.licenseId !== payload.licenseId || cert.installationFingerprint !== fingerprint) {
      return { status: 'INVALID', reason: 'Esta licenca foi ativada para outra instalacao.', effectiveNow: effectiveNow.toISOString(), daysRemaining: null, license: licenseDto };
    }

    // 3. Revogacao / suspensao (CRL)
    const crl = await this.getCachedCrl();
    if (crl?.revoked?.includes(payload.licenseId)) {
      return { status: 'REVOKED', reason: 'Licenca revogada.', effectiveNow: effectiveNow.toISOString(), daysRemaining: null, license: licenseDto };
    }
    if (crl?.suspended?.includes(payload.licenseId)) {
      return { status: 'SUSPENDED', reason: 'Licenca suspensa.', effectiveNow: effectiveNow.toISOString(), daysRemaining: null, license: licenseDto };
    }

    // 4. Janela de validade
    if (effectiveNow < startsAt) {
      return { status: 'PENDING', reason: 'Licenca ainda nao iniciou a sua validade.', effectiveNow: effectiveNow.toISOString(), daysRemaining: daysBetween(startsAt, effectiveNow), license: licenseDto };
    }

    if (!expiresAt) {
      return { status: 'ACTIVE', reason: null, effectiveNow: effectiveNow.toISOString(), daysRemaining: null, license: licenseDto };
    }

    const graceEnd = new Date(expiresAt.getTime() + graceDays * 24 * 60 * 60 * 1000);
    // positivo = dias ate expirar; negativo = dias desde que expirou (dentro do grace period)
    const daysRemaining = daysBetween(expiresAt, effectiveNow);

    if (effectiveNow > graceEnd) {
      return { status: 'EXPIRED', reason: 'Licenca expirada.', effectiveNow: effectiveNow.toISOString(), daysRemaining, license: licenseDto };
    }
    if (effectiveNow > expiresAt) {
      return { status: 'EXPIRING', reason: 'Licenca expirada — dentro do periodo de tolerancia.', effectiveNow: effectiveNow.toISOString(), daysRemaining, license: licenseDto };
    }
    const warnStart = new Date(expiresAt.getTime() - WARNING_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    if (effectiveNow > warnStart) {
      return { status: 'EXPIRING', reason: `Licenca expira em ${daysRemaining} dia(s).`, effectiveNow: effectiveNow.toISOString(), daysRemaining, license: licenseDto };
    }

    return { status: 'ACTIVE', reason: null, effectiveNow: effectiveNow.toISOString(), daysRemaining, license: licenseDto };
  }

  // -------------------------------------------------------------------
  // Entitlement (modulos / features)
  // -------------------------------------------------------------------

  static isRestricted(status: LicenseStatus): boolean {
    return RESTRICTED_STATUSES.includes(status);
  }

  static moduleIncluded(result: LicenseValidationResult, moduleKey: string): boolean {
    if (result.status === 'UNLICENSED' || !result.license) return true;
    const modules = result.license.modules;
    if (modules.length === 0) return true; // lista vazia = todos os modulos incluidos (licenca "cheia")
    return modules.includes(moduleKey);
  }

  static featureEnabled(result: LicenseValidationResult, featureKey: string): boolean {
    if (result.status === 'UNLICENSED' || !result.license) return true;
    const value = result.license.features[featureKey];
    return value !== false; // por omissao, uma feature nao listada esta habilitada
  }

  static async hasModule(moduleKey: string): Promise<boolean> {
    const result = await this.getCachedValidation();
    if (this.isRestricted(result.status)) return false;
    return this.moduleIncluded(result, moduleKey);
  }

  static async hasFeature(featureKey: string): Promise<boolean> {
    const result = await this.getCachedValidation();
    if (this.isRestricted(result.status)) return false;
    return this.featureEnabled(result, featureKey);
  }

  // -------------------------------------------------------------------
  // Limites de utilizadores
  // -------------------------------------------------------------------

  static async checkUserLimit(kind: 'user' | 'admin' = 'user'): Promise<{ allowed: boolean; current: number; max: number | null }> {
    const result = await this.getCachedValidation();
    const max = kind === 'admin' ? result.license?.maxAdmins ?? null : result.license?.maxUsers ?? null;
    if (max === null || max === undefined) return { allowed: true, current: 0, max: null };

    const current = await prisma.user.count({
      where: kind === 'admin' ? { status: 'active', role: 'admin_sistema' } : { status: 'active' },
    });

    return { allowed: current < max, current, max };
  }
}

export const licenseService = LicenseService;
