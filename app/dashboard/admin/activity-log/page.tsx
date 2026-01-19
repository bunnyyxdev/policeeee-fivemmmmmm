'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Clock, Filter, Download, ArrowUpDown, ArrowUp, ArrowDown, Trash2, FileJson, FileSpreadsheet, BarChart3, TrendingUp } from 'lucide-react';

interface ActivityLog {
  _id: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  performedBy: any;
  performedByName: string;
  changes?: Array<{ field: string; oldValue: any; newValue: any }>;
  metadata?: any;
  ipAddress?: string;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  create: 'สร้าง',
  update: 'แก้ไข',
  delete: 'ลบ',
  login: 'เข้าสู่ระบบ',
  logout: 'ออกจากระบบ',
  view: 'ดู',
  approve: 'อนุมัติ',
  reject: 'ปฏิเสธ',
};

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  login: 'bg-purple-100 text-purple-800',
  logout: 'bg-gray-100 text-gray-800',
  view: 'bg-yellow-100 text-yellow-800',
  approve: 'bg-emerald-100 text-emerald-800',
  reject: 'bg-orange-100 text-orange-800',
};

interface User {
  _id: string;
  name: string;
  username: string;
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    search: '',
    performedBy: '',
    startDate: '',
    endDate: '',
  });
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' }>({
    field: 'createdAt',
    direction: 'desc',
  });
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const limit = 20;

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [page, filters, sortConfig]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data.users || []);
    } catch (error) {
      // Silently fail - users list is optional
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort: sortConfig.field,
        sortOrder: sortConfig.direction,
      });

      if (filters.action) params.append('action', filters.action);
      if (filters.entityType) params.append('entityType', filters.entityType);
      if (filters.search) params.append('search', filters.search);
      if (filters.performedBy) params.append('performedBy', filters.performedBy);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await axios.get(`/api/activity-log?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setLogs(response.data.data);
      setTotal(response.data.pagination.total);
    } catch (error: any) {
      toast.error('ไม่สามารถโหลด Activity Log ได้');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSort = (field: string) => {
    setSortConfig((current) => ({
      field,
      direction: current.field === field && current.direction === 'desc' ? 'asc' : 'desc',
    }));
    setPage(1); // Reset to first page when sorting changes
  };

  const getSortIcon = (field: string) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-600" />
      : <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  const renderChanges = (changes?: Array<{ field: string; oldValue: any; newValue: any }>) => {
    if (!changes || changes.length === 0) return null;

    return (
      <div className="mt-2 space-y-1 text-xs">
        {changes.map((change, idx) => (
          <div key={idx} className="text-gray-600">
            <span className="font-medium">{change.field}:</span>{' '}
            <span className="text-red-600">{JSON.stringify(change.oldValue) || '(ไม่มี)'}</span>
            {' → '}
            <span className="text-green-600">{JSON.stringify(change.newValue) || '(ไม่มี)'}</span>
          </div>
        ))}
      </div>
    );
  };

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      // Use same filters as current view
      if (filters.action) params.append('action', filters.action);
      if (filters.entityType) params.append('entityType', filters.entityType);
      if (filters.search) params.append('search', filters.search);
      if (filters.performedBy) params.append('performedBy', filters.performedBy);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      // Get all logs (no pagination for export)
      params.append('limit', '10000');

      const response = await axios.get(`/api/activity-log?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const logs = response.data.data || [];
      
      // Generate CSV
      const headers = ['เวลา', 'Action', 'Entity Type', 'Entity Name', 'ผู้ดำเนินการ', 'IP Address', 'Changes'];
      const rows = logs.map((log: ActivityLog) => [
        formatDate(log.createdAt),
        ACTION_LABELS[log.action] || log.action,
        log.entityType,
        log.entityName || '-',
        log.performedByName,
        log.ipAddress || '-',
        log.changes ? JSON.stringify(log.changes) : '-',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `activity-log-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('ส่งออก CSV สำเร็จ');
    } catch (error: any) {
      toast.error('ไม่สามารถส่งออก CSV ได้');
    }
  };

  const handleExportJSON = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      // Use same filters as current view
      if (filters.action) params.append('action', filters.action);
      if (filters.entityType) params.append('entityType', filters.entityType);
      if (filters.search) params.append('search', filters.search);
      if (filters.performedBy) params.append('performedBy', filters.performedBy);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      // Get all logs (no pagination for export)
      params.append('limit', '10000');

      const response = await axios.get(`/api/activity-log?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const logs = response.data.data || [];
      
      // Generate JSON
      const jsonContent = JSON.stringify(logs, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `activity-log-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('ส่งออก JSON สำเร็จ');
    } catch (error: any) {
      toast.error('ไม่สามารถส่งออก JSON ได้');
    }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.startDate && filters.endDate) {
        params.append('startDate', filters.startDate);
        params.append('endDate', filters.endDate);
      } else {
        params.append('period', '30d');
      }

      const response = await axios.get(`/api/activity-log/analytics?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAnalyticsData(response.data);
    } catch (error: any) {
      toast.error('ไม่สามารถโหลดข้อมูล Analytics ได้');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (showAnalytics) {
      fetchAnalytics();
    }
  }, [showAnalytics, filters.startDate, filters.endDate]);

  const handleDeleteAll = async () => {
    // Double confirmation
    const firstConfirm = window.confirm(
      '⚠️ คุณแน่ใจหรือไม่ว่าต้องการลบ Activity Log ทั้งหมด?\n\nการดำเนินการนี้จะลบบันทึกการกระทำทั้งหมดและไม่สามารถกู้คืนได้\n\nกด "OK" เพื่อยืนยัน'
    );
    
    if (!firstConfirm) {
      return;
    }

    const secondConfirm = window.confirm(
      '⚠️ การยืนยันครั้งสุดท้าย\n\nคุณแน่ใจ 100% ว่าต้องการลบ Activity Log ทั้งหมดหรือไม่?\n\nการดำเนินการนี้ไม่สามารถยกเลิกได้!'
    );

    if (!secondConfirm) {
      return;
    }

    setDeleteAllLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('ไม่พบ token กรุณาเข้าสู่ระบบใหม่');
        return;
      }

      const response = await axios.delete('/api/activity-log', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && response.data.deletedCount !== undefined) {
        toast.success(`ลบ Activity Log ทั้งหมดสำเร็จ (${response.data.deletedCount} รายการ)`);
        setLogs([]); // Clear the list immediately
        setTotal(0); // Reset total count
        setPage(1); // Reset to first page
        
        // Refresh the list after a short delay
        setTimeout(() => {
          fetchLogs();
        }, 500);
      } else {
        toast.error('ไม่ได้รับข้อมูลการลบจากเซิร์ฟเวอร์');
      }
    } catch (error: any) {
      const status = error.response?.status;
      const errorData = error.response?.data;
      let errorMessage = errorData?.error || error.message || 'ไม่สามารถลบ Activity Log ทั้งหมดได้';
      
      if (status === 401) {
        errorMessage = 'กรุณาเข้าสู่ระบบใหม่';
      } else if (status === 403) {
        errorMessage = 'คุณไม่มีสิทธิ์ในการดำเนินการนี้ (ต้องเป็นผู้ดูแลระบบ)';
      } else if (status === 500) {
        errorMessage = 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ - กรุณาลองอีกครั้ง';
      }
      
      toast.error(errorMessage);
    } finally {
      setDeleteAllLoading(false);
    }
  };

  return (
    <Layout requireAuth={true} requireRole="admin">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Activity Log / Audit Trail</h1>
            <p className="text-gray-600">บันทึกการกระทำสำคัญของผู้ใช้ทั้งหมด</p>
          </div>
          <div className="flex items-center space-x-2">
            {total > 0 && (
              <Button
                variant="danger"
                onClick={handleDeleteAll}
                disabled={deleteAllLoading || loading}
                description="ลบ Activity Log ทั้งหมด (ไม่สามารถกู้คืนได้)"
              >
                <span className="flex items-center space-x-2">
                  <Trash2 className="w-5 h-5" />
                  <span>{deleteAllLoading ? 'กำลังลบ...' : 'ลบทั้งหมด'}</span>
                </span>
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">ตัวกรอง</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
              <select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              >
                <option value="">ทั้งหมด</option>
                {Object.entries(ACTION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">วันที่เริ่มต้น</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">วันที่สิ้นสุด</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหา</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                placeholder="ค้นหาตามชื่อหรือ Entity Name"
              />
            </div>
          </div>
        </div>

        {/* Activity Logs Table */}
        <div className="card">
          {loading ? (
            <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">ไม่มีข้อมูล Activity Log</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>เวลา</span>
                        {getSortIcon('createdAt')}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('action')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Action</span>
                        {getSortIcon('action')}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('entityType')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Entity Type</span>
                        {getSortIcon('entityType')}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('entityName')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Entity Name</span>
                        {getSortIcon('entityName')}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('performedByName')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>ผู้ดำเนินการ</span>
                        {getSortIcon('performedByName')}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">รายละเอียด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>{formatDate(log.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800'}`}>
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{log.entityType}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{log.entityName || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{log.performedByName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {log.changes && log.changes.length > 0 ? (
                          renderChanges(log.changes)
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                แสดง {((page - 1) * limit) + 1} - {Math.min(page * limit, total)} จาก {total} รายการ
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ก่อนหน้า
                </Button>
                <span className="text-sm text-gray-600">หน้า {page} / {Math.ceil(total / limit)}</span>
                <Button
                  variant="secondary"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= Math.ceil(total / limit)}
                >
                  ถัดไป
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
