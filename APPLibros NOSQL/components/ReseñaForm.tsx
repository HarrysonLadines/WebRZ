import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { ReseñaConVotos } from "../src/types/reseña";

interface ReseñaFormProps {
  libroId: string;
  onNuevaReseña: (reseña: ReseñaConVotos) => void;
  usuarioId?: string;
  reseñaEditar?: ReseñaConVotos | null;
}

export default function ReseñaForm({
  onNuevaReseña,
  usuarioId,
  reseñaEditar,
}: ReseñaFormProps) {
  const [texto, setTexto] = useState("");
  const [calificacion, setCalificacion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [libroId, setLibroId] = useState<string | null>(null);
  const [mensajeNoAutenticado, setMensajeNoAutenticado] = useState<string | null>(null);

  const router = useRouter();

  // Obtener libroId desde query params 
  useEffect(() => {
    if (router.query.id && !libroId) {
      setLibroId(router.query.id as string);
    }
  }, [router.query, libroId]);

  useEffect(() => {
    if (reseñaEditar) {
      setTexto(reseñaEditar.contenido);
      setCalificacion(reseñaEditar.calificacion);
      setLibroId(reseñaEditar.libroId); 
    }
  }, [reseñaEditar]);

  // Mensaje si no hay usuario autenticado
  useEffect(() => {
    if (!usuarioId) {
      setMensajeNoAutenticado("Inicia sesión para publicar una reseña.");
    } else {
      setMensajeNoAutenticado(null);
    }
  }, [usuarioId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!texto.trim() || calificacion === 0) {
      console.log("[handleSubmit] Formulario incompleto ❌");
      return;
    }

    if (!libroId) {
      console.log("[handleSubmit] Error: No se encontró libroId");
      return;
    }

    if (!usuarioId) {
      alert("Necesitas iniciar sesión para publicar una reseña.");
      return;
    }

    try {
      setLoading(true);

      const url = reseñaEditar ? `/api/resenas/${reseñaEditar._id}` : "/api/resenas";
      const method = reseñaEditar ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contenido: texto,
          calificacion,
          libroId,
          usuarioId,
        }),
      });

      if (!res.ok) throw new Error("Error al guardar en BD");

      const data: ReseñaConVotos = await res.json();

      onNuevaReseña(data);

      // Reset solo si no es edición
      if (!reseñaEditar) {
        setTexto("");
        setCalificacion(0);
      }

    } catch (err) {
      console.error("[handleSubmit] Error atrapado:", err);
      alert("No se pudo guardar la reseña en la base de datos");
    } finally {
      setLoading(false);
    }
  };

  if (!libroId) {
    return <p>Cargando...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {mensajeNoAutenticado && <p className="text-red-500">{mensajeNoAutenticado}</p>}

      <textarea
        className="w-full p-2 border rounded-lg"
        placeholder="Escribe tu reseña..."
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={4}
      />

      <div className="flex items-center gap-2">
        <label htmlFor="calificacion">Calificación:</label>
        <select
          id="calificacion"
          value={calificacion}
          onChange={(e) => setCalificacion(Number(e.target.value))}
          className="border p-1 rounded"
        >
          <option value={0}>Selecciona</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {"⭐".repeat(n)}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? "Guardando..." : reseñaEditar ? "Actualizar Reseña" : "Publicar Reseña"}
      </button>
    </form>
  );
}
