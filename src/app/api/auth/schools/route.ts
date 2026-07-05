import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const schools = await db.school.findMany({
      where: { status: true },
      select: { id: true, name: true, address: true },
      orderBy: { name: 'asc' },
    });
    
    return NextResponse.json(schools);
  } catch (error) {
    console.error('Fetch schools error:', error);
    return NextResponse.json({ error: 'Failed to fetch schools' }, { status: 500 });
  }
}
