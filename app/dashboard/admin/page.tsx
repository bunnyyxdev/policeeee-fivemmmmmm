'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useRouter } from 'next/navigation';
import { Users, UserPlus, Settings, Shield, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    officers: 0,
    admins: 0,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Only run on client side
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only fetch stats after component is mounted and token is available
    if (!mounted) return;
    
    const token = localStorage.getItem('token');
    if (token) {
      fetchStats();
    }
    // If no token, Layout component will handle redirect
  }, [mounted]);

  const fetchStats = async () => {
    try {
      let token = localStorage.getItem('token');
      
      if (!token) {
        // Token not available - Layout component will handle redirect
        return;
      }

      // Clean the token - remove any whitespace
      token = token.trim();
      
      // Validate token format (JWT should have 3 parts)
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.error('Invalid token format in localStorage. Token parts:', tokenParts.length);
        console.error('Token preview:', token.substring(0, 50));
        // Clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }

      console.log('Fetching admin stats with token:', token.substring(0, 30) + '...');
      console.log('Token length:', token.length);
      
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Admin stats response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to fetch stats:', response.status, errorData);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const adminActions = [
    {
      label: 'จัดการผู้ใช้',
      description: 'สร้าง แก้ไข และลบบัญชีผู้ใช้',
      icon: Users,
      href: '/dashboard/admin/users',
      color: 'bg-blue-500',
    },
    {
      label: 'สร้างบัญชีตำรวจ',
      description: 'เพิ่มบัญชีตำรวจใหม่',
      icon: UserPlus,
      href: '/dashboard/admin/users/create',
      color: 'bg-green-500',
    },
    {
      label: 'ตั้งค่าระบบ',
      description: 'จัดการการตั้งค่าระบบ',
      icon: Settings,
      href: '/dashboard/admin/settings',
      color: 'bg-purple-500',
    },
  ];

  return (
    <Layout requireAuth={true} requireRole="admin">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Shield className="w-8 h-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <p className="text-gray-600">จัดการระบบและผู้ใช้ทั้งหมด</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">ผู้ใช้ทั้งหมด</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">ตำรวจ</p>
                <p className="text-3xl font-bold text-gray-900">{stats.officers}</p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">ผู้ดูแลระบบ</p>
                <p className="text-3xl font-bold text-gray-900">{stats.admins}</p>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {adminActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <div
                key={index}
                onClick={() => router.push(action.href)}
                className="card cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div className={`${action.color} p-4 rounded-lg w-12 h-12 flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.label}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
