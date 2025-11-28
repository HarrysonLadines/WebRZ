import { GetServerSideProps } from 'next';
import DetalleLibro from '../../../components/DetalleLibro';
import { buscarLibroPorID } from '@/lib/apiGoogleBooks';
import { Libro } from '@/types/libro';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const id = context.params?.id as string;

  const libro = await buscarLibroPorID(id);

  if (!libro) {
    return { notFound: true };
  }

  return {
    props: { libro },
  };
};

export default function LibroPage({ libro }: { libro: Libro }) {
  return <DetalleLibro libro={libro} />;
}
