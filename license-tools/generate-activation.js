#!/usr/bin/env node
const fs = require('fs');
const { parseArgs } = require('./lib/args');
const { signPayload } = require('./lib/sign');

const args = parseArgs(process.argv.slice(2));

function fail(msg) {
  console.error(`Erro: ${msg}`);
  process.exit(1);
}

if (!args.licenseId) fail('--licenseId e obrigatorio (o mesmo licenseId da licenca .lic ja emitida)');
if (!args.fingerprint) fail('--fingerprint e obrigatorio (recebido do ecra de ativacao do cliente)');
if (!args.out) fail('--out e obrigatorio (ex.: cliente.cert)');

const payload = {
  licenseId: args.licenseId,
  installationFingerprint: args.fingerprint,
  activatedAt: new Date().toISOString(),
};

const payloadJson = JSON.stringify(payload);
const signature = signPayload(payloadJson);

fs.writeFileSync(args.out, JSON.stringify({ payloadJson, signature }, null, 2));

console.log(`Certificado de ativacao gerado: ${args.out}`);
console.log(`  licenseId:    ${payload.licenseId}`);
console.log(`  fingerprint:  ${payload.installationFingerprint}`);
