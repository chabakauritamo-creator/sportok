import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { NewsArticle } from '@/models/NewsArticle';
import { Match } from '@/models/Match';
import { User } from '@/models/User';

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();

    const [
      newsTotal,
      newsPublished,
      newsDraft,
      newsHidden,
      matchesTotal,
      matchesPublished,
      matchesDraft,
      matchesHidden,
      usersTotal,
      usersAdmins,
    ] = await Promise.all([
      NewsArticle.countDocuments(),
      NewsArticle.countDocuments({ status: 'published' }),
      NewsArticle.countDocuments({ status: 'draft' }),
      NewsArticle.countDocuments({ status: 'hidden' }),
      Match.countDocuments(),
      Match.countDocuments({ publishStatus: 'published' }),
      Match.countDocuments({ publishStatus: 'draft' }),
      Match.countDocuments({ publishStatus: 'hidden' }),
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
    ]);

    return NextResponse.json({
      news: { total: newsTotal, published: newsPublished, draft: newsDraft, hidden: newsHidden },
      matches: { total: matchesTotal, published: matchesPublished, draft: matchesDraft, hidden: matchesHidden },
      users: { total: usersTotal, admins: usersAdmins },
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
