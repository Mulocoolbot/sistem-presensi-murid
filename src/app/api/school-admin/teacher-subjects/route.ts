import { db } from '@/lib/db';
import { protectApi, getTenantFilter } from '@/lib/auth';
import { logActivity } from '@/lib/activityLogger';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const { session, errorResponse } = await protectApi(['SCHOOL_ADMIN', 'TEACHER']);
  if (errorResponse) return errorResponse;

  try {
    const tenant = getTenantFilter(session!);
    
    const assignments = await db.teacherSubjectClass.findMany({
      where: {
        class: { schoolId: tenant.schoolId }
      },
      include: {
        teacher: { select: { id: true, fullName: true, username: true } },
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true, grade: true } }
      },
      orderBy: [
        { class: { name: 'asc' } },
        { subject: { name: 'asc' } }
      ]
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Fetch teacher assignments error:', error);
    return NextResponse.json({ error: 'Failed to fetch teacher assignments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { session, errorResponse } = await protectApi(['SCHOOL_ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const tenant = getTenantFilter(session!);
    const { teacherId, subjectId, classId, academicYear, semester } = await request.json();

    if (!teacherId || !subjectId || !classId || !academicYear || !semester) {
      return NextResponse.json({ error: 'Missing required assignment fields' }, { status: 400 });
    }

    // Verify teacher belongs to school
    const teacher = await db.user.findFirst({
      where: { id: teacherId, schoolId: tenant.schoolId, role: 'TEACHER' }
    });
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found in this school' }, { status: 400 });
    }

    // Verify subject belongs to school
    const subject = await db.subject.findFirst({
      where: { id: subjectId, schoolId: tenant.schoolId }
    });
    if (!subject) {
      return NextResponse.json({ error: 'Subject not found in this school' }, { status: 400 });
    }

    // Verify class belongs to school
    const classObj = await db.class.findFirst({
      where: { id: classId, schoolId: tenant.schoolId }
    });
    if (!classObj) {
      return NextResponse.json({ error: 'Class not found in this school' }, { status: 400 });
    }

    // Check duplicate assignment
    const existing = await db.teacherSubjectClass.findFirst({
      where: {
        teacherId,
        subjectId,
        classId,
        academicYear,
        semester
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Teacher is already assigned to this class and subject for this semester' }, { status: 400 });
    }

    const assignment = await db.teacherSubjectClass.create({
      data: {
        teacherId,
        subjectId,
        classId,
        academicYear,
        semester
      },
      include: {
        teacher: { select: { fullName: true } },
        subject: { select: { name: true } },
        class: { select: { name: true } }
      }
    });

    // Log Activity
    await logActivity({
      userId: session!.userId,
      schoolId: tenant.schoolId,
      username: session!.username,
      role: 'SCHOOL_ADMIN',
      action: `Assign Teacher (${assignment.teacher.fullName}) to Subject (${assignment.subject.name}) in Class (${assignment.class.name})`,
      request,
      afterData: assignment,
    });

    return NextResponse.json({ success: true, assignment });
  } catch (error) {
    console.error('Create teacher assignment error:', error);
    return NextResponse.json({ error: 'Failed to assign teacher' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { session, errorResponse } = await protectApi(['SCHOOL_ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const tenant = getTenantFilter(session!);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing assignment id' }, { status: 400 });
    }

    // Verify assignment belongs to this school
    const assignment = await db.teacherSubjectClass.findFirst({
      where: {
        id,
        class: { schoolId: tenant.schoolId }
      },
      include: {
        teacher: { select: { fullName: true } },
        subject: { select: { name: true } },
        class: { select: { name: true } }
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found in this school' }, { status: 404 });
    }

    await db.teacherSubjectClass.delete({ where: { id } });

    // Log Activity
    await logActivity({
      userId: session!.userId,
      schoolId: tenant.schoolId,
      username: session!.username,
      role: 'SCHOOL_ADMIN',
      action: `Remove Teacher Assignment - Teacher: ${assignment.teacher.fullName}, Subject: ${assignment.subject.name}, Class: ${assignment.class.name}`,
      request,
      beforeData: assignment,
    });

    return NextResponse.json({ success: true, message: 'Assignment removed successfully' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    return NextResponse.json({ error: 'Failed to remove assignment' }, { status: 500 });
  }
}
