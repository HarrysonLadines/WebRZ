import { useState } from 'react';
import TarjetaLibro from '../../components/TarjetaLibro';
import Header from '../../components/Header';
import { buscarLibros } from '../lib/apiGoogleBooks';
import { Libro } from '../types/libro';

interface HomePageProps {
  librosIniciales: Libro[];
}

export default function HomePage({ librosIniciales }: HomePageProps) {
  const [libros, setLibros] = useState<Libro[]>(librosIniciales);
  const [pagina, setPagina] = useState(0);
  const [queryActual, setQueryActual] = useState('tendencias');

  const manejarBusqueda = async (query: string) => {
    try {
      setQueryActual(query);
      setPagina(0);
      const resultados = await buscarLibros(query, 0, 20);
      setLibros(resultados);
    } catch (error) {
      console.error('Error buscando libros:', error);
    }
  };

  const cargarMas = async () => {
    const nuevaPagina = pagina + 20;
    const resultados = await buscarLibros(queryActual, nuevaPagina, 20);
    setLibros((prev) => [...prev, ...resultados]);
    setPagina(nuevaPagina);
  };

  return (
    <div className="min-h-screen bg-gray-">
      <Header onBuscar={manejarBusqueda} />
      <main className="max-w-6xl mx-auto p-4 mt-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {libros.map((libro) => (
            <TarjetaLibro key={libro.id} libro={libro} />
          ))}
        </div>
        {libros.length > 0 && (
          <div className="flex justify-center mt-4">
            <button onClick={cargarMas} className="mt-11 mb-10 px-4 py-2 bg-black text-white rounded">
              Cargar más
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export async function getServerSideProps() {
  const librosIniciales = await buscarLibros('tendencias', 0, 20);

  return {
    props: {
      librosIniciales,
    },
  };
}
