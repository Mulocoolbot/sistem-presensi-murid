import { db } from '@/lib/db';
import { protectApi } from '@/lib/auth';
import { logActivity } from '@/lib/activityLogger';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const { errorResponse } = await protectApi(['SUPER_ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const schools = await db.school.findMany({
      include: {
        _count: {
          select: {
            users: { where: { role: 'TEACHER' } },
            students: { where: { isDeleted: false } },
            classes: true,
          }
        }
      },
      orderBy: { name: 'asc' },
    });
    
    return NextResponse.json(schools);
  } catch (error) {
    console.error('Fetch schools error:', error);
    return NextResponse.json({ error: 'Failed to fetch school list' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { session, errorResponse } = await protectApi(['SUPER_ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const { name, address, phone, status } = await request.json();

    if (!name || !address || !phone) {
      return NextResponse.json({ error: 'Missing required school fields' }, { status: 400 });
    }

    // Check duplicate
    const existing = await db.school.findFirst({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: 'School name already exists' }, { status: 400 });
    }

    const school = await db.school.create({
      data: {
        name,
        address,
        phone,
        status: status !== undefined ? !!status : true,
      }
    });

    // Log Activity
    await logActivity({
      userId: session!.userId,
      schoolId: null,
      username: session!.username,
      role: 'SUPER_ADMIN',
      action: `Create School - ${school.name}`,
      request,
      afterData: school,
    });

    return NextResponse.json({ success: true, school });
  } catch (error) {
    console.error('Create school error:', error);
    return NextResponse.json({ error: 'Failed to create school' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { session, errorResponse } = await protectApi(['SUPER_ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const { id, name, address, phone, status } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing school id' }, { status: 400 });
    }

    const targetSchool = await db.school.findUnique({ where: { id } });
    if (!targetSchool) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const updatedSchool = await db.school.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        address: address !== undefined ? address : undefined,
        phone: phone !== undefined ? phone : undefined,
        status: status !== undefined ? !!status : undefined,
      }
    });

    // Log Activity
    await logActivity({
      userId: session!.userId,
      schoolId: null,
      username: session!.username,
      role: 'SUPER_ADMIN',
      action: `Update School - ${updatedSchool.name}`,
      request,
      beforeData: targetSchool,
      afterData: updatedSchool,
    });

    return NextResponse.json({ success: true, school: updatedSchool });
  } catch (error) {
    console.error('Update school error:', error);
    return NextResponse.json({ error: 'Failed to update school' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { session, errorResponse } = await protectApi(['SUPER_ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing school id' }, { status: 400 });
    }

    const school = await db.school.findUnique({ where: { id } });
    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Hard delete school (cascade deletion is set up on prisma model relations)
    await db.school.delete({ where: { id } });

    // Log Activity
    await logActivity({
      userId: session!.userId,
      schoolId: null,
      username: session!.username,
      role: 'SUPER_ADMIN',
      action: `Delete School - Name: ${school.name}`,
      request,
      beforeData: school,
    });

    return NextResponse.json({ success: true, message: 'School deleted successfully' });
  } catch (error) {
    console.error('Delete school error:', error);
    return NextResponse.json({ error: 'Failed to delete school: ' + (error as Error).message }, { status: 500 });
  }
}
