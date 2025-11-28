import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import ReseñasInteractivo from './ReseñasInteractivo';
import { Libro } from '@/types/libro';

function DetalleLibro({ libro }: { libro: Libro }) {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Verifica si el libro ya está marcado como favorito por el usuario
  const verificarFavorito = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/favoritos/${user.id}`);

      if (!response.ok) {
        if (response.status === 404) {
          setIsFavorite(false);
          setIsLoading(false);
          return;
        }
        throw new Error('Error al obtener los favoritos');
      }

      const favoritos = await response.json();
      const isFav = favoritos.some((libroId: string) => libroId === libro.id);
      setIsFavorite(isFav);
    } catch {
        setError('Error al obtener los favoritos');
      }
      finally {
      setIsLoading(false);
    }
  }, [user, libro.id]);

  useEffect(() => {
    verificarFavorito();
  }, [verificarFavorito]);

  // Alterna entre marcar o desmarcar el libro como favorito
  const toggleFavorito = async () => {
    if (!user) {
      setError('Necesitas iniciar sesión para marcar como favorito');
      return;
    }

    try {
      const endpoint = isFavorite ? 'desmarcar' : 'marcar';
      const response = await fetch(`http://localhost:3000/api/favoritos/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId: user.id,
          libroId: libro.id,
        }),
      });

      if (!response.ok) throw new Error('Error al actualizar favoritos');

      setIsFavorite(!isFavorite);
    } catch {
      setError('Error al actualizar el favorito');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center text-gray-500">
        Cargando detalles del libro...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="mb-6">
        <button
          onClick={() => history.back()}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
        >
          Volver
        </button>
      </div>

      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* Portada del libro */}
        <div className="flex-shrink-0 rounded-lg overflow-hidden shadow-lg border border-gray-700">
          <Image
            src={libro.volumeInfo.imageLinks?.thumbnail || '/default.jpg'}
            alt={libro.volumeInfo.title || 'Sin título'}
            width={300}
            height={400}
            className="object-cover"
          />
        </div>

        {/* Detalles del libro */}
        <div className="flex-1 space-y-4">
          <h1 className="text-4xl font-bold">{libro.volumeInfo.title}</h1>

          <div className="space-y-1 text-gray-300">
            <p>
              <span className="font-semibold text-white">Autor:</span>{' '}
              {libro.volumeInfo.authors?.join(', ') || 'Desconocido'}
            </p>
            <p>
              <span className="font-semibold text-white">Publicado:</span>{' '}
              {libro.volumeInfo.publishedDate || 'N/A'}
            </p>
            <p>
              <span className="font-semibold text-white">Páginas:</span>{' '}
              {libro.volumeInfo.pageCount || 'N/A'}
            </p>
            <p>
              <span className="font-semibold text-white">Categorías:</span>{' '}
              {(libro.volumeInfo.categories || []).slice(0, 5).join(', ')}
              {libro.volumeInfo.categories && libro.volumeInfo.categories.length > 5 ? ', ...' : ''}
            </p>
          </div>

          <div
            className="mt-4 text-gray-200 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: libro.volumeInfo.description || 'Sin descripción disponible.',
            }}
          ></div>
        </div>
      </div>

      {/* Botón para marcar/desmarcar como favorito */}
      <div className="mt-8 text-center">
        <button
          onClick={toggleFavorito}
          className={`px-4 py-2 ${isFavorite ? 'bg-red-500' : 'bg-yellow-500'} text-black rounded`}
        >
          {isFavorite ? 'Desmarcar como favorito' : 'Marcar como favorito ★'}
        </button>

        {error && error === 'Necesitas iniciar sesión para marcar como favorito' && (
          <p className="mt-4 text-red-500">{error}</p>
        )}
      </div>

      {/* Sección de reseñas */}
      <div className="mt-12 max-w-6xl mx-auto">
        <ReseñasInteractivo libroId={libro.id} usuarioId={user ? user.id : ''} />
      </div>
    </div>
  );
}

export default DetalleLibro;
