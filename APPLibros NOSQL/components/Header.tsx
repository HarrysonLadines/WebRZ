import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Buscador from './Buscador';

export default function Header({ onBuscar }: { onBuscar: (query: string) => void }) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    const res = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (res.ok) {
      logout();
    } else {
      console.error('Error al cerrar sesión');
    }
  };

  return (
    <header className="w-full bg-black text-white p-4 shadow-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Image src="/vercel.svg" alt="Logo" width={50} height={50} className="object-contain" />
          <span className="text-xl font-bold">Buscador 3000</span>
        </div>

        {/* Navegación según el estado de autenticación */}
        <div className="flex space-x-4">
          {user ? (
            <>
              <Link
                href="/perfil"
                className="px-4 py-1 rounded-md border border-white hover:bg-white hover:text-black transition-colors duration-200"
              >
                Mi perfil
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-1 rounded-md border border-white hover:bg-white hover:text-black transition-colors duration-200"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-1 rounded-md border border-white hover:bg-white hover:text-black transition-colors duration-200"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="px-4 py-1 rounded-md bg-red-500 hover:bg-red-600 transition-colors duration-200"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Buscador centrado */}
      <div className="mt-6 flex justify-center">
        <Buscador onBuscar={onBuscar} />
      </div>
    </header>
  );
}
