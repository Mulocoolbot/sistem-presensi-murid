import { db } from '@/lib/db';
import { protectApi, getTenantFilter } from '@/lib/auth';
import { logActivity } from '@/lib/activityLogger';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await protectApi(['SCHOOL_ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const tenant = getTenantFilter(session!);
    
    const classes = await db.class.findMany({
      where: {
        schoolId: tenant.schoolId,
      },
      include: {
        waliKelas: {
          select: { id: true, fullName: true, username: true }
        },
        _count: {
          select: { students: { where: { isDeleted: false } } }
        }
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(classes);
  } catch (error) {
    console.error('Fetch classes error:', error);
    return NextResponse.json({ error: 'Failed to fetch class list' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { session, errorResponse } = await protectApi(['SCHOOL_ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const tenant = getTenantFilter(session!);
    const { name, grade, capacity, waliKelasId } = await request.json();

    if (!name || !grade || !capacity) {
      return NextResponse.json({ error: 'Missing required class fields' }, { status: 400 });
    }

    // Check duplicate
    const existing = await db.class.findFirst({
      where: {
        schoolId: tenant.schoolId,
        name,
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Class name already exists' }, { status: 400 });
    }

    // Optional: verify wali kelas exists and is a teacher at this school
    if (waliKelasId) {
      const teacher = await db.user.findFirst({
        where: { id: waliKelasId, schoolId: tenant.schoolId, role: 'TEACHER' }
      });
      if (!teacher) {
        return NextResponse.json({ error: 'Wali Kelas must be an active teacher at this school' }, { status: 400 });
      }
    }

    const classObj = await db.class.create({
      data: {
        schoolId: tenant.schoolId,
        name,
        grade,
        capacity: parseInt(capacity),
        waliKelasId: waliKelasId || null,
      },
      include: {
        waliKelas: { select: { fullName: true } }
      }
    });

    // Log Activity
    await logActivity({
      userId: session!.userId,
      schoolId: tenant.schoolId,
      username: session!.username,
      role: 'SCHOOL_ADMIN',
      action: `Create Class - ${classObj.name}`,
      request,
      afterData: classObj,
    });

    return NextResponse.json({ success: true, class: classObj });
  } catch (error) {
    console.error('Create class error:', error);
    return NextResponse.json({ error: 'Failed to create class' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { session, errorResponse } = await protectApi(['SCHOOL_ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const tenant = getTenantFilter(session!);
    const { id, name, grade, capacity, waliKelasId } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing class id' }, { status: 400 });
    }

    const targetClass = await db.class.findFirst({
      where: { id, schoolId: tenant.schoolId }
    });

    if (!targetClass) {
      return NextResponse.json({ error: 'Class not found in this school' }, { status: 404 });
    }

    // If changing name, check duplicate
    if (name && name !== targetClass.name) {
      const duplicate = await db.class.findFirst({
        where: { schoolId: tenant.schoolId, name }
      });
      if (duplicate) {
        return NextResponse.json({ error: 'Class name already exists' }, { status: 400 });
      }
    }

    // Verify wali kelas if changed
    if (waliKelasId && waliKelasId !== targetClass.waliKelasId) {
      const teacher = await db.user.findFirst({
        where: { id: waliKelasId, schoolId: tenant.schoolId, role: 'TEACHER' }
      });
      if (!teacher) {
        return NextResponse.json({ error: 'Wali Kelas must be an active teacher at this school' }, { status: 400 });
      }
    }

    const updatedClass = await db.class.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        grade: grade !== undefined ? grade : undefined,
        capacity: capacity !== undefined ? parseInt(capacity) : undefined,
        waliKelasId: waliKelasId !== undefined ? (waliKelasId || null) : undefined,
      },
      include: {
        waliKelas: { select: { fullName: true } }
      }
    });

    // Log Activity
    await logActivity({
      userId: session!.userId,
      schoolId: tenant.schoolId,
      username: session!.username,
      role: 'SCHOOL_ADMIN',
      action: `Update Class - ${updatedClass.name}`,
      request,
      beforeData: targetClass,
      afterData: updatedClass,
    });

    return NextResponse.json({ success: true, class: updatedClass });
  } catch (error) {
    console.error('Update class error:', error);
    return NextResponse.json({ error: 'Failed to update class' }, { status: 500 });
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
      return NextResponse.json({ error: 'Missing class id' }, { status: 400 });
    }

    const classObj = await db.class.findFirst({
      where: { id, schoolId: tenant.schoolId }
    });

    if (!classObj) {
      return NextResponse.json({ error: 'Class not found in this school' }, { status: 404 });
    }

    // IMPORTANT: Under Admin requirements, we must automatically run backup before deleting a class!
    const { backupClassBeforeDelete } = await import('@/lib/backupService');
    await backupClassBeforeDelete(id);

    // Hard delete class (associated data deletion cascade or setNull is set up in schema)
    await db.class.delete({ where: { id } });

    // Log Activity
    await logActivity({
      userId: session!.userId,
      schoolId: tenant.schoolId,
      username: session!.username,
      role: 'SCHOOL_ADMIN',
      action: `Delete Class (Backup Generated) - Name: ${classObj.name}`,
      request,
      beforeData: classObj,
    });

    return NextResponse.json({ success: true, message: 'Class deleted successfully and backup generated' });
  } catch (error) {
    console.error('Delete class error:', error);
    return NextResponse.json({ error: 'Failed to delete class: ' + (error as Error).message }, { status: 500 });
  }
}
