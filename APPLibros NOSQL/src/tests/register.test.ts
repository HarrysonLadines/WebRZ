import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import bcrypt from 'bcryptjs';
import Usuario from '../../models/Usuario';
import { createMocks } from 'node-mocks-http';

vi.mock('bcryptjs');
vi.mock('../../../lib/mongoose', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (bcrypt.hash as unknown as Mock).mockResolvedValue('hashed_password');
    Usuario.prototype.save = vi.fn();
  });

  it('crea un usuario nuevo correctamente', async () => {
    (Usuario.findOne as unknown as Mock) = vi.fn().mockResolvedValue(null);

    const { req, res } = createMocks({
      method: 'POST',
      body: { email: 'nuevo@example.com', password: 'password123', nombre: 'Nuevo Usuario' },
    });

    const handler = (await import('@/pages/api/auth/register')).default;

    await handler(req, res);

    expect(res._getStatusCode()).toBe(201);
    expect(Usuario.prototype.save).toHaveBeenCalled();
    const json = JSON.parse(res._getData());
    expect(json.message).toBe('Usuario creado correctamente');
  });

  it('devuelve 400 si el usuario ya existe', async () => {
    (Usuario.findOne as unknown as Mock) = vi.fn().mockResolvedValue({ email: 'existe@example.com' });

    const { req, res } = createMocks({
      method: 'POST',
      body: { email: 'existe@example.com', password: 'password123', nombre: 'Usuario Existente' },
    });

    const handler = (await import('@/pages/api/auth/register')).default;
    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const json = JSON.parse(res._getData());
    expect(json.message).toBe('Usuario ya existe');
  });

  it('devuelve 400 si los datos no pasan validación', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { email: 'no-email', password: '', nombre: '' },
    });

    const handler = (await import('@/pages/api/auth/register')).default;
    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const json = JSON.parse(res._getData());
    expect(json.message).toMatch(/Datos inválidos/i);
  });

  it('devuelve 405 si el método no es POST', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    const handler = (await import('@/pages/api/auth/register')).default;
    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    const json = JSON.parse(res._getData());
    expect(json.message).toBe('Método no permitido');
  });
});
