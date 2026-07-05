import { db } from '@/lib/db';
import { protectApi, getTenantFilter } from '@/lib/auth';
import { logActivity } from '@/lib/activityLogger';
import { backupSchoolManual, restoreBackup } from '@/lib/backupService';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const { session, errorResponse } = await protectApi(['SCHOOL_ADMIN']);
  if (errorResponse || !session) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const tenant = getTenantFilter(session);

    const backups = await db.backup.findMany({
      where: {
        schoolId: tenant.schoolId,
        isDeleted: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(backups);
  } catch (error) {
    console.error('Fetch backups error:', error);
    return NextResponse.json({ error: 'Failed to fetch backup history' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { session, errorResponse } = await protectApi(['SCHOOL_ADMIN']);
  if (errorResponse || !session) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const tenant = getTenantFilter(session);

    // Trigger manual full backup of school configurations & students
    const backup = await backupSchoolManual(tenant.schoolId);

    // Log Activity
    await logActivity({
      userId: session.userId,
      schoolId: tenant.schoolId,
      username: session.username,
      role: 'SCHOOL_ADMIN',
      action: 'Create Manual School Backup',
      request,
      afterData: backup,
    });

    return NextResponse.json({ success: true, backup });
  } catch (error) {
    console.error('Manual backup error:', error);
    return NextResponse.json({ error: 'Failed to create manual backup: ' + (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { session, errorResponse } = await protectApi(['SCHOOL_ADMIN']);
  if (errorResponse || !session) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const tenant = getTenantFilter(session);
    const { backupId } = await request.json();

    if (!backupId) {
      return NextResponse.json({ error: 'Missing backupId' }, { status: 400 });
    }

    // Verify backup belongs to the school
    const backup = await db.backup.findFirst({
      where: {
        id: backupId,
        schoolId: tenant.schoolId,
        isDeleted: false,
      }
    });

    if (!backup) {
      return NextResponse.json({ error: 'Backup not found in this school' }, { status: 404 });
    }

    // Perform restore operation
    await restoreBackup(backupId);

    // Log Activity
    await logActivity({
      userId: session.userId,
      schoolId: tenant.schoolId,
      username: session.username,
      role: 'SCHOOL_ADMIN',
      action: `Restore School Backup - File: ${backup.filePath}`,
      request,
      afterData: { backupId: backup.id, restoredAt: new Date().toISOString() },
    });

    return NextResponse.json({ success: true, message: 'Data restored successfully' });
  } catch (error) {
    console.error('Restore backup error:', error);
    return NextResponse.json({ error: 'Failed to restore backup: ' + (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { session, errorResponse } = await protectApi(['SCHOOL_ADMIN']);
  if (errorResponse || !session) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const tenant = getTenantFilter(session);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing backup id' }, { status: 400 });
    }

    const backup = await db.backup.findFirst({
      where: { id, schoolId: tenant.schoolId, isDeleted: false }
    });

    if (!backup) {
      return NextResponse.json({ error: 'Backup not found in this school' }, { status: 404 });
    }

    // Soft delete backup record from system view
    await db.backup.update({
      where: { id },
      data: { isDeleted: true }
    });

    // Optionally delete physical file
    const physicalPath = path.join(process.cwd(), 'backups', backup.filePath);
    if (fs.existsSync(physicalPath)) {
      fs.unlinkSync(physicalPath);
    }

    // Log Activity
    await logActivity({
      userId: session.userId,
      schoolId: tenant.schoolId,
      username: session.username,
      role: 'SCHOOL_ADMIN',
      action: `Delete Backup File - File: ${backup.filePath}`,
      request,
      beforeData: backup,
    });

    return NextResponse.json({ success: true, message: 'Backup file deleted successfully' });
  } catch (error) {
    console.error('Delete backup error:', error);
    return NextResponse.json({ error: 'Failed to delete backup' }, { status: 500 });
  }
}
