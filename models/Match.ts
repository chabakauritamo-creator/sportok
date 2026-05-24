import mongoose, { Schema, Document, Model } from 'mongoose';

const BilingualSchema = new Schema({ ka: String, en: String }, { _id: false });

const TeamEmbedSchema = new Schema(
  {
    id: String,
    name: { ka: String, en: String },
    logo: String,
    short: String,
  },
  { _id: false }
);

const LeagueEmbedSchema = new Schema(
  {
    id: String,
    name: { ka: String, en: String },
    country: String,
    sport: String,
  },
  { _id: false }
);

const PastMatchSchema = new Schema(
  {
    id: String,
    date: String,
    home: { name: String, logo: String },
    away: { name: String, logo: String },
    score: { home: Number, away: Number },
    result: { type: String, enum: ['W', 'D', 'L'] },
  },
  { _id: false }
);

export interface IMatch extends Document {
  slug: string;
  sport: 'football' | 'basketball' | 'tennis';
  league: object;
  home: object;
  away: object;
  kickoff: Date;
  venue?: string;
  referee?: string;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED';
  liveMinute?: number;
  score?: { home: number; away: number };
  odds: { home: number; draw?: number; away: number };
  recommendedBet?: object;
  homeLast5?: object[];
  awayLast5?: object[];
  h2hLast5?: object[];
  preview?: object;
  hero?: string;
}

const MatchSchema = new Schema<IMatch>({
  slug: { type: String, required: true, unique: true, index: true },
  sport: { type: String, enum: ['football', 'basketball', 'tennis'], required: true },
  league: { type: LeagueEmbedSchema, required: true },
  home: { type: TeamEmbedSchema, required: true },
  away: { type: TeamEmbedSchema, required: true },
  kickoff: { type: Date, required: true },
  venue: String,
  referee: String,
  status: { type: String, enum: ['SCHEDULED', 'LIVE', 'FINISHED'], required: true },
  liveMinute: Number,
  score: { home: Number, away: Number },
  odds: {
    home: { type: Number, required: true },
    draw: Number,
    away: { type: Number, required: true },
  },
  recommendedBet: {
    selection: BilingualSchema,
    price: Number,
    bookmaker: String,
    confidence: { type: String, enum: ['low', 'medium', 'high'] },
  },
  homeLast5: [PastMatchSchema],
  awayLast5: [PastMatchSchema],
  h2hLast5: [PastMatchSchema],
  preview: {
    ka: { title: String, body: String },
    en: { title: String, body: String },
  },
  hero: String,
});

export const Match: Model<IMatch> =
  mongoose.models.Match ?? mongoose.model<IMatch>('Match', MatchSchema);
