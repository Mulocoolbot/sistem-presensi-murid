import { db } from '@/lib/db';
import { protectApi, getTenantFilter } from '@/lib/auth';
import { saveUploadFile } from '@/lib/upload';
import { logActivity } from '@/lib/activityLogger';
import { StudentStatus, Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await protectApi(['SCHOOL_ADMIN', 'TEACHER']);
  if (errorResponse || !session) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const tenant = getTenantFilter(session);
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId') || '';

    const where: Prisma.StudentWhereInput = {
      schoolId: tenant.schoolId,
      isDeleted: false,
    };

    if (classId) {
      where.classId = classId;
    }

    const students = await db.student.findMany({
      where,
      include: {
        class: { select: { id: true, name: true, grade: true } }
      },
      orderBy: { fullName: 'asc' },
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error('Fetch students error:', error);
    return NextResponse.json({ error: 'Failed to fetch student list' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { session, errorResponse } = await protectApi(['SCHOOL_ADMIN', 'TEACHER']);
  // Note: both School Admin and Wali Kelas (represented as TEACHER) can create students!
  // Wait, let's verify if Wali kelas can add students.
  // The prompt says under Wali Kelas: "Hak akses: Melihat daftar murid, Menambah murid, Mengubah data murid, Menghapus murid, Melakukan mutasi murid..."
  // So yes! Both SCHOOL_ADMIN and TEACHER (Wali Kelas) can perform student CRUD.
  if (errorResponse || !session) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const tenant = getTenantFilter(session);
    const formData = await request.formData();

    const classId = formData.get('classId') as string;
    const nis = formData.get('nis') as string;
    const nisn = formData.get('nisn') as string;
    const fullName = formData.get('fullName') as string;
    const gender = formData.get('gender') as string; // "L" / "P"
    const birthPlace = formData.get('birthPlace') as string;
    const birthDateStr = formData.get('birthDate') as string;
    const religion = formData.get('religion') as string;
    const address = formData.get('address') as string;
    const parentName = formData.get('parentName') as string;
    const parentPhone = formData.get('parentPhone') as string;
    const kkFile = formData.get('kkFile') as File | null;

    if (!classId || !nis || !nisn || !fullName || !gender || !birthPlace || !birthDateStr || !religion || !address || !parentName || !parentPhone) {
      return NextResponse.json({ error: 'Missing required student details' }, { status: 400 });
    }

    // Verify class belongs to school
    const classObj = await db.class.findFirst({
      where: { id: classId, schoolId: tenant.schoolId }
    });
    if (!classObj) {
      return NextResponse.json({ error: 'Class not found in this school' }, { status: 400 });
    }

    // Check duplicate NIS/NISN in the school
    const existing = await db.student.findFirst({
      where: {
        schoolId: tenant.schoolId,
        isDeleted: false,
        OR: [
          { nis },
          { nisn }
        ]
      }
    });

    if (existing) {
      const match = existing.nis === nis ? 'NIS' : 'NISN';
      return NextResponse.json({ error: `Siswa dengan ${match} tersebut sudah terdaftar` }, { status: 400 });
    }

    // Upload KK File
    let kkFileUrl = null;
    if (kkFile && kkFile.size > 0) {
      kkFileUrl = await saveUploadFile(kkFile, 'kartu_keluarga');
    }

    const student = await db.student.create({
      data: {
        schoolId: tenant.schoolId,
        classId,
        nis,
        nisn,
        fullName,
        gender,
        birthPlace,
        birthDate: new Date(birthDateStr),
        religion,
        address,
        parentName,
        parentPhone,
        kkFileUrl,
        status: StudentStatus.ACTIVE,
      },
      include: {
        class: { select: { name: true } }
      }
    });

    // Log Activity
    await logActivity({
      userId: session.userId,
      schoolId: tenant.schoolId,
      username: session.username,
      role: session.role,
      action: `Create Student - ${student.fullName} (NIS: ${student.nis})`,
      request,
      afterData: student,
    });

    return NextResponse.json({ success: true, student });
  } catch (error) {
    console.error('Create student error:', error);
    return NextResponse.json({ error: 'Failed to add student: ' + (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { session, errorResponse } = await protectApi(['SCHOOL_ADMIN', 'TEACHER']);
  if (errorResponse || !session) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const tenant = getTenantFilter(session);
    const formData = await request.formData();

    const id = formData.get('id') as string;
    const classId = formData.get('classId') as string | null;
    const nis = formData.get('nis') as string | null;
    const nisn = formData.get('nisn') as string | null;
    const fullName = formData.get('fullName') as string | null;
    const gender = formData.get('gender') as string | null;
    const birthPlace = formData.get('birthPlace') as string | null;
    const birthDateStr = formData.get('birthDate') as string | null;
    const religion = formData.get('religion') as string | null;
    const address = formData.get('address') as string | null;
    const parentName = formData.get('parentName') as string | null;
    const parentPhone = formData.get('parentPhone') as string | null;
    const statusStr = formData.get('status') as string | null;
    const kkFile = formData.get('kkFile') as File | null;

    if (!id) {
      return NextResponse.json({ error: 'Missing student id' }, { status: 400 });
    }

    // Verify student belongs to school
    const targetStudent = await db.student.findFirst({
      where: { id, schoolId: tenant.schoolId, isDeleted: false }
    });

    if (!targetStudent) {
      return NextResponse.json({ error: 'Student not found in this school' }, { status: 404 });
    }

    const updateData: Prisma.StudentUpdateInput = {};

    if (classId) {
      // Verify class
      const classObj = await db.class.findFirst({
        where: { id: classId, schoolId: tenant.schoolId }
      });
      if (!classObj) return NextResponse.json({ error: 'Class not found' }, { status: 400 });
      updateData.class = { connect: { id: classId } };
    }

    if (nis && nis !== targetStudent.nis) {
      const dup = await db.student.findFirst({ where: { schoolId: tenant.schoolId, nis, isDeleted: false } });
      if (dup) return NextResponse.json({ error: 'NIS already registered' }, { status: 400 });
      updateData.nis = nis;
    }

    if (nisn && nisn !== targetStudent.nisn) {
      const dup = await db.student.findFirst({ where: { schoolId: tenant.schoolId, nisn, isDeleted: false } });
      if (dup) return NextResponse.json({ error: 'NISN already registered' }, { status: 400 });
      updateData.nisn = nisn;
    }

    if (fullName) updateData.fullName = fullName;
    if (gender) updateData.gender = gender;
    if (birthPlace) updateData.birthPlace = birthPlace;
    if (birthDateStr) updateData.birthDate = new Date(birthDateStr);
    if (religion) updateData.religion = religion;
    if (address) updateData.address = address;
    if (parentName) updateData.parentName = parentName;
    if (parentPhone) updateData.parentPhone = parentPhone;
    
    if (statusStr) {
      if (!Object.values(StudentStatus).includes(statusStr as StudentStatus)) {
        return NextResponse.json({ error: 'Invalid student status' }, { status: 400 });
      }
      updateData.status = statusStr as StudentStatus;
    }

    // Save new Family Card file if uploaded
    if (kkFile && kkFile.size > 0) {
      updateData.kkFileUrl = await saveUploadFile(kkFile, 'kartu_keluarga');
    }

    const updatedStudent = await db.student.update({
      where: { id },
      data: updateData,
      include: { class: { select: { name: true } } }
    });

    // Log Activity
    await logActivity({
      userId: session.userId,
      schoolId: tenant.schoolId,
      username: session.username,
      role: session.role,
      action: `Update Student - ${updatedStudent.fullName} (NIS: ${updatedStudent.nis})`,
      request,
      beforeData: targetStudent,
      afterData: updatedStudent,
    });

    return NextResponse.json({ success: true, student: updatedStudent });
  } catch (error) {
    console.error('Update student error:', error);
    return NextResponse.json({ error: 'Failed to update student details' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { session, errorResponse } = await protectApi(['SCHOOL_ADMIN', 'TEACHER']);
  if (errorResponse || !session) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const tenant = getTenantFilter(session);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing student id' }, { status: 400 });
    }

    const student = await db.student.findFirst({
      where: { id, schoolId: tenant.schoolId, isDeleted: false }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found in this school' }, { status: 404 });
    }

    // IMPORTANT: Under Admin/Wali Kelas requirements, system MUST run backup before delete student!
    const { backupStudentBeforeDelete } = await import('@/lib/backupService');
    await backupStudentBeforeDelete(id);

    // Perform Soft Delete
    const deletedStudent = await db.student.update({
      where: { id },
      data: { isDeleted: true }
    });

    // Log Activity
    await logActivity({
      userId: session.userId,
      schoolId: tenant.schoolId,
      username: session.username,
      role: session.role,
      action: `Soft Delete Student (Backup Generated) - Name: ${student.fullName} (NIS: ${student.nis})`,
      request,
      beforeData: student,
      afterData: deletedStudent,
    });

    return NextResponse.json({ success: true, message: 'Student soft-deleted and backup generated' });
  } catch (error) {
    console.error('Delete student error:', error);
    return NextResponse.json({ error: 'Failed to delete student: ' + (error as Error).message }, { status: 500 });
  }
}
