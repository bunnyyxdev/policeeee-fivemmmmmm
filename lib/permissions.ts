import connectDB from './mongodb';
import User from '@/models/User';
import Role from '@/models/Role';
import Permission from '@/models/Permission';

export interface UserPermissions {
  hasPermission: (code: string) => boolean;
  hasAnyPermission: (codes: string[]) => boolean;
  hasAllPermissions: (codes: string[]) => boolean;
  getPermissions: () => string[];
}

/**
 * Get all permissions for a user (from role + direct permissions)
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    await connectDB();
    
    const user = await (User as any).findById(userId)
      .populate('customRole')
      .populate('permissions', 'code')
      .lean();

    if (!user) {
      return [];
    }

    const permissionCodes: Set<string> = new Set();

    // Get permissions from custom role
    if (user.customRole) {
      const role = await (Role as any).findById(user.customRole._id)
        .populate('permissions', 'code')
        .lean();

      if (role?.permissions) {
        role.permissions.forEach((perm: any) => {
          permissionCodes.add(perm.code);
        });
      }
    }

    // Get direct permissions
    if (user.permissions) {
      user.permissions.forEach((perm: any) => {
        permissionCodes.add(perm.code);
      });
    }

    // Legacy role permissions (backward compatibility)
    if (user.role === 'admin') {
      // Admin has all permissions
      const allPermissions = await (Permission as any).find({}).select('code').lean();
      allPermissions.forEach((perm: any) => {
        permissionCodes.add(perm.code);
      });
    }

    return Array.from(permissionCodes);
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(userId: string, permissionCode: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions.includes(permissionCode.toLowerCase());
}

/**
 * Check if user has any of the specified permissions
 */
export async function hasAnyPermission(userId: string, permissionCodes: string[]): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  const lowerCodes = permissionCodes.map(code => code.toLowerCase());
  return lowerCodes.some(code => permissions.includes(code));
}

/**
 * Check if user has all of the specified permissions
 */
export async function hasAllPermissions(userId: string, permissionCodes: string[]): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  const lowerCodes = permissionCodes.map(code => code.toLowerCase());
  return lowerCodes.every(code => permissions.includes(code));
}

/**
 * Initialize default system permissions
 */
export async function initializeSystemPermissions() {
  try {
    await connectDB();

    const systemPermissions = [
      // User Management
      { name: 'สร้างผู้ใช้', code: 'users.create', category: 'users', isSystem: true },
      { name: 'ดูผู้ใช้', code: 'users.view', category: 'users', isSystem: true },
      { name: 'แก้ไขผู้ใช้', code: 'users.update', category: 'users', isSystem: true },
      { name: 'ลบผู้ใช้', code: 'users.delete', category: 'users', isSystem: true },

      // Leave Management
      { name: 'สร้างการลา', code: 'leaves.create', category: 'leaves', isSystem: true },
      { name: 'ดูการลา', code: 'leaves.view', category: 'leaves', isSystem: true },
      { name: 'แก้ไขการลา', code: 'leaves.update', category: 'leaves', isSystem: true },
      { name: 'อนุมัติการลา', code: 'leaves.approve', category: 'leaves', isSystem: true },
      { name: 'ปฏิเสธการลา', code: 'leaves.reject', category: 'leaves', isSystem: true },
      { name: 'ลบการลา', code: 'leaves.delete', category: 'leaves', isSystem: true },

      // Discipline Management
      { name: 'สร้างโทษวินัย', code: 'discipline.create', category: 'discipline', isSystem: true },
      { name: 'ดูโทษวินัย', code: 'discipline.view', category: 'discipline', isSystem: true },
      { name: 'แก้ไขโทษวินัย', code: 'discipline.update', category: 'discipline', isSystem: true },
      { name: 'ลบโทษวินัย', code: 'discipline.delete', category: 'discipline', isSystem: true },

      // Withdraw Items
      { name: 'สร้างการเบิกของ', code: 'withdraw.create', category: 'withdraw', isSystem: true },
      { name: 'ดูการเบิกของ', code: 'withdraw.view', category: 'withdraw', isSystem: true },
      { name: 'แก้ไขการเบิกของ', code: 'withdraw.update', category: 'withdraw', isSystem: true },
      { name: 'ลบการเบิกของ', code: 'withdraw.delete', category: 'withdraw', isSystem: true },

      // Time Tracking
      { name: 'สร้างลงเวลา', code: 'time.create', category: 'time', isSystem: true },
      { name: 'ดูลงเวลา', code: 'time.view', category: 'time', isSystem: true },
      { name: 'แก้ไขลงเวลา', code: 'time.update', category: 'time', isSystem: true },
      { name: 'ลบลงเวลา', code: 'time.delete', category: 'time', isSystem: true },

      // Blacklist
      { name: 'สร้างแบล็คลิส', code: 'blacklist.create', category: 'blacklist', isSystem: true },
      { name: 'ดูแบล็คลิส', code: 'blacklist.view', category: 'blacklist', isSystem: true },
      { name: 'แก้ไขแบล็คลิส', code: 'blacklist.update', category: 'blacklist', isSystem: true },
      { name: 'ลบแบล็คลิส', code: 'blacklist.delete', category: 'blacklist', isSystem: true },

      // Case Record
      { name: 'บันทึกคดี', code: 'caserecord.create', category: 'caserecord', isSystem: true },
      { name: 'ดูคดี', code: 'caserecord.view', category: 'caserecord', isSystem: true },
      { name: 'แก้ไขคดี', code: 'caserecord.update', category: 'caserecord', isSystem: true },
      { name: 'ลบคดี', code: 'caserecord.delete', category: 'caserecord', isSystem: true },

      // Admin
      { name: 'จัดการระบบ', code: 'admin.manage', category: 'admin', isSystem: true },
      { name: 'ดู Activity Log', code: 'admin.activity', category: 'admin', isSystem: true },
      { name: 'จัดการ Backup', code: 'admin.backup', category: 'admin', isSystem: true },
      { name: 'จัดการ Roles', code: 'admin.roles', category: 'admin', isSystem: true },
      { name: 'จัดการ Permissions', code: 'admin.permissions', category: 'admin', isSystem: true },
      { name: 'ดู Analytics', code: 'admin.analytics', category: 'admin', isSystem: true },
    ];

    for (const perm of systemPermissions) {
      await (Permission as any).findOneAndUpdate(
        { code: perm.code },
        perm,
        { upsert: true, new: true }
      );
    }

    console.log('System permissions initialized');
  } catch (error) {
    console.error('Error initializing system permissions:', error);
  }
}

/**
 * Initialize default system roles
 */
export async function initializeSystemRoles() {
  try {
    await connectDB();
    await initializeSystemPermissions();

    // Get all permissions
    const allPermissions = await (Permission as any).find({}).select('_id code').lean();

    // Admin role (has all permissions)
    const adminPermissions = allPermissions.map((p: any) => p._id);

    await (Role as any).findOneAndUpdate(
      { code: 'admin' },
      {
        name: 'ผู้ดูแลระบบ',
        code: 'admin',
        description: 'ผู้ดูแลระบบที่มีสิทธิ์ทั้งหมด',
        permissions: adminPermissions,
        isSystem: true,
        isDefault: false,
      },
      { upsert: true, new: true }
    );

    // Officer role (basic permissions)
    const officerPermissions = allPermissions
      .filter((p: any) => 
        p.code.startsWith('leaves.') ||
        p.code.startsWith('time.') ||
        p.code.startsWith('withdraw.') ||
        p.code.startsWith('caserecord.')
      )
      .map((p: any) => p._id);

    await (Role as any).findOneAndUpdate(
      { code: 'officer' },
      {
        name: 'ตำรวจ',
        code: 'officer',
        description: 'ตำรวจทั่วไป',
        permissions: officerPermissions,
        isSystem: true,
        isDefault: true,
      },
      { upsert: true, new: true }
    );

    console.log('System roles initialized');
  } catch (error) {
    console.error('Error initializing system roles:', error);
  }
}
