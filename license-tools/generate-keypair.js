#!/usr/bin/env node
// Gera o par de chaves Ed25519 do vendor. Corre-se UMA VEZ (ou quando se
// decide rodar as chaves). A chave privada fica so em license-tools/keys/,
// que esta no .gitignore da raiz do projeto - nunca sai desta maquina.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { KEYS_DIR, PRIVATE_KEY_PATH, PUBLIC_KEY_PATH } = require('./lib/sign');

const PUBLIC_KEY_TS_PATH = path.join(__dirname, '..', 'server', 'src', 'config', 'license-public-key.ts');

if (fs.existsSync(PRIVATE_KEY_PATH)) {
  console.error(`Ja existe uma chave privada em ${PRIVATE_KEY_PATH}.`);
  console.error('Para gerar um novo par (invalida todas as licencas ja emitidas), apague esse ficheiro primeiro.');
  process.exit(1);
}

fs.mkdirSync(KEYS_DIR, { recursive: true });

const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');

fs.writeFileSync(PRIVATE_KEY_PATH, privateKey.export({ type: 'pkcs8', format: 'pem' }));
const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
fs.writeFileSync(PUBLIC_KEY_PATH, publicKeyPem);

fs.mkdirSync(path.dirname(PUBLIC_KEY_TS_PATH), { recursive: true });
fs.writeFileSync(
  PUBLIC_KEY_TS_PATH,
  `// Gerado por license-tools/generate-keypair.js — NAO editar a mao.
// Chave publica Ed25519 do vendor: usada apenas para VERIFICAR assinaturas de
// licenca/certificado. A chave privada correspondente nunca entra neste
// repositorio do lado do cliente.
export const LICENSE_PUBLIC_KEY_PEM = \`${publicKeyPem.trim()}\`;
`
);

console.log('Par de chaves Ed25519 gerado com sucesso.');
console.log(`  Chave privada: ${PRIVATE_KEY_PATH} (NAO versionar, NAO distribuir)`);
console.log(`  Chave publica: ${PUBLIC_KEY_PATH}`);
console.log(`  Constante TS:  ${PUBLIC_KEY_TS_PATH} (versionar normalmente)`);
