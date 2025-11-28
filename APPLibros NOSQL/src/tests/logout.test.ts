import { describe, it, expect } from 'vitest';
import { createMocks } from 'node-mocks-http';

describe('POST /api/auth/logout', () => {
  it('cierra sesión correctamente y borra la cookie', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    const handler = (await import('@/pages/api/auth/logout')).default;

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);

    const cookieHeader = res.getHeader('Set-Cookie');
    expect(cookieHeader).toBeDefined();
    expect(typeof cookieHeader).toBe('string');
    expect(cookieHeader).toMatch(/^token=;/);
    expect(cookieHeader).toMatch(/Max-Age=-1/);

    const json = JSON.parse(res._getData());
    expect(json.message).toBe('Sesión cerrada correctamente');
  });

  it('devuelve 405 si el método no es POST', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    const handler = (await import('@/pages/api/auth/logout')).default;

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    const json = JSON.parse(res._getData());
    expect(json.message).toBe('Método no permitido');
  });
});
