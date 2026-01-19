'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import Alert from '@/components/Alert';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Clock, Plus, Users, User, Calendar, FileText, CheckCircle2, X, Info, Activity } from 'lucide-react';

interface TimeTrackingRecord {
  _id: string;
  caregiverName: string;
  caredForPerson: string;
  date: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  notes?: string;
  recordedByName: string;
  status: 'active' | 'completed';
  createdAt: string;
}

export default function TimeTrackingPage() {
  const [records, setRecords] = useState<TimeTrackingRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    caregiverName: '',
    caredForPerson: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    notes: '',
  });

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/time-tracking', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecords(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch records:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/time-tracking',
        {
          caregiverName: formData.caregiverName,
          caredForPerson: formData.caredForPerson,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          notes: formData.notes || undefined,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('บันทึกเวลาสำเร็จ');
      setFormData({
        caregiverName: '',
        caredForPerson: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        notes: '',
      });
      setShowForm(false);
      fetchRecords();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'ไม่สามารถบันทึกเวลาได้';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} ชั่วโมง ${mins} นาที`;
    }
    return `${mins} นาที`;
  };

  return (
    <Layout requireAuth={true}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  ประวัติการลงเวลาของพี่เลี้ยง
                </h1>
                <p className="text-gray-500 text-sm mt-0.5">ดูประวัติการลงเวลาพี่เลี้ยง</p>
              </div>
            </div>
            <Button 
              variant="primary" 
              onClick={() => setShowForm(!showForm)}
              className="shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <span className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>ลงเวลา</span>
              </span>
            </Button>
          </div>
        </div>

        {/* Form Section */}
        {showForm && (
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-white" />
                    <h2 className="text-xl font-semibold text-white">ฟอร์มลงเวลา</h2>
                  </div>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setFormData({
                        caregiverName: '',
                        caredForPerson: '',
                        date: new Date().toISOString().split('T')[0],
                        startTime: '',
                        endTime: '',
                        notes: '',
                      });
                    }}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ชื่อพี่เลี้ยง *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.caregiverName}
                        onChange={(e) => setFormData({ ...formData, caregiverName: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                        placeholder="กรอกชื่อพี่เลี้ยง"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ชื่อนักเรียนตำรวจ *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.caredForPerson}
                        onChange={(e) => setFormData({ ...formData, caredForPerson: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                        placeholder="กรอกชื่อนักเรียนตำรวจ"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">วันที่ *</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">เวลาเริ่มต้น *</label>
                      <input
                        type="time"
                        required
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">เวลาสิ้นสุด *</label>
                      <input
                        type="time"
                        required
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">หมายเหตุ</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 resize-none"
                      rows={3}
                      placeholder="กรอกหมายเหตุ (ถ้ามี)"
                    />
                  </div>

                  <div className="flex items-center space-x-4 pt-4">
                    <Button type="submit" variant="primary" isLoading={loading} className="flex-1 sm:flex-none">
                      <span className="flex items-center space-x-2">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>บันทึก</span>
                      </span>
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setShowForm(false);
                        setFormData({
                          caregiverName: '',
                          caredForPerson: '',
                          date: new Date().toISOString().split('T')[0],
                          startTime: '',
                          endTime: '',
                          notes: '',
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
          </div>
        )}

        {/* History Section */}
        <div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-200 rounded-lg">
                  <FileText className="w-5 h-5 text-gray-700" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">ประวัติการลงเวลาของพี่เลี้ยง</h2>
              </div>
            </div>

            {records.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-full mb-4">
                  <Info className="w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">ยังไม่มีการลงเวลา</h3>
                <p className="text-gray-500">ยังไม่มีข้อมูลการลงเวลาในระบบ</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {records.map((record, index) => (
                  <div
                    key={record._id}
                    className="p-6 hover:bg-gray-50 transition-colors duration-200"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* People Section */}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-emerald-50 rounded-lg">
                            <User className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">พี่เลี้ยง</p>
                            <p className="text-sm font-semibold text-gray-900">{record.caregiverName}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-teal-50 rounded-lg">
                            <Activity className="w-5 h-5 text-teal-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">นักเรียนตำรวจ</p>
                            <p className="text-sm font-semibold text-gray-900">{record.caredForPerson}</p>
                          </div>
                        </div>
                      </div>

                      {/* Time Section */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">{record.startTime}</span>
                            <span className="text-xs text-gray-400">→</span>
                            <span className="text-sm font-medium text-gray-900">{record.endTime || '-'}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium">
                            {formatDuration(record.duration)}
                          </span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border ${
                            record.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {record.status === 'completed' ? 'เสร็จสิ้น' : 'กำลังดำเนินการ'}
                          </span>
                        </div>
                        {record.notes && (
                          <p className="text-sm text-gray-600 line-clamp-1">{record.notes}</p>
                        )}
                        <p className="text-xs text-gray-500 flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>บันทึกโดย: {record.recordedByName}</span>
                        </p>
                      </div>

                      {/* Date Section */}
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">วันที่</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {new Date(record.date).toLocaleDateString('th-TH', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
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
