import mongoose, { Schema, Document } from "mongoose";

export interface IHistory extends Document {
  medicineName: string;
  purpose?: string;
  usage?: string;
  precautions?: string;
  sideEffects?: string;
  imageUrl?: string;
  createdAt: Date;
}

const HistorySchema: Schema = new Schema({
  medicineName: { type: String, required: true },
  purpose: { type: String, default: "" },
  usage: { type: String, default: "" },
  precautions: { type: String, default: "" },
  sideEffects: { type: String, default: "" },
  imageUrl: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.History || mongoose.model<IHistory>("History", HistorySchema);
