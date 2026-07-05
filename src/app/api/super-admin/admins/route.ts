import { db } from '@/lib/db';
import { protectApi } from '@/lib/auth';
import { logActivity } from '@/lib/activityLogger';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const { errorResponse } = await protectApi(['SUPER_ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const pendingAdmins = await db.user.findMany({
      where: {
        role: 'SCHOOL_ADMIN',
      },
      include: {
        school: true,
        documents: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(pendingAdmins);
  } catch (error) {
    console.error('Fetch pending admins error:', error);
    return NextResponse.json({ error: 'Failed to fetch pending admin list' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { session, errorResponse } = await protectApi(['SUPER_ADMIN']);
  if (errorResponse || !session) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { userId, status } = await request.json();

    if (!userId || !status) {
      return NextResponse.json({ error: 'Missing userId or status' }, { status: 400 });
    }

    const validStatuses = ['PENDING', 'ACTIVE', 'INACTIVE'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid account status' }, { status: 400 });
    }

    // Get current user data before change
    const targetUser = await db.user.findUnique({
      where: { id: userId },
      include: { school: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update status
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { status },
      include: { school: true }
    });

    // Log Activity
    await logActivity({
      userId: session.userId,
      schoolId: null,
      username: session.username,
      role: 'SUPER_ADMIN',
      action: `Change Admin Status (${status}) - User: ${updatedUser.username}`,
      request,
      beforeData: { status: targetUser.status },
      afterData: { status: updatedUser.status },
    });

    return NextResponse.json({
      success: true,
      message: `Admin account is now ${status}`,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        status: updatedUser.status,
      }
    });

  } catch (error) {
    console.error('Update admin status error:', error);
    return NextResponse.json({ error: 'Failed to update admin status' }, { status: 500 });
  }
}
