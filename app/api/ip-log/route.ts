import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import IPLog from '@/models/IPLog';
import User from '@/models/User';
import { getClientIP, parseUserAgent, generateSessionId } from '@/lib/ip-utils';
import { verifyTokenServer } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ip-log
 * Log IP address and connection information to database only
 * No GET endpoint - logs are stored in database for internal use only
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Get IP address
    const ipAddress = getClientIP(request);
    
    // Get user agent and parse it
    const userAgent = request.headers.get('user-agent') || '';
    const { device, browser, os } = parseUserAgent(userAgent);

    // Get path from request
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const referer = request.headers.get('referer') || undefined;

    // Try to get user info from token (optional - can log as anonymous)
    let userId: string | undefined;
    let username: string | undefined;
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (token) {
      try {
        // Import here to avoid circular dependency issues
        const { verifyTokenServer } = await import('@/lib/auth');
        const User = (await import('@/models/User')).default;
        
        const decoded = verifyTokenServer(token);
        if (decoded) {
          userId = decoded.userId;
          // Get username from database
          const user = await (User as any).findById(decoded.userId).select('username');
          if (user) {
            username = user.username;
          }
        }
      } catch (error) {
        // Token invalid or expired, continue as anonymous
        // Silently continue - don't log errors for anonymous users
      }
    }

    // Generate or get session ID from cookie
    let sessionId = request.cookies.get('session_id')?.value;
    if (!sessionId) {
      sessionId = generateSessionId();
    }

    // Create IP log entry
    const ipLog = new IPLog({
      userId: userId || undefined,
      username: username || undefined,
      ipAddress,
      userAgent,
      path,
      method,
      referer,
      device,
      browser,
      os,
      sessionId,
      isActive: true,
      lastActivity: new Date(),
    });

    await ipLog.save();

    // Set session cookie (expires in 24 hours)
    const response = NextResponse.json({
      success: true,
      message: 'IP logged successfully',
      data: {
        ipAddress,
        sessionId,
      },
    });

    response.cookies.set('session_id', sessionId, {
      maxAge: 24 * 60 * 60, // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    console.error('IP log error:', error);
    return NextResponse.json(
      { error: 'Failed to log IP address', details: error.message },
      { status: 500 }
    );
  }
}

