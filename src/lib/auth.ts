import { getSession, UserSession } from './jwt';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

/**
 * Server Component Helper: Protects page layouts and throws redirects if not authorized
 */
export async function protectPage(allowedRoles: ('SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER')[]): Promise<UserSession> {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  if (!allowedRoles.includes(session.role)) {
    // Redirect to default dashboard based on their actual role
    if (session.role === 'SUPER_ADMIN') redirect('/super-admin');
    if (session.role === 'SCHOOL_ADMIN') redirect('/school-admin');
    if (session.role === 'TEACHER') redirect('/teacher');
    redirect('/login');
  }

  return session;
}

/**
 * API Route Helper: Protects API route handlers and returns the session or a NextResponse error
 */
export async function protectApi(
  allowedRoles: ('SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER')[]
): Promise<{ session: UserSession | null; errorResponse: NextResponse | null }> {
  const session = await getSession();

  if (!session) {
    return {
      session: null,
      errorResponse: NextResponse.json({ error: 'Unauthorized: No session found' }, { status: 401 }),
    };
  }

  if (!allowedRoles.includes(session.role)) {
    return {
      session: null,
      errorResponse: NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 }),
    };
  }

  return { session, errorResponse: null };
}

/**
 * Enforces school tenant isolation for database queries
 */
export function getTenantFilter(session: UserSession): { schoolId: string } {
  if (session.role === 'SUPER_ADMIN') {
    throw new Error('Tenant isolation filter cannot be applied to Super Admin');
  }
  
  if (!session.schoolId) {
    throw new Error('User does not have an associated school');
  }

  return { schoolId: session.schoolId };
}
