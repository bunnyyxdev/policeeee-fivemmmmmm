'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Package,
  Clock,
  Users,
  Image,
  AlertCircle,
  Ban,
  FileText,
  MessageSquare,
  MoreHorizontal,
  Home,
  LogOut,
  Calendar,
  DollarSign,
  UserCircle,
  BookOpen,
  ExternalLink,
  Database,
  Settings,
  Car,
  Menu,
  X,
  History,
  Download,
  Upload,
  Megaphone,
} from 'lucide-react';

interface SidebarProps {
  role?: 'officer' | 'admin';
  onLogout?: () => void;
}

type Role = 'officer' | 'admin';

type MenuItem = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  roles: readonly Role[];
  external?: boolean;
  submenu?: Array<{
    label: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
  }>;
};

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    icon: Home,
    href: '/dashboard',
    roles: ['officer', 'admin'] as const,
  },
  {
    label: 'โปรไฟล์',
    icon: UserCircle,
    href: '/dashboard/profile',
    roles: ['officer', 'admin'] as const,
  },
  {
    label: 'ตั้งค่า',
    icon: Settings,
    href: '/dashboard/settings',
    roles: ['officer', 'admin'] as const,
  },
  {
    label: 'เบิกของในตู้',
    icon: Package,
    href: '/dashboard/withdraw-items',
    roles: ['officer', 'admin'] as const,
  },
  {
    label: 'ลงเวลาพี่เลี้ยง',
    icon: Clock,
    href: '/dashboard/time-tracking',
    roles: ['officer', 'admin'] as const,
  },
  {
    label: 'บันทึกคดี',
    icon: FileText,
    href: '/dashboard/case-record',
    roles: ['officer', 'admin'] as const,
  },
  {
    label: 'แบล็คลิส',
    icon: Ban,
    href: '/dashboard/blacklist',
    roles: ['officer', 'admin'] as const,
  },
  {
    label: 'โทษวินัยตำรวจ',
    icon: FileText,
    href: '/dashboard/discipline',
    roles: ['officer', 'admin'] as const,
  },
  {
    label: 'เสนอความคิดเห็น',
    icon: MessageSquare,
    href: '/dashboard/suggestions',
    roles: ['officer', 'admin'] as const,
  },
  {
    label: 'กฏตำรวจ',
    icon: BookOpen,
    href: 'https://simple.com',
    external: true,
    roles: ['officer', 'admin'] as const,
  },
  {
    label: 'อื่น',
    icon: MoreHorizontal,
    href: '/dashboard/others',
    submenu: [
      { label: 'แจ้งลา', href: '/dashboard/others/leave', icon: Calendar },
      { label: 'สำหรับคำประกาศตำรวจ', href: '/dashboard/others/announcements', icon: Megaphone },
    ],
    roles: ['officer', 'admin'] as const,
  },
];

const adminMenuItems: MenuItem[] = [
  {
    label: 'การจัดการ',
    icon: Users,
    href: '/dashboard/admin/manage',
    submenu: [
      { label: 'จัดการผู้ใช้', href: '/dashboard/admin/users', icon: Users },
      { label: 'ออกใบอนุญาติขับฮอ', href: '/dashboard/admin/driver-license', icon: Car },
    ],
    roles: ['admin'],
  },
  {
    label: 'ระบบ',
    icon: Database,
    href: '/dashboard/admin/system',
    submenu: [
      { label: 'Activity Log', href: '/dashboard/admin/activity-log', icon: History },
    ],
    roles: ['admin'],
  },
];

export default function Sidebar({ role = 'officer', onLogout }: SidebarProps) {
  const pathname = usePathname();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Update Thailand time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const thailandTime = new Intl.DateTimeFormat('th-TH', {
        timeZone: 'Asia/Bangkok',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now);
      setCurrentTime(thailandTime);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // Ensure role is valid ('officer' or 'admin'), default to 'officer'
  const validRole: Role = (role === 'admin' || role === 'officer') ? role : 'officer';

  // Only include admin menu items if user is admin
  const allMenuItems = validRole === 'admin' ? [...menuItems, ...adminMenuItems] : menuItems;

  // Filter menu items based on user role - only show items that include the user's role
  const filteredMenuItems = allMenuItems.filter((item) => {
    // Check if the item's allowed roles include the user's role
    return item.roles.includes(validRole);
  });

  return (
    <>
      {/* Mobile Burger Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg shadow-lg"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white shadow-lg z-40 transition-spring ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
      style={{
        height: '100dvh', // Dynamic viewport height for mobile
      }}>
      <div className="flex flex-col h-full">
        {/* Logo/Header */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div>
              <h1 className="text-xl font-bold text-primary-400">ระบบตำรวจ Preview City</h1>
            <p className="text-sm text-gray-400 mt-1">Police Management System</p>
            {currentTime && (
              <p className="text-xs text-gray-500 mt-2 font-mono">{currentTime}</p>
            )}
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.submenu && item.submenu.some((sub) => pathname === sub.href));
              const hasSubmenu = !!item.submenu;

              return (
                <div key={item.href}>
                  {hasSubmenu ? (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenSubmenu(openSubmenu === item.href ? null : item.href)}
                        className={`w-full flex items-center px-4 py-3 rounded-lg transition-smooth hover-lift ${
                          isActive || openSubmenu === item.href
                            ? 'bg-primary-600 text-white shadow-md'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`}
                        aria-expanded={openSubmenu === item.href}
                        aria-haspopup="true"
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        <span className="flex-1 text-left font-medium">{item.label}</span>
                        <svg
                          className={`w-4 h-4 transition-transform duration-200 ${
                            openSubmenu === item.href ? 'rotate-90' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center px-4 py-3 rounded-lg transition-smooth hover-lift ${
                          isActive ? 'bg-primary-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        <span className="flex-1">{item.label}</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        className={`flex items-center px-4 py-3 rounded-lg transition-smooth hover-lift ${
                          isActive ? 'bg-primary-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        <span>{item.label}</span>
                      </Link>
                    )
                  )}

                  {hasSubmenu && openSubmenu === item.href && (
                    <div className="ml-6 mt-1 space-y-1 border-l-2 border-gray-700 pl-2 py-1">
                      {item.submenu?.map((sub) => {
                        const isSubActive = pathname === sub.href;
                        const SubIcon = sub.icon;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={`group flex items-center px-4 py-2.5 rounded-lg text-sm transition-all duration-200 relative ${
                              isSubActive
                                ? 'bg-primary-700 text-white shadow-md font-medium'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`}
                          >
                            {SubIcon && (
                              <SubIcon className={`w-4 h-4 mr-2 transition-colors ${
                                isSubActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'
                              }`} />
                            )}
                            {!SubIcon && (
                              <div
                                className={`w-1.5 h-1.5 rounded-full transition-colors mr-2 ${
                                  isSubActive ? 'bg-white' : 'bg-gray-500 group-hover:bg-gray-300'
                                }`}
                              ></div>
                            )}
                            <span className="flex-1">{sub.label}</span>
                            {isSubActive && (
                              <svg
                                className="w-4 h-4 ml-auto"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
        </nav>

        {/* Logout Button */}
        {onLogout && (
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={onLogout}
              className="w-full flex items-center px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
