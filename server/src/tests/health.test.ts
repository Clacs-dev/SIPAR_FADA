import test from 'node:test';
import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import { app } from '../index';

test('health endpoint responde 200 e devolve x-request-id', async () => {
  const server = app.listen(0);

  try {
    const address = server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/health`, {
      headers: { 'x-request-id': 'test-request-id' },
    });
    const payload = await response.json() as { status: string; timestamp: string };

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-request-id'), 'test-request-id');
    assert.equal(payload.status, 'ok');
    assert.ok(payload.timestamp);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});

test('rota inexistente devolve 404 com requestId', async () => {
  const server = app.listen(0);

  try {
    const address = server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/rota-inexistente`, {
      headers: { 'x-request-id': 'test-not-found' },
    });
    const payload = await response.json() as { error: string; requestId?: string };

    assert.equal(response.status, 404);
    assert.equal(response.headers.get('x-request-id'), 'test-not-found');
    assert.equal(payload.error, 'NOT_FOUND');
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});
