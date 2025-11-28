import { NextApiRequest } from 'next';

export const getCookie = (name: string, req?: NextApiRequest) => {
  // Si estamos en el frontend (navegador), usar document.cookie
  if (typeof window !== "undefined") {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return "";
  }

  // Si estamos en el backend (servidor), usar req.headers.cookie
  if (req && req.headers.cookie) {
    const cookie = req.headers.cookie;
    const match = cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    if (match) return match[2]; // Retorna el valor de la cookie
  }

  return "";  // Si no se encuentra la cookie, retornamos un valor vacío
};
