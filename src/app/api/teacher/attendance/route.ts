import { db } from '@/lib/db';
import { protectApi, getTenantFilter } from '@/lib/auth';
import { logActivity } from '@/lib/activityLogger';
import { AttendanceStatus, Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

interface AttendanceStudentPayload {
  studentId: string;
  fullName: string;
  status: AttendanceStatus;
  note?: string;
}

export async function GET(request: NextRequest) {
  // Teachers and School Admins can view attendance sheets
  const { session, errorResponse } = await protectApi(['TEACHER', 'SCHOOL_ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const tenant = getTenantFilter(session!);
    const { searchParams } = new URL(request.url);
    
    const classId = searchParams.get('classId') || '';
    const subjectId = searchParams.get('subjectId') || '';
    const dateStr = searchParams.get('date') || '';
    const periodTime = searchParams.get('periodTime') || '';

    if (!classId || !subjectId || !dateStr || !periodTime) {
      return NextResponse.json({ error: 'Missing classId, subjectId, date, or periodTime' }, { status: 400 });
    }

    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    // Fetch class students
    const students = await db.student.findMany({
      where: {
        classId,
        schoolId: tenant.schoolId,
        isDeleted: false,
        status: 'ACTIVE'
      },
      orderBy: { fullName: 'asc' }
    });

    // Fetch existing attendance header and details
    const existingAttendance = await db.attendance.findFirst({
      where: {
        schoolId: tenant.schoolId,
        classId,
        subjectId,
        date,
        periodTime
      },
      include: {
        details: true
      }
    });

    // Merge student records with existing attendance details
    const studentAttendanceList = students.map((student) => {
      const detail = existingAttendance?.details.find((d) => d.studentId === student.id);
      return {
        id: student.id,
        nis: student.nis,
        fullName: student.fullName,
        gender: student.gender,
        attendanceStatus: detail?.status || 'HADIR', // Default to HADIR
        note: detail?.note || '',
      };
    });

    return NextResponse.json({
      attendanceHeaderId: existingAttendance?.id || null,
      students: studentAttendanceList
    });

  } catch (error) {
    console.error('Fetch attendance list error:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance sheet' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Both teacher and admin can post/save attendance
  const { session, errorResponse } = await protectApi(['TEACHER', 'SCHOOL_ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const tenant = getTenantFilter(session!);
    const { 
      classId, 
      subjectId, 
      date: dateStr, 
      periodTime, 
      dayOfWeek, 
      academicYear, 
      semester, 
      students 
    } = await request.json();

    if (!classId || !subjectId || !dateStr || !periodTime || !dayOfWeek || !academicYear || !semester || !students) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const inputDate = new Date(dateStr);
    const today = new Date();
    
    // Set both to midnight to compare calendar dates (ignoring time)
    const compareInput = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());
    const compareToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // TIME-LOCK RULE: If calendar date is not today, only SCHOOL_ADMIN can make edits!
    if (compareInput.getTime() !== compareToday.getTime() && session!.role === 'TEACHER') {
      return NextResponse.json({ 
        error: 'Perubahan presensi hari sebelumnya hanya dapat dilakukan oleh Admin Sekolah' 
      }, { status: 403 });
    }

    // Begin database transaction for atomic save
    const result = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Create or Find the Attendance Header
      let attendance = await tx.attendance.findFirst({
        where: {
          schoolId: tenant.schoolId,
          classId,
          subjectId,
          date: compareInput,
          periodTime
        }
      });

      const beforeData = attendance ? await tx.attendance.findUnique({
        where: { id: attendance.id },
        include: { details: true }
      }) : null;

      if (!attendance) {
        attendance = await tx.attendance.create({
          data: {
            schoolId: tenant.schoolId,
            classId,
            subjectId,
            teacherId: session!.userId,
            academicYear,
            semester,
            date: compareInput,
            periodTime,
            dayOfWeek
          }
        });
      } else {
        // If updating, refresh teacher id to the last submitter
        attendance = await tx.attendance.update({
          where: { id: attendance.id },
          data: { teacherId: session!.userId }
        });
      }

      // 2. Clear existing details
      await tx.attendanceDetail.deleteMany({
        where: { attendanceId: attendance.id }
      });

      const detailData = (students as AttendanceStudentPayload[]).map((s) => {
        if (s.status !== 'HADIR' && !s.note) {
          throw new Error(`Siswa ${s.fullName} berstatus selain Hadir, alasan/keterangan wajib diisi.`);
        }
        
        return {
          attendanceId: attendance.id,
          studentId: s.studentId,
          status: s.status,
          note: s.status !== 'HADIR' ? s.note : '',
        };
      });

      await tx.attendanceDetail.createMany({
        data: detailData
      });

      const afterData = await tx.attendance.findUnique({
        where: { id: attendance.id },
        include: { details: true }
      });

      return { attendance, beforeData, afterData };
    });

    // Log Activity
    await logActivity({
      userId: session!.userId,
      schoolId: tenant.schoolId,
      username: session!.username,
      role: session!.role,
      action: `Post/Update Student Attendance - Date: ${dateStr}, Period: ${periodTime}`,
      request,
      beforeData: result.beforeData,
      afterData: result.afterData
    });

    return NextResponse.json({ success: true, attendanceId: result.attendance.id });

  } catch (error) {
    console.error('Save attendance error:', error);
    return NextResponse.json({ error: 'Failed to save attendance: ' + (error as Error).message }, { status: 500 });
  }
}
