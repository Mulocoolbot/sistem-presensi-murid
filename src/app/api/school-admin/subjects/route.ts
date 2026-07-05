import { db } from '@/lib/db';
import { protectApi, getTenantFilter } from '@/lib/auth';
import { logActivity } from '@/lib/activityLogger';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await protectApi(['SCHOOL_ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const tenant = getTenantFilter(session!);
    
    const subjects = await db.subject.findMany({
      where: {
        schoolId: tenant.schoolId,
      },
      include: {
        _count: {
          select: { teacherSubjectClasses: true }
        }
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(subjects);
  } catch (error) {
    console.error('Fetch subjects error:', error);
    return NextResponse.json({ error: 'Failed to fetch subject list' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { session, errorResponse } = await protectApi(['SCHOOL_ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const tenant = getTenantFilter(session!);
    const { name, code } = await request.json();

    if (!name || !code) {
      return NextResponse.json({ error: 'Missing name or code' }, { status: 400 });
    }

    // Check duplicate
    const existing = await db.subject.findFirst({
      where: {
        schoolId: tenant.schoolId,
        code,
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Subject code already exists' }, { status: 400 });
    }

    const subject = await db.subject.create({
      data: {
        schoolId: tenant.schoolId,
        name,
        code: code.toUpperCase(),
      }
    });

    // Log Activity
    await logActivity({
      userId: session!.userId,
      schoolId: tenant.schoolId,
      username: session!.username,
      role: 'SCHOOL_ADMIN',
      action: `Create Subject - Name: ${subject.name} (${subject.code})`,
      request,
      afterData: subject,
    });

    return NextResponse.json({ success: true, subject });
  } catch (error) {
    console.error('Create subject error:', error);
    return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { session, errorResponse } = await protectApi(['SCHOOL_ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const tenant = getTenantFilter(session!);
    const { id, name, code } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing subject id' }, { status: 400 });
    }

    const targetSub = await db.subject.findFirst({
      where: { id, schoolId: tenant.schoolId }
    });

    if (!targetSub) {
      return NextResponse.json({ error: 'Subject not found in this school' }, { status: 404 });
    }

    // Check duplicate code if code changed
    if (code && code.toUpperCase() !== targetSub.code) {
      const duplicate = await db.subject.findFirst({
        where: { schoolId: tenant.schoolId, code: code.toUpperCase() }
      });
      if (duplicate) {
        return NextResponse.json({ error: 'Subject code already exists' }, { status: 400 });
      }
    }

    const updatedSub = await db.subject.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        code: code !== undefined ? code.toUpperCase() : undefined,
      }
    });

    // Log Activity
    await logActivity({
      userId: session!.userId,
      schoolId: tenant.schoolId,
      username: session!.username,
      role: 'SCHOOL_ADMIN',
      action: `Update Subject - Name: ${updatedSub.name} (${updatedSub.code})`,
      request,
      beforeData: targetSub,
      afterData: updatedSub,
    });

    return NextResponse.json({ success: true, subject: updatedSub });
  } catch (error) {
    console.error('Update subject error:', error);
    return NextResponse.json({ error: 'Failed to update subject' }, { status: 500 });
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
      return NextResponse.json({ error: 'Missing subject id' }, { status: 400 });
    }

    const subject = await db.subject.findFirst({
      where: { id, schoolId: tenant.schoolId }
    });

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found in this school' }, { status: 404 });
    }

    await db.subject.delete({ where: { id } });

    // Log Activity
    await logActivity({
      userId: session!.userId,
      schoolId: tenant.schoolId,
      username: session!.username,
      role: 'SCHOOL_ADMIN',
      action: `Delete Subject - Name: ${subject.name} (${subject.code})`,
      request,
      beforeData: subject,
    });

    return NextResponse.json({ success: true, message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Delete subject error:', error);
    return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 });
  }
}
