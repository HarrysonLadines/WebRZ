import mongoose, { Schema, Document, model } from 'mongoose';

export interface IUsuario extends Document {
  email: string;
  passwordHash: string;
  nombre?: string;
  createdAt: Date;
}

const UsuarioSchema = new Schema<IUsuario>({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  nombre: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Usuario = mongoose.models.Usuario || model<IUsuario>('Usuario', UsuarioSchema);
export default Usuario;
