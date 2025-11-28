import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { createMocks } from 'node-mocks-http';
import Usuario from '../../models/Usuario';
import Favorito from '../../models/Favorito';
import marcarFavoritoHandler from '@/pages/api/favoritos/marcar';

vi.mock('../../models/Usuario');
vi.mock('../../models/Favorito');

describe('POST /api/favoritos/marcar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('agrega un libro favorito cuando el usuario y favoritos existen y libro no está en la lista', async () => {
    const saveMock = vi.fn().mockResolvedValue(true);
    const favoritoMock = {
      usuarioId: '507f1f77bcf86cd799439011',
      librosIds: ['libroExistente'],
      save: saveMock,
    };

    (Usuario.findById as Mock).mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
    (Favorito.findOne as Mock).mockResolvedValue(favoritoMock);

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        usuarioId: '507f1f77bcf86cd799439011',
        libroId: 'libroNuevo',
      },
    });

    await marcarFavoritoHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.librosIds).toContain('libroNuevo');
    expect(saveMock).toHaveBeenCalled();
  });

  it('crea favoritos y agrega libro si no existe favoritos para usuario', async () => {
    (Usuario.findById as Mock).mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
    });

    (Favorito.findOne as Mock).mockResolvedValue(null);

    const fakeFavorito = {
      usuarioId: '507f1f77bcf86cd799439011',
      librosIds: ['libroNuevo'],
      save: vi.fn().mockResolvedValue(true),
    };

    (Favorito as unknown as { mockImplementation: (impl: () => unknown) => void }).mockImplementation(() => fakeFavorito);

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        usuarioId: '507f1f77bcf86cd799439011',
        libroId: 'libroNuevo',
      },
    });

    await marcarFavoritoHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.librosIds).toContain('libroNuevo');
    expect(fakeFavorito.save).toHaveBeenCalled();
  });

  it('devuelve 400 si el libro ya está en la lista de favoritos', async () => {
    const favoritoMock = {
      usuarioId: '507f1f77bcf86cd799439011',
      librosIds: ['libroRepetido'],
      save: vi.fn(),
    };

    (Usuario.findById as Mock).mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
    (Favorito.findOne as Mock).mockResolvedValue(favoritoMock);

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        usuarioId: '507f1f77bcf86cd799439011',
        libroId: 'libroRepetido',
      },
    });

    await marcarFavoritoHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.message).toMatch(/ya está en la lista/i);
  });

  it('devuelve 400 si datos no son válidos', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        usuarioId: 'invalido',
        libroId: '',
      },
    });

    await marcarFavoritoHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.message).toBeDefined();
  });

  it('devuelve 404 si usuario no encontrado', async () => {
    (Usuario.findById as Mock).mockResolvedValue(null);

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        usuarioId: '507f1f77bcf86cd799439011',
        libroId: 'libroNuevo',
      },
    });

    await marcarFavoritoHandler(req, res);

    expect(res._getStatusCode()).toBe(404);
    const data = JSON.parse(res._getData());
    expect(data.message).toMatch(/usuario no encontrado/i);
  });

  it('devuelve 405 si método no es POST', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      body: {},
    });

    await marcarFavoritoHandler(req, res);

    expect(res._getStatusCode()).toBe(405);
    const data = JSON.parse(res._getData());
    expect(data.message).toMatch(/método no permitido/i);
  });
});
