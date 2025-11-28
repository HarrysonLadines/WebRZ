import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { authenticate } from '@/lib/authMiddleware';
import { NextApiRequest } from 'next';

// Mock para getCookie
const getCookieMock = vi.fn();

vi.mock('@/utils/cookies', () => ({
  getCookie: (name: string, req: NextApiRequest) => getCookieMock(name, req),
}));

vi.mock('jsonwebtoken', async (importOriginal) => {
  const actual = await importOriginal<typeof import('jsonwebtoken')>();
  return {
    default: {
      ...actual,
      verify: vi.fn(),
    },
  };
});

describe('authenticate middleware', () => {
  const mockReq = {} as NextApiRequest;

  beforeEach(() => {
    getCookieMock.mockReset();
    (jwt.verify as unknown as ReturnType<typeof vi.fn>).mockReset();
  });

  it('lanza error si no hay token', () => {
    getCookieMock.mockReturnValue(null);

    expect(() => authenticate(mockReq)).toThrow('No se proporcionó token');
  });

  it('lanza error si el token es inválido', () => {
    getCookieMock.mockReturnValue('token_invalido');
    (jwt.verify as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('invalid token');
    });

    expect(() => authenticate(mockReq)).toThrow('Token inválido o expirado');
  });

  it('retorna el token decodificado si es válido', () => {
    const decodedToken = { userId: '123', iat: 0, exp: 9999 };
    getCookieMock.mockReturnValue('token_valido');
    (jwt.verify as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => decodedToken);

    const resultado = authenticate(mockReq);
    expect(resultado).toEqual(decodedToken);
  });
});
