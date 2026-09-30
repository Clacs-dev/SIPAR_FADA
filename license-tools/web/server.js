#!/usr/bin/env node
// Ferramenta web local (uso exclusivo do vendor) para gerar licencas,
// certificados de ativacao e revogacoes do SIPAR-FADA, com historico de
// clientes guardado em SQLite. NUNCA expor esta porta fora de localhost: usa
// a mesma chave privada de license-tools/keys/private.pem (ver README.md
// da pasta license-tools/).
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { signPayload, KEYS_DIR } = require('../lib/sign');
const store = require('./lib/db');

const PORT = process.env.LICENSE_TOOL_PORT ? Number(process.env.LICENSE_TOOL_PORT) : 4790;
const HOST = '127.0.0.1'; // nunca 0.0.0.0 - esta ferramenta assina licencas com a chave privada do vendor
const CRL_OUT = path.join(__dirname, '..', 'crl.json');

// Modulos licenciaveis reconhecidos pelo servidor (ver requireLicenseModule(...)
// em server/src/routes/*.routes.ts e config.permissionModule em modules.routes.ts).
// Uma licenca com a lista de modulos vazia inclui TODOS os modulos (ver
// LicenseService.moduleIncluded em server/src/services/license.service.ts).
const MODULES = [
  { key: 'presentations', label: 'Carta de apresentacao' },
  { key: 'audiences', label: 'Pedido de audiencia' },
  { key: 'invoices', label: 'Factura' },
  { key: 'finance', label: 'Financas (Fornecedores + Procurement)' },
  { key: 'communications', label: 'Comunicacao' },
  { key: 'actas', label: 'Acta' },
  { key: 'departments', label: 'Departamentos / Areas' },
  { key: 'users', label: 'Utilizadores' },
  { key: 'roles', label: 'Perfis (Roles)' },
  { key: 'audit', label: 'Auditoria' },
  { key: 'messages', label: 'Mensagens' },
  { key: 'internal_meetings', label: 'Reunioes internas' },
  { key: 'email', label: 'E-mail' },
  { key: 'settings', label: 'Definicoes do sistema' },
  { key: 'notifications', label: 'Notificacoes' },
];

function fail(res, status, message) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: message }));
}

function ok(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) req.destroy();
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('JSON invalido no pedido'));
      }
    });
    req.on('error', reject);
  });
}

function rowToJson(row) {
  return {
    licenseId: row.licenseId,
    customerName: row.customerName,
    licenseType: row.licenseType,
    startsAt: row.startsAt,
    expiresAt: row.expiresAt,
    maxUsers: row.maxUsers,
    maxAdmins: row.maxAdmins,
    modules: JSON.parse(row.modules),
    features: JSON.parse(row.features),
    offlineGraceDays: row.offlineGraceDays,
    issuedAt: row.issuedAt,
    fingerprint: row.fingerprint,
    activatedAt: row.activatedAt,
    hasCert: !!row.certFile,
    revoked: !!row.revoked,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function buildLicensePayload(body, licenseId) {
  if (!body.customer) throw new Error('Cliente e obrigatorio');
  if (!body.type) throw new Error('Tipo de licenca e obrigatorio');
  if (!body.starts) throw new Error('Data de inicio e obrigatoria');

  const startsAt = new Date(`${body.starts}T00:00:00.000Z`);
  if (isNaN(startsAt.getTime())) throw new Error(`Data de inicio invalida: ${body.starts}`);

  let expiresAt = null;
  if (body.expires) {
    expiresAt = new Date(`${body.expires}T23:59:59.999Z`);
    if (isNaN(expiresAt.getTime())) throw new Error(`Data de expiracao invalida: ${body.expires}`);
  }

  const modules = Array.isArray(body.modules) ? body.modules.filter(Boolean) : [];
  const features = body.features && typeof body.features === 'object' ? body.features : {};

  const payload = {
    licenseId,
    customerName: String(body.customer).trim(),
    licenseType: String(body.type).trim(),
    startsAt: startsAt.toISOString(),
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
    maxUsers: body.maxUsers ? Number(body.maxUsers) : null,
    maxAdmins: body.maxAdmins ? Number(body.maxAdmins) : null,
    modules,
    features,
    offlineGraceDays: body.grace ? Number(body.grace) : 7,
    minVersion: null,
    issuedAt: new Date().toISOString(),
  };

  const payloadJson = JSON.stringify(payload);
  const signature = signPayload(payloadJson);
  const licenseFile = JSON.stringify({ payloadJson, signature }, null, 2);

  return { payload, licenseFile };
}

function regenerateCrl() {
  const revoked = store.listRevokedIds();
  const seqFile = path.join(KEYS_DIR, 'crl-seq.txt');
  let seq = 0;
  if (fs.existsSync(seqFile)) seq = parseInt(fs.readFileSync(seqFile, 'utf-8').trim(), 10) || 0;
  seq += 1;
  fs.mkdirSync(KEYS_DIR, { recursive: true });
  fs.writeFileSync(seqFile, String(seq));

  const payload = { seq, revoked, issuedAt: new Date().toISOString() };
  const payloadJson = JSON.stringify(payload);
  const signature = signPayload(payloadJson);
  fs.writeFileSync(CRL_OUT, JSON.stringify({ payloadJson, signature }, null, 2));
  return payload;
}

function sanitizeFilename(name) {
  return String(name).normalize('NFKD').replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').toLowerCase();
}

function serveStatic(req, res) {
  const filePath = path.join(__dirname, 'public', 'index.html');
  fs.readFile(filePath, (err, data) => {
    if (err) return fail(res, 500, 'Nao foi possivel carregar a pagina');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const parts = url.pathname.split('/').filter(Boolean);

  try {
    if (req.method === 'GET' && url.pathname === '/') return serveStatic(req, res);

    if (req.method === 'GET' && url.pathname === '/api/modules') {
      return ok(res, { modules: MODULES });
    }

    if (req.method === 'GET' && url.pathname === '/api/clients') {
      return ok(res, { clients: store.listClients().map(rowToJson) });
    }

    if (req.method === 'POST' && url.pathname === '/api/clients') {
      const body = await readJsonBody(req);
      // licenseId so deve ser passado manualmente ao importar uma licenca ja
      // emitida antes de existir esta ferramenta (ex.: via CLI) - normalmente
      // e sempre gerado de novo.
      const licenseId = body.licenseId || crypto.randomUUID();
      if (store.getClient(licenseId)) return fail(res, 409, 'Ja existe um cliente com este licenseId');
      const { payload, licenseFile } = buildLicensePayload(body, licenseId);
      store.insertClient({
        licenseId,
        customerName: payload.customerName,
        licenseType: payload.licenseType,
        startsAt: payload.startsAt,
        expiresAt: payload.expiresAt,
        maxUsers: payload.maxUsers,
        maxAdmins: payload.maxAdmins,
        modules: JSON.stringify(payload.modules),
        features: JSON.stringify(payload.features),
        offlineGraceDays: payload.offlineGraceDays,
        issuedAt: payload.issuedAt,
        licenseFile,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return ok(res, { client: rowToJson(store.getClient(licenseId)) }, 201);
    }

    if (req.method === 'POST' && parts[0] === 'api' && parts[1] === 'clients' && parts[3] === 'renew') {
      const licenseId = decodeURIComponent(parts[2]);
      const existing = store.getClient(licenseId);
      if (!existing) return fail(res, 404, 'Cliente nao encontrado');
      const body = await readJsonBody(req);
      const { payload, licenseFile } = buildLicensePayload(body, licenseId);
      store.renewClient(licenseId, {
        customerName: payload.customerName,
        licenseType: payload.licenseType,
        startsAt: payload.startsAt,
        expiresAt: payload.expiresAt,
        maxUsers: payload.maxUsers,
        maxAdmins: payload.maxAdmins,
        modules: JSON.stringify(payload.modules),
        features: JSON.stringify(payload.features),
        offlineGraceDays: payload.offlineGraceDays,
        issuedAt: payload.issuedAt,
        licenseFile,
        updatedAt: new Date().toISOString(),
      });
      return ok(res, { client: rowToJson(store.getClient(licenseId)) });
    }

    if (req.method === 'GET' && parts[0] === 'api' && parts[1] === 'clients' && parts[3] === 'lic') {
      const licenseId = decodeURIComponent(parts[2]);
      const row = store.getClient(licenseId);
      if (!row) return fail(res, 404, 'Cliente nao encontrado');
      const filename = `${sanitizeFilename(row.customerName)}.lic`;
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      });
      return res.end(row.licenseFile);
    }

    if (req.method === 'POST' && parts[0] === 'api' && parts[1] === 'clients' && parts[3] === 'activate') {
      const licenseId = decodeURIComponent(parts[2]);
      const existing = store.getClient(licenseId);
      if (!existing) return fail(res, 404, 'Cliente nao encontrado');
      const body = await readJsonBody(req);
      const fingerprint = String(body.fingerprint || '').trim();
      if (!fingerprint) return fail(res, 400, 'Fingerprint e obrigatorio');

      const certPayload = { licenseId, installationFingerprint: fingerprint, activatedAt: new Date().toISOString() };
      const payloadJson = JSON.stringify(certPayload);
      const signature = signPayload(payloadJson);
      const certFile = JSON.stringify({ payloadJson, signature }, null, 2);

      store.setActivation(licenseId, { fingerprint, certFile, activatedAt: certPayload.activatedAt });
      return ok(res, { client: rowToJson(store.getClient(licenseId)) });
    }

    if (req.method === 'GET' && parts[0] === 'api' && parts[1] === 'clients' && parts[3] === 'cert') {
      const licenseId = decodeURIComponent(parts[2]);
      const row = store.getClient(licenseId);
      if (!row || !row.certFile) return fail(res, 404, 'Certificado ainda nao gerado para este cliente');
      const filename = `${sanitizeFilename(row.customerName)}.cert`;
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      });
      return res.end(row.certFile);
    }

    if (req.method === 'POST' && parts[0] === 'api' && parts[1] === 'clients' && (parts[3] === 'revoke' || parts[3] === 'unrevoke')) {
      const licenseId = decodeURIComponent(parts[2]);
      const existing = store.getClient(licenseId);
      if (!existing) return fail(res, 404, 'Cliente nao encontrado');
      store.setRevoked(licenseId, parts[3] === 'revoke');
      const crl = regenerateCrl();
      return ok(res, { client: rowToJson(store.getClient(licenseId)), crl });
    }

    if (req.method === 'DELETE' && parts[0] === 'api' && parts[1] === 'clients' && parts.length === 3) {
      const licenseId = decodeURIComponent(parts[2]);
      store.deleteClient(licenseId);
      return ok(res, { success: true });
    }

    fail(res, 404, 'Rota nao encontrada');
  } catch (error) {
    fail(res, 400, error.message || 'Erro inesperado');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Gerador de licencas SIPAR-FADA disponivel em http://${HOST}:${PORT} (uso local apenas)`);
  console.log(`Base de dados: ${path.join(store.DATA_DIR, 'clients.db')}`);
});
