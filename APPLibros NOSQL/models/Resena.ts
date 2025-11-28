import mongoose, { Schema, Document, model } from 'mongoose';
import { Types } from 'mongoose'; 

export interface IResena {
  _id: Types.ObjectId;  
  calificacion: number;
  contenido: string;
  fechaCreacion: Date;
  libroId: string;
  usuarioId?: Types.ObjectId;  
}

const ResenaSchema = new Schema<IResena>({
  calificacion: { type: Number, required: true },
  contenido: { type: String, required: true },
  fechaCreacion: { type: Date, default: Date.now },
  libroId: { type: String, required: true },
  usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true }, 
});

const Resena = mongoose.models.Resena || model<IResena>('Resena', ResenaSchema);
export default Resena;
