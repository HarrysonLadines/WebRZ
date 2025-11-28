import bcrypt from 'bcryptjs';
import { NextApiRequest, NextApiResponse } from 'next';
import Usuario from '../../../../models/Usuario';
import connect from '../../../lib/mongoose';
import { registerSchema } from '@/schemas/authSchema';

type ResponseData = {
  message: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method === 'POST') {
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
      const errorMessages = result.error.issues.map(issue => issue.message).join(', ');
      return res.status(400).json({ message: `Datos inválidos: ${errorMessages}` });
    }

    const { email, password, nombre } = result.data;

    await connect(); 

    // Verificar si el usuario ya existe
    const existingUser = await Usuario.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Usuario ya existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear el nuevo usuario
    const newUser = new Usuario({
      email,
      passwordHash: hashedPassword,
      nombre,
      createdAt: new Date(),
    });

    // Guardar el usuario en la base de datos
    await newUser.save();

    return res.status(201).json({ message: 'Usuario creado correctamente' });
  } else {
    res.status(405).json({ message: 'Método no permitido' });
  }
}
