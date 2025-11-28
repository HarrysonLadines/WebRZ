import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from 'next';
import { loginSchema } from '@/schemas/authSchema';

import Usuario from '../../../../models/Usuario';
import connect from '../../../lib/mongoose';

type ResponseData = {
  message?: string;
  token?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    const errorMessages = result.error.issues.map(issue => issue.message).join(', ');
    return res.status(400).json({ message: `Datos inválidos: ${errorMessages}` });
  }

  const { email, password } = result.data;

  await connect();

  // Buscar usuario
  const user = await Usuario.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: 'Credenciales incorrectas' });
  }

  // Comparar contraseñas
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(400).json({ message: 'Credenciales incorrectas' });
  }

  // Generar token
  const token = jwt.sign(
    { userId: user._id, email: user.email, nombre: user.nombre },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );

  // Setear cookie HTTP-only
  res.setHeader(
    'Set-Cookie',
    `token=${token}; HttpOnly; Path=/; Max-Age=3600; SameSite=Lax; Secure=false`
  );

  return res.status(200).json({ message: 'Login exitoso', token });
}
