import { db } from '@/lib/db';
import { protectApi, getTenantFilter } from '@/lib/auth';
import { AttendanceStatus, Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Teachers and School Admins can access attendance rekap
  const { session, errorResponse } = await protectApi(['TEACHER', 'SCHOOL_ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const tenant = getTenantFilter(session!);
    const { searchParams } = new URL(request.url);

    const classId = searchParams.get('classId') || '';
    const subjectId = searchParams.get('subjectId') || '';
    const studentId = searchParams.get('studentId') || '';
    const academicYear = searchParams.get('academicYear') || '';
    const semester = searchParams.get('semester') || '';

    // Build filters
    const where: Prisma.AttendanceWhereInput = {
      schoolId: tenant.schoolId,
    };

    if (classId) where.classId = classId;
    if (subjectId) where.subjectId = subjectId;
    if (academicYear) where.academicYear = academicYear;
    if (semester) where.semester = semester;

    // Fetch matching attendances and details
    const attendances = await db.attendance.findMany({
      where,
      include: {
        class: { select: { name: true } },
        subject: { select: { name: true, code: true } },
        details: {
          where: studentId ? { studentId } : undefined,
          include: {
            student: { select: { fullName: true, nis: true } }
          }
        }
      },
      orderBy: { date: 'asc' }
    });

    // Process rekap stats
    // We will aggregate stats grouped by Class and Subject, or by Student
    const studentStats: Record<string, Record<AttendanceStatus, number> & {
      nis: string;
      name: string;
      total: number;
    }> = {};

    let grandTotal = 0;
    const counters: Record<AttendanceStatus, number> = {
      HADIR: 0,
      SAKIT: 0,
      IZIN: 0,
      ALPHA: 0,
      TERLAMBAT: 0,
      DISPENSASI: 0
    };

    for (const att of attendances) {
      for (const det of att.details) {
        const sId = det.studentId;
        if (!studentStats[sId]) {
          studentStats[sId] = {
            nis: det.student.nis,
            name: det.student.fullName,
            HADIR: 0,
            SAKIT: 0,
            IZIN: 0,
            ALPHA: 0,
            TERLAMBAT: 0,
            DISPENSASI: 0,
            total: 0
          };
        }

        studentStats[sId][det.status] = (studentStats[sId][det.status] || 0) + 1;
        studentStats[sId].total++;

        counters[det.status] = (counters[det.status] || 0) + 1;
        grandTotal++;
      }
    }

    const rekapList = Object.keys(studentStats).map((key) => {
      const stats = studentStats[key];
      const present = stats.HADIR + stats.TERLAMBAT + stats.DISPENSASI;
      const rate = stats.total > 0 ? Math.round((present / stats.total) * 100) : 0;
      
      return {
        studentId: key,
        ...stats,
        rate
      };
    });

    // Group logs by date for calendar/daily summaries
    const dailyStats: Record<string, Record<AttendanceStatus, number> & {
      date: string;
      total: number;
    }> = {};

    for (const att of attendances) {
      const dStr = att.date.toISOString().substring(0, 10);
      if (!dailyStats[dStr]) {
        dailyStats[dStr] = {
          date: dStr,
          HADIR: 0,
          SAKIT: 0,
          IZIN: 0,
          ALPHA: 0,
          TERLAMBAT: 0,
          DISPENSASI: 0,
          total: 0
        };
      }

      for (const det of att.details) {
        dailyStats[dStr][det.status] = (dailyStats[dStr][det.status] || 0) + 1;
        dailyStats[dStr].total++;
      }
    }

    const dailyList = Object.keys(dailyStats).map((key) => dailyStats[key]);

    return NextResponse.json({
      summary: {
        totalAttendance: grandTotal,
        ...counters,
        rate: grandTotal > 0 ? Math.round(((counters.HADIR + counters.TERLAMBAT + counters.DISPENSASI) / grandTotal) * 100) : 0
      },
      studentsRekap: rekapList,
      dailyRekap: dailyList,
      details: attendances.map((a) => ({
        id: a.id,
        date: a.date,
        periodTime: a.periodTime,
        className: a.class.name,
        subjectName: a.subject.name,
        subjectCode: a.subject.code,
        details: a.details.map((d) => ({
          studentName: d.student.fullName,
          status: d.status,
          note: d.note
        }))
      }))
    });

  } catch (error) {
    console.error('Fetch rekap error:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance rekap: ' + (error as Error).message }, { status: 500 });
  }
}
