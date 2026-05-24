import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Match } from '@/models/Match';

export async function GET() {
  try {
    await connectDB();
    const matches = await Match.find({}).sort({ kickoff: -1 }).lean();
    return NextResponse.json(matches);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
