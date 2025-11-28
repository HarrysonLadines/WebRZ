import { z } from 'zod';

// Schema para crear una reseña (POST)
export const crearResenaSchema = z.object({
  contenido: z
    .string()
    .nonempty('El contenido es obligatorio')
    .min(5, 'El contenido debe tener al menos 5 caracteres'),

  calificacion: z
    .number()
    .min(1, 'La calificación mínima es 1')
    .max(5, 'La calificación máxima es 5'),

  libroId: z
    .string()
    .nonempty('El ID del libro es obligatorio'),  
});

// Schema para editar una reseña (PUT)
export const editarResenaSchema = z.object({
  resenaId: z
    .string()
    .nonempty('El ID de la reseña es obligatorio'),  

  contenido: z
    .string()
    .min(5, 'El contenido debe tener al menos 5 caracteres')
    .optional(),

  calificacion: z
    .number()
    .min(1, 'La calificación mínima es 1')
    .max(5, 'La calificación máxima es 5')
    .optional(),
});

// Validación de query param libroId (GET /reseñas?libroId=...)
export const obtenerResenasQuerySchema = z.object({
  libroId: z
    .string()
    .nonempty('El ID del libro es obligatorio'),  
});

export const obtenerResenasUsuarioQuerySchema = z.object({
  usuarioId: z
    .string()
    .min(1, { message: 'El ID de usuario es requerido' })
    .refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
      message: 'ID de usuario inválido',
    }),
});

export const eliminarResenaQuerySchema = z.object({
  id: z
    .string()
    .nonempty('El ID de la reseña es obligatorio'),  
});
