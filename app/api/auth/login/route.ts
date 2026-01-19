import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyPassword, generateToken } from '@/lib/auth';
import { logActivity } from '@/lib/activity-log';

// Mark route as dynamic since it uses MongoDB connection
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Parse request body first
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError: any) {
      console.error('Login error: Failed to parse request body', parseError);
      return NextResponse.json({ 
        error: 'Invalid request format' 
      }, { status: 400 });
    }

    const { username, password } = requestBody;

    // Connect to database after parsing (to avoid connection errors during request parsing)
    try {
      await connectDB();
    } catch (dbError: any) {
      console.error('Login error: Database connection failed', dbError);
      return NextResponse.json({ 
        error: 'ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้ กรุณาตรวจสอบการตั้งค่า MongoDB หรือติดต่อผู้ดูแลระบบ' 
      }, { status: 503 });
    }

    if (!username || !password) {
      return NextResponse.json({ error: 'กรุณากรอก username และ password' }, { status: 400 });
    }

    // Trim whitespace from username and password
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      return NextResponse.json({ error: 'กรุณากรอก username และ password' }, { status: 400 });
    }

    // Check for admin login - identify admin by username from .env
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'administrator';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'exampleadminpassword';

    console.log(`Login attempt - Username: "${trimmedUsername}", Admin username from .env: "${ADMIN_USERNAME}"`);

    // If username matches admin username from .env, handle admin login
    // Admin password is now verified against database (like regular users)
    if (trimmedUsername === ADMIN_USERNAME) {
      console.log('Admin username matched, checking database...');
      
      // Check if admin user exists in database
      let adminUser = await (User as any).findOne({ username: ADMIN_USERNAME });
      
      if (adminUser) {
        // Admin user exists - verify password against database
        console.log('Admin user found in database, verifying password...');
        
        // Ensure user has admin role
        if (adminUser.role !== 'admin') {
          console.log(`Updating user "${ADMIN_USERNAME}" to admin role...`);
          adminUser.role = 'admin';
          await adminUser.save();
        }
        
        // Check if password field exists
        if (!adminUser.password) {
          console.log(`Admin user has no password - setting from .env`);
          const { hashPassword } = await import('@/lib/auth');
          adminUser.password = await hashPassword(ADMIN_PASSWORD);
          await adminUser.save();
        }
        
        // Check if password is hashed
        const isHashed = adminUser.password.startsWith('$2a$') || 
                        adminUser.password.startsWith('$2b$') || 
                        adminUser.password.startsWith('$2y$');
        
        let isValidPassword = false;
        
        if (isHashed) {
          // Verify against hashed password in database
          console.log(`Verifying hashed password...`);
          isValidPassword = await verifyPassword(trimmedPassword, adminUser.password);
          console.log(`Password verification result:`, isValidPassword);
        } else {
          // Legacy plain text - compare directly
          console.log(`Comparing plain text password...`);
          isValidPassword = trimmedPassword === adminUser.password;
          console.log(`Password comparison result:`, isValidPassword);
          
          // If login succeeds with plain text, hash it
          if (isValidPassword) {
            const { hashPassword } = await import('@/lib/auth');
            adminUser.password = await hashPassword(trimmedPassword);
            await adminUser.save();
            console.log(`Updated admin password to hashed format.`);
          }
        }
        
        if (!isValidPassword) {
          // Fallback: If password doesn't match but entered password matches .env password, update it
          if (trimmedPassword === ADMIN_PASSWORD) {
            console.log(`Password doesn't match database but matches .env - updating database password...`);
            const { hashPassword } = await import('@/lib/auth');
            adminUser.password = await hashPassword(ADMIN_PASSWORD);
            await adminUser.save();
            console.log(`✅ Admin password updated in database`);
            isValidPassword = true;
          } else {
            console.log(`Admin login failed: Invalid password`);
            console.log(`Entered password length:`, trimmedPassword.length);
            console.log(`Stored password length:`, adminUser.password?.length);
            console.log(`Password is hashed:`, isHashed);
            return NextResponse.json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
          }
        }
        
        console.log(`✅ Admin login successful (password verified from database)`);
      } else {
        // Admin user doesn't exist - create it in database with .env password (for initial setup)
        console.log(`Admin user doesn't exist, creating with .env password...`);
        console.log(`Creating admin with username: "${ADMIN_USERNAME}"`);
        
        const { hashPassword } = await import('@/lib/auth');
        
        try {
          const hashedPassword = await hashPassword(ADMIN_PASSWORD);
          console.log(`Password hashed, creating user...`);
          
          adminUser = await (User as any).create({
            username: ADMIN_USERNAME,
            password: hashedPassword,
            name: 'Administrator',
            role: 'admin',
          });
          console.log(`✅ Admin user created successfully in database`);
          
          // Verify the password matches (should always work for initial creation)
          console.log(`Verifying password for newly created admin user...`);
          const isValidPassword = await verifyPassword(trimmedPassword, adminUser.password);
          
          console.log(`Password verification result:`, isValidPassword);
          console.log(`Entered password length:`, trimmedPassword.length);
          console.log(`Expected password from .env: "${ADMIN_PASSWORD}"`);
          
          if (!isValidPassword) {
            console.log(`Admin login failed: Password doesn't match after creation`);
            console.log(`This might happen if the entered password doesn't match .env password`);
            return NextResponse.json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
          }
          
          console.log(`✅ Password verified successfully for new admin user`);
        } catch (createError: any) {
          console.error('Error creating admin user:', createError);
          console.error('Error details:', {
            message: createError.message,
            code: createError.code,
            name: createError.name
          });
          return NextResponse.json({ 
            error: 'ไม่สามารถสร้างบัญชีผู้ดูแลระบบได้ กรุณาติดต่อผู้ดูแลระบบ' 
          }, { status: 500 });
        }
      }

      // Ensure _id is converted to string
      const userId = adminUser._id?.toString() || String(adminUser._id);
      console.log('Generating token for admin user:', { userId, role: 'admin' });
      
      let token: string;
      try {
        token = generateToken(userId, 'admin');
        console.log('Token generated successfully. Token length:', token?.length);
        
        if (!token || typeof token !== 'string') {
          throw new Error('Token generation returned invalid token');
        }
      } catch (tokenError: any) {
        console.error('Error generating token:', tokenError);
        return NextResponse.json({ 
          error: 'เกิดข้อผิดพลาดในการสร้างโทเค็น' 
        }, { status: 500 });
      }

      // Log activity
      try {
        const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';
        
        await logActivity({
          action: 'login',
          entityType: 'User',
          entityId: userId,
          entityName: adminUser.name || adminUser.username,
          performedBy: userId,
          performedByName: adminUser.name || adminUser.username,
          metadata: {
            username: adminUser.username,
            role: adminUser.role,
          },
          ipAddress: ipAddress,
          userAgent: userAgent,
        });
      } catch (error) {
        console.error('Failed to log activity:', error);
      }

      const responseData = {
        token,
        user: {
          _id: userId,
          username: adminUser.username,
          name: adminUser.name,
          email: adminUser.email,
          policeRank: adminUser.policeRank,
          profileImage: adminUser.profileImage,
          driverLicense: adminUser.driverLicense,
          role: adminUser.role,
          createdAt: adminUser.createdAt instanceof Date 
            ? adminUser.createdAt.toISOString() 
            : adminUser.createdAt || new Date().toISOString(),
        },
      };

      console.log('Returning login response with token length:', token.length);
      return NextResponse.json(responseData);
    }

    // Regular user login
    const user = await (User as any).findOne({ username: trimmedUsername });

    if (!user) {
      console.log(`Login failed: User not found - username: "${trimmedUsername}"`);
      return NextResponse.json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    // Check if password field exists and is valid
    if (!user.password) {
      console.log(`Login failed: User has no password - username: "${trimmedUsername}"`);
      return NextResponse.json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    // Check if password is hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
    const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$');
    
    let isValidPassword = false;
    
    if (isHashed) {
      // Normal password verification
      isValidPassword = await verifyPassword(trimmedPassword, user.password);
    } else {
      // Legacy plain text password (shouldn't happen, but handle it)
      console.warn(`Warning: User "${trimmedUsername}" has plain text password. Please update to hashed password.`);
      isValidPassword = trimmedPassword === user.password;
      
      // If login succeeds with plain text, hash it for future use
      if (isValidPassword) {
        const { hashPassword } = await import('@/lib/auth');
        user.password = await hashPassword(trimmedPassword);
        await user.save();
        console.log(`Updated user "${trimmedUsername}" password to hashed format.`);
      }
    }

    if (!isValidPassword) {
      console.log(`Login failed: Invalid password - username: "${trimmedUsername}"`);
      return NextResponse.json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    // Ensure _id is converted to string
    const userId = user._id?.toString() || String(user._id);
    console.log('Generating token for user:', { userId, role: user.role });
    
    let token: string;
    try {
      token = generateToken(userId, user.role);
      console.log('Token generated successfully. Token length:', token?.length);
      
      if (!token || typeof token !== 'string') {
        throw new Error('Token generation returned invalid token');
      }
    } catch (tokenError: any) {
      console.error('Error generating token:', tokenError);
      return NextResponse.json({ 
        error: 'เกิดข้อผิดพลาดในการสร้างโทเค็น' 
      }, { status: 500 });
    }

    // Log activity
    try {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      await logActivity({
        action: 'login',
        entityType: 'User',
        entityId: userId,
        entityName: user.name || user.username,
        performedBy: userId,
        performedByName: user.name || user.username,
        metadata: {
          username: user.username,
          role: user.role,
        },
        ipAddress: ipAddress,
        userAgent: userAgent,
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }

    const responseData = {
      token,
      user: {
        _id: userId,
        username: user.username,
        name: user.name,
        email: user.email,
        policeRank: user.policeRank,
        profileImage: user.profileImage,
        driverLicense: user.driverLicense,
        role: user.role,
        createdAt: user.createdAt instanceof Date 
          ? user.createdAt.toISOString() 
          : user.createdAt || new Date().toISOString(),
      },
    };

    console.log('Returning login response with token length:', token.length);
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Login error:', error);
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    
    // Provide more specific error messages
    if (error.name === 'MongooseServerSelectionError' || error.message?.includes('MongoDB')) {
      return NextResponse.json({ 
        error: 'ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้ กรุณาตรวจสอบการตั้งค่า MongoDB หรือติดต่อผู้ดูแลระบบ' 
      }, { status: 503 });
    }
    
    // Return error details in development, generic message in production
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `เกิดข้อผิดพลาดในการเข้าสู่ระบบ: ${error.message || 'Unknown error'}`
      : 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
