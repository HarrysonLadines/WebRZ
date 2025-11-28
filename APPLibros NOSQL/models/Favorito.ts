import mongoose, { Schema, Document, model } from 'mongoose';

export interface IFavorito extends Document {
  usuarioId: mongoose.Types.ObjectId;
  librosIds: string[]; 
  nombreLista?: string;
  creadoEn: Date;
}

const FavoritoSchema = new Schema<IFavorito>({
  usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  librosIds: [{ type: String, required: true }], 
  nombreLista: { type: String },
  creadoEn: { type: Date, default: Date.now },
});

// Si el modelo ya existe, lo usa, si no, lo crea
const Favorito = mongoose.models.Favorito || model<IFavorito>('Favorito', FavoritoSchema);
export default Favorito;
