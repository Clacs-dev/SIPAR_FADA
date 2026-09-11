import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { LicenseService, LicenseValidationResult } from '../services/license.service';

// Par de chaves Ed25519 gerado apenas para este teste — nunca o par real do
// vendor (esse fica fora do repositorio, em license-tools/keys/, e nunca deve
// ser usado em testes automatizados).
const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
const testPublicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();

function sign(payloadJson: string): string {
  return crypto.sign(null, Buffer.from(payloadJson, 'utf-8'), privateKey).toString('base64');
}

test('verifySignature aceita uma assinatura valida gerada com a chave correspondente', () => {
  const payloadJson = JSON.stringify({ licenseId: 'L-1', expiresAt: null });
  const signature = sign(payloadJson);
  assert.equal(LicenseService.verifySignature(payloadJson, signature, testPublicKeyPem), true);
});

test('verifySignature rejeita quando o payload foi adulterado apos a assinatura', () => {
  const original = JSON.stringify({ licenseId: 'L-1', maxUsers: 5 });
  const signature = sign(original);
  const tampered = JSON.stringify({ licenseId: 'L-1', maxUsers: 999 });
  assert.equal(LicenseService.verifySignature(tampered, signature, testPublicKeyPem), false);
});

test('verifySignature rejeita uma assinatura valida mas de outra chave', () => {
  const payloadJson = JSON.stringify({ licenseId: 'L-1' });
  const otherKeyPair = crypto.generateKeyPairSync('ed25519');
  const signature = crypto.sign(null, Buffer.from(payloadJson, 'utf-8'), otherKeyPair.privateKey).toString('base64');
  assert.equal(LicenseService.verifySignature(payloadJson, signature, testPublicKeyPem), false);
});

test('verifySignature nao lanca excecao perante lixo/base64 invalido', () => {
  assert.equal(LicenseService.verifySignature('{}', 'nao-e-base64-valido!!', testPublicKeyPem), false);
  assert.equal(LicenseService.verifySignature('{}', '', testPublicKeyPem), false);
});

test('parseSignedFile rejeita JSON malformado e formato inesperado', () => {
  assert.throws(() => LicenseService.parseSignedFile('nao e json', 'licenca'));
  assert.throws(() => LicenseService.parseSignedFile('{"foo":"bar"}', 'licenca'));
  const valid = LicenseService.parseSignedFile(JSON.stringify({ payloadJson: '{}', signature: 'abc' }), 'licenca');
  assert.deepEqual(valid, { payloadJson: '{}', signature: 'abc' });
});

function baseResult(overrides: Partial<LicenseValidationResult> = {}): LicenseValidationResult {
  return {
    status: 'ACTIVE',
    reason: null,
    effectiveNow: new Date().toISOString(),
    daysRemaining: null,
    license: {
      licenseId: 'L-1',
      customerName: 'Cliente Teste',
      licenseType: 'annual',
      startsAt: new Date().toISOString(),
      expiresAt: null,
      maxUsers: null,
      maxAdmins: null,
      modules: [],
      features: {},
      offlineGraceDays: 7,
      activatedAt: new Date().toISOString(),
    },
    ...overrides,
  };
}

test('moduleIncluded: lista de modulos vazia significa licenca completa (todos incluidos)', () => {
  const result = baseResult({ license: { ...baseResult().license!, modules: [] } });
  assert.equal(LicenseService.moduleIncluded(result, 'facturas'), true);
  assert.equal(LicenseService.moduleIncluded(result, 'qualquer_modulo'), true);
});

test('moduleIncluded: lista nao-vazia restringe aos modulos listados', () => {
  const result = baseResult({ license: { ...baseResult().license!, modules: ['facturas', 'actas'] } });
  assert.equal(LicenseService.moduleIncluded(result, 'facturas'), true);
  assert.equal(LicenseService.moduleIncluded(result, 'compras'), false);
});

test('moduleIncluded: status UNLICENSED nunca bloqueia (sem instalacao licenciada ainda)', () => {
  const result = baseResult({ status: 'UNLICENSED', license: null });
  assert.equal(LicenseService.moduleIncluded(result, 'qualquer_modulo'), true);
});

test('featureEnabled: por omissao uma feature nao listada esta ligada', () => {
  const result = baseResult({ license: { ...baseResult().license!, features: {} } });
  assert.equal(LicenseService.featureEnabled(result, 'export_pdf'), true);
});

test('featureEnabled: feature explicitamente desligada (false) e respeitada', () => {
  const result = baseResult({ license: { ...baseResult().license!, features: { export_pdf: false } } });
  assert.equal(LicenseService.featureEnabled(result, 'export_pdf'), false);
});

test('isRestricted: estados que bloqueiam escrita', () => {
  for (const status of ['PENDING', 'EXPIRED', 'SUSPENDED', 'REVOKED', 'INVALID'] as const) {
    assert.equal(LicenseService.isRestricted(status), true, `${status} deveria estar restrito`);
  }
});

test('isRestricted: estados que NAO bloqueiam', () => {
  for (const status of ['ACTIVE', 'EXPIRING', 'UNLICENSED'] as const) {
    assert.equal(LicenseService.isRestricted(status), false, `${status} nao deveria estar restrito`);
  }
});
