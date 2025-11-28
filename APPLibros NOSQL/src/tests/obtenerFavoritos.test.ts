import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { createMocks } from 'node-mocks-http';
import Favorito from '../../models/Favorito';
import handler from '@/pages/api/favoritos/[usuarioId]';

vi.mock('../../models/Favorito');

describe('GET /api/favoritos/obtenerFavoritos', () => {
  const mockLibros = [
    { _id: 'libro1', title: 'Libro 1', authors: ['Autor 1'], publishedDate: '2020' },
    { _id: 'libro2', title: 'Libro 2', authors: ['Autor 2'], publishedDate: '2021' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devuelve lista de libros favoritos para usuario válido', async () => {
    (Favorito.findOne as unknown as Mock).mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue({ librosIds: mockLibros }),
    });

    const { req, res } = createMocks({
      method: 'GET',
      query: { usuarioId: '507f1f77bcf86cd799439011' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data).toEqual(mockLibros);
  });

  it('devuelve 400 si usuarioId inválido', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { usuarioId: '123' }, // inválido
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.message).toMatch(/no es válido/i);
  });

  it('devuelve 404 si no encuentra favoritos para usuario', async () => {
    (Favorito.findOne as unknown as Mock).mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(null),
    });

    const { req, res } = createMocks({
      method: 'GET',
      query: { usuarioId: '507f1f77bcf86cd799439011' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(404);
    const data = JSON.parse(res._getData());
    expect(data.message).toMatch(/no se encontraron libros favoritos/i);
  });

  it('devuelve 405 si método no es GET', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: { usuarioId: '507f1f77bcf86cd799439011' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    const data = JSON.parse(res._getData());
    expect(data.message).toMatch(/método no permitido/i);
  });
});
