import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Match } from '@/models/Match';
import { auth } from '@/lib/auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();
    const { id } = await params;
    const match = await Match.findById(id).lean();
    if (!match) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(match);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const match = await Match.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!match) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(match);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();
    const { id } = await params;
    const match = await Match.findByIdAndDelete(id).lean();
    if (!match) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
