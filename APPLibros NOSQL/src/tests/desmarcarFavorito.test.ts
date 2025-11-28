import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { createMocks } from 'node-mocks-http';
import desmarcarFavoritoHandler from '@/pages/api/favoritos/desmarcar';
import Favorito from '../../models/Favorito';
import Usuario from '../../models/Usuario';

vi.mock('../../models/Favorito');
vi.mock('../../models/Usuario');

describe('POST /api/favoritos/desmarcar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockFavorito = {
    usuarioId: '507f1f77bcf86cd799439011',
    librosIds: ['libro1', 'libro2'],
    save: vi.fn().mockResolvedValue(true),
  };

  it('desmarca libro favorito correctamente', async () => {
    (Usuario.findById as unknown as Mock).mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
    (Favorito.findOne as unknown as Mock).mockResolvedValue(mockFavorito);

    const { req, res } = createMocks({
      method: 'POST',
      body: { usuarioId: '507f1f77bcf86cd799439011', libroId: 'libro1' },
    });

    await desmarcarFavoritoHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.librosIds).not.toContain('libro1');
    expect(mockFavorito.save).toHaveBeenCalled();
  });

  it('devuelve 400 si datos inválidos', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { usuarioId: 'invalido', libroId: '' },
    });

    await desmarcarFavoritoHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.message).toMatch(/parámetros inválidos/i);
  });

  it('devuelve 404 si usuario no existe', async () => {
    (Usuario.findById as unknown as Mock).mockResolvedValue(null);

    const { req, res } = createMocks({
      method: 'POST',
      body: { usuarioId: '507f1f77bcf86cd799439011', libroId: 'libro1' },
    });

    await desmarcarFavoritoHandler(req, res);

    expect(res._getStatusCode()).toBe(404);
    const data = JSON.parse(res._getData());
    expect(data.message).toMatch(/usuario no encontrado/i);
  });

  it('devuelve 404 si no hay favoritos para el usuario', async () => {
    (Usuario.findById as unknown as Mock).mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
    (Favorito.findOne as unknown as Mock).mockResolvedValue(null);

    const { req, res } = createMocks({
      method: 'POST',
      body: { usuarioId: '507f1f77bcf86cd799439011', libroId: 'libro1' },
    });

    await desmarcarFavoritoHandler(req, res);

    expect(res._getStatusCode()).toBe(404);
    const data = JSON.parse(res._getData());
    expect(data.message).toMatch(/no tiene favoritos registrados/i);
  });

  it('devuelve 400 si libro no está en favoritos', async () => {
    const favoritoSinLibro = {
      usuarioId: '507f1f77bcf86cd799439011',
      librosIds: ['libro2'],
      save: vi.fn(),
    };
    (Usuario.findById as unknown as Mock).mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
    (Favorito.findOne as unknown as Mock).mockResolvedValue(favoritoSinLibro);

    const { req, res } = createMocks({
      method: 'POST',
      body: { usuarioId: '507f1f77bcf86cd799439011', libroId: 'libro1' },
    });

    await desmarcarFavoritoHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.message).toMatch(/no está en la lista de favoritos/i);
  });

  it('devuelve 405 si método no es POST', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      body: {},
    });

    await desmarcarFavoritoHandler(req, res);

    expect(res._getStatusCode()).toBe(405);
    const data = JSON.parse(res._getData());
    expect(data.message).toMatch(/método no permitido/i);
  });
});
