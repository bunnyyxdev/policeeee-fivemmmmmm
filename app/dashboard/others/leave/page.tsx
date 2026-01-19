'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import toast from 'react-hot-toast';
import axios from 'axios';
import { 
  Calendar, 
  Clock, 
  User, 
  CalendarDays,
  CheckCircle2,
  XCircle,
  Ban,
  Heart,
  Briefcase,
  Zap,
  MoreHorizontal,
  Info,
  Users,
  Plus,
  X,
  FileText
} from 'lucide-react';
import CustomDatePicker from '@/components/DatePicker';

interface Leave {
  _id: string;
  startDate: string;
  endDate: string;
  reason: string;
  leaveType: 'sick' | 'personal' | 'vacation' | 'emergency' | 'other';
  duration: number;
  requestedByName: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  createdAt: string;
}

export default function LeavePage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/leave', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeaves(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/leave',
        {
          startDate: formData.startDate,
          endDate: formData.endDate,
          reason: formData.reason,
          leaveType: 'other',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('แจ้งลาสำเร็จ');
      setFormData({
        startDate: '',
        endDate: '',
        reason: '',
      });
      setShowForm(false);
      fetchLeaves();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'ไม่สามารถแจ้งลาได้';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const calculateDuration = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end >= start) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
      }
    }
    return 0;
  };

  const getLeaveTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      sick: 'ลาป่วย',
      personal: 'ลาส่วนตัว',
      vacation: 'ลาพักผ่อน',
      emergency: 'ลาฉุกเฉิน',
      other: 'อื่นๆ',
    };
    return labels[type] || type;
  };

  const getLeaveTypeIcon = (type: string) => {
    switch (type) {
      case 'sick':
        return <Heart className="w-4 h-4" />;
      case 'personal':
        return <User className="w-4 h-4" />;
      case 'vacation':
        return <Briefcase className="w-4 h-4" />;
      case 'emergency':
        return <Zap className="w-4 h-4" />;
      default:
        return <MoreHorizontal className="w-4 h-4" />;
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'sick':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'personal':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'vacation':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'emergency':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'รอดำเนินการ',
      approved: 'อนุมัติ',
      rejected: 'ปฏิเสธ',
      cancelled: 'ยกเลิก',
    };
    return labels[status] || status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'cancelled':
        return <Ban className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'cancelled':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  
  // Filter out pending leaves
  const filteredLeaves = leaves.filter(l => l.status !== 'pending');

  return (
    <Layout requireAuth={true}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  ประวัติการลาของทุกคน
                </h1>
                <p className="text-gray-500 text-sm mt-0.5">ดูประวัติการลาและวันหยุดของทุกคนในระบบ</p>
              </div>
            </div>
            <Button 
              variant="primary" 
              onClick={() => setShowForm(!showForm)}
              className="shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <span className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>ส่งคำขอลา</span>
              </span>
            </Button>
          </div>

        </div>

        {/* Form Section */}
        {showForm && (
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-white" />
                    <h2 className="text-xl font-semibold text-white">ฟอร์มแจ้งลา</h2>
                  </div>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setFormData({
                        startDate: '',
                        endDate: '',
                        reason: '',
                      });
                    }}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <CustomDatePicker
                      label="วันเริ่มต้นลา"
                      value={formData.startDate}
                      onChange={(date) => setFormData({ ...formData, startDate: date })}
                      required
                      placeholder="เลือกวันที่เริ่มต้นลา"
                    />
                  </div>
                  <div className="space-y-2">
                    <CustomDatePicker
                      label="วันสิ้นสุดลา"
                      value={formData.endDate}
                      onChange={(date) => setFormData({ ...formData, endDate: date })}
                      required
                      minDate={formData.startDate}
                      placeholder="เลือกวันที่สิ้นสุดลา"
                    />
                  </div>
                </div>

                {formData.startDate && formData.endDate && calculateDuration() > 0 && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <CalendarDays className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">จำนวนวันลา</p>
                        <p className="text-xl font-bold text-blue-700">{calculateDuration()} วัน</p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เหตุผลการลา <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    rows={4}
                    placeholder="กรุณากรอกเหตุผลการลา..."
                  />
                </div>

                <div className="flex items-center space-x-4 pt-4">
                  <Button type="submit" variant="primary" isLoading={submitting} className="flex-1 sm:flex-none">
                    <span className="flex items-center space-x-2">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>ส่งคำขอ</span>
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowForm(false);
                      setFormData({
                        startDate: '',
                        endDate: '',
                        reason: '',
                      });
                    }}
                    className="flex-1 sm:flex-none"
                  >
                    <span className="flex items-center space-x-2">
                      <X className="w-5 h-5" />
                      <span>ยกเลิก</span>
                    </span>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* History Section */}
        <div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-200 rounded-lg">
                  <Clock className="w-5 h-5 text-gray-700" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">ประวัติการลาของทุกคน</h2>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mb-4"></div>
                <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
              </div>
            ) : filteredLeaves.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full mb-4">
                  <Info className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">ยังไม่มีการแจ้งลา</h3>
                <p className="text-gray-500">ยังไม่มีข้อมูลการลาในระบบ</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredLeaves.map((leave, index) => (
                  <div
                    key={leave._id}
                    className="p-6 hover:bg-gray-50 transition-colors duration-200"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Date Section */}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <Calendar className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">วันเริ่มต้น</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {new Date(leave.startDate).toLocaleDateString('th-TH', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-indigo-50 rounded-lg">
                            <CalendarDays className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">วันสิ้นสุด</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {new Date(leave.endDate).toLocaleDateString('th-TH', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Middle Section */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium border ${getLeaveTypeColor(leave.leaveType)}`}>
                            {getLeaveTypeIcon(leave.leaveType)}
                            <span>{getLeaveTypeLabel(leave.leaveType)}</span>
                          </span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-sm text-gray-600 font-medium">{leave.duration} วัน</span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">{leave.reason}</p>
                        <p className="text-xs text-gray-500 flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{leave.requestedByName}</span>
                        </p>
                      </div>

                      {/* Status Section */}
                      <div className="flex items-center justify-between lg:justify-end space-x-4">
                        <span className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold border ${getStatusColor(leave.status)}`}>
                          {getStatusIcon(leave.status)}
                          <span>{getStatusLabel(leave.status)}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
