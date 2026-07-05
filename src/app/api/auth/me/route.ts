import { getSession } from '@/lib/jwt';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Refresh data from database to check for updates (e.g. status changes)
    const user = await db.user.findUnique({
      where: { id: session.userId },
      include: { school: true }
    });

    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ authenticated: false, error: 'User is inactive or deleted' }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        schoolId: user.schoolId,
        schoolName: user.school?.name || null,
        subRoles: {
          isKepalaSekolah: user.isKepalaSekolah,
          isWaliKelas: user.isWaliKelas,
          isGuruMapel: user.isGuruMapel,
        }
      }
    });

  } catch (error) {
    console.error('Fetch current session error:', error);
    return NextResponse.json({ error: 'Failed to retrieve session' }, { status: 500 });
  }
}
