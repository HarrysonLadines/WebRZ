import { Types } from "mongoose";

export interface Reseña {
  _id: Types.ObjectId;  
  calificacion: number;
  contenido: string;
  fechaCreacion: Date; 
  libroId: string;
  usuarioId?: Types.ObjectId;  
}

export interface NuevaReseña {
  libroId: string;
  contenido: string;
  calificacion: number;
  fechaCreacion?: Date;
  usuarioId: string;  
}

export interface ReseñaConVotos extends Reseña {
  likes: number;
  dislikes: number;
}

export interface ResenaLean {
  _id: Types.ObjectId;
  calificacion: number;
  contenido: string;
  fechaCreacion: Date;
  libroId: string;
  usuarioId?: Types.ObjectId; 
}
