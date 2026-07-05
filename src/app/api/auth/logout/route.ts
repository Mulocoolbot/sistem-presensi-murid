import { getSession, clearSessionCookie } from '@/lib/jwt';
import { logActivity } from '@/lib/activityLogger';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (session) {
      // Log logout activity
      await logActivity({
        userId: session.userId,
        schoolId: session.schoolId,
        username: session.username,
        role: session.role,
        action: 'User Logout',
        request,
      });
    }

    // Clear session cookie
    await clearSessionCookie();

    return NextResponse.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
