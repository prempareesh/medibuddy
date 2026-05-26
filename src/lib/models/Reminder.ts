import mongoose, { Schema, Document } from "mongoose";

export interface IReminder extends Document {
  medicineName: string;
  time: string; // "HH:MM"
  note?: string;
  active: boolean;
  takenDates: string[]; // List of dates ("YYYY-MM-DD") when the medicine was taken
  createdAt: Date;
}

const ReminderSchema: Schema = new Schema({
  medicineName: { type: String, required: true },
  time: { type: String, required: true },
  note: { type: String, default: "" },
  active: { type: Boolean, default: true },
  takenDates: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Reminder || mongoose.model<IReminder>("Reminder", ReminderSchema);
