import { db } from './db';
import fs from 'fs';
import path from 'path';
import { BackupType } from '@prisma/client';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Helper to ensure backups directory exists
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

/**
 * Creates a physical JSON backup file and records it in the database
 */
export async function createBackup(
  schoolId: string | null,
  type: BackupType,
  description: string,
  data: unknown
): Promise<import('@prisma/client').Backup> {
  try {
    ensureBackupDir();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const prefix = type === BackupType.AUTO ? 'auto' : 'manual';
    const schoolLabel = schoolId ? `school_${schoolId}` : 'global';
    const filename = `${prefix}_${schoolLabel}_${timestamp}.json`;
    const filePath = path.join(BACKUP_DIR, filename);

    // Save physical file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

    // Create DB entry
    const backup = await db.backup.create({
      data: {
        schoolId,
        type,
        filePath: filename, // Save relative path/filename
        description,
      },
    });

    return backup;
  } catch (error) {
    console.error('Failed to create backup:', error);
    throw new Error('Backup creation failed: ' + (error as Error).message);
  }
}

/**
 * Automated backup of a Student before soft/hard deletion
 */
export async function backupStudentBeforeDelete(studentId: string): Promise<import('@prisma/client').Backup> {
  const student = await db.student.findUnique({
    where: { id: studentId },
    include: {
      attendanceDetails: true,
    },
  });

  if (!student) {
    throw new Error('Student not found for backup');
  }

  const description = `Automated backup before deleting student: ${student.fullName} (NIS: ${student.nis}, NISN: ${student.nisn})`;
  
  const backupData = {
    entity: 'Student',
    deletedAt: new Date().toISOString(),
    student,
  };

  return createBackup(student.schoolId, BackupType.AUTO, description, backupData);
}

/**
 * Automated backup of a Class before deletion
 */
export async function backupClassBeforeDelete(classId: string): Promise<import('@prisma/client').Backup> {
  const classObj = await db.class.findUnique({
    where: { id: classId },
    include: {
      students: true,
      teacherSubjectClasses: true,
    },
  });

  if (!classObj) {
    throw new Error('Class not found for backup');
  }

  const description = `Automated backup before deleting class: ${classObj.name} (Grade: ${classObj.grade})`;

  const backupData = {
    entity: 'Class',
    deletedAt: new Date().toISOString(),
    class: classObj,
  };

  return createBackup(classObj.schoolId, BackupType.AUTO, description, backupData);
}

/**
 * Automated backup of a Teacher before deletion
 */
export async function backupTeacherBeforeDelete(teacherId: string): Promise<import('@prisma/client').Backup> {
  const teacher = await db.user.findUnique({
    where: { id: teacherId },
    include: {
      documents: true,
      teacherSubjectClasses: true,
    },
  });

  if (!teacher) {
    throw new Error('Teacher not found for backup');
  }

  const description = `Automated backup before deleting teacher: ${teacher.fullName} (Username: ${teacher.username})`;

  const backupData = {
    entity: 'Teacher',
    deletedAt: new Date().toISOString(),
    teacher,
  };

  return createBackup(teacher.schoolId, BackupType.AUTO, description, backupData);
}

/**
 * Creates a full School manual backup (backup all configuration data)
 */
export async function backupSchoolManual(schoolId: string): Promise<import('@prisma/client').Backup> {
  const school = await db.school.findUnique({
    where: { id: schoolId },
  });

  if (!school) {
    throw new Error('School not found for manual backup');
  }

  // Gather all school data
  const users = await db.user.findMany({ where: { schoolId }, include: { documents: true } });
  const classes = await db.class.findMany({ where: { schoolId } });
  const students = await db.student.findMany({ where: { schoolId } });
  const subjects = await db.subject.findMany({ where: { schoolId } });
  const attendances = await db.attendance.findMany({
    where: { schoolId },
    include: { details: true },
  });

  const fullData = {
    school,
    users,
    classes,
    students,
    subjects,
    attendances,
    backedUpAt: new Date().toISOString(),
  };

  const description = `Manual school backup for ${school.name}`;
  return createBackup(schoolId, BackupType.MANUAL, description, fullData);
}

/**
 * Restores data from a backup record
 */
export async function restoreBackup(backupId: string): Promise<boolean> {
  const backup = await db.backup.findUnique({
    where: { id: backupId },
  });

  if (!backup) {
    throw new Error('Backup record not found');
  }

  const filePath = path.join(BACKUP_DIR, backup.filePath);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Backup file does not exist on disk: ${backup.filePath}`);
  }

  try {
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(rawData);

    // If it's a student backup, restore the student
    if (data.entity === 'Student') {
      const { student } = data;
      // Remove relationships to prevent issues with foreign keys
      const { attendanceDetails: _attendanceDetails, ...studentFields } = student;
      
      // Upsert student
      await db.student.upsert({
        where: { id: studentFields.id },
        update: { ...studentFields, isDeleted: false },
        create: { ...studentFields, isDeleted: false },
      });
      return true;
    }

    // If it's a class backup, restore class and its students
    if (data.entity === 'Class') {
      const { class: classObj } = data;
      const { students, teacherSubjectClasses: _teacherSubjectClasses, ...classFields } = classObj;

      await db.class.upsert({
        where: { id: classFields.id },
        update: classFields,
        create: classFields,
      });

      // Restore class members if possible
      for (const student of students) {
        await db.student.upsert({
          where: { id: student.id },
          update: { ...student, isDeleted: false },
          create: { ...student, isDeleted: false },
        });
      }
      return true;
    }

    // If it's a teacher backup
    if (data.entity === 'Teacher') {
      const { teacher } = data;
      const { documents: _documents, teacherSubjectClasses: _teacherSubjectClasses, ...teacherFields } = teacher;

      await db.user.upsert({
        where: { id: teacherFields.id },
        update: teacherFields,
        create: teacherFields,
      });
      return true;
    }

    // If it's a manual full backup, restore all tables
    if (data.school) {
      const { school, users, classes, students, subjects, attendances } = data;

      // 1. Restore School
      await db.school.upsert({
        where: { id: school.id },
        update: school,
        create: school,
      });

      // 2. Restore Users
      for (const user of users) {
        const { documents: _documents, ...userFields } = user;
        await db.user.upsert({
          where: { id: user.id },
          update: userFields,
          create: userFields,
        });
      }

      // 3. Restore Subjects
      for (const sub of subjects) {
        await db.subject.upsert({
          where: { id: sub.id },
          update: sub,
          create: sub,
        });
      }

      // 4. Restore Classes
      for (const cls of classes) {
        await db.class.upsert({
          where: { id: cls.id },
          update: cls,
          create: cls,
        });
      }

      // 5. Restore Students
      for (const stud of students) {
        await db.student.upsert({
          where: { id: stud.id },
          update: stud,
          create: stud,
        });
      }

      // 6. Restore Attendances
      for (const att of attendances) {
        const { details, ...attFields } = att;
        // Parse date
        attFields.date = new Date(attFields.date);
        
        await db.attendance.upsert({
          where: { id: att.id },
          update: attFields,
          create: attFields,
        });

        for (const det of details) {
          await db.attendanceDetail.upsert({
            where: { id: det.id },
            update: det,
            create: det,
          });
        }
      }
      return true;
    }

    throw new Error('Unknown backup file schema');
  } catch (error) {
    console.error('Failed to restore backup:', error);
    throw new Error('Restore failed: ' + (error as Error).message);
  }
}
