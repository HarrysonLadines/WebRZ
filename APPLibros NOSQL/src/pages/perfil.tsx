import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { IResena } from '../../models/Resena';
import Link from 'next/link';

const API_GOOGLE_BOOKS_URL = 'https://www.googleapis.com/books/v1/volumes';

type Favorito =
  | string
  | {
      id: string;
      authors?: string[];
      publishedDate?: string;
    };

// Estado y lógica del componente
const Perfil = () => {
  const [user, setUser] = useState<{ id: string; nombre?: string; email: string } | null>(null);
  const [reseñas, setReseñas] = useState<IResena[]>([]);
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const [loading, setLoading] = useState(true);

  // Almacenamos no solo el título sino también autores y fecha
  const [detallesLibros, setDetallesLibros] = useState<
    Record<string, { title: string; authors?: string[]; publishedDate?: string }>
  >({});

  const router = useRouter();

  // Obtener usuario logueado
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get('/api/auth/me', { withCredentials: true });
        setUser(response.data.user);
      } catch (error) {
        console.error('Error al obtener el usuario:', error);
        router.push('/login');
      }
    };

    fetchUser();
  }, [router]);

  // Cargar reseñas, favoritos y detalles de libros
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Reseñas
        const resenasRes = await axios.get(`/api/resenas/usuario/${user.id}`, { withCredentials: true });
        setReseñas(resenasRes.data);

        // Favoritos
        const favoritosRes = await axios.get(`/api/favoritos/${user.id}`, { withCredentials: true });
        setFavoritos(favoritosRes.data);

        // Extraer IDs únicos de libros 
        const idsResenas: string[] = resenasRes.data.map((resena: IResena) => resena.libroId);
        const idsFavoritos: string[] = favoritosRes.data.map((libro: Favorito) =>
          typeof libro === 'string' ? libro : libro.id
        );
        const libroIdsUnicos: string[] = Array.from(new Set([...idsResenas, ...idsFavoritos]));

        // Objeto temporal con detalles
        const nuevosDetalles: Record<
          string,
          { title: string; authors?: string[]; publishedDate?: string }
        > = {};

        // Buscar detalles en Google Books
        await Promise.all(
          libroIdsUnicos.map(async (libroId: string) => {
            try {
              const res = await fetch(`${API_GOOGLE_BOOKS_URL}/${libroId}`);
              if (!res.ok) throw new Error(`No se encontró el libro con ID ${libroId}`);

              const data = await res.json();
              nuevosDetalles[libroId] = {
                title: data.volumeInfo?.title || 'Título no disponible',
                authors: data.volumeInfo?.authors || [],
                publishedDate: data.volumeInfo?.publishedDate || undefined,
              };
            } catch (error) {
              nuevosDetalles[libroId] = {
                title: 'Título no disponible',
                authors: [],
                publishedDate: undefined,
              };
              console.error(`Error al obtener datos del libro ${libroId}:`, error);
            }
          })
        );

        // Guardar en el estado
        setDetallesLibros(nuevosDetalles);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Pantalla de carga
  if (loading) return <p className="text-center text-gray-500">Cargando tu información...</p>;

  return (
    <div className="w-full max-w-6xl mx-auto p-6 relative">
      <button
        onClick={() => router.push('/')}
        className="absolute top-4 left-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
      >
        Volver
      </button>

      <h1 className="text-3xl font-bold mb-6 text-center">Mi Perfil</h1>

      {/* Info de usuario */}
      <div className="mb-6 p-4 bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Información de Usuario</h2>
        {user ? (
          <>
            <p><strong>Nombre:</strong> {user.nombre || 'No disponible'}</p>
            <p><strong>Email:</strong> {user.email}</p>
          </>
        ) : (
          <p>Cargando usuario...</p>
        )}
      </div>

      {/* Historial de Reseñas */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Historial de Reseñas</h2>
        {reseñas.length === 0 ? (
          <p>No has creado reseñas aún.</p>
        ) : (
          <ul className="space-y-4">
            {reseñas.map((reseña) => (
              <li key={reseña._id.toString()} className="border p-4 rounded-lg bg-gray-700">
                <h3 className="font-bold text-xl mb-2">
                  {detallesLibros[reseña.libroId]?.title || 'Cargando título...'}
                </h3>
                <p>{reseña.contenido}</p>
                <p className="text-sm text-gray-500">Calificación: {reseña.calificacion}</p>
                <p className="text-sm text-gray-500">Fecha: {new Date(reseña.fechaCreacion).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Libros Favoritos */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Libros Favoritos</h2>
        {favoritos.length === 0 ? (
          <p>No has marcado libros como favoritos aún.</p>
        ) : (
          <ul className="space-y-4">
            {favoritos.map((libro) => {
              const libroId = typeof libro === 'string' ? libro : libro.id;
              const detalles = detallesLibros[libroId];
              const title = detalles?.title || 'Cargando título...';
              const authors = detalles?.authors?.join(', ') || 'Desconocido';
              const publishedDate = detalles?.publishedDate || 'N/A';

              return (
                <li key={libroId} className="border p-4 rounded-lg bg-gray-700 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-xl mb-2">{title}</h3>
                    <p className="text-sm text-gray-500">Autor: {authors}</p>
                    <p className="text-sm text-gray-500">Publicado: {publishedDate}</p>
                  </div>
                  <Link
                    href={`/libro/${libroId}`}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    Buscar
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Perfil;
