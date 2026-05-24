import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { NewsArticle } from '@/models/NewsArticle';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10)));
    const skip = (page - 1) * limit;

    await connectDB();
    const [articles, total] = await Promise.all([
      NewsArticle.find({}).sort({ publishedAt: -1 }).skip(skip).limit(limit).lean(),
      NewsArticle.countDocuments(),
    ]);

    return NextResponse.json({
      articles,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
