import { z } from 'zod';

// Validar un ObjectId de MongoDB
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, {
  message: 'ID inválido',
});

// Validación para obtener favoritos (usuarioId en query)
export const obtenerFavoritosSchema = z.object({
  usuarioId: objectIdSchema,
});

// Validación para marcar favorito (POST body)
export const marcarFavoritoSchema = z.object({
  usuarioId: objectIdSchema,
  libroId: z.string().min(1, { message: 'El libroId es obligatorio' }),
});

// Validación para desmarcar favorito (POST body)
export const desmarcarFavoritoSchema = z.object({
  usuarioId: objectIdSchema,
  libroId: z.string().min(1, { message: 'El libroId es obligatorio' }),
});
