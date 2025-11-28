import Link from 'next/link';
import { Libro } from '../src/types/libro';
import Image from 'next/image';
import React from "react";

interface TarjetaLibroProps {
  libro: Libro;
}

export default function TarjetaLibro({ libro }: TarjetaLibroProps) {
  const info = libro.volumeInfo;

  // Seleccionar la mejor imagen disponible
  const links = info.imageLinks;
  const imagen =
    links?.extraLarge ||
    links?.large ||
    links?.medium ||
    links?.thumbnail ||
    '/default.png';

  const imagenSegura = imagen.startsWith('http://')
    ? imagen.replace('http://', 'https://')
    : imagen;

  const titulo = info.title ?? 'Sin título';

  return (
    <Link
      href={`/libro/${libro.id}`}
      passHref
      aria-label={`Ver detalles del libro ${titulo}`}
      className="block">

      <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer">
        <div className="w-full h-60 sm:h-72 relative">
          <Image
            src={imagenSegura}
            alt={titulo}
            fill
            style={{ objectFit: 'cover' }}
            className="transition-transform duration-300 hover:scale-105"
            sizes="(max-width: 640px) 100vw, 25vw"
            priority={false}
          />
        </div>
        <div className="p-2">
          <h3 className="text-gray-800 font-semibold text-center truncate text-sm sm:text-base">
            {titulo}
          </h3>
        </div>
      </div>

    </Link>
  );
}
