import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Check if new password is too similar to old password
 * Returns true if passwords are too similar (should be rejected)
 */
export function isPasswordTooSimilar(newPassword: string, oldPassword: string): boolean {
  // Exact match
  if (newPassword === oldPassword) {
    return true;
  }

  // Case-insensitive comparison
  if (newPassword.toLowerCase() === oldPassword.toLowerCase()) {
    return true;
  }

  // Check similarity using Levenshtein distance
  const similarity = calculateSimilarity(newPassword, oldPassword);
  if (similarity > 0.7) { // More than 70% similar
    return true;
  }

  // Check if new password is just old password with minor changes
  const minLength = Math.min(newPassword.length, oldPassword.length);
  const maxLength = Math.max(newPassword.length, oldPassword.length);
  
  // If length difference is small (1-2 chars) and similarity is high
  if (maxLength - minLength <= 2 && similarity > 0.6) {
    return true;
  }

  // Check if new password contains old password or vice versa
  if (newPassword.includes(oldPassword) || oldPassword.includes(newPassword)) {
    return true;
  }

  return false;
}

/**
 * Calculate similarity between two strings (0-1, where 1 is identical)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) {
    return 1.0;
  }

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

export function generateToken(userId: string, role: string): string {
  if (!userId || !role) {
    throw new Error('generateToken: userId and role are required');
  }

  if (!JWT_SECRET || JWT_SECRET === 'fallback-secret-key') {
    console.warn('Warning: Using fallback JWT_SECRET. Please set JWT_SECRET in .env file.');
  }

  const token = jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
  
  // Validate the generated token
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3) {
    throw new Error('generateToken: Generated token is invalid');
  }

  console.log('Token generated successfully. Length:', token.length, 'Parts:', tokenParts.length);
  
  return token;
}

// Client-side token decoding (no verification - verification happens on server)
export function verifyToken(token: string): { userId: string; role: string } | null {
  try {
    if (!token) {
      console.log('verifyToken: No token provided');
      return null;
    }

    // Clean the token - remove any whitespace and "Bearer " prefix if present
    const cleanedToken = token.trim().replace(/^Bearer\s+/i, '');
    
    // Validate token format (JWT should have 3 parts separated by dots)
    if (!cleanedToken || cleanedToken.split('.').length !== 3) {
      console.log('verifyToken: Invalid token format - should have 3 parts separated by dots');
      console.log('Token length:', cleanedToken?.length, 'Token preview:', cleanedToken?.substring(0, 20));
      return null;
    }

    // Decode token without verification (for client-side use)
    // Full verification happens on the server
    let decoded: any;
    try {
      // Use decode instead of verify for client-side (no secret needed)
      decoded = jwt.decode(cleanedToken, { complete: false });
    } catch (jwtError: any) {
      console.log('verifyToken: JWT decode error:', jwtError.message || jwtError);
      return null;
    }
    
    // Type check and validate structure
    if (!decoded || typeof decoded !== 'object') {
      console.log('verifyToken: Decoded token is not an object', typeof decoded);
      return null;
    }

    const typedDecoded = decoded as { userId?: string; role?: string; exp?: number };
    
    // Check if token is expired (basic check)
    if (typedDecoded.exp && typedDecoded.exp < Date.now() / 1000) {
      console.log('verifyToken: Token has expired');
      return null;
    }
    
    if (!typedDecoded.userId || !typedDecoded.role) {
      console.log('verifyToken: Invalid token structure - missing userId or role', typedDecoded);
      return null;
    }

    return {
      userId: String(typedDecoded.userId),
      role: String(typedDecoded.role),
    };
  } catch (error: any) {
    console.log('verifyToken error:', error.message || error);
    console.log('Error type:', error?.name || typeof error);
    console.log('Token preview:', token?.substring(0, 50));
    return null;
  }
}

// Server-side token verification (with secret)
export function verifyTokenServer(token: string): { userId: string; role: string } | null {
  try {
    if (!token) {
      console.log('verifyTokenServer: No token provided');
      return null;
    }

    if (!JWT_SECRET || JWT_SECRET === 'fallback-secret-key') {
      console.error('verifyTokenServer: JWT_SECRET is not defined or using fallback');
      return null;
    }

    const cleanedToken = token.trim().replace(/^Bearer\s+/i, '');
    
    if (!cleanedToken || cleanedToken.split('.').length !== 3) {
      console.log('verifyTokenServer: Invalid token format - expected 3 parts');
      return null;
    }

    const decoded = jwt.verify(cleanedToken, JWT_SECRET) as { userId: string; role: string };
    
    if (!decoded || !decoded.userId || !decoded.role) {
      console.log('verifyTokenServer: Invalid token structure - missing userId or role', decoded);
      return null;
    }

    return {
      userId: String(decoded.userId),
      role: String(decoded.role),
    };
  } catch (error: any) {
    console.error('verifyTokenServer error:', error.name, error.message);
    if (error.name === 'JsonWebTokenError') {
      console.error('JWT verification failed - token may be invalid or JWT_SECRET mismatch');
    } else if (error.name === 'TokenExpiredError') {
      console.error('JWT token has expired');
    }
    return null;
  }
}
