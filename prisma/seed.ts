import { PrismaClient, Role, AccountStatus, StudentStatus, AttendanceStatus, BackupType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing database tables...');
  
  // Clean up order matters due to foreign key constraints
  await prisma.activityLog.deleteMany({});
  await prisma.backup.deleteMany({});
  await prisma.attendanceDetail.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.teacherSubjectClass.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.class.deleteMany({});
  await prisma.verificationDocument.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.school.deleteMany({});

  console.log('Database tables cleared. Seeding database with dummy data...');

  const passwordHash = await bcrypt.hash('Password123', 10);

  // ==================== 1. CREATE SUPER ADMIN ====================
  const superAdmin = await prisma.user.create({
    data: {
      fullName: 'Super Admin SIPMS',
      email: 'superadmin@sipms.com',
      phone: '081234567890',
      username: 'superadmin',
      passwordHash: passwordHash,
      role: Role.SUPER_ADMIN,
      status: AccountStatus.ACTIVE,
    },
  });
  console.log(`Created Super Admin: ${superAdmin.username}`);

  // ==================== 2. CREATE SCHOOLS (Multi-Tenancy) ====================
  const school1 = await prisma.school.create({
    data: {
      name: 'SMA Negeri 1 Jakarta',
      address: 'Jl. Budi Utomo No.7, Jakarta Pusat',
      phone: '0213865001',
      status: true,
    },
  });

  const school2 = await prisma.school.create({
    data: {
      name: 'SMA Negeri 2 Jakarta',
      address: 'Jl. Gajah Mada No.175, Jakarta Barat',
      phone: '0216291234',
      status: true,
    },
  });
  console.log(`Created Schools: ${school1.name}, ${school2.name}`);

  // ==================== 3. CREATE SCHOOL ADMINS ====================
  const admin1 = await prisma.user.create({
    data: {
      fullName: 'Hendra Wijaya, M.Kom.',
      email: 'hendra.wijaya@sman1jkt.sch.id',
      phone: '081298765432',
      username: 'adminjaya',
      passwordHash: passwordHash,
      role: Role.SCHOOL_ADMIN,
      status: AccountStatus.ACTIVE,
      schoolId: school1.id,
    },
  });

  const admin2 = await prisma.user.create({
    data: {
      fullName: 'Siti Aminah, S.Kom.',
      email: 'siti.aminah@sman2jkt.sch.id',
      phone: '085712345678',
      username: 'adminjaya2',
      passwordHash: passwordHash,
      role: Role.SCHOOL_ADMIN,
      status: AccountStatus.ACTIVE,
      schoolId: school2.id,
    },
  });

  // Pending Admin for school1 to test verifications
  const pendingAdmin = await prisma.user.create({
    data: {
      fullName: 'Andi Saputra, S.E.',
      email: 'andi.saputra@sman1jkt.sch.id',
      phone: '089988776655',
      username: 'andiadmin',
      passwordHash: passwordHash,
      role: Role.SCHOOL_ADMIN,
      status: AccountStatus.PENDING,
      schoolId: school1.id,
    },
  });

  await prisma.verificationDocument.create({
    data: {
      userId: pendingAdmin.id,
      type: 'KTP',
      fileUrl: '/uploads/ktp_dummy_andi.jpg',
    },
  });
  await prisma.verificationDocument.create({
    data: {
      userId: pendingAdmin.id,
      type: 'SURAT_TUGAS',
      fileUrl: '/uploads/surat_tugas_dummy_andi.pdf',
    },
  });

  console.log(`Created Admins: ${admin1.username}, ${admin2.username}, ${pendingAdmin.username} (Pending)`);

  // ==================== 4. CREATE TEACHERS ====================
  // School 1 Teachers
  const teacher1 = await prisma.user.create({
    data: {
      fullName: 'Budi Santoso, S.Pd.',
      email: 'budi.santoso@sman1jkt.sch.id',
      phone: '081345678901',
      username: 'gurujaya',
      passwordHash: passwordHash,
      role: Role.TEACHER,
      status: AccountStatus.ACTIVE,
      schoolId: school1.id,
      isWaliKelas: true,
      isGuruMapel: true,
    },
  });

  const teacher2 = await prisma.user.create({
    data: {
      fullName: 'Ani Wijaya, S.Pd.',
      email: 'ani.wijaya@sman1jkt.sch.id',
      phone: '081398765432',
      username: 'guruani',
      passwordHash: passwordHash,
      role: Role.TEACHER,
      status: AccountStatus.ACTIVE,
      schoolId: school1.id,
      isWaliKelas: true,
      isGuruMapel: true,
    },
  });

  await prisma.user.create({
    data: {
      fullName: 'Drs. H. Mulyono, M.Pd.',
      email: 'mulyono@sman1jkt.sch.id',
      phone: '081122334455',
      username: 'kepsekjaya',
      passwordHash: passwordHash,
      role: Role.TEACHER,
      status: AccountStatus.ACTIVE,
      schoolId: school1.id,
      isKepalaSekolah: true,
    },
  });

  // School 2 Teachers
  const teacherSchool2 = await prisma.user.create({
    data: {
      fullName: 'Rudi Hartono, S.Pd.',
      email: 'rudi.hartono@sman2jkt.sch.id',
      phone: '081266554433',
      username: 'gururudi',
      passwordHash: passwordHash,
      role: Role.TEACHER,
      status: AccountStatus.ACTIVE,
      schoolId: school2.id,
      isWaliKelas: true,
      isGuruMapel: true,
    },
  });

  // Pending teacher for School 1
  const pendingTeacher = await prisma.user.create({
    data: {
      fullName: 'Dewi Lestari, S.Pd.',
      email: 'dewi.lestari@sman1jkt.sch.id',
      phone: '081255667788',
      username: 'gurutestpending',
      passwordHash: passwordHash,
      role: Role.TEACHER,
      status: AccountStatus.PENDING,
      schoolId: school1.id,
    },
  });

  await prisma.verificationDocument.create({
    data: {
      userId: pendingTeacher.id,
      type: 'KTP',
      fileUrl: '/uploads/ktp_dummy_dewi.jpg',
    },
  });
  await prisma.verificationDocument.create({
    data: {
      userId: pendingTeacher.id,
      type: 'SURAT_TUGAS',
      fileUrl: '/uploads/surat_tugas_dummy_dewi.pdf',
    },
  });

  console.log('Created Teachers: Budi, Ani, Mulyono(Kepsek), Rudi (School 2), Dewi (Pending)');

  // ==================== 5. CREATE SUBJECTS ====================
  // School 1 Subjects
  const mtkS1 = await prisma.subject.create({
    data: { schoolId: school1.id, name: 'Matematika', code: 'MTK' },
  });
  const ingS1 = await prisma.subject.create({
    data: { schoolId: school1.id, name: 'Bahasa Inggris', code: 'ING' },
  });
  await prisma.subject.create({
    data: { schoolId: school1.id, name: 'Bahasa Indonesia', code: 'IND' },
  });
  const fisS1 = await prisma.subject.create({
    data: { schoolId: school1.id, name: 'Fisika', code: 'FIS' },
  });

  // School 2 Subjects
  const mtkS2 = await prisma.subject.create({
    data: { schoolId: school2.id, name: 'Matematika', code: 'MTK' },
  });

  console.log('Created Academic Subjects');

  // ==================== 6. CREATE CLASSES ====================
  // School 1 Classes
  const class10A = await prisma.class.create({
    data: {
      schoolId: school1.id,
      name: 'Kelas 10-A',
      grade: '10',
      capacity: 36,
      waliKelasId: teacher1.id,
    },
  });

  const class10B = await prisma.class.create({
    data: {
      schoolId: school1.id,
      name: 'Kelas 10-B',
      grade: '10',
      capacity: 36,
      waliKelasId: teacher2.id,
    },
  });

  // School 2 Classes
  const class20A = await prisma.class.create({
    data: {
      schoolId: school2.id,
      name: 'Kelas 10-A',
      grade: '10',
      capacity: 36,
      waliKelasId: teacherSchool2.id,
    },
  });

  console.log('Created Class Units');

  // ==================== 7. LINK TEACHER SUBJECT CLASSES ====================
  // Link Budi (teacher1) to Math & Physics in Class 10-A
  await prisma.teacherSubjectClass.create({
    data: {
      teacherId: teacher1.id,
      subjectId: mtkS1.id,
      classId: class10A.id,
      academicYear: '2025/2026',
      semester: 'Ganjil',
    },
  });
  await prisma.teacherSubjectClass.create({
    data: {
      teacherId: teacher1.id,
      subjectId: fisS1.id,
      classId: class10A.id,
      academicYear: '2025/2026',
      semester: 'Ganjil',
    },
  });

  // Link Ani (teacher2) to English in Class 10-B
  await prisma.teacherSubjectClass.create({
    data: {
      teacherId: teacher2.id,
      subjectId: ingS1.id,
      classId: class10B.id,
      academicYear: '2025/2026',
      semester: 'Ganjil',
    },
  });

  // Link Rudi to Math in School 2 Class 10-A
  await prisma.teacherSubjectClass.create({
    data: {
      teacherId: teacherSchool2.id,
      subjectId: mtkS2.id,
      classId: class20A.id,
      academicYear: '2025/2026',
      semester: 'Ganjil',
    },
  });

  console.log('Linked teachers to subjects and classes');

  // ==================== 8. CREATE STUDENTS ====================
  // Class 10-A School 1 Students (30 Students)
  const dbStudents10A = [];
  const firstNamesL = ['Ahmad', 'Budi', 'Chandra', 'Dedi', 'Eko', 'Fajar', 'Guntur', 'Hadi', 'Irfan', 'Joko', 'Kurnia', 'Lukman', 'Mulyono', 'Naufal', 'Oki'];
  const firstNamesP = ['Annisa', 'Citra', 'Dewi', 'Eka', 'Gita', 'Indah', 'Kartika', 'Lestari', 'Megawati', 'Nabila', 'Putri', 'Rini', 'Siti', 'Tari', 'Wulandari'];
  
  for (let i = 1; i <= 30; i++) {
    const isMale = i % 2 !== 0;
    const list = isMale ? firstNamesL : firstNamesP;
    const nameIdx = Math.floor((i - 1) / 2) % list.length;
    const fullName = `${list[nameIdx]} Pratama ${String.fromCharCode(65 + (i % 26))}`;
    const student = await prisma.student.create({
      data: {
        schoolId: school1.id,
        classId: class10A.id,
        nis: `100${i < 10 ? '0' + i : i}`,
        nisn: `00800010${i < 10 ? '0' + i : i}`,
        fullName,
        gender: isMale ? 'L' : 'P',
        birthPlace: 'Jakarta',
        birthDate: new Date('2010-06-20'),
        religion: 'Islam',
        address: `Jl. Merdeka Raya No. ${i}`,
        parentName: `Bapak ${list[nameIdx]}`,
        parentPhone: `0812000010${i < 10 ? '0' + i : i}`,
        status: StudentStatus.ACTIVE,
      },
    });
    dbStudents10A.push(student);
  }

  // Class 10-B School 1 Students (30 Students)
  const dbStudents10B = [];
  for (let i = 1; i <= 30; i++) {
    const isMale = i % 2 !== 0;
    const list = isMale ? firstNamesL : firstNamesP;
    const nameIdx = Math.floor((i - 1) / 2) % list.length;
    const fullName = `${list[nameIdx]} Wijaya ${String.fromCharCode(65 + (i % 26))}`;
    const student = await prisma.student.create({
      data: {
        schoolId: school1.id,
        classId: class10B.id,
        nis: `200${i < 10 ? '0' + i : i}`,
        nisn: `00800020${i < 10 ? '0' + i : i}`,
        fullName,
        gender: isMale ? 'L' : 'P',
        birthPlace: 'Bandung',
        birthDate: new Date('2010-08-11'),
        religion: 'Islam',
        address: `Jl. Keadilan Jaya No. ${i}`,
        parentName: `Ibu ${list[nameIdx]}`,
        parentPhone: `0813999920${i < 10 ? '0' + i : i}`,
        status: StudentStatus.ACTIVE,
      },
    });
    dbStudents10B.push(student);
  }

  // School 2 Students (5 Students)
  for (let i = 1; i <= 5; i++) {
    await prisma.student.create({
      data: {
        schoolId: school2.id,
        classId: class20A.id,
        nis: `3000${i}`,
        nisn: `008000300${i}`,
        fullName: `Siswa S2 ${String.fromCharCode(65 + i)}`,
        gender: i % 2 === 0 ? 'P' : 'L',
        birthPlace: 'Surabaya',
        birthDate: new Date('2010-09-05'),
        religion: 'Islam',
        address: `Jl. Pemuda No. ${i}`,
        parentName: `Orang Tua S2`,
        parentPhone: `08571111300${i}`,
        status: StudentStatus.ACTIVE,
      },
    });
  }

  console.log('Created dynamic Students in all classrooms (30 in 10-A, 30 in 10-B, 5 in School 2).');

  // ==================== 9. CREATE ATTENDANCE RECORDS (School 1) ====================
  // Generate last 60 weekdays of school attendance
  const attendanceDates: Date[] = [];
  for (let i = 0; i < 90 && attendanceDates.length < 60; i++) {
    const day = new Date();
    day.setDate(day.getDate() - i - 1); // Start from yesterday
    const dayOfWeek = day.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) and not Saturday (6)
      day.setHours(8, 0, 0, 0);
      attendanceDates.push(day);
    }
  }

  const indonesianDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  for (let dIdx = 0; dIdx < attendanceDates.length; dIdx++) {
    const attendanceDate = attendanceDates[dIdx];
    const dayName = indonesianDays[attendanceDate.getDay()];

    // 1. Create MTK Attendance for Class 10-A (Teacher 1)
    const att10A = await prisma.attendance.create({
      data: {
        schoolId: school1.id,
        classId: class10A.id,
        subjectId: mtkS1.id,
        teacherId: teacher1.id,
        academicYear: '2025/2026',
        semester: 'Ganjil',
        date: attendanceDate,
        periodTime: '1-2',
        dayOfWeek: dayName,
      },
    });

    for (let sIdx = 0; sIdx < dbStudents10A.length; sIdx++) {
      const student = dbStudents10A[sIdx];
      let status: AttendanceStatus = 'HADIR';
      let note = '';
      
      const rand = (sIdx + dIdx) % 25;
      if (rand === 3) {
        status = 'SAKIT';
        note = 'Sakit flu';
      } else if (rand === 7) {
        status = 'IZIN';
        note = 'Acara keluarga';
      } else if (rand === 11) {
        status = 'ALPHA';
        note = 'Tanpa keterangan';
      } else if (rand === 17) {
        status = 'TERLAMBAT';
        note = 'Kesiangan';
      }

      await prisma.attendanceDetail.create({
        data: {
          attendanceId: att10A.id,
          studentId: student.id,
          status,
          note: status !== 'HADIR' ? note : null,
        },
      });
    }

    // 2. Create English Attendance for Class 10-B (Teacher 2)
    const att10B = await prisma.attendance.create({
      data: {
        schoolId: school1.id,
        classId: class10B.id,
        subjectId: ingS1.id,
        teacherId: teacher2.id,
        academicYear: '2025/2026',
        semester: 'Ganjil',
        date: attendanceDate,
        periodTime: '3-4',
        dayOfWeek: dayName,
      },
    });

    for (let sIdx = 0; sIdx < dbStudents10B.length; sIdx++) {
      const student = dbStudents10B[sIdx];
      let status: AttendanceStatus = 'HADIR';
      let note = '';
      
      const rand = (sIdx + dIdx + 5) % 25;
      if (rand === 3) {
        status = 'SAKIT';
        note = 'Demam';
      } else if (rand === 7) {
        status = 'IZIN';
        note = 'Pindah rumah';
      } else if (rand === 11) {
        status = 'ALPHA';
        note = 'Alpa';
      } else if (rand === 17) {
        status = 'TERLAMBAT';
        note = 'Macet jalan raya';
      }

      await prisma.attendanceDetail.create({
        data: {
          attendanceId: att10B.id,
          studentId: student.id,
          status,
          note: status !== 'HADIR' ? note : null,
        },
      });
    }
  }

  console.log('Seeded 60 days of attendance logs for Class 10-A and Class 10-B (~3600 detail entries total)');

  // ==================== 10. CREATE AUDIT TRAILS / ACTIVITY LOGS ====================
  const auditLogs = [
    {
      userId: superAdmin.id,
      schoolId: null,
      username: superAdmin.username,
      role: 'SUPER_ADMIN',
      action: 'Register School: SMA Negeri 1 Jakarta',
      ipAddress: '127.0.0.1',
      deviceType: 'Desktop - Chrome on macOS',
      afterData: { schoolId: school1.id, schoolName: school1.name },
    },
    {
      userId: superAdmin.id,
      schoolId: null,
      username: superAdmin.username,
      role: 'SUPER_ADMIN',
      action: 'Register School: SMA Negeri 2 Jakarta',
      ipAddress: '127.0.0.1',
      deviceType: 'Desktop - Chrome on macOS',
      afterData: { schoolId: school2.id, schoolName: school2.name },
    },
    {
      userId: admin1.id,
      schoolId: school1.id,
      username: admin1.username,
      role: 'SCHOOL_ADMIN',
      action: 'Approve Teacher: Budi Santoso, S.Pd.',
      ipAddress: '192.168.1.100',
      deviceType: 'Desktop - Firefox on Windows',
      beforeData: { status: 'PENDING' },
      afterData: { status: 'ACTIVE' },
    },
    {
      userId: admin1.id,
      schoolId: school1.id,
      username: admin1.username,
      role: 'SCHOOL_ADMIN',
      action: 'Add Class Unit: Kelas 10-A',
      ipAddress: '192.168.1.100',
      deviceType: 'Desktop - Firefox on Windows',
      afterData: { classId: class10A.id, className: class10A.name },
    },
    {
      userId: teacher1.id,
      schoolId: school1.id,
      username: teacher1.username,
      role: 'TEACHER',
      action: 'Submit Attendance Sheet: Kelas 10-A (Matematika)',
      ipAddress: '192.168.1.150',
      deviceType: 'Mobile - Safari on iOS (iPhone)',
      afterData: { classId: class10A.id, subjectId: mtkS1.id },
    },
  ];

  for (const log of auditLogs) {
    await prisma.activityLog.create({
      data: {
        userId: log.userId,
        schoolId: log.schoolId,
        username: log.username,
        role: log.role as any,
        action: log.action,
        ipAddress: log.ipAddress,
        deviceType: log.deviceType,
        beforeData: log.beforeData ?? undefined,
        afterData: log.afterData ?? undefined,
      },
    });
  }

  console.log('Seeded Activity log entries');

  // ==================== 11. CREATE BACKUP RECORDS ====================
  await prisma.backup.create({
    data: {
      schoolId: school1.id,
      type: BackupType.AUTO,
      filePath: 'backup_auto_school1_initial.json',
      description: 'Pencadangan otomatis awal sistem oleh Super Admin',
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
