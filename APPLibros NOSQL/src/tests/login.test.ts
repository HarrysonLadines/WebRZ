import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Usuario from '../../models/Usuario';
import handler from '@/pages/api/auth/login';
import { createMocks } from 'node-mocks-http';

vi.mock('bcryptjs');
vi.mock('jsonwebtoken');

beforeEach(() => {
  Usuario.findOne = vi.fn();

  (bcrypt.compare as unknown as Mock).mockReset();
  (jwt.sign as unknown as Mock).mockReset();
});

describe('POST /api/auth/login', () => {
  const mockUser = {
    _id: 'user123',
    email: 'test@example.com',
    password: 'hashed_password',
  };

  it('devuelve 200 en login exitoso', async () => {
    (Usuario.findOne as Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as Mock).mockResolvedValue(true);
    (jwt.sign as Mock).mockReturnValue('mocked_token');

    const { req, res } = createMocks({
      method: 'POST',
      body: { email: 'test@example.com', password: 'password123' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const json = JSON.parse(res._getData());
    expect(json.token).toBe('mocked_token');
  });

  it('devuelve 400 si el usuario no existe', async () => {
    (Usuario.findOne as Mock).mockResolvedValue(null);

    const { req, res } = createMocks({
      method: 'POST',
      body: { email: 'noexiste@example.com', password: 'password123' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const json = JSON.parse(res._getData());
    expect(json.message).toMatch(/credenciales incorrectas/i);

  });

  it('devuelve 400 si la contraseña es incorrecta', async () => {
    (Usuario.findOne as Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as Mock).mockResolvedValue(false);

    const { req, res } = createMocks({
      method: 'POST',
      body: { email: 'test@example.com', password: 'wrongpassword' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const json = JSON.parse(res._getData());
    expect(json.message).toMatch(/credenciales incorrectas/i);
  });

  it('devuelve 400 si datos no pasan validación', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { email: '', password: '' }, 
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
  });

  it('devuelve 405 si el método no es POST', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
  });
});
