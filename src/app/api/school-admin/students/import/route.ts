import { db } from '@/lib/db';
import { protectApi, getTenantFilter } from '@/lib/auth';
import { logActivity } from '@/lib/activityLogger';
import { NextRequest, NextResponse } from 'next/server';

interface StudentImportPayload {
  nis: string;
  nisn: string;
  fullName: string;
  gender: 'L' | 'P';
  classId: string;
  phone?: string;
  address?: string;
  guardianName?: string;
}

export async function POST(request: NextRequest) {
  const { session, errorResponse } = await protectApi(['SCHOOL_ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const tenant = getTenantFilter(session!);
    const { students } = await request.json();

    if (!students || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: 'No student data provided' }, { status: 400 });
    }

    // Begin transaction for bulk insert
    const createdCount = await db.$transaction(async (tx) => {
      let count = 0;
      for (const student of students as StudentImportPayload[]) {
        // Validate student structure
        if (!student.nis || !student.nisn || !student.fullName || !student.gender || !student.classId) {
          throw new Error('NIS, NISN, Nama Lengkap, Jenis Kelamin, dan Kelas wajib diisi.');
        }

        // Check if student exists in the school by NIS/NISN
        const existing = await tx.student.findFirst({
          where: {
            schoolId: tenant.schoolId,
            OR: [
              { nis: student.nis },
              { nisn: student.nisn }
            ],
            isDeleted: false
          }
        });

        if (existing) {
          throw new Error(`Siswa dengan NIS ${student.nis} atau NISN ${student.nisn} sudah terdaftar.`);
        }

        // Create student
        await tx.student.create({
          data: {
            schoolId: tenant.schoolId,
            classId: student.classId,
            nis: student.nis,
            nisn: student.nisn,
            fullName: student.fullName,
            gender: student.gender === 'L' ? 'L' : 'P',
            birthPlace: 'Lokal',
            birthDate: new Date('2010-01-01'),
            religion: 'Islam',
            address: student.address || '-',
            parentName: student.guardianName || '-',
            parentPhone: student.phone || '-',
            status: 'ACTIVE'
          }
        });
        count++;
      }
      return count;
    });

    // Log Activity
    await logActivity({
      userId: session!.userId,
      schoolId: tenant.schoolId,
      username: session!.username,
      role: 'SCHOOL_ADMIN',
      action: `Bulk Import Students - Count: ${createdCount}`,
      request,
      afterData: { count: createdCount }
    });

    return NextResponse.json({ success: true, count: createdCount });

  } catch (error) {
    console.error('Import students error:', error);
    return NextResponse.json({ error: (error as Error).message || 'Gagal mengimpor data murid' }, { status: 500 });
  }
}
