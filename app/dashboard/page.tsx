'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { 
  Package, 
  Clock, 
  Users, 
  FileText, 
  Calendar, 
  RefreshCw, 
  TrendingUp, 
  ArrowRight, 
  Activity, 
  Zap
} from 'lucide-react';

interface DashboardStats {
  leave: number;
  discipline: number;
  withdrawItems: number;
  timeTracking: number;
  caseRecords?: number;
  pendingLeaves?: number;
  pendingDisciplines?: number;
  recentWithdraws?: number;
  caseRecordJokpoon?: number;
  recentCaseRecords?: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    leave: 0,
    discipline: 0,
    withdrawItems: 0,
    timeTracking: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const refreshInterval = 5000; // 5 seconds for real-time updates

  const fetchStats = async (showLoading = false) => {
    try {
      if (showLoading) {
        setIsRefreshing(true);
      }
      const token = localStorage.getItem('token');
      if (token) {
        const response = await axios.get('/api/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(response.data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
      if (showLoading) {
        setIsRefreshing(false);
      }
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
    fetchStats(true);
    setLastUpdated(new Date());
  }, []);

  // Auto-refresh every 5 seconds for stats (real-time sync)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats(false); // Don't show loading indicator for auto-refresh
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, []);


  const statCards: Array<{
    label: string;
    value: string;
    icon: any;
    gradient: string;
    bgGradient: string;
    borderColor: string;
    textColor: string;
    iconBg: string;
    iconColor: string;
    href: string;
    description: string;
    trend?: string;
    isActive?: boolean;
  }> = [
    {
      label: 'เบิกของในตู้',
      value: loading ? '...' : stats.withdrawItems.toLocaleString('th-TH'),
      icon: Package,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      href: '/dashboard/withdraw-items',
      description: stats.recentWithdraws ? `${stats.recentWithdraws} รายการ 7 วันล่าสุด` : 'รายการทั้งหมด',
      trend: stats.recentWithdraws ? '+' : undefined,
    },
    {
      label: 'ลงเวลาพี่เลี้ยง',
      value: loading ? '...' : stats.timeTracking.toLocaleString('th-TH'),
      icon: Clock,
      gradient: 'from-emerald-500 to-teal-500',
      bgGradient: 'from-emerald-50 to-teal-50',
      borderColor: 'border-emerald-200',
      textColor: 'text-emerald-700',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      href: '/dashboard/time-tracking',
      description: 'บันทึกการลงเวลา',
    },
    {
      label: 'บันทึกคดี',
      value: loading ? '...' : (stats.caseRecords || 0).toLocaleString('th-TH'),
      icon: FileText,
      gradient: 'from-indigo-500 to-purple-600',
      bgGradient: 'from-indigo-50 to-purple-50',
      borderColor: 'border-indigo-200',
      textColor: 'text-indigo-700',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      href: '/dashboard/case-record',
      description: stats.recentCaseRecords ? `${stats.recentCaseRecords} คดี 7 วันล่าสุด` : 'จัดการข้อมูลคดีทั้งหมด',
      trend: stats.recentCaseRecords ? '+' : undefined,
    },
    {
      label: 'การลา',
      value: loading ? '...' : stats.leave.toLocaleString('th-TH'),
      icon: Calendar,
      gradient: 'from-orange-500 to-amber-500',
      bgGradient: 'from-orange-50 to-amber-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-700',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      href: '/dashboard/others/leave',
      description: stats.pendingLeaves ? `${stats.pendingLeaves} รอการอนุมัติ` : 'รายการทั้งหมด',
    },
    {
      label: 'โทษวินัย',
      value: loading ? '...' : stats.discipline.toLocaleString('th-TH'),
      icon: FileText,
      gradient: 'from-red-500 to-rose-500',
      bgGradient: 'from-red-50 to-rose-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      href: '/dashboard/discipline',
      description: stats.pendingDisciplines ? `${stats.pendingDisciplines} รอดำเนินการ` : 'รายการทั้งหมด',
    },
  ];

  return (
    <Layout requireAuth={true}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Dashboard
                  </h1>
                  <p className="text-gray-500 text-sm mt-0.5">
                    ยินดีต้อนรับ, <span className="font-semibold text-gray-700">{user?.name || 'ผู้ใช้'}</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {lastUpdated && (
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    อัปเดตล่าสุด: {lastUpdated.toLocaleTimeString('th-TH', { 
                      hour: '2-digit', 
                      minute: '2-digit', 
                      second: '2-digit' 
                    })}
                  </span>
                  {isRefreshing && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 animate-pulse">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
                      กำลังอัปเดต
                    </span>
                  )}
                </div>
              )}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  fetchStats(true);
                }}
                disabled={loading || isRefreshing}
                className="flex items-center space-x-2 px-4 py-2.5 text-sm bg-white border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 rounded-xl transition-smooth hover-lift button-press disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                title="รีเฟรชข้อมูล"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'กำลังอัปเดต...' : 'รีเฟรช'}</span>
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  onClick={() => router.push(stat.href)}
                  className={`bg-gradient-to-br ${stat.bgGradient} border-2 ${stat.borderColor} rounded-2xl p-6 cursor-pointer card-hover group transition-smooth`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                        {stat.isActive && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 animate-pulse">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                            กำลังทำงาน
                          </span>
                        )}
                      </div>
                      <p className={`text-3xl font-bold ${stat.textColor} mb-1`}>
                        {stat.value}
                      </p>
                      {stat.description && (
                        <p className="text-xs text-gray-600 mt-1">{stat.description}</p>
                      )}
                    </div>
                    <div className={`${stat.iconBg} p-3 rounded-xl group-hover:scale-110 transition-spring animate-float`}>
                      <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/50">
                    <span className="text-xs font-medium text-gray-600">ดูรายละเอียด</span>
                    <ArrowRight className={`w-4 h-4 ${stat.iconColor} group-hover:translate-x-1 transition-smooth`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions Section */}
        <div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Zap className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">เมนูหลัก</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {statCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <button
                    key={index}
                    onClick={() => router.push(stat.href)}
                    className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-50 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-smooth hover-scale button-press group"
                  >
                    <div className={`${stat.iconBg} p-3 rounded-lg mb-3 group-hover:scale-110 transition-spring`}>
                      <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                    </div>
                    <span className="text-xs font-medium text-gray-700 text-center group-hover:text-gray-900">
                      {stat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}
