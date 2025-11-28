import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import jwt from 'jsonwebtoken';
import Usuario from '../../models/Usuario';

vi.mock('jsonwebtoken');
vi.mock('../../models/Usuario');
vi.mock('../../lib/mongoose', () => ({
  default: vi.fn(),
}));

describe('GET /api/auth/me', () => {
  const mockUser = {
    _id: 'user123',
    email: 'test@example.com',
    nombre: 'Test User',
  };

  beforeEach(() => {
    (jwt.verify as jest.Mock).mockReset();
    (Usuario.findById as jest.Mock).mockReset();
  });

  it('devuelve datos del usuario si el token es válido', async () => {
    (jwt.verify as unknown as jest.Mock).mockReturnValue({ userId: 'user123', email: 'test@example.com' });
    (Usuario.findById as unknown as jest.Mock).mockResolvedValue(mockUser);

    const { req, res } = createMocks({
      method: 'GET',
      cookies: {
        token: 'validtoken',
      },
    });

    const handler = (await import('@/pages/api/auth/me')).default;
    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const json = JSON.parse(res._getData());
    expect(json.user).toMatchObject({
      id: mockUser._id,
      email: mockUser.email,
      nombre: mockUser.nombre,
    });
  });

  it('devuelve 401 si no hay token', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      cookies: {},
    });

    const handler = (await import('@/pages/api/auth/me')).default;
    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
    const json = JSON.parse(res._getData());
    expect(json.message).toMatch(/no autorizado/i);
  });

  it('devuelve 401 si el token es inválido', async () => {
    (jwt.verify as unknown as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const { req, res } = createMocks({
      method: 'GET',
      cookies: { token: 'invalidtoken' },
    });

    const handler = (await import('@/pages/api/auth/me')).default;
    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
    const json = JSON.parse(res._getData());
    expect(json.message).toMatch(/token inválido/i);
  });

  it('devuelve 401 si el usuario no existe', async () => {
    (jwt.verify as unknown as jest.Mock).mockReturnValue({ userId: 'user123', email: 'test@example.com' });
    (Usuario.findById as unknown as jest.Mock).mockResolvedValue(null);

    const { req, res } = createMocks({
      method: 'GET',
      cookies: { token: 'validtoken' },
    });

    const handler = (await import('@/pages/api/auth/me')).default;
    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
    const json = JSON.parse(res._getData());
    expect(json.message).toMatch(/usuario no encontrado/i);
  });

  it('devuelve 405 si el método no es GET', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    const handler = (await import('@/pages/api/auth/me')).default;
    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    const json = JSON.parse(res._getData());
    expect(json.message).toMatch(/método no permitido/i);
  });
});
