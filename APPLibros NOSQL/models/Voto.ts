import { Schema, model, models, Types } from 'mongoose';

const VotoSchema = new Schema({
  tipo: { type: String, enum: ['UP', 'DOWN'], required: true },
  resenaId: { type: Types.ObjectId, ref: 'Resena', required: true },
  usuarioId: { type: Types.ObjectId, ref: 'Usuario', required: false },  
  fecha: { type: Date, default: Date.now },
});

const Voto = models.Voto || model('Voto', VotoSchema);

export default Voto;
