const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const KEYS_DIR = path.join(__dirname, '..', 'keys');
const PRIVATE_KEY_PATH = path.join(KEYS_DIR, 'private.pem');
const PUBLIC_KEY_PATH = path.join(KEYS_DIR, 'public.pem');

function loadPrivateKey() {
  if (!fs.existsSync(PRIVATE_KEY_PATH)) {
    throw new Error(
      `Chave privada nao encontrada em ${PRIVATE_KEY_PATH}. Corra "node license-tools/generate-keypair.js" primeiro.`
    );
  }
  return crypto.createPrivateKey(fs.readFileSync(PRIVATE_KEY_PATH, 'utf-8'));
}

function loadPublicKey() {
  if (!fs.existsSync(PUBLIC_KEY_PATH)) {
    throw new Error(
      `Chave publica nao encontrada em ${PUBLIC_KEY_PATH}. Corra "node license-tools/generate-keypair.js" primeiro.`
    );
  }
  return crypto.createPublicKey(fs.readFileSync(PUBLIC_KEY_PATH, 'utf-8'));
}

// Assina os bytes EXATOS da string JSON (nao reserializa o objeto), para nao
// haver divergencia de canonicalizacao entre quem assina e quem verifica.
function signPayload(payloadJson) {
  const privateKey = loadPrivateKey();
  const signature = crypto.sign(null, Buffer.from(payloadJson, 'utf-8'), privateKey);
  return signature.toString('base64');
}

function verifyPayload(payloadJson, signatureBase64) {
  const publicKey = loadPublicKey();
  return crypto.verify(
    null,
    Buffer.from(payloadJson, 'utf-8'),
    publicKey,
    Buffer.from(signatureBase64, 'base64')
  );
}

module.exports = { KEYS_DIR, PRIVATE_KEY_PATH, PUBLIC_KEY_PATH, loadPrivateKey, loadPublicKey, signPayload, verifyPayload };
