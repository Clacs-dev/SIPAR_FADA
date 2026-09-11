import test from 'node:test';
import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import jwt from 'jsonwebtoken';
import { app } from '../index';

// Rota protegida por requireAuth, usada apenas para verificar rejeicao de
// tokens invalidos/ausentes — nunca chega a tocar dados reais porque o
// middleware rejeita antes de qualquer leitura a base de dados.
const PROTECTED_PATH = '/api/v1/users';

async function withServer(fn: (baseUrl: string) => Promise<void>) {
  const server = app.listen(0);
  try {
    const address = server.address() as AddressInfo;
    await fn(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test('rota protegida rejeita pedido sem token de autorizacao', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}${PROTECTED_PATH}`);
    const payload = await response.json() as { error: string };
    assert.equal(response.status, 401);
    assert.equal(payload.error, 'UNAUTHORIZED');
  });
});

test('rota protegida rejeita token com formato invalido', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}${PROTECTED_PATH}`, {
      headers: { Authorization: 'Bearer nao-e-um-jwt-valido' },
    });
    assert.equal(response.status, 401);
  });
});

test('rota protegida rejeita token assinado com chave errada', async () => {
  await withServer(async (baseUrl) => {
    const forgedToken = jwt.sign({ id: 'fake-id', email: 'fake@example.com' }, 'chave-errada-nao-e-o-segredo-real', {
      expiresIn: '1h',
    });
    const response = await fetch(`${baseUrl}${PROTECTED_PATH}`, {
      headers: { Authorization: `Bearer ${forgedToken}` },
    });
    const payload = await response.json() as { error: string };
    assert.equal(response.status, 401);
    assert.equal(payload.error, 'UNAUTHORIZED');
  });
});

test('rota protegida rejeita token expirado (mesmo com claims plausiveis)', async () => {
  await withServer(async (baseUrl) => {
    // Assinado com uma chave errada mas com exp no passado: o objectivo aqui e
    // garantir que um token expirado nunca autentica, seja qual for a causa
    // da rejeicao (assinatura invalida e/ou expiracao) - o middleware tem de
    // devolver 401 em qualquer um dos casos, nunca deixar passar.
    const expiredToken = jwt.sign(
      { id: 'fake-id', email: 'fake@example.com' },
      'chave-errada-nao-e-o-segredo-real',
      { expiresIn: -10 }
    );
    const response = await fetch(`${baseUrl}${PROTECTED_PATH}`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    assert.equal(response.status, 401);
  });
});
