#!/usr/bin/env node
const fs = require('fs');
const crypto = require('crypto');
const { parseArgs } = require('./lib/args');
const { signPayload } = require('./lib/sign');

const args = parseArgs(process.argv.slice(2));

function fail(msg) {
  console.error(`Erro: ${msg}`);
  process.exit(1);
}

if (!args.customer) fail('--customer e obrigatorio');
if (!args.type) fail('--type e obrigatorio (ex.: trial, monthly, annual, custom, lifetime)');
if (!args.starts) fail('--starts e obrigatorio (AAAA-MM-DD)');
if (!args.out) fail('--out e obrigatorio (ex.: cliente.lic)');

const startsAt = new Date(`${args.starts}T00:00:00.000Z`);
if (isNaN(startsAt.getTime())) fail(`--starts invalido: ${args.starts}`);

let expiresAt = null;
if (args.expires) {
  expiresAt = new Date(`${args.expires}T23:59:59.999Z`);
  if (isNaN(expiresAt.getTime())) fail(`--expires invalido: ${args.expires}`);
}

const modules = args.modules ? String(args.modules).split(',').map((m) => m.trim()).filter(Boolean) : [];

const features = {};
if (args.features) {
  for (const pair of String(args.features).split(',')) {
    const [key, value] = pair.split('=');
    if (!key) continue;
    features[key.trim()] = value === undefined ? true : value.trim() === 'true';
  }
}

// Reutilizar o mesmo licenseId numa renovacao evita nova ativacao (ver
// license-tools/README.md, secao 2, e server/src/services/license.service.ts).
const licenseId = args.licenseId || crypto.randomUUID();

const payload = {
  licenseId,
  customerName: args.customer,
  licenseType: args.type,
  startsAt: startsAt.toISOString(),
  expiresAt: expiresAt ? expiresAt.toISOString() : null,
  maxUsers: args.maxUsers ? Number(args.maxUsers) : null,
  maxAdmins: args.maxAdmins ? Number(args.maxAdmins) : null,
  modules,
  features,
  offlineGraceDays: args.grace ? Number(args.grace) : 7,
  minVersion: args.minVersion || null,
  issuedAt: new Date().toISOString(),
};

const payloadJson = JSON.stringify(payload);
const signature = signPayload(payloadJson);

fs.writeFileSync(args.out, JSON.stringify({ payloadJson, signature }, null, 2));

console.log(`Licenca gerada: ${args.out}`);
console.log(`  licenseId: ${licenseId}`);
console.log(`  cliente:   ${payload.customerName}`);
console.log(`  tipo:      ${payload.licenseType}`);
console.log(`  validade:  ${payload.startsAt} -> ${payload.expiresAt || 'vitalicia'}`);
console.log(`  modulos:   ${modules.join(', ') || '(nenhum)'}`);
