import { Reseña } from './reseña';
import { ObjectId } from "mongodb";

export type TipoVoto = 'UP' | 'DOWN';

export interface Voto {
  _id: ObjectId;
  tipo: TipoVoto;
  usuarioId?: ObjectId;
  reseñaId: ObjectId;
  reseña?: Reseña;
}

export interface VotoFrontend {
  _id: string;
  tipo: TipoVoto;
  usuarioId?: string;
  reseñaId: string;
  reseña?: Reseña;
}