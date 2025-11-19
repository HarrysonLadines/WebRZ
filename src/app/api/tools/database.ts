import { PrismaClient } from "@prisma/client";
import { tool } from "ai";
import { z } from "zod";
import { buscarLibros, buscarLibroPorID } from "@/lib/googleBooks";

const prisma = new PrismaClient();

// 📚 Interfaz lo que devuelve la capa de servicio BuscarLibroPorID, buscarLibro.
export interface ResultadoLibroSimplificado {
  id: string; 
  title: string | undefined;
  authors?: string[];
  description?: string;
  publishedDate?: string;
  pageCount?: number; 
  categories?: string[];
  imageLinks?: {
    thumbnail?: string;
  };
}

// Tool para buscar libros
export const buscarLibro = tool({
  name: "buscarLibro",
  description: "Busca libros por palabra clave usando la API de Google Books y devuelve un resumen de los resultados.",
  inputSchema: z.object({
    query: z.string().min(1).describe("La palabra clave o título del libro a buscar."),
    startIndex: z.number().optional().default(0),
    maxResults: z.number().optional().default(5),
  }),
  execute: async ({ query, startIndex, maxResults }) => {
    try {
      console.log(`!🟢! Ejecutando buscarLibro con query="${query}", startIndex=${startIndex}, maxResults=${maxResults}`);
      // 1. Ejecutar la búsqueda (retorna directamente el array SimplifiedBookResult[])
      const libros = await buscarLibros(query, startIndex, maxResults); 
      
      // 2. Retorna el array obtenido de buscarLibros
        console.log("Libros encontrados:", libros);
      return { 
          success: true, 
          books: libros 
      };
      console.log("Libros encontrados:", libros);
      
    } catch (e) {
        console.error("Error al buscar libros:", e);
        return { success: false, error: "Ocurrió un error al consultar la API de Google Books.", books: [] };
    }
},
});

// Tool para obtener libro por ID
export const obtenerLibroPorID = tool({
  name: "obtenerLibroPorID",
  description: "Obtiene información detallada de un libro por ID.",
  inputSchema: z.object({
    id: z.string().describe("El ID único del libro (Google Books ID)."),
  }),
  execute: async ({ id }) => {
    try {
      // 1. Ejecutar la búsqueda
      const libro = await buscarLibroPorID(id); 
      
      if (!libro || !libro.title) {
          return { success: false, book: null, error: `Libro con ID ${id} no encontrado.` };
      }

      // 2. Retornar el objeto simplificado directamente al LLM
      return { 
          success: true, 
          book: libro 
      };

    } catch (e) {
        console.error("Error al obtener libro por ID:", e);
        return { success: false, book: null, error: "Ocurrió un error al obtener detalles del libro." };
    }
  },
});

export const AñadirAReadingList = (
  usuarioId: number, 
  buscarLibroPorID: (id: string) => Promise<ResultadoLibroSimplificado | null>
) => tool({
  name: "AñadirAReadingList",
  description: "Agrega un libro a la lista de lectura pendiente, primero asegurando que su metadata esté en caché.",
  
  inputSchema: z.object({
    bookId: z.string().describe("El ID único de Google Books del libro."),
    prioridad: z.enum(["alta", "media", "baja"]).optional().default("media"),
    notas: z.string().optional().describe("Una nota corta para recordar el contexto de por qué se añadió el libro."),
  }),
  
  execute: async ({ bookId, prioridad, notas }) => {
    try {
      // Verificación de cache - Tabla BookCache
      let bookCacheEntry = await prisma.bookCache.findUnique({ where: { bookId } });
      if (!bookCacheEntry) {
        console.log(`!🟡! (ReadingList) El libro no está en cache: Invocando BuscarLibroPorId para obtener detalles de libro ${bookId}.`);
        // Invocamos a la función de búsqueda buscarLibroPorID 
        const details = await buscarLibroPorID(bookId); 

        // Verificación de respuesta obtenida.
        if (!details || !details.id) { 
          return { success: false, error: `No se pudo encontrar el libro con ID: ${bookId} en details de Google Books API.` };
        }

        // Si la respuesta es obtenida, procedemos a crear la entrada en BookCache.
        try {
          bookCacheEntry = await prisma.bookCache.create({
              data: {
                bookId: details.id, 
                title: details.title || 'Título Desconocido', 
                author: details.authors ? details.authors.join(', ') : null,
                pageCount: details.pageCount,
                categories: details.categories ? details.categories.join(', ') : null,
                thumbnailUrl: details.imageLinks?.thumbnail,
              },
          });

        } catch (error) {
          // Manejo de Concurrencia (Condición de carrera: otro proceso pudo haber creado la entrada justo ahora). 
          bookCacheEntry = await prisma.bookCache.findUnique({ where: { bookId } });
          if (!bookCacheEntry) {
            console.error("!🟡! (ReadingList) Error grave de DB al crear caché:", error);
            return { success: false, error: "Error de base de datos al intentar cachear el libro." };
          } 
        }
      }
      // FIN: Verificación de cache - Tabla BookCache

      // Crear el registro en ReadingList.
      const nuevo = await prisma.readingList.create({
        data: { usuarioId, bookId, prioridad, notas },
      });
      return { success: true, entry: nuevo };
    } catch (e: any) {
      console.error("Error al añadir a ReadingList:", e);
      if (e.code === 'P2002') { 
        return { success: false, error: "Este libro ya está en tu lista de lectura pendiente." };
      }
      return { success: false, error: "Ocurrió un error desconocido al agregar el libro a la lista." };
    }
  },
});

export const obtenerReadingList = (usuarioId: number) => tool({
  name: "obtenerReadingList",
  description: "Devuelve la lista de lectura pendiente del usuario, incluyendo detalles clave del libro del caché.",
  
  inputSchema: z.object({
        // No hay inputs controlables por el LLM en este caso.
  }),
  
  execute: async () => {
    try {
      console.log(`!🟢! Ejecutando obtenerReadingList para usuarioId=${usuarioId}`);
      
      const lista = await prisma.readingList.findMany({
        where: { usuarioId },
        orderBy: { creadoEn: "desc" },
        include: {  // JOIN con BookCache para obtener detalles de los libros.
          book: {
              select: { 
                    title: true, 
                    author: true, 
                    thumbnailUrl: true,
                    bookId: true 
                }
          }
        }
      });
      return { success: true, entries: lista };
    } catch (e) {
      console.error("!🟡! Error al obtenerReadingList:", e);
      return { success: false, error: "No se pudo cargar la lista de lectura pendiente." };
    }
  },
});

export const MarcarComoLeido = (
  usuarioId: number, 
  buscarLibroPorID: (id: string) => Promise<ResultadoLibroSimplificado | null>
) => tool({
    name: "MarcarComoLeido",
    description: "Marca un libro como leído, con calificación y reseña opcional, asegurando que la metadata del libro esté en el caché.",
    
    inputSchema: z.object({
        bookId: z.string().describe("El ID único de Google Books del libro."),
        calificacion: z.number().min(1).max(5).optional().describe("Calificación del 1 al 5."),
        reseña: z.string().optional().describe("Reseña o comentario sobre el libro."),
        fechaFinal: z.string().optional().describe("Fecha en que se terminó de leer (ejemplo: '2025-10-25')."), 
    }),
    
    execute: async ({ bookId, calificacion, reseña, fechaFinal }) => {
        try {
            // Verificación de cache - Tabla BookCache
            let bookCacheEntry = await prisma.bookCache.findUnique({ where: { bookId } });
            if (!bookCacheEntry) {
                console.log(`!🟡! (MarcarComoLeido) Libro no encontrado en Cache: Buscando detalles de libro ${bookId}.`);
                
                // Invocamos a la función de búsqueda buscarLibroPorID
                const details = await buscarLibroPorID(bookId); 

                // Verificación de respuesta obtenida.
                if (!details || !details.id) {
                    return { success: false, error: `No se pudo encontrar el libro con ID: ${bookId} en Google Books API.` };
                }

                // Si la respuesta es obtenida, procedemos a crear la entrada en BookCache.
                try {
                    bookCacheEntry = await prisma.bookCache.create({
                        data: {
                            bookId: details.id, 
                            title: details.title || 'Título Desconocido',
                            author: details.authors ? details.authors.join(', ') : null,
                            pageCount: details.pageCount,
                            categories: details.categories ? details.categories.join(', ') : null,
                            thumbnailUrl: details.imageLinks?.thumbnail,
                        },
                    });
                } catch (error) {
                    // Manejo de Concurrencia (Condición de carrera. Otro proceso pudo haber creado la entrada justo ahora).
                    bookCacheEntry = await prisma.bookCache.findUnique({ where: { bookId } });
                    if (!bookCacheEntry) {
                        console.error("!🟡! (marcarComoLeido) Error de DB/Caché:", error);
                        return { success: false, error: "Error de base de datos al intentar guardar el caché." };
                    }
                }
            }
            // Fin de Verificación de cache - Tabla BookCache

            // Crear el registro en ReadBooks
            const lectura = await prisma.readBooks.create({
                data: {
                    usuarioId,
                    bookId,
                    calificacion,
                    reseña,
                    fechaFinal: fechaFinal ? new Date(fechaFinal) : new Date(), 
                },
            });
            
            // El libro que es marcado como leido es eliminado de ReadingList si estaba pendiente.
            try {
                await prisma.readingList.delete({
                    where: {
                        usuarioId_bookId: { 
                            usuarioId: usuarioId,
                            bookId: bookId,
                        }
                    }
                });
                console.log(`ⓘ Libro ${bookId} removido de ReadingList.`);
            } catch (e) {
                // No pasa nada, simplemente ignoramos el error de no encontrado en ReadingList, no estaba ahí.
            }

            return { success: true, entry: lectura };

        } catch (e: any) {
            console.error("!🟡! (MarcarComoLeido) Error al marcar como leído:",  e);
            
            // Manejamos el error de UNIQUE (P2002): El libro ya está marcado como leído por este usuario
            if (e.code === 'P2002') { 
                return { success: false, error: "Este libro ya fue marcado como leído por ti." };
            }
            return { success: false, error: "Ocurrió un error desconocido al intentar marcar el libro como leído." };
        }
    },
});

export const ObtenerInfoUsuario = (usuarioId: number) => tool({
  name: "ObtenerInfoUsuario",
  description: "Obtiene el nombre del usuario autenticado para personalizar la respuesta. NO USAR para obtener contraseñas u otra información sensible.",
  
  inputSchema: z.object({
        // No requiere argumentos del LLM.
  }),
  
  execute: async () => {
    try {
      console.log(`🟢 Ejecutando getUsuarioInfo para usuarioId=${usuarioId}`);
      
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        
        select: { 
            id: true, 
            nombre: true, 
            creadoEn: true
        }
      });

      if (!usuario) {
          return { success: false, error: "El usuario autenticado no fue encontrado en la base de datos." };
      }

      return { success: true, data: usuario };
    } catch (e) {
      console.error("!🟡! (ObtenerInfoUsuario) Error al obtener info de usuario:", e);
      return { success: false, error: "No se pudo obtener la información del usuario debido a un error de base de datos." };
    }
  },
});


export const getReadingStats = (usuarioId: number) => tool({
  name: "getReadingStats",
  description: "Genera analiticas detalladas sobre los hábitos de lectura del usuario, como totales, géneros, autores y rating promedio. Requiere datos de ReadBooks.",
  
  inputSchema: z.object({
    period: z.enum(["all-time", "year", "month", "week"]).optional().default("all-time"),
    groupBy: z.enum(["genre", "author", "year", "none"]).optional().default("none"),
  }),
  
  execute: async ({ period, groupBy }) => {
    try {
      console.log(`!🟢! Ejecutando getReadingStats para usuarioId=${usuarioId} (Periodo: ${period}, GroupBy: ${groupBy})`);

      // Obtener todas las lecturas del usuario con detalles del libro
      const librosLeidos = await prisma.readBooks.findMany({
        where: { usuarioId },
        orderBy: { fechaFinal: "desc" },
        include: {  // JOIN a BookCache para obtener metadatas de los libros
          book: {
            select: { 
              pageCount: true, 
              categories: true, 
              author: true,
              bookId: true
            } 
          } 
        }
      });
      
      if (librosLeidos.length === 0) {
        return { success: true, stats: { totalLibros: 0, message: "Aún no has marcado ningún libro como leído." } };
      }

      // filtrado por periodo
      let filteredLibros = librosLeidos;
      if (period !== "all-time") {
        // Invocamos la función auxiliar getCutoffDate para calcular la fecha de inicio del período.
        const cutoffDate = getCutoffDate(period);
        filteredLibros = librosLeidos.filter(l => l.fechaFinal > cutoffDate);
      }

      // Cálculo - Métricas principales: Se itera sobre los libros filtrados y se calculan las métricas simultaneamente.
      let totalLibros = filteredLibros.length;
      let totalPaginas = 0;
      let totalCalificaciones = 0;
      let numCalificaciones = 0;
      const genreCountMap = new Map();
      const authorCountMap = new Map();
      const monthlyCountMap = new Map<string, number>();

      for (const lectura of filteredLibros) {
        if (lectura.book.pageCount) totalPaginas += lectura.book.pageCount;
        if (lectura.calificacion) {
          totalCalificaciones += lectura.calificacion;
          numCalificaciones++;
        }

        // Agregación Mensual (para "Libros por Mes/Año")
        const monthKey = `${lectura.fechaFinal.getFullYear()}-${lectura.fechaFinal.getMonth() + 1}`;
        monthlyCountMap.set(monthKey, (monthlyCountMap.get(monthKey) || 0) + 1);

        // Contar Géneros
        if (lectura.book.categories) {
          lectura.book.categories.split(',').map(s => s.trim()).forEach(key => {
            if (key) genreCountMap.set(key, (genreCountMap.get(key) || 0) + 1);
          });
        }
        // Contar Autores
        if (lectura.book.author) {
            lectura.book.author.split(',').map(s => s.trim()).forEach(key => {
                if (key) authorCountMap.set(key, (authorCountMap.get(key) || 0) + 1);
            });
        }
      }

      // Resultados finales de métricas
      const avgRating = numCalificaciones > 0 ? (totalCalificaciones / numCalificaciones).toFixed(1) : 0;
      const topGenre = Array.from(genreCountMap.entries()).sort((a, b) => b[1] - a[1])[0];
      const topAuthor = Array.from(authorCountMap.entries()).sort((a, b) => b[1] - a[1])[0];
      const readingStreak = calculateReadingStreak(librosLeidos.map(l => l.fechaFinal));

      // Construcción del objeto final de estadísticas a retornar.
      const stats = {
        // Métricas principales
        totalLibros: totalLibros,
        totalPaginas: totalPaginas,
        ratingPromedio: avgRating,
        rachaActual: readingStreak, 

        // Agrupaciones Clave (Incluso si groupBy es 'none', las incluimos para el resumen)
        generoFavorito: topGenre ? { nombre: topGenre[0], libros: topGenre[1] } : null,
        autorFavorito: topAuthor ? { nombre: topAuthor[0], libros: topAuthor[1] } : null,
        
        // Agregación de libros por periodo
        librosPorMes: Array.from(monthlyCountMap.entries()).map(([key, count]) => ({ mes_anio: key, libros: count })),

        // Información de agrupación específica 
        agrupacionSolicitada: groupBy !== "none" ? {
          tipo: groupBy,
          datos: groupBy === 'genre' ? topGenre : (groupBy === 'author' ? topAuthor : monthlyCountMap),
        } : null
      };

      return { success: true, stats: stats };
    } catch (e) {
      console.error("Error al obtener estadísticas:", e);
      return { success: false, error: "No se pudo generar el análisis de lectura." };
    }
  },
});


// FUNCIONES AUXILIARES PARA getReadingStats ---------------------------------------------

/** * Calcula la fecha límite para el filtro de periodo. 
*/
function getCutoffDate(period: "year" | "month" | "week"): Date {
    const now = new Date();
    switch (period) {
        case "year":
            // Resta un año
            now.setFullYear(now.getFullYear() - 1);
            break;
        case "month":
            // Resta un mes
            now.setMonth(now.getMonth() - 1);
            break;
        case "week":
            // Resta 7 días
            now.setDate(now.getDate() - 7);
            break;
    }
    return now;
}

/** * Calcula la racha de lectura actual en días o semanas.
*/
function calculateReadingStreak(dates: Date[]): string {
    if (dates.length === 0) return "0 días";

    // 1. Obtener solo las fechas únicas (en formato YYYY-MM-DD) y ordenarlas.
    const uniqueDates = Array.from(new Set(dates.map(d => d.toISOString().split('T')[0])))
        .map(dateStr => new Date(dateStr))
        .sort((a, b) => b.getTime() - a.getTime()); // Orden descendente

    if (uniqueDates.length === 0) return "0 días";

    let streakDays = 0;
    let referenceDate = new Date(); // Fecha de referencia (hoy)

    // Ajustar la fecha de referencia a medianoche para comparaciones
    referenceDate.setHours(0, 0, 0, 0); 
    
    // Verificamos si el último libro fue completado hoy o ayer
    const lastRead = uniqueDates[0];
    lastRead.setHours(0, 0, 0, 0);

    const yesterday = new Date(referenceDate);
    yesterday.setDate(yesterday.getDate() - 1);

    // Si el último libro leído no es hoy ni ayer, la racha se rompió.
    if (lastRead.getTime() !== referenceDate.getTime() && lastRead.getTime() !== yesterday.getTime()) {
        return "0 días";
    }

    // Si el último libro fue hoy, sumamos 1 día a la racha
    if (lastRead.getTime() === referenceDate.getTime()) {
        streakDays = 1;
        referenceDate.setDate(referenceDate.getDate() - 1); // La nueva referencia es ayer
    }

    // Iteramos sobre las fechas leídas para ver la secuencia
    for (let i = 0; i < uniqueDates.length; i++) {
        const currentRead = uniqueDates[i];
        currentRead.setHours(0, 0, 0, 0);
        
        // Si la lectura de hoy ya se contó, saltamos
        if (i === 0 && streakDays === 1) continue; 

        if (currentRead.getTime() === referenceDate.getTime()) {
            streakDays++;
            referenceDate.setDate(referenceDate.getDate() - 1); // Moverse al día anterior
        } else if (currentRead.getTime() < referenceDate.getTime()) {
            // Si la fecha es anterior al día de referencia, la racha se rompe
            break; 
        }
    }

    // Formato de salida para el LLM
    if (streakDays >= 7) {
        return `${Math.floor(streakDays / 7)} semanas`;
    }
    return `${streakDays} días`;
}































// EXTRAS --  (Historial de busquedas y Guardar Búsqueda)

// // Tool para guardar búsquedas recibe usuarioId y contenido.
// export const guardarBusqueda = (usuarioId: number) => tool({
//   name: "guardarBusqueda",
//   description: "Guarda la búsqueda de un usuario específico en la base de datos.",
//   inputSchema: z.object({
//     contenido: z.string().describe("El texto exacto de la pregunta o búsqueda del usuario."),
//   }),
//   execute: async ({ contenido }) => { // 
//     try {
//       console.log(`!🟢! Ejecutando guardarBusqueda con contenido: "${contenido}" para usuarioId=${usuarioId}`);
//       const nuevo_registro = await prisma.busqueda.create({
//         data: { termino: contenido, usuarioId },
//       });
//       return { success: true, entry: "Nuevo registro: ",nuevo_registro };
//     } catch (e) {
//       console.error("Error al guardar búsqueda:", e);
//       return { success: false, error: "No se pudo guardar la búsqueda en la DB." };
//     }
//   },
// });

// // Tool para obtener historial de búsquedas POR usuarioId
// export const ObtenerHistorial = (usuarioId: number) => tool({
//   name: "obtenerHistorial",
//   description: "Devuelve los últimos mensajes almacenados en el historial de búsquedas del usuario.",
//   inputSchema: z.object({
//     limite: z.number().optional().default(8), // Número máximo de entradas a recuperar por defecto establecidas en: 8 
//   }),
//   execute: async ({ limite }) => {
//     try {
//       const mensajes = await prisma.busqueda.findMany({
//         where: { usuarioId }, 
//         orderBy: { id: "desc" },
//         take: limite ?? 10,
//       });
//       return { success: true, entries: mensajes.reverse() };
//     } catch (e) {
//       console.error("Error al obtener historial:", e);
//       return { success: false, error: "No se pudo obtener el historial de la DB." };
//     }
//   },
// });
