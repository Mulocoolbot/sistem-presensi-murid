import { db } from '@/lib/db';
import { setSessionCookie } from '@/lib/jwt';
import { logActivity } from '@/lib/activityLogger';
import { isRateLimited } from '@/lib/rateLimiter';
import { AccountStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const loginSchema = z.object({
  username: z.string().min(3, { message: 'Username minimal 3 karakter' }).max(50),
  password: z.string().min(6, { message: 'Password minimal 6 karakter' }),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimit = isRateLimited(ip, 5, 60 * 1000); // 5 attempts per minute

    if (!rateLimit.allowed) {
      return NextResponse.json({
        error: `Terlalu banyak percobaan masuk. Silakan coba lagi dalam ${rateLimit.resetInSeconds} detik.`
      }, { status: 429 });
    }

    const body = await request.json();
    const parseResult = loginSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { username, password } = parseResult.data;

    // Find User
    const user = await db.user.findUnique({
      where: { username },
      include: { school: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Check Password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Check Account Status
    if (user.status === AccountStatus.PENDING) {
      return NextResponse.json({
        error: 'Akun Anda sedang menunggu verifikasi oleh pihak berwenang.'
      }, { status: 403 });
    }

    if (user.status === AccountStatus.INACTIVE) {
      return NextResponse.json({
        error: 'Akun Anda telah dinonaktifkan. Silakan hubungi admin sekolah.'
      }, { status: 403 });
    }

    // Setup session payload
    const sessionPayload = {
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      role: user.role,
      schoolId: user.schoolId,
      isKepalaSekolah: user.isKepalaSekolah,
      isWaliKelas: user.isWaliKelas,
      isGuruMapel: user.isGuruMapel,
    };

    // Set session cookie
    await setSessionCookie(sessionPayload);

    // Log Activity
    await logActivity({
      userId: user.id,
      schoolId: user.schoolId,
      username: user.username,
      role: user.role,
      action: 'User Login',
      request,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        schoolName: user.school?.name || null,
        subRoles: {
          isKepalaSekolah: user.isKepalaSekolah,
          isWaliKelas: user.isWaliKelas,
          isGuruMapel: user.isGuruMapel,
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + (error as Error).message }, { status: 500 });
  }
}
