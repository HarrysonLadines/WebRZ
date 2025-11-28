"use client";

import React, { useEffect, useState } from 'react';
import ListaReseñas from './ListaReseñas';
import ReseñaForm from './ReseñaForm';
import { ReseñaConVotos } from '@/types/reseña';

interface ReseñasInteractivoProps {
  libroId: string;
  usuarioId?: string;
}

export default function ReseñasInteractivo({ libroId, usuarioId }: ReseñasInteractivoProps) {
  const [reseñas, setReseñas] = useState<ReseñaConVotos[]>([]);

  useEffect(() => {
    async function fetchReseñas() {
      try {
        const res = await fetch(`/api/resenas?libroId=${libroId}`);
        if (!res.ok) throw new Error('Error al traer reseñas');
        const data = await res.json();
        console.log('Reseñas obtenidas:', data);
        setReseñas(data);
      } catch (error) {
        console.error('Error al obtener las reseñas:', error);
      }
    }
    fetchReseñas();
  }, [libroId]);

  // Calcular promedio de calificación
  const promedio =
    reseñas.length > 0
      ? reseñas.reduce((acc, r) => acc + r.calificacion, 0) / reseñas.length
      : 0;

  // Actualiza las reseñas al crear o editar una reseña
  const handleNuevaReseña = (nuevaReseña: ReseñaConVotos) => {
    setReseñas(prev => {
      const existe = prev.find(r => r._id === nuevaReseña._id);
      if (existe) {
        // Si ya existe, actualizamos esa reseña
        return prev.map(r => (r._id === nuevaReseña._id ? nuevaReseña : r));
      } else {
        // Si es nueva, la agregamos al principio
        return [nuevaReseña, ...prev];
      }
    });
  };

  return (
    <div className="mt-12 max-w-6xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">
        Reseñas
      </h2>

      {/* Mostrar estrellas de promedio */}
      <div className="flex items-center space-x-1 mb-6">
        {Array.from({ length: Math.round(promedio) }).map((_, i) => (
          <span key={i} className="text-yellow-400 text-lg">★</span>
        ))}
        {Array.from({ length: 5 - Math.round(promedio) }).map((_, i) => (
          <span key={i} className="text-gray-500 text-lg">★</span>
        ))}
        <span className="ml-2 text-sm text-gray-300">
          {promedio.toFixed(1)} / 5
        </span>
      </div>

      <ListaReseñas
        libroId={libroId}
        reseñas={reseñas}
        setReseñas={setReseñas}
        usuarioId={usuarioId ?? ''}
      />

      <div className="mt-6">
        <ReseñaForm
          libroId={libroId}
          onNuevaReseña={handleNuevaReseña}
          usuarioId={usuarioId ?? ''}
        />
      </div>
    </div>
  );
}
