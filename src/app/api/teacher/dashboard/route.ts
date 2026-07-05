import { db } from '@/lib/db';
import { protectApi, getTenantFilter } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const { session, errorResponse } = await protectApi(['TEACHER']);
  if (errorResponse) return errorResponse;

  try {
    const tenant = getTenantFilter(session!);
    const schoolId = tenant.schoolId;

    interface TeacherDashboardData {
      isKepalaSekolah: boolean;
      isWaliKelas: boolean;
      isGuruMapel: boolean;
      kepsekStats?: {
        totalStudents: number;
        totalTeachers: number;
        totalClasses: number;
        attendanceRate: number;
      };
      waliStats?: {
        classId: string;
        className: string;
        studentCount: number;
        attendanceRate: number;
      };
      mapelStats?: {
        assignmentCount: number;
        assignments: {
          subjectName: string;
          subjectCode: string;
          className: string;
          semester: string;
          academicYear: string;
        }[];
      };
    }

    const data: TeacherDashboardData = {
      isKepalaSekolah: session!.isKepalaSekolah,
      isWaliKelas: session!.isWaliKelas,
      isGuruMapel: session!.isGuruMapel,
    };

    // 1. If Kepala Sekolah, load full school statistics
    if (session!.isKepalaSekolah) {
      const totalStudents = await db.student.count({ where: { schoolId, isDeleted: false } });
      const totalTeachers = await db.user.count({ where: { schoolId, role: 'TEACHER' } });
      const totalClasses = await db.class.count({ where: { schoolId } });
      
      const totalAtt = await db.attendanceDetail.count({
        where: { attendance: { schoolId } }
      });
      const presentAtt = await db.attendanceDetail.count({
        where: { 
          attendance: { schoolId },
          status: { in: ['HADIR', 'TERLAMBAT', 'DISPENSASI'] }
        }
      });
      const attendanceRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;

      data.kepsekStats = {
        totalStudents,
        totalTeachers,
        totalClasses,
        attendanceRate
      };
    }

    // 2. If Wali Kelas, load class specific stats
    if (session!.isWaliKelas) {
      // Find the class they manage
      const waliClass = await db.class.findFirst({
        where: { schoolId, waliKelasId: session!.userId },
        include: {
          _count: { select: { students: { where: { isDeleted: false } } } }
        }
      });

      if (waliClass) {
        const totalAtt = await db.attendanceDetail.count({
          where: { attendance: { classId: waliClass.id } }
        });
        const presentAtt = await db.attendanceDetail.count({
          where: { 
            attendance: { classId: waliClass.id },
            status: { in: ['HADIR', 'TERLAMBAT', 'DISPENSASI'] }
          }
        });
        const classAttendanceRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;

        data.waliStats = {
          classId: waliClass.id,
          className: waliClass.name,
          studentCount: waliClass._count.students,
          attendanceRate: classAttendanceRate
        };
      }
    }

    // 3. If Guru Mapel, load teaching assignments count
    if (session!.isGuruMapel) {
      const assignmentCount = await db.teacherSubjectClass.count({
        where: { teacherId: session!.userId }
      });
      
      const assignments = await db.teacherSubjectClass.findMany({
        where: { teacherId: session!.userId },
        include: {
          subject: { select: { name: true, code: true } },
          class: { select: { name: true } }
        }
      });

      data.mapelStats = {
        assignmentCount,
        assignments: assignments.map((a: {
          subject: { name: string; code: string };
          class: { name: string };
          semester: string;
          academicYear: string;
        }) => ({
          subjectName: a.subject.name,
          subjectCode: a.subject.code,
          className: a.class.name,
          semester: a.semester,
          academicYear: a.academicYear
        }))
      };
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Fetch Teacher dashboard stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard statistics' }, { status: 500 });
  }
}
