import { NextRequest } from 'next/server';

/**
 * Get client IP address from request
 * Handles various proxy headers (x-forwarded-for, x-real-ip, etc.)
 */
export function getClientIP(request: NextRequest): string {
  // Try various headers in order of preference
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    return ips[0] || 'unknown';
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to connection remote address (if available)
  const remoteAddress = (request as any).socket?.remoteAddress;
  if (remoteAddress) {
    return remoteAddress;
  }

  return 'unknown';
}

/**
 * Parse user agent to extract device, browser, and OS info
 */
export function parseUserAgent(userAgent: string | null): {
  device: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  browser: string;
  os: string;
} {
  if (!userAgent) {
    return {
      device: 'unknown',
      browser: 'unknown',
      os: 'unknown',
    };
  }

  const ua = userAgent.toLowerCase();

  // Detect device
  let device: 'mobile' | 'desktop' | 'tablet' | 'unknown' = 'unknown';
  if (ua.match(/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i)) {
    device = 'mobile';
  } else if (ua.match(/tablet|ipad|playbook|silk/i)) {
    device = 'tablet';
  } else {
    device = 'desktop';
  }

  // Detect browser
  let browser = 'unknown';
  if (ua.includes('chrome') && !ua.includes('edg')) {
    browser = 'Chrome';
  } else if (ua.includes('firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
  } else if (ua.includes('edg')) {
    browser = 'Edge';
  } else if (ua.includes('opera') || ua.includes('opr')) {
    browser = 'Opera';
  }

  // Detect OS
  let os = 'unknown';
  if (ua.includes('windows')) {
    os = 'Windows';
  } else if (ua.includes('mac os')) {
    os = 'macOS';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  } else if (ua.includes('android')) {
    os = 'Android';
  } else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS';
  }

  return { device, browser, os };
}

/**
 * Generate a simple session ID
 */
export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}
