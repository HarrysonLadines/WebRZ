import type { NextApiRequest, NextApiResponse } from 'next';
import connect from '@/lib/mongoose';
import Voto from '../../../../../../models/Voto';
import { Types } from 'mongoose';
import { verify } from 'jsonwebtoken';
import { votarResenaParamsSchema, votarResenaBodySchema} from '@/schemas/votoSchema';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Validar query (id)
  const parsedQuery = votarResenaParamsSchema.safeParse(req.query);
  if (!parsedQuery.success) {
    return res.status(400).json({ error: parsedQuery.error.flatten() });
  }
  const { id } = parsedQuery.data;

  // Validar body (tipo)
  const parsedBody = votarResenaBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({ error: parsedBody.error.flatten() });
  }
  const { tipo } = parsedBody.data;

  try {
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({ error: 'No estás autenticado' });
    }

    const decoded = verify(token, process.env.JWT_SECRET!) as { userId: string };
    const { userId } = decoded;

    const votoExistente = await Voto.findOne({
      resenaId: new Types.ObjectId(id),
      usuarioId: new Types.ObjectId(userId),
    });

    if (votoExistente) {
      return res.status(400).json({ error: 'Ya has votado por esta reseña' });
    }

    const nuevoVoto = new Voto({
      resenaId: new Types.ObjectId(id),
      tipo,
      usuarioId: new Types.ObjectId(userId),
    });

    await nuevoVoto.save();

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error al guardar voto:', error);
    return res.status(500).json({ error: error || 'Error interno' });
  }
}

