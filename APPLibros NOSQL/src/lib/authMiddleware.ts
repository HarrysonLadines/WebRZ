import jwt, { JwtPayload } from 'jsonwebtoken';
import { getCookie } from '@/utils/cookies';
import { NextApiRequest } from 'next';

interface DecodedToken extends JwtPayload {
  userId: string;
}

export const authenticate = (req: NextApiRequest): DecodedToken => {
  const token = getCookie('token', req);

  if (!token) {
    throw new Error('No se proporcionó token');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    return decoded;
  } catch {
    throw new Error('Token inválido o expirado');
  }
};
