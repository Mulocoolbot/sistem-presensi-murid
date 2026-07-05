import { db } from '@/lib/db';
import { protectApi, getTenantFilter } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const { session, errorResponse } = await protectApi(['SCHOOL_ADMIN']);
  if (errorResponse || !session) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const tenant = getTenantFilter(session);
    const schoolId = tenant.schoolId;

    const totalStudents = await db.student.count({ 
      where: { schoolId, isDeleted: false } 
    });
    
    const totalTeachers = await db.user.count({ 
      where: { schoolId, role: 'TEACHER' } 
    });
    
    const totalClasses = await db.class.count({ 
      where: { schoolId } 
    });
    
    const totalSubjects = await db.subject.count({ 
      where: { schoolId } 
    });

    // Today's attendance counters
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayAttendances = await db.attendance.findMany({
      where: {
        schoolId,
        date: {
          gte: todayStart,
          lte: todayEnd,
        }
      },
      include: {
        details: true
      }
    });

    const statusCounts: Record<'HADIR' | 'SAKIT' | 'IZIN' | 'ALPHA' | 'TERLAMBAT' | 'DISPENSASI', number> = {
      HADIR: 0,
      SAKIT: 0,
      IZIN: 0,
      ALPHA: 0,
      TERLAMBAT: 0,
      DISPENSASI: 0
    };

    let totalAttendanceEntries = 0;

    for (const att of todayAttendances) {
      for (const det of att.details) {
        statusCounts[det.status] = (statusCounts[det.status] || 0) + 1;
        totalAttendanceEntries++;
      }
    }

    // Recent 5 logs for this school
    const recentLogs = await db.activityLog.findMany({
      where: { schoolId },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    // Recent 5 students added
    const recentStudents = await db.student.findMany({
      where: { schoolId, isDeleted: false },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { class: { select: { name: true } } }
    });

    return NextResponse.json({
      stats: {
        totalStudents,
        totalTeachers,
        totalClasses,
        totalSubjects,
        todayAttendance: {
          total: totalAttendanceEntries,
          ...statusCounts
        }
      },
      recentLogs,
      recentStudents,
    });
  } catch (error) {
    console.error('Fetch School Admin dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard statistics' }, { status: 500 });
  }
}
