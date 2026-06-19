import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INewsArticle extends Document {
  slug: string;
  hero: string;
  publishedAt: Date;
  author: { ka: string; en: string };
  readMinutes: number;
  tags: string[];
  title: { ka: string; en: string };
  excerpt: { ka: string; en: string };
  body: { ka: string; en: string };
  status: 'draft' | 'published' | 'hidden';
  featured: boolean;
  seoTitle: { ka: string; en: string };
  seoDescription: { ka: string; en: string };
}

const BilingualSchema = new Schema({ ka: String, en: String }, { _id: false });

const NewsArticleSchema = new Schema<INewsArticle>({
  slug: { type: String, required: true, unique: true, index: true },
  hero: { type: String, required: true },
  publishedAt: { type: Date, required: true },
  author: { type: BilingualSchema, required: true },
  readMinutes: { type: Number, required: true },
  tags: [{ type: String }],
  title: { type: BilingualSchema, required: true },
  excerpt: { type: BilingualSchema, required: true },
  body: { type: BilingualSchema, required: true },
  status: { type: String, enum: ['draft', 'published', 'hidden'], default: 'draft' },
  featured: { type: Boolean, default: false },
  seoTitle: { type: BilingualSchema, default: () => ({ ka: '', en: '' }) },
  seoDescription: { type: BilingualSchema, default: () => ({ ka: '', en: '' }) },
});

export const NewsArticle: Model<INewsArticle> =
  mongoose.models.NewsArticle ?? mongoose.model<INewsArticle>('NewsArticle', NewsArticleSchema);
