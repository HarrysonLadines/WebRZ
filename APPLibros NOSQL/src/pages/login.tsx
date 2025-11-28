import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import HeaderAuth from '../../components/HeaderAuth';

export default function LoginPage() {
  // Estados para controlar los inputs del formulario y errores
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Contexto de autenticación para usar el método login
  const { login } = useAuth();

  // Router para redireccionar después del login exitoso
  const router = useRouter();

  // Función que maneja el submit del formulario de login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();  // Evitar recarga de página

    try {
      // Petición al endpoint de login en el backend con email y password
      const response = await axios.post('/api/auth/login', { email, password });

      // Extraemos el token JWT recibido en la respuesta
      const { token } = response.data;

      // Decodificamos el token para obtener datos del usuario
      const decoded = jwt.decode(token) as { userId: string; email: string };

      // Actualizamos el contexto de autenticación con los datos del usuario
      login({ id: decoded.userId, email: decoded.email });

      // Redirigimos a la página principal tras login exitoso
      router.push('/');
    } catch (err) {
      setError('Credenciales incorrectas. ' + err);
    }
  };

  return (
    <div className="min-h-screen bg-black-100">
      {/* Header fijo para páginas de autenticación */}
      <HeaderAuth />

      {/* Contenedor centrado para el formulario */}
      <div className="flex items-center justify-center min-h-screen pt-0">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full sm:w-96">
          <h1 className="text-2xl font-semibold text-center mb-6 text-gray-800">
            Iniciar sesión
          </h1>

          {/* Formulario de login */}
          <form onSubmit={handleLogin}>
            {/* Campo email */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                required
              />
            </div>

            {/* Campo contraseña */}
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                required
              />
            </div>

            {/* Mensaje de error */}
            {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

            {/* Botón de enviar */}
            <button
              type="submit"
              className="w-full py-3 bg-black text-white font-semibold rounded-md hover:bg-gray-800 focus:outline-none"
            >
              Iniciar sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
