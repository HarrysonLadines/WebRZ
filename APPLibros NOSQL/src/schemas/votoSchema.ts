import { z } from 'zod';

export const votarResenaParamsSchema = z.object({
  id: z.string().min(1, { message: 'El ID es obligatorio' }),
});

export const votarResenaBodySchema = z.object({
  tipo: z
    .string()
    .refine((val) => val === 'UP' || val === 'DOWN', {
      message: 'Tipo de voto inválido',
    }),
});