import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { NewsArticle } from '@/models/NewsArticle';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectDB();
    const article = await NewsArticle.findOne({ slug }).lean();
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }
    return NextResponse.json(article);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
