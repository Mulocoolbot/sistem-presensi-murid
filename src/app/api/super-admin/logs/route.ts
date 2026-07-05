import { db } from '@/lib/db';
import { protectApi } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { errorResponse } = await protectApi(['SUPER_ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const schoolId = searchParams.get('schoolId') || '';
    const role = searchParams.get('role') || '';

    // Build query conditions
    const where: {
      schoolId?: string;
      role?: string;
      OR?: Array<{
        username?: { contains: string };
        action?: { contains: string };
        ipAddress?: { contains: string };
        deviceType?: { contains: string };
      }>;
    } = {};

    if (schoolId) {
      where.schoolId = schoolId;
    }

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { username: { contains: search } },
        { action: { contains: search } },
        { ipAddress: { contains: search } },
        { deviceType: { contains: search } }
      ];
    }

    const logs = await db.activityLog.findMany({
      where,
      include: {
        school: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to recent 100 logs
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Fetch activity logs error:', error);
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
  }
}
