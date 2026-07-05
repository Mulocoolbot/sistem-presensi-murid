import { db } from '@/lib/db';
import { saveUploadFile } from '@/lib/upload';
import { logActivity } from '@/lib/activityLogger';
import { Role, AccountStatus, DocumentType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const fullName = formData.get('fullName') as string;
    const nip = formData.get('nip') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const schoolId = formData.get('schoolId') as string;
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    // Sub-roles
    const isKepalaSekolah = formData.get('isKepalaSekolah') === 'true';
    const isWaliKelas = formData.get('isWaliKelas') === 'true';
    const isGuruMapel = formData.get('isGuruMapel') === 'true';

    const fotoKtp = formData.get('fotoKtp') as File | null;
    const suratTugas = formData.get('suratTugas') as File | null;

    // Validate inputs
    if (!fullName || !nip || !email || !phone || !schoolId || !username || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (!fotoKtp || !suratTugas) {
      return NextResponse.json({ error: 'Verification documents (KTP and Surat Tugas) are required' }, { status: 400 });
    }

    if (!isKepalaSekolah && !isWaliKelas && !isGuruMapel) {
      return NextResponse.json({ error: 'Please select at least one role (Kepala Sekolah, Wali Kelas, or Guru Mata Pelajaran)' }, { status: 400 });
    }

    // Check if school exists
    const school = await db.school.findUnique({
      where: { id: schoolId }
    });

    if (!school) {
      return NextResponse.json({ error: 'Selected school does not exist' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
          { nip }
        ]
      }
    });

    if (existingUser) {
      let conflictField = 'username, email, or NIP';
      if (existingUser.username === username) conflictField = 'Username';
      else if (existingUser.email === email) conflictField = 'Email';
      else if (existingUser.nip === nip) conflictField = 'NIP';

      return NextResponse.json({ error: `${conflictField} is already registered` }, { status: 400 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create Teacher User as PENDING
    const user = await db.user.create({
      data: {
        fullName,
        email,
        phone,
        username,
        passwordHash,
        nip,
        role: Role.TEACHER,
        status: AccountStatus.PENDING,
        schoolId: school.id,
        isKepalaSekolah,
        isWaliKelas,
        isGuruMapel
      }
    });

    // Save files locally
    const fotoKtpUrl = await saveUploadFile(fotoKtp, 'ktp');
    const suratTugasUrl = await saveUploadFile(suratTugas, 'surat_tugas');

    // Create verification documents
    await db.verificationDocument.createMany({
      data: [
        {
          userId: user.id,
          type: DocumentType.KTP,
          fileUrl: fotoKtpUrl,
        },
        {
          userId: user.id,
          type: DocumentType.SURAT_TUGAS,
          fileUrl: suratTugasUrl,
        }
      ]
    });

    // Log Activity
    await logActivity({
      userId: user.id,
      schoolId: school.id,
      username: user.username,
      role: 'TEACHER',
      action: 'Register Teacher (Pending Verification)',
      request,
      afterData: {
        userId: user.id,
        fullName: user.fullName,
        username: user.username,
        schoolName: school.name,
        roles: { isKepalaSekolah, isWaliKelas, isGuruMapel }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Registration successful! Your account is pending School Admin verification.',
      userId: user.id
    });

  } catch (error) {
    console.error('Teacher registration error:', error);
    return NextResponse.json({ error: 'Failed to register teacher: ' + (error as Error).message }, { status: 500 });
  }
}
