import Image from 'next/image';
import Link from 'next/link';

export default function HeaderAuth() {
  return (
    <header className="w-full bg-black text-white p-4 shadow-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo y título */}
        <div className="flex items-center space-x-2">
          <Image src="/vercel.svg" alt="Logo" width={50} height={50} className="object-contain" />
          <span className="text-xl font-bold">Buscador 3000</span>
        </div>

        {/* Navegación para usuarios no autenticados */}
        <div className="flex space-x-4">
          <Link href="/login" legacyBehavior>
            <button className="px-4 py-1 rounded-md border border-white hover:bg-white hover:text-black transition-colors duration-200">
              Iniciar sesión
            </button>
          </Link>

          <Link href="/register" legacyBehavior>
            <button className="px-4 py-1 rounded-md bg-red-500 hover:bg-red-600 transition-colors duration-200">
              Registrarse
            </button>
          </Link>

          <Link href="/" legacyBehavior>
            <button className="px-4 py-1 rounded-md bg-gray-600 hover:bg-gray-700 transition-colors duration-200">
              🏠
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}
