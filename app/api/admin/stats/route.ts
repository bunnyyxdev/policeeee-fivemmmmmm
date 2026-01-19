import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyTokenServer } from '@/lib/auth';

// Mark route as dynamic since it uses request.headers
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    // Clean the token - handle both "Bearer token" and just "token" formats
    let token = authHeader?.trim() || '';
    if (token.toLowerCase().startsWith('bearer ')) {
      token = token.substring(7).trim();
    }

    console.log('Admin stats request - Token present:', !!token);
    console.log('Token length:', token?.length);
    console.log('Token preview:', token?.substring(0, 30) + '...');

    if (!token) {
      console.log('Admin stats: No token provided');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate token format before verification
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.log('Admin stats: Invalid token format - expected 3 parts, got:', tokenParts.length);
      return NextResponse.json({ error: 'Invalid token format' }, { status: 401 });
    }

    const decoded = verifyTokenServer(token);
    console.log('Admin stats - Token decoded:', { decoded, hasDecoded: !!decoded, role: decoded?.role });

    if (!decoded) {
      console.log('Admin stats: Token verification failed');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (decoded.role !== 'admin') {
      console.log('Admin stats: User is not admin, role:', decoded.role);
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    await connectDB();

    const totalUsers = await (User as any).countDocuments();
    const officers = await (User as any).countDocuments({ role: 'officer' });
    const admins = await (User as any).countDocuments({ role: 'admin' });

    return NextResponse.json({
      totalUsers,
      officers,
      admins,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
