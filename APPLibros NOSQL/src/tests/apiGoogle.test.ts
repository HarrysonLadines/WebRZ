import { describe, test, expect, vi, beforeEach } from 'vitest';
import { buscarLibroPorID, buscarLibros } from '@/lib/apiGoogleBooks';

describe('API Google Books', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('buscarLibros retorna un array de libros', async () => {
    const mockItems = [{ id: '1', title: 'Libro 1' }];
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockItems }),
    } as Response);

    const libros = await buscarLibros('harry potter');
    expect(Array.isArray(libros)).toBe(true);
    expect(libros.length).toBeGreaterThan(0);
  });

  test('buscarLibros retorna un array vacío si no hay resultados', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    const libros = await buscarLibros('tema-sin-resultados');
    expect(libros).toEqual([]);
  });

  test('buscarLibroPorID retorna un libro por ID', async () => {
    const mockLibro = { id: 'abc123', title: 'Libro test' };
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockLibro,
    } as Response);

    const libro = await buscarLibroPorID('abc123');
    expect(libro).toHaveProperty('id', 'abc123');
    expect(libro.title).toBe('Libro test');
  });
});
