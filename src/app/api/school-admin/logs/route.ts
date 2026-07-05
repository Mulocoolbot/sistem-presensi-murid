import { db } from '@/lib/db';
import { protectApi, getTenantFilter } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await protectApi(['SCHOOL_ADMIN']);
  if (errorResponse || !session) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const tenant = getTenantFilter(session);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // Build query conditions
    const where: {
      schoolId: string | null;
      OR?: Array<{
        username?: { contains: string };
        action?: { contains: string };
        ipAddress?: { contains: string };
        deviceType?: { contains: string };
      }>;
    } = {
      schoolId: tenant.schoolId
    };

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
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to recent 100 logs
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Fetch school activity logs error:', error);
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
  }
}
