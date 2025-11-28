import { describe, test, expect, beforeAll, afterAll} from 'vitest';
import handler from '@/pages/api/resenas/index';
import { createMocks } from 'node-mocks-http';
import mongoose, { Types } from 'mongoose';
import { sign } from 'jsonwebtoken';
import connect from '@/lib/mongoose';
import Resena from '../../models/Resena';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

describe('/api/resenas API', () => {
  let userId: string;
  let token: string;
  let libroId: string;
  let resenaId: string;

  beforeAll(async () => {
    await connect();

    userId = new Types.ObjectId().toString();
    token = sign({ userId }, JWT_SECRET);

    libroId = new Types.ObjectId().toString();

    const resena = new Resena({
      contenido: 'Reseña inicial',
      calificacion: 3,
      libroId,
      usuarioId: new Types.ObjectId(userId),
      fechaCreacion: new Date(),
    });
    const saved = await resena.save();
    resenaId = saved._id.toString();
  });

  afterAll(async () => {
    await Resena.deleteMany({ libroId });
    await mongoose.connection.close();
  });

  test('POST /api/resenas crea una reseña con token', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        contenido: 'Nueva reseña desde test',
        calificacion: 4,
        libroId,
      },
      cookies: {
        token,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(201);

    const data = JSON.parse(res._getData());
    expect(data.contenido).toBe('Nueva reseña desde test');
    expect(data.calificacion).toBe(4);
    expect(data.libroId).toBe(libroId);
    expect(data.usuarioId).toBe(userId);
  });

  test('GET /api/resenas devuelve array con reseñas y votos', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { libroId },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);

    const data = JSON.parse(res._getData());
    expect(Array.isArray(data)).toBe(true);

    if (data.length > 0) {
      expect(data[0]).toHaveProperty('likes');
      expect(data[0]).toHaveProperty('dislikes');
      expect(data[0]).toHaveProperty('contenido');
    }
  });

  test('PUT /api/resenas edita una reseña si es el autor', async () => {
    const { req, res } = createMocks({
      method: 'PUT',
      body: {
        resenaId,
        contenido: 'Reseña editada desde test',
        calificacion: 5,
      },
      cookies: {
        token,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);

    const data = JSON.parse(res._getData());
    expect(data.contenido).toBe('Reseña editada desde test');
    expect(data.calificacion).toBe(5);
  });

  test('DELETE /api/resenas elimina una reseña si es el autor', async () => {
    const resena = new Resena({
      contenido: 'Reseña a eliminar',
      calificacion: 1,
      libroId,
      usuarioId: new Types.ObjectId(userId),
      fechaCreacion: new Date(),
    });
    const saved = await resena.save();

    const { req, res } = createMocks({
      method: 'DELETE',
      query: { id: saved._id.toString() },
      cookies: {
        token,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.message).toBe('Reseña eliminada correctamente');
  });

  test('POST /api/resenas rechaza sin token', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        contenido: 'No autorizado',
        calificacion: 3,
        libroId,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('No estás autenticado');
  });
});
