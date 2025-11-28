import { NextApiRequest, NextApiResponse } from 'next';
import connect from '@/lib/mongoose';
import Resena from '../../../../../models/Resena';
import { Types } from 'mongoose';
import { authenticate } from '@/lib/authMiddleware';
import { obtenerResenasUsuarioQuerySchema } from '@/schemas/resenaSchema';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const parsed = obtenerResenasUsuarioQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { usuarioId } = parsed.data;

  try {
    const decoded = authenticate(req);

    if (decoded.userId !== usuarioId) {
      return res.status(403).json({ error: 'No tienes permiso para acceder a estas reseñas' });
    }

    await connect();

    const reseñas = await Resena.find({ usuarioId: new Types.ObjectId(usuarioId) })
      .populate('libroId', 'titulo')
      .lean()
      .exec();

    return res.status(200).json(reseñas);

  } catch (error: unknown) {
    console.error('Error al obtener las reseñas del usuario', error);
    return res.status(500).json({ error: error || 'Error al obtener las reseñas' });
  }
}