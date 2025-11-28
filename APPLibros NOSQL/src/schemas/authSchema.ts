import { z } from 'zod';

//  Schema para registro de usuario
export const registerSchema = z.object({
  email: z.string().email({ message: 'El email no es válido' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
  nombre: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
});

//  Schema para login de usuario
export const loginSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(1, { message: 'La contraseña es requerida' }),
});
