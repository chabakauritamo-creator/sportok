export type Sport = 'football' | 'basketball' | 'tennis';

export type Team = {
  id: string;
  name: { ka: string; en: string };
  logo: string;
  short?: string;
};

export type League = {
  id: string;
  name: { ka: string; en: string };
  country: string;
  sport: Sport;
};

export type FormResult = 'W' | 'D' | 'L';

export type PastMatch = {
  id: string;
  date: string;
  home: { name: string; logo: string };
  away: { name: string; logo: string };
  score: { home: number; away: number };
  result: FormResult;
};

export type Match = {
  id: string;
  slug: string;
  sport: Sport;
  league: League;
  home: Team;
  away: Team;
  kickoff: string;
  venue?: string;
  referee?: string;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED';
  liveMinute?: number;
  score?: { home: number; away: number };
  odds: { home: number; draw?: number; away: number };
  recommendedBet?: {
    selection: { ka: string; en: string };
    price: number;
    bookmaker: string;
    confidence: 'low' | 'medium' | 'high';
  };
  homeLast5?: PastMatch[];
  awayLast5?: PastMatch[];
  h2hLast5?: PastMatch[];
  preview?: {
    ka: { title: string; body: string };
    en: { title: string; body: string };
  };
  hero?: string;
};

export type NewsArticle = {
  id: string;
  slug: string;
  hero: string;
  publishedAt: string;
  author: { ka: string; en: string };
  readMinutes: number;
  tags: string[];
  title: { ka: string; en: string };
  excerpt: { ka: string; en: string };
  body: { ka: string; en: string };
};
