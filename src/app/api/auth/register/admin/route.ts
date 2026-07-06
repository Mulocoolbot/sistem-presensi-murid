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
    const nik = formData.get('nik') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const schoolName = formData.get('schoolName') as string;
    const schoolAddress = formData.get('schoolAddress') as string;
    const schoolPhone = formData.get('schoolPhone') as string;
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    const fotoKtp = formData.get('fotoKtp') as File | null;
    const suratTugas = formData.get('suratTugas') as File | null;

    // Validate inputs
    if (!fullName || !nik || !email || !phone || !schoolName || !schoolAddress || !schoolPhone || !username || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (!fotoKtp || !suratTugas) {
      return NextResponse.json({ error: 'Verification documents (KTP and Surat Tugas) are required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
          { nik }
        ]
      }
    });

    if (existingUser) {
      let conflictField = 'username, email, or NIK';
      if (existingUser.username === username) conflictField = 'Username';
      else if (existingUser.email === email) conflictField = 'Email';
      else if (existingUser.nik === nik) conflictField = 'NIK';

      return NextResponse.json({ error: `${conflictField} is already registered` }, { status: 400 });
    }

    // Create or find school
    let school = await db.school.findFirst({
      where: { name: schoolName }
    });

    if (!school) {
      // Create new school (starts as inactive by default, activated on admin approval)
      school = await db.school.create({
        data: {
          name: schoolName,
          address: schoolAddress,
          phone: schoolPhone,
          status: false
        }
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create School Admin User as PENDING
    const user = await db.user.create({
      data: {
        fullName,
        email,
        phone,
        username,
        passwordHash,
        nik,
        role: Role.SCHOOL_ADMIN,
        status: AccountStatus.PENDING,
        schoolId: school.id,
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
      role: 'SCHOOL_ADMIN',
      action: 'Register School Admin (Pending Approval)',
      request,
      afterData: {
        userId: user.id,
        fullName: user.fullName,
        username: user.username,
        schoolName: school.name,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Registration successful! Your account is pending Super Admin verification.',
      userId: user.id
    });

  } catch (error) {
    console.error('Admin registration error:', error);
    return NextResponse.json({ error: 'Failed to register school admin: ' + (error as Error).message }, { status: 500 });
  }
}
