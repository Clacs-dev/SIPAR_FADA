#!/usr/bin/env node
// Gera a lista de revogacao (CRL). Inclui um "seq" monotonico (persistido em
// keys/crl-seq.txt) para o cliente poder rejeitar uma CRL antiga reenviada
// de proposito para esconder uma revogacao mais recente (ver plano, secao 7
// e secao 13, vetor "replay de CRL antiga").
const fs = require('fs');
const path = require('path');
const { parseArgs } = require('./lib/args');
const { signPayload, KEYS_DIR } = require('./lib/sign');

const args = parseArgs(process.argv.slice(2));

function fail(msg) {
  console.error(`Erro: ${msg}`);
  process.exit(1);
}

if (!args.out) fail('--out e obrigatorio (ex.: crl.json)');

const revoked = args.revoked
  ? String(args.revoked).split(',').map((id) => id.trim()).filter(Boolean)
  : [];

const seqFile = path.join(KEYS_DIR, 'crl-seq.txt');
let seq = 0;
if (fs.existsSync(seqFile)) {
  seq = parseInt(fs.readFileSync(seqFile, 'utf-8').trim(), 10) || 0;
}
seq += 1;
fs.mkdirSync(KEYS_DIR, { recursive: true });
fs.writeFileSync(seqFile, String(seq));

const payload = {
  seq,
  revoked,
  issuedAt: new Date().toISOString(),
};

const payloadJson = JSON.stringify(payload);
const signature = signPayload(payloadJson);

fs.writeFileSync(args.out, JSON.stringify({ payloadJson, signature }, null, 2));

console.log(`CRL gerada: ${args.out}`);
console.log(`  seq:      ${seq}`);
console.log(`  revoked:  ${revoked.join(', ') || '(nenhuma)'}`);
