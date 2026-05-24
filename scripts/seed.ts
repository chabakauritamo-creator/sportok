import mongoose from 'mongoose';
import { mockData } from '../lib/mock-data';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('MONGODB_URI not set');

// Inline minimal schemas for seeding (avoids model registration conflicts)
const BilingualSchema = new mongoose.Schema({ ka: String, en: String }, { _id: false });
const TeamEmbedSchema = new mongoose.Schema(
  { id: String, name: { ka: String, en: String }, logo: String, short: String },
  { _id: false }
);
const LeagueEmbedSchema = new mongoose.Schema(
  { id: String, name: { ka: String, en: String }, country: String, sport: String },
  { _id: false }
);
const PastMatchSchema = new mongoose.Schema(
  {
    id: String, date: String,
    home: { name: String, logo: String },
    away: { name: String, logo: String },
    score: { home: Number, away: Number },
    result: String,
  },
  { _id: false }
);

const MatchSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, index: true },
  sport: String,
  league: LeagueEmbedSchema,
  home: TeamEmbedSchema,
  away: TeamEmbedSchema,
  kickoff: Date,
  venue: String, referee: String,
  status: String,
  liveMinute: Number,
  score: { home: Number, away: Number },
  odds: { home: Number, draw: Number, away: Number },
  recommendedBet: {
    selection: BilingualSchema,
    price: Number, bookmaker: String, confidence: String,
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

const NewsSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, index: true },
  hero: String,
  publishedAt: Date,
  author: BilingualSchema,
  readMinutes: Number,
  tags: [String],
  title: BilingualSchema,
  excerpt: BilingualSchema,
  body: BilingualSchema,
});

const MatchModel = mongoose.models.Match ?? mongoose.model('Match', MatchSchema);
const NewsModel = mongoose.models.NewsArticle ?? mongoose.model('NewsArticle', NewsSchema);

async function seed() {
  await mongoose.connect(MONGODB_URI!);
  console.log('Connected to MongoDB');

  // Upsert matches
  let matchCount = 0;
  for (const match of mockData.allMatches) {
    await MatchModel.findOneAndUpdate(
      { slug: match.slug },
      { ...match, kickoff: new Date(match.kickoff) },
      { upsert: true, new: true }
    );
    matchCount++;
  }
  console.log(`Seeded ${matchCount} matches`);

  // Upsert news articles
  let newsCount = 0;
  for (const article of mockData.news) {
    await NewsModel.findOneAndUpdate(
      { slug: article.slug },
      { ...article, publishedAt: new Date(article.publishedAt) },
      { upsert: true, new: true }
    );
    newsCount++;
  }
  console.log(`Seeded ${newsCount} news articles`);

  await mongoose.disconnect();
  console.log('Done');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
