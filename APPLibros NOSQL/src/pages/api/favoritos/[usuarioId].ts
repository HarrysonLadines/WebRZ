import { NextApiRequest, NextApiResponse } from 'next';
import Favorito from '../../../../models/Favorito';
import { z } from 'zod';

const obtenerFavoritosSchema = z.object({
  usuarioId: z.string().regex(/^[0-9a-fA-F]{24}$/, { message: 'El usuarioId no es válido' }),
});

async function obtenerFavoritos(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const parsedQuery = obtenerFavoritosSchema.safeParse(req.query);
  if (!parsedQuery.success) {
    const flattenedErrors = parsedQuery.error.flatten();
    const firstErrorMessage = flattenedErrors.fieldErrors.usuarioId?.[0] || 'Error en el parámetro usuarioId';
    return res.status(400).json({ message: firstErrorMessage });
  }


  const { usuarioId } = parsedQuery.data;

  try {
    const favorito = await Favorito.findOne({ usuarioId })
      .populate('librosIds', 'title authors publishedDate')
      .exec();

    console.log(favorito);

    if (!favorito) {
      return res.status(404).json({ message: 'No se encontraron libros favoritos para este usuario' });
    }

    return res.status(200).json(favorito.librosIds);
  } catch (error) {
    console.error('Error al obtener los favoritos:', error);
    return res.status(500).json({ message: 'Error al obtener los favoritos', error });
  }
}

export default obtenerFavoritos;
