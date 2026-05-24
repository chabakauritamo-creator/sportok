import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITeam extends Document {
  id: string;
  name: { ka: string; en: string };
  logo: string;
  short?: string;
}

const TeamSchema = new Schema<ITeam>({
  id: { type: String, required: true, unique: true },
  name: {
    ka: { type: String, required: true },
    en: { type: String, required: true },
  },
  logo: { type: String, required: true },
  short: { type: String },
});

export const Team: Model<ITeam> =
  mongoose.models.Team ?? mongoose.model<ITeam>('Team', TeamSchema);
