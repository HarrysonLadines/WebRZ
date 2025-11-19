import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Crear un usuario de prueba
  const usuario = await prisma.usuario.create({
    data: {
      nombre: "Harryson",
      email: "harryson@example.com",
      contrasena: "123456",
    },
  });
  console.log("Usuario creado:", usuario);

  // Agregar un libro a la lista de lectura
  const libroLista = await prisma.readingList.create({
    data: {
      usuarioId: usuario.id,
      bookId: "abc123",
      prioridad: "alta",
      notas: "Leer este libro primero",
    },
  });
  console.log("Libro agregado a lista de lectura:", libroLista);

  // Marcar un libro como leído
  const libroLeido = await prisma.readBooks.create({
    data: {
      usuarioId: usuario.id,
      bookId: "xyz789",
      calificacion: 5,
      reseña: "Me encantó este libro!",
    },
  });
  console.log("Libro marcado como leído:", libroLeido);

  // Leer lista de lectura del usuario
  const lista = await prisma.readingList.findMany({
    where: { usuarioId: usuario.id },
  });
  console.log("Lista de lectura del usuario:", lista);

  // Leer libros leídos del usuario
  const leidos = await prisma.readBooks.findMany({
    where: { usuarioId: usuario.id },
  });
  console.log("Libros leídos del usuario:", leidos);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
