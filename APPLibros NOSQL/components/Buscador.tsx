'use client';

import { useState } from 'react';
import Image from 'next/image';
import * as React from 'react';

export default function Buscador({ onBuscar }: { onBuscar: (query: string) => void }) {
  const [query, setQuery] = useState('');
  const [tipo, setTipo] = useState<'title' | 'author' | 'isbn'>('author');

  const manejarSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let busqueda = '';
    if (tipo === 'title') {
      busqueda = query; // 
    } else if (tipo === 'author') {
      busqueda = `inauthor:${query}`;
    } else if (tipo === 'isbn') {
      busqueda = `isbn:${query}`;
    }

    onBuscar(busqueda);
  };

  return (
    <div className="flex justify-center mt-2 mb-8 items-center space-x-4">
      {/* Logo */}
      <div className="flex-shrink-0">
        <Image src="/globe.svg" alt="Logo" width={60} height={60} className="object-contain" />
      </div>

      {/* Buscador */}
      <form
        onSubmit={manejarSubmit}
        className="flex items-center max-w-md w-full bg-white shadow-md rounded-full overflow-hidden"
      >
        {/* Desplegable de tipo de búsqueda */}
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as 'title' | 'author' | 'isbn')}
          aria-label="Seleccionar tipo de búsqueda"
          className="px-4 py-2 border-r border-gray-300 focus:outline-none text-gray-700"
        >
          <option value="title" className='text-black'>Título</option>
          <option value="author" className='text-black'>Autor</option>
          <option value="isbn" className='text-black'>ISBN</option>
        </select>

        <input
          type="text"
          placeholder="Buscar libro..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-grow px-4 py-2 text-gray-700 placeholder-gray-400 focus:outline-none"
        />
        <button
          type="submit"
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 flex items-center justify-center transition-colors duration-200"
        >
          🔍
        </button>
      </form>
    </div>
  );
}
