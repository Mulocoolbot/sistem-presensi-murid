import { db } from './db';
import { NextRequest } from 'next/server';

interface LogParams {
  userId: string | null;
  schoolId: string | null;
  username: string;
  role: string;
  action: string;
  request?: NextRequest | null;
  beforeData?: unknown;
  afterData?: unknown;
}

export function parseUserAgent(userAgent: string | null): string {
  if (!userAgent) return 'Unknown Device';
  
  const ua = userAgent.toLowerCase();
  
  // Detect OS/Device type
  let os = 'Unknown OS';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  else if (ua.includes('linux')) os = 'Linux';

  // Detect form factor
  let device = 'Desktop';
  if (ua.includes('mobi') || ua.includes('android') || ua.includes('iphone')) {
    device = 'Mobile';
  } else if (ua.includes('ipad') || ua.includes('tablet')) {
    device = 'Tablet';
  }

  return `${device} (${os})`;
}

export async function logActivity({
  userId,
  schoolId,
  username,
  role,
  action,
  request,
  beforeData,
  afterData,
}: LogParams) {
  try {
    let ipAddress = '127.0.0.1';
    let deviceType = 'Unknown Device';

    if (request) {
      // Get IP Address
      const forwardedFor = request.headers.get('x-forwarded-for');
      if (forwardedFor) {
        ipAddress = forwardedFor.split(',')[0].trim();
      } else {
        ipAddress = request.headers.get('x-real-ip') || '127.0.0.1';
      }

      // Get User Agent
      const userAgent = request.headers.get('user-agent');
      deviceType = parseUserAgent(userAgent);
    }

    // Save to Database
    const log = await db.activityLog.create({
      data: {
        userId,
        schoolId,
        username,
        role,
        action,
        ipAddress,
        deviceType,
        beforeData: beforeData ? JSON.parse(JSON.stringify(beforeData)) : undefined,
        afterData: afterData ? JSON.parse(JSON.stringify(afterData)) : undefined,
      },
    });

    return log;
  } catch (error) {
    console.error('Failed to write activity log:', error);
    return null;
  }
}
