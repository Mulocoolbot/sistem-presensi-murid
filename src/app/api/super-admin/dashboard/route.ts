import { db } from '@/lib/db';
import { protectApi } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const { errorResponse } = await protectApi(['SUPER_ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const totalSchools = await db.school.count();
    const activeSchools = await db.school.count({ where: { status: true } });
    
    const totalAdmins = await db.user.count({ where: { role: 'SCHOOL_ADMIN' } });
    const pendingAdmins = await db.user.count({ 
      where: { role: 'SCHOOL_ADMIN', status: 'PENDING' } 
    });

    const recentLogs = await db.activityLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { school: { select: { name: true } } }
    });

    const recentAdmins = await db.user.findMany({
      take: 5,
      where: { role: 'SCHOOL_ADMIN' },
      orderBy: { createdAt: 'desc' },
      include: { school: { select: { name: true } } }
    });

    const schoolStats = await db.school.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: { where: { role: 'TEACHER' } },
            students: { where: { isDeleted: false } },
            classes: true,
          }
        }
      }
    });

    return NextResponse.json({
      stats: {
        totalSchools,
        activeSchools,
        totalAdmins,
        pendingAdmins,
      },
      recentLogs,
      recentAdmins,
      schoolStats,
    });
  } catch (error) {
    console.error('Fetch Super Admin dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
