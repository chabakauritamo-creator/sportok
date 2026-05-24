import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILeague extends Document {
  id: string;
  name: { ka: string; en: string };
  country: string;
  sport: 'football' | 'basketball' | 'tennis';
}

const LeagueSchema = new Schema<ILeague>({
  id: { type: String, required: true, unique: true },
  name: {
    ka: { type: String, required: true },
    en: { type: String, required: true },
  },
  country: { type: String, required: true },
  sport: { type: String, enum: ['football', 'basketball', 'tennis'], required: true },
});

export const League: Model<ILeague> =
  mongoose.models.League ?? mongoose.model<ILeague>('League', LeagueSchema);
