import { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';

type ResponseData = {
  message: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method === 'POST') {
    res.setHeader('Set-Cookie', serialize('token', '', { path: '/', maxAge: -1 }));
    return res.status(200).json({ message: 'Sesión cerrada correctamente' });

  } else {
    res.status(405).json({ message: 'Método no permitido' });
  }
}