import {
  AñadirAReadingList,
  obtenerReadingList,
  MarcarComoLeido,
  getReadingStats,
  ObtenerInfoUsuario,
  buscarLibro,
  obtenerLibroPorID
} from "./database";

import { buscarLibroPorID } from "@/lib/googleBooks";

export function buildTools(usuarioId: number) {
  return {
    addToReadingList: AñadirAReadingList(usuarioId, buscarLibroPorID),
    getReadingList: obtenerReadingList(usuarioId),
    markAsRead: MarcarComoLeido(usuarioId, buscarLibroPorID),
    getReadingStats: getReadingStats(usuarioId),
    getUserInfo: ObtenerInfoUsuario(usuarioId),
    searchBooks: buscarLibro,
    getBookDetails: obtenerLibroPorID,
  };
}
