import { NextApiRequest, NextApiResponse } from 'next';
import Favorito from '../../../../models/Favorito';
import Usuario from '../../../../models/Usuario';
import mongoose from 'mongoose';
import { z } from 'zod';

const marcarFavoritoSchema = z.object({
  usuarioId: z.string().refine(val => mongoose.Types.ObjectId.isValid(val), {
    message: 'El usuarioId no es válido',
  }),
  libroId: z.string().min(1, { message: 'El libroId debe ser un string válido' }),
});

async function marcarFavorito(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const parseResult = marcarFavoritoSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errors = parseResult.error.flatten();
    return res.status(400).json({ message: errors.formErrors[0] || 'Parámetros inválidos' });
  }

  const { usuarioId, libroId } = parseResult.data;

  try {
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    let favorito = await Favorito.findOne({ usuarioId });

    if (!favorito) {
      favorito = new Favorito({
        usuarioId,
        librosIds: [libroId],
        creadoEn: new Date(),
      });
    } else {
      if (favorito.librosIds.includes(libroId)) {
        return res.status(400).json({ message: 'El libro ya está en la lista de favoritos' });
      }
      favorito.librosIds.push(libroId);
    }

    await favorito.save();
    return res.status(200).json(favorito);
  } catch (error) {
    console.error('Error al guardar el favorito:', error);
    return res.status(500).json({ message: 'Error al marcar como favorito', error });
  }
}

export default marcarFavorito;
