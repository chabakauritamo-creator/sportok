import type { Match, NewsArticle, PastMatch, Sport, Team } from './types';

const SVG = {
  barcelona: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/120px-FC_Barcelona_%28crest%29.svg.png',
  psg: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a7/Paris_Saint-Germain_F.C..svg/120px-Paris_Saint-Germain_F.C..svg.png',
  realMadrid: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/120px-Real_Madrid_CF.svg.png',
  manCity: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/120px-Manchester_City_FC_badge.svg.png',
  arsenal: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/53/Arsenal_FC.svg/120px-Arsenal_FC.svg.png',
  liverpool: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0c/Liverpool_FC.svg/120px-Liverpool_FC.svg.png',
  chelsea: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/cc/Chelsea_FC.svg/120px-Chelsea_FC.svg.png',
  bayern: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg/120px-FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg.png',
  inter: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/FC_Internazionale_Milano_2021.svg/120px-FC_Internazionale_Milano_2021.svg.png',
  lakers: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Los_Angeles_Lakers_logo.svg/120px-Los_Angeles_Lakers_logo.svg.png',
  celtics: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8f/Boston_Celtics.svg/120px-Boston_Celtics.svg.png',
  warriors: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/01/Golden_State_Warriors_logo.svg/120px-Golden_State_Warriors_logo.svg.png',
  bucks: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4a/Milwaukee_Bucks_logo.svg/120px-Milwaukee_Bucks_logo.svg.png',
  tennis: '/tennis-ball.svg',
};

const HERO_FOOTBALL = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=70';
const HERO_FOOTBALL_2 = 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1200&q=70';
const HERO_BASKETBALL = 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=70';
const HERO_TENNIS = 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&q=70';
const HERO_NEWS_1 = 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=800&q=70';
const HERO_NEWS_2 = 'https://images.unsplash.com/photo-1487466365202-1afdb86c764e?auto=format&fit=crop&w=800&q=70';
const HERO_NEWS_3 = 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=800&q=70';

const teams: Record<string, Team> = {
  barcelona: { id: 'barcelona', name: { ka: 'ბარსელონა', en: 'Barcelona' }, logo: SVG.barcelona, short: 'BAR' },
  psg: { id: 'psg', name: { ka: 'პარი სენ-ჟერმენი', en: 'Paris Saint-Germain' }, logo: SVG.psg, short: 'PSG' },
  realMadrid: { id: 'real-madrid', name: { ka: 'რეალი', en: 'Real Madrid' }, logo: SVG.realMadrid, short: 'RMA' },
  manCity: { id: 'man-city', name: { ka: 'მანჩესტერ სიტი', en: 'Manchester City' }, logo: SVG.manCity, short: 'MCI' },
  arsenal: { id: 'arsenal', name: { ka: 'არსენალი', en: 'Arsenal' }, logo: SVG.arsenal, short: 'ARS' },
  liverpool: { id: 'liverpool', name: { ka: 'ლივერპული', en: 'Liverpool' }, logo: SVG.liverpool, short: 'LIV' },
  chelsea: { id: 'chelsea', name: { ka: 'ჩელსი', en: 'Chelsea' }, logo: SVG.chelsea, short: 'CHE' },
  bayern: { id: 'bayern', name: { ka: 'ბაიერნი', en: 'Bayern Munich' }, logo: SVG.bayern, short: 'FCB' },
  inter: { id: 'inter', name: { ka: 'ინტერი', en: 'Inter Milan' }, logo: SVG.inter, short: 'INT' },
  lakers: { id: 'lakers', name: { ka: 'ლეიკერსი', en: 'LA Lakers' }, logo: SVG.lakers, short: 'LAL' },
  celtics: { id: 'celtics', name: { ka: 'სელტიქსი', en: 'Boston Celtics' }, logo: SVG.celtics, short: 'BOS' },
  warriors: { id: 'warriors', name: { ka: 'უორიორსი', en: 'GS Warriors' }, logo: SVG.warriors, short: 'GSW' },
  bucks: { id: 'bucks', name: { ka: 'ბაკსი', en: 'Milwaukee Bucks' }, logo: SVG.bucks, short: 'MIL' },
  alcaraz: { id: 'alcaraz', name: { ka: 'კარლოს ალკარასი', en: 'Carlos Alcaraz' }, logo: SVG.tennis, short: 'ALC' },
  sinner: { id: 'sinner', name: { ka: 'იანიკ სინერი', en: 'Jannik Sinner' }, logo: SVG.tennis, short: 'SIN' },
  djokovic: { id: 'djokovic', name: { ka: 'ნოვაკ ჯოკოვიჩი', en: 'Novak Djokovic' }, logo: SVG.tennis, short: 'DJO' },
  zverev: { id: 'zverev', name: { ka: 'ალექსანდრე ზვერევი', en: 'Alexander Zverev' }, logo: SVG.tennis, short: 'ZVE' },
};

function inHours(h: number): string {
  const d = new Date();
  d.setHours(d.getHours() + h, 0, 0, 0);
  return d.toISOString();
}

function past(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function pm(homeT: Team, awayT: Team, sh: number, sa: number, days: number, perspective: 'home' | 'away' = 'home'): PastMatch {
  const result: 'W' | 'D' | 'L' = sh === sa ? 'D' : (sh > sa ? (perspective === 'home' ? 'W' : 'L') : (perspective === 'home' ? 'L' : 'W'));
  return {
    id: `${homeT.id}-${awayT.id}-${days}`,
    date: past(days),
    home: { name: homeT.short ?? homeT.name.en, logo: homeT.logo },
    away: { name: awayT.short ?? awayT.name.en, logo: awayT.logo },
    score: { home: sh, away: sa },
    result,
  };
}

const leagueChampions = {
  id: 'ucl',
  name: { ka: 'ჩემპიონთა ლიგა', en: 'Champions League' },
  country: 'Europe',
  sport: 'football' as Sport,
};
const leaguePremier = {
  id: 'epl',
  name: { ka: 'პრემიერ ლიგა', en: 'Premier League' },
  country: 'England',
  sport: 'football' as Sport,
};
const leagueNba = {
  id: 'nba',
  name: { ka: 'NBA', en: 'NBA' },
  country: 'USA',
  sport: 'basketball' as Sport,
};
const leagueAtp = {
  id: 'atp',
  name: { ka: 'ATP ტურნირი', en: 'ATP Tour' },
  country: 'Worldwide',
  sport: 'tennis' as Sport,
};

const featuredMatch: Match = {
  id: 'barcelona-psg-ucl',
  slug: 'barcelona-vs-psg',
  sport: 'football',
  league: leagueChampions,
  home: teams.barcelona,
  away: teams.psg,
  kickoff: inHours(20),
  venue: 'Spotify Camp Nou',
  referee: 'Anthony Taylor',
  status: 'SCHEDULED',
  odds: { home: 2.15, draw: 3.6, away: 3.1 },
  hero: HERO_FOOTBALL,
  recommendedBet: {
    selection: { ka: 'ბარსელონას მოგება ან ფრე', en: 'Barcelona to win or draw' },
    price: 1.42,
    bookmaker: 'Pinnacle',
    confidence: 'high',
  },
  homeLast5: [
    pm(teams.barcelona, teams.realMadrid, 2, 1, 4),
    pm(teams.barcelona, teams.chelsea, 3, 0, 9),
    pm(teams.arsenal, teams.barcelona, 1, 2, 14, 'away'),
    pm(teams.barcelona, teams.inter, 1, 1, 19),
    pm(teams.bayern, teams.barcelona, 2, 2, 24, 'away'),
  ],
  awayLast5: [
    pm(teams.psg, teams.arsenal, 0, 0, 3),
    pm(teams.psg, teams.liverpool, 2, 1, 8),
    pm(teams.manCity, teams.psg, 1, 2, 13, 'away'),
    pm(teams.psg, teams.chelsea, 1, 1, 18),
    pm(teams.bayern, teams.psg, 3, 1, 23, 'away'),
  ],
  h2hLast5: [
    pm(teams.barcelona, teams.psg, 3, 2, 120),
    pm(teams.psg, teams.barcelona, 1, 4, 250),
    pm(teams.barcelona, teams.psg, 2, 2, 410),
    pm(teams.psg, teams.barcelona, 2, 0, 540),
    pm(teams.barcelona, teams.psg, 1, 3, 720),
  ],
  preview: {
    en: {
      title: 'Barcelona vs PSG — Match Preview',
      body: `One of Europe's most-watched fixtures returns to Camp Nou as Barcelona host Paris Saint-Germain in a Champions League quarter-final tie. Both sides come in on the back of strong domestic form, but with attention split between league and cup, rotation will be the story of the night.

Barcelona have lost only one of their last seven Champions League home games and are unbeaten at home in the league this calendar year. Their press has been sharper since the manager moved Pedri into a deeper role — expect them to control midfield tempo and force PSG out wide where Cubarsí and Koundé have looked dominant.

Paris arrive without their first-choice left-back and with Marquinhos a doubt after a knock on the weekend. They've kept a clean sheet in just two of their last ten away matches in Europe, which gives the over-2.5 market real value. Up top, the front three of Dembélé, Barcola and Ramos remain electric on transitions, and Barça's high line should give them space to run into.

The bookmakers price Barcelona as clear favourites at 2.15, but factoring in PSG's defensive vulnerabilities and Barcelona's tendency to concede on the counter, the most attractive market in our view is over 2.5 goals at 1.78 and a Barcelona double-chance at 1.42 as a safer pick.

Predicted scoreline: 2-1 Barcelona.`,
    },
    ka: {
      title: 'ბარსელონა - პარი სენ-ჟერმენი — თამაშის პროგნოზი',
      body: `ევროპის ერთ-ერთი ყველაზე ცნობილი წყვილი ისევ კამპ ნოუზე ხვდება ერთმანეთს. ჩემპიონთა ლიგის მეოთხედფინალური დაპირისპირება, რომელშიც ორივე გუნდი კარგ ფორმაში შემოდის, თუმცა ლიგა-თასებს შორის გადანაწილებული ფოკუსი როტაციას აუცილებლად მოყვება.

ბარსელონამ ბოლო შვიდი ჩემპიონთა ლიგის სახლის თამაშიდან მხოლოდ ერთი წააგო და კალენდარული წლის განმავლობაში სახლში ჩემპიონატში დაუმარცხებელია. პრესინგი გამოცოცხლდა მას შემდეგ, რაც პედრი უფრო ღრმად ჩამოვიდა — შუა ხაზის ტემპს გააკონტროლებენ და PSG-ს ფლანგებზე გაყავთ, სადაც კუბარსი და კუნდე საუკეთესოები არიან.

პარიზელები პირველი ნომრის მარცხენა მცველის გარეშე ჩამოვიდნენ და მარკინიოსიც კითხვის ნიშნის ქვეშაა. ბოლო ათი ევროპული გასტროლის თამაშიდან მათ მხოლოდ ორი წააგებინეს უგოლოდ მოწინააღმდეგეებს — ეს ნათლად მიუთითებს ჯამში 2.5-ზე მეტი გოლის ღირებულებაზე 1.78-ის კოეფიციენტით.

ბუკმეკერებთან ბარსელონა ფავორიტია 2.15-ით, თუმცა PSG-ის თავდაცვითი სისუსტეებისა და ბარსელონას კონტრშეტევებზე გაცემული გოლების ტენდენციის გათვალისწინებით, ჩვენი არჩევანი — ბარსელონას ორმაგი შანსი 1.42-ით.

პროგნოზირებული ანგარიში: 2-1 ბარსელონას სასარგებლოდ.`,
    },
  },
};

const moreFootball: Match[] = [
  {
    id: 'real-arsenal',
    slug: 'real-madrid-vs-arsenal',
    sport: 'football',
    league: leagueChampions,
    home: teams.realMadrid,
    away: teams.arsenal,
    kickoff: inHours(44),
    venue: 'Santiago Bernabéu',
    status: 'SCHEDULED',
    hero: HERO_FOOTBALL_2,
    odds: { home: 1.85, draw: 3.8, away: 3.9 },
    recommendedBet: { selection: { ka: 'რეალის მოგება', en: 'Real Madrid to win' }, price: 1.85, bookmaker: 'Bet365', confidence: 'medium' },
  },
  {
    id: 'liverpool-bayern',
    slug: 'liverpool-vs-bayern',
    sport: 'football',
    league: leagueChampions,
    home: teams.liverpool,
    away: teams.bayern,
    kickoff: inHours(45),
    venue: 'Anfield',
    status: 'SCHEDULED',
    hero: HERO_FOOTBALL,
    odds: { home: 2.4, draw: 3.5, away: 2.8 },
    recommendedBet: { selection: { ka: 'ორი გუნდი გაიტანს', en: 'Both teams to score' }, price: 1.55, bookmaker: 'Pinnacle', confidence: 'high' },
  },
  {
    id: 'man-city-chelsea',
    slug: 'man-city-vs-chelsea',
    sport: 'football',
    league: leaguePremier,
    home: teams.manCity,
    away: teams.chelsea,
    kickoff: inHours(28),
    venue: 'Etihad Stadium',
    status: 'SCHEDULED',
    hero: HERO_FOOTBALL_2,
    odds: { home: 1.55, draw: 4.2, away: 5.5 },
    recommendedBet: { selection: { ka: 'სიტის მოგება ფორით -1.5', en: 'Man City -1.5' }, price: 2.1, bookmaker: 'William Hill', confidence: 'medium' },
  },
  {
    id: 'arsenal-inter',
    slug: 'arsenal-vs-inter',
    sport: 'football',
    league: leagueChampions,
    home: teams.arsenal,
    away: teams.inter,
    kickoff: inHours(46),
    venue: 'Emirates Stadium',
    status: 'SCHEDULED',
    hero: HERO_FOOTBALL,
    odds: { home: 1.95, draw: 3.4, away: 3.6 },
    recommendedBet: { selection: { ka: 'არსენალის სუფთა მოგება', en: 'Arsenal clean sheet' }, price: 2.4, bookmaker: 'Bet365', confidence: 'medium' },
  },
  {
    id: 'inter-bayern',
    slug: 'inter-vs-bayern',
    sport: 'football',
    league: leagueChampions,
    home: teams.inter,
    away: teams.bayern,
    kickoff: inHours(68),
    venue: 'San Siro',
    status: 'SCHEDULED',
    hero: HERO_FOOTBALL_2,
    odds: { home: 2.55, draw: 3.3, away: 2.6 },
    recommendedBet: { selection: { ka: 'სულ 2.5-ზე მეტი', en: 'Over 2.5 goals' }, price: 1.65, bookmaker: 'Pinnacle', confidence: 'high' },
  },
  {
    id: 'chelsea-psg',
    slug: 'chelsea-vs-psg',
    sport: 'football',
    league: leagueChampions,
    home: teams.chelsea,
    away: teams.psg,
    kickoff: inHours(70),
    venue: 'Stamford Bridge',
    status: 'SCHEDULED',
    hero: HERO_FOOTBALL,
    odds: { home: 2.7, draw: 3.4, away: 2.45 },
    recommendedBet: { selection: { ka: 'PSG ფრეს ან მოგებას აიღებს', en: 'PSG draw no bet' }, price: 1.7, bookmaker: 'Bet365', confidence: 'medium' },
  },
];

const basketballMatches: Match[] = [
  {
    id: 'lakers-celtics',
    slug: 'lakers-vs-celtics',
    sport: 'basketball',
    league: leagueNba,
    home: teams.lakers,
    away: teams.celtics,
    kickoff: inHours(26),
    venue: 'Crypto.com Arena',
    status: 'SCHEDULED',
    hero: HERO_BASKETBALL,
    odds: { home: 2.1, away: 1.78 },
    recommendedBet: { selection: { ka: 'სელტიქსის მოგება', en: 'Celtics to win' }, price: 1.78, bookmaker: 'Pinnacle', confidence: 'high' },
  },
  {
    id: 'warriors-bucks',
    slug: 'warriors-vs-bucks',
    sport: 'basketball',
    league: leagueNba,
    home: teams.warriors,
    away: teams.bucks,
    kickoff: inHours(30),
    venue: 'Chase Center',
    status: 'SCHEDULED',
    hero: HERO_BASKETBALL,
    odds: { home: 1.92, away: 1.92 },
    recommendedBet: { selection: { ka: 'სულ 225.5-ზე მეტი ქულა', en: 'Over 225.5 total points' }, price: 1.85, bookmaker: 'Bet365', confidence: 'medium' },
  },
  {
    id: 'celtics-bucks',
    slug: 'celtics-vs-bucks',
    sport: 'basketball',
    league: leagueNba,
    home: teams.celtics,
    away: teams.bucks,
    kickoff: inHours(52),
    venue: 'TD Garden',
    status: 'SCHEDULED',
    hero: HERO_BASKETBALL,
    odds: { home: 1.65, away: 2.3 },
    recommendedBet: { selection: { ka: 'სელტიქსი ფორით -4.5', en: 'Celtics -4.5' }, price: 1.92, bookmaker: 'Pinnacle', confidence: 'medium' },
  },
];

const tennisMatches: Match[] = [
  {
    id: 'alcaraz-sinner',
    slug: 'alcaraz-vs-sinner',
    sport: 'tennis',
    league: leagueAtp,
    home: teams.alcaraz,
    away: teams.sinner,
    kickoff: inHours(24),
    venue: 'Madrid Open',
    status: 'SCHEDULED',
    hero: HERO_TENNIS,
    odds: { home: 1.75, away: 2.1 },
    recommendedBet: { selection: { ka: 'ალკარასი 2-0-ით', en: 'Alcaraz 2-0' }, price: 2.6, bookmaker: 'Pinnacle', confidence: 'medium' },
  },
  {
    id: 'djokovic-zverev',
    slug: 'djokovic-vs-zverev',
    sport: 'tennis',
    league: leagueAtp,
    home: teams.djokovic,
    away: teams.zverev,
    kickoff: inHours(50),
    venue: 'Madrid Open',
    status: 'SCHEDULED',
    hero: HERO_TENNIS,
    odds: { home: 1.55, away: 2.45 },
    recommendedBet: { selection: { ka: 'ჯოკოვიჩის მოგება', en: 'Djokovic to win' }, price: 1.55, bookmaker: 'Bet365', confidence: 'high' },
  },
];

const liveMatches: Match[] = Array.from({ length: 6 }).map((_, i) => ({
  id: `live-${i}`,
  slug: `live-${i}`,
  sport: 'football',
  league: leagueChampions,
  home: teams.barcelona,
  away: teams.psg,
  kickoff: new Date().toISOString(),
  status: 'LIVE',
  liveMinute: 86 - i * 7,
  score: { home: 1, away: 0 },
  odds: { home: 1.5, away: 4.5 },
}));

const news: NewsArticle[] = [
  {
    id: 'n1',
    slug: 'ronaldo-arabia-quarter-final',
    hero: HERO_NEWS_1,
    publishedAt: past(0),
    author: { ka: 'სპორტოკის რედაქცია', en: 'Sportok Editorial' },
    readMinutes: 4,
    tags: ['Ronaldo', 'Al Nassr'],
    title: {
      ka: 'რონალდო არაბეთს ევრო კლუბებთან დაპირისპირებამდე მიჰყავს',
      en: 'Ronaldo drags Al Nassr to European-level showdown',
    },
    excerpt: {
      ka: 'პორტუგალიელი ფორვარდი ისევ მუშტავს ცხრილს და გუნდს კონტინენტთაშორის თამაშებამდე მიჰყავს.',
      en: 'The Portuguese striker keeps the goals coming and pushes his side towards an inter-continental tie.',
    },
    body: {
      ka: 'სრული სტატია მოკლე ფორმაში — ისევე როგორც დატვირთული მატჩი, ცხრილში მისი მონაცემები სხვა მონაცემებთან გადარეულია. რონალდოს ბოლო ხუთი თამაში: ოთხი გოლი, ერთი ასისტი, ერთი წაგება. გუნდი თამაშობს უფრო კომპაქტურად და სტრუქტურულად.',
      en: 'A short editorial example: same as a busy match itself, his numbers stand out. Ronaldo over his last five outings has racked up four goals and an assist, while the team plays a more compact, structured shape.',
    },
  },
  {
    id: 'n2',
    slug: 'arsenal-double-injury-blow',
    hero: HERO_NEWS_2,
    publishedAt: past(1),
    author: { ka: 'სპორტოკის რედაქცია', en: 'Sportok Editorial' },
    readMinutes: 3,
    tags: ['Arsenal', 'Premier League'],
    title: {
      ka: 'არსენალისთვის ორმაგი ტრავმული დარტყმა ფინიშის წინ',
      en: 'Arsenal hit by double injury blow before the run-in',
    },
    excerpt: {
      ka: 'მიქელ არტეტას მთავარი წყვილი ფიზიკურ მდგომარეობასთან გვერდს უხვევს.',
      en: "Mikel Arteta's key pair leave the pitch with knocks days before a decisive run.",
    },
    body: {
      ka: 'არტეტას რეჟიმი როტაციას მოითხოვს. დღევანდელი მონაცემები ცხადყოფს, რომ ორი მთავარი მოთამაშე ორი კვირით გავიდა.',
      en: "Arteta's rotation policy will be tested. Today's reports confirm that two starting-XI players will be sidelined for at least two weeks.",
    },
  },
  {
    id: 'n3',
    slug: 'transfer-window-shake-up',
    hero: HERO_NEWS_3,
    publishedAt: past(2),
    author: { ka: 'სპორტოკის რედაქცია', en: 'Sportok Editorial' },
    readMinutes: 5,
    tags: ['Transfers', 'Premier League'],
    title: {
      ka: 'ტრანსფერული ფანჯრის მთავარი ცვლილებები — გადახედვა',
      en: 'Transfer window shake-up — what to watch',
    },
    excerpt: {
      ka: 'რომელი კლუბი იძენს ვისთან რეალურ უპირატესობას ბაზარზე.',
      en: 'Which clubs are actually gaining a real advantage in the market.',
    },
    body: {
      ka: 'მოკლე მიმოხილვა — ბაზრის სტრუქტურა ისევ ცვალებადია.',
      en: 'A short overview — the structural shape of the market keeps shifting.',
    },
  },
  {
    id: 'n4',
    slug: 'nba-mvp-race',
    hero: HERO_NEWS_1,
    publishedAt: past(2),
    author: { ka: 'სპორტოკის რედაქცია', en: 'Sportok Editorial' },
    readMinutes: 6,
    tags: ['NBA', 'MVP'],
    title: { ka: 'NBA MVP-ის რბოლა შემოდგომისკენ', en: 'The NBA MVP race heading into the spring' },
    excerpt: { ka: 'ვინ ცდილობს ლიდერობას ცხრილში.', en: 'Who is making the strongest push.' },
    body: { ka: 'სრული გადახედვა.', en: 'Full breakdown coming.' },
  },
  {
    id: 'n5',
    slug: 'tennis-madrid-preview',
    hero: HERO_NEWS_2,
    publishedAt: past(3),
    author: { ka: 'სპორტოკის რედაქცია', en: 'Sportok Editorial' },
    readMinutes: 4,
    tags: ['Tennis', 'ATP'],
    title: { ka: 'მადრიდის ღია ჩემპიონატის გასაღები მონაცემები', en: 'Madrid Open: key data to watch' },
    excerpt: { ka: 'რომელი მონაცემები გადაწყვეტენ ბრძოლას.', en: 'Which numbers will decide the tournament.' },
    body: { ka: 'ანალიზი მოყვება სრულ ფორმაში.', en: 'Full analysis follows.' },
  },
];

const allMatches: Match[] = [featuredMatch, ...moreFootball, ...basketballMatches, ...tennisMatches];

export const mockData = {
  featuredMatch,
  liveMatches,
  news,
  allMatches,
  bySport: (s: Sport) => allMatches.filter((m) => m.sport === s),
  bySlug: (slug: string) => allMatches.find((m) => m.slug === slug),
  newsBySlug: (slug: string) => news.find((n) => n.slug === slug),
  relatedNews: (count = 5) => news.slice(0, count),
};
