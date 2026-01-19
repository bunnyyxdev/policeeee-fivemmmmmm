'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  Calendar,
  User,
  MapPin,
  AlertCircle,
  CheckCircle,
  X,
  Upload,
  Camera,
  TrendingUp,
  Clock
} from 'lucide-react';
import DatePicker from '@/components/DatePicker';

interface CaseRecord {
  _id: string;
  caseNumber: string;
  caseDate: string;
  incidentDate?: string;
  incidentLocation?: string;
  suspectName?: string;
  suspectId?: string;
  victimName?: string;
  victimId?: string;
  caseType?: string;
  caseCategory?: 'criminal' | 'civil' | 'traffic' | 'other';
  description?: string;
  status: 'open' | 'investigating' | 'prosecuted' | 'closed' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedOfficerName?: string;
  recordedByName: string;
  arrestName?: string;
  arrestIdCard?: string;
  crimeType?: string;
  fineAmount?: number;
  jailTime?: string;
  arrestImages?: string[];
  createdAt: string;
}

export default function CaseRecordPage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [caseTypeFilter, setCaseTypeFilter] = useState<string>('เคสทั้งหมด');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  
  // Statistics state
  const [stats, setStats] = useState({
    totalCases: 0,
    jokpoonCases: 0,
    recentCases: 0,
  });
  const [recentCase, setRecentCase] = useState<CaseRecord | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    caseDate: '',
    incidentDate: '',
    incidentLocation: '',
    status: 'open' as 'open' | 'investigating' | 'prosecuted' | 'closed' | 'dismissed',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    arrestName: '',
    crimeType: '',
    fineAmount: '',
    jailTime: '',
    notes: '',
  });
  const [arrestImages, setArrestImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCases();
    fetchStats();
  }, [caseTypeFilter]);

  // Auto-refresh for live updates (every 5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCases();
      fetchStats();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [caseTypeFilter]);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (caseTypeFilter && caseTypeFilter !== 'เคสทั้งหมด') {
        params.append('crimeType', caseTypeFilter);
      }

      const response = await axios.get(`/api/case-record?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCases(response.data.data || []);
    } catch (error: any) {
      console.error('Failed to fetch cases:', error);
      toast.error('ไม่สามารถโหลดข้อมูลคดีได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch statistics
      const statsResponse = await axios.get('/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const statsData = statsResponse.data;
      setStats({
        totalCases: statsData.caseRecords || 0,
        jokpoonCases: statsData.caseRecordJokpoon || 0,
        recentCases: statsData.recentCaseRecords || 0,
      });

      // Get most recent case - fetch latest 5 and get the first one
      const recentResponse = await axios.get('/api/case-record?limit=5', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (recentResponse.data.data && recentResponse.data.data.length > 0) {
        // Sort by createdAt descending to get the most recent
        const sortedCases = [...recentResponse.data.data].sort((a: CaseRecord, b: CaseRecord) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setRecentCase(sortedCases[0]);
      }
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCases();
  };

  const handleArrestImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) {
        toast.error(`ไฟล์ ${file.name} ไม่ใช่รูปภาพ`);
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error(`ไฟล์ ${file.name} ใหญ่เกิน 10MB`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await axios.post(
          `/api/upload/image?folder=arrest-images`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        if (uploadResponse.data.success) {
          setArrestImages([...arrestImages, uploadResponse.data.data.url]);
        }
      } catch (error: any) {
        toast.error(`ไม่สามารถอัปโหลด ${file.name}`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('กรุณาเข้าสู่ระบบ');
        return;
      }

      await axios.post(
        '/api/case-record',
        {
          ...formData,
          fineAmount: formData.fineAmount ? parseFloat(formData.fineAmount) : undefined,
          arrestImages,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('บันทึกคดีสำเร็จ');
      setShowCreateModal(false);
      resetForm();
      fetchCases();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'ไม่สามารถบันทึกคดีได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      caseDate: '',
      incidentDate: '',
      incidentLocation: '',
      status: 'open',
      priority: 'medium',
      arrestName: '',
      crimeType: '',
      fineAmount: '',
      jailTime: '',
      notes: '',
    });
    setArrestImages([]);
  };

  const handleView = (caseRecord: CaseRecord) => {
    setSelectedCase(caseRecord);
    setShowViewModal(true);
  };

  const getStatusBadge = (status: string) => {
    const statuses: Record<string, { label: string; color: string }> = {
      open: { label: 'เปิดคดี', color: 'bg-blue-100 text-blue-700' },
      investigating: { label: 'กำลังสืบสวน', color: 'bg-yellow-100 text-yellow-700' },
      prosecuted: { label: 'ฟ้องร้อง', color: 'bg-purple-100 text-purple-700' },
      closed: { label: 'ปิดคดี', color: 'bg-green-100 text-green-700' },
      dismissed: { label: 'ยกฟ้อง', color: 'bg-gray-100 text-gray-700' },
    };
    return statuses[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
  };

  const getPriorityBadge = (priority: string) => {
    const priorities: Record<string, { label: string; color: string }> = {
      low: { label: 'ต่ำ', color: 'bg-gray-100 text-gray-700' },
      medium: { label: 'ปานกลาง', color: 'bg-blue-100 text-blue-700' },
      high: { label: 'สูง', color: 'bg-orange-100 text-orange-700' },
      critical: { label: 'วิกฤต', color: 'bg-red-100 text-red-700' },
    };
    return priorities[priority] || { label: priority, color: 'bg-gray-100 text-gray-700' };
  };

  return (
    <Layout requireAuth={true}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  บันทึกคดี
                </h1>
                <p className="text-gray-500 text-sm mt-0.5">จัดการข้อมูลคดีทั้งหมด</p>
              </div>
            </div>
            <Button
              variant="primary"
              onClick={() => {
                // Sync crimeType with filter when opening modal
                if (caseTypeFilter === 'จกปูน') {
                  setFormData({ ...formData, crimeType: 'จกปูน' });
                } else {
                  setFormData({ ...formData, crimeType: '' });
                }
                setShowCreateModal(true);
              }}
              className="shadow-lg hover:shadow-xl transition-all duration-300 flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              <span>บันทึกคดีใหม่</span>
            </Button>
          </div>

          {/* Statistics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">จำนวนคดีทั้งหมด</p>
                  <p className="text-2xl font-bold text-indigo-700">{stats.totalCases.toLocaleString('th-TH')}</p>
                </div>
                <div className="bg-indigo-100 p-3 rounded-lg">
                  <FileText className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Latest Case Alert */}
          {recentCase && (
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg p-4 mb-6 text-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="w-5 h-5 animate-pulse" />
                    <span className="text-sm font-semibold">เคสล่าสุดที่จับได้</span>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-lg">{recentCase.caseNumber}</p>
                    {recentCase.arrestName && (
                      <p className="text-sm opacity-90">ผู้ต้องสงสัย: {recentCase.arrestName}</p>
                    )}
                    {recentCase.crimeType && (
                      <p className="text-sm opacity-90">คดี: {recentCase.crimeType}</p>
                    )}
                    <p className="text-xs opacity-75">
                      {new Date(recentCase.createdAt).toLocaleString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => handleView(recentCase)}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  ดูรายละเอียด
                </Button>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ค้นหาจากหมายเลขคดี, ชื่อผู้ต้องสงสัย, ผู้เสียหาย..."
                    className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={caseTypeFilter}
                  onChange={(e) => setCaseTypeFilter(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="เคสทั้งหมด">เคสทั้งหมด</option>
                  <option value="จกปูน">จกปูน</option>
                </select>
                <Button type="submit" variant="secondary" className="flex items-center">
                  <Filter className="w-4 h-4 mr-2" />
                  <span>กรอง</span>
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Cases List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-500">กำลังโหลด...</p>
          </div>
        ) : cases.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">ยังไม่มีคดี</h3>
            <p className="text-gray-500">เริ่มต้นด้วยการบันทึกคดีใหม่</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cases.map((caseRecord) => {
              const statusBadge = getStatusBadge(caseRecord.status);
              const priorityBadge = getPriorityBadge(caseRecord.priority);
              
              return (
                <div
                  key={caseRecord._id}
                  className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {caseRecord.caseNumber}
                          </h3>
                        </div>
                        <div className="flex gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.color}`}>
                            {statusBadge.label}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${priorityBadge.color}`}>
                            {priorityBadge.label}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
                        {caseRecord.incidentLocation && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4" />
                            <span><strong>สถานที่:</strong> {caseRecord.incidentLocation}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span><strong>วันที่:</strong> {new Date(caseRecord.caseDate).toLocaleDateString('th-TH')}</span>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-gray-500">
                        บันทึกโดย: {caseRecord.recordedByName} • {new Date(caseRecord.createdAt).toLocaleDateString('th-TH')}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => handleView(caseRecord)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        ดู
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <h2 className="text-2xl font-bold text-white">บันทึกคดีใหม่</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Arrest Information */}
                <div className="border-t-2 border-gray-200 pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลการจับกุม</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อ-นามสกุล IC</label>
                      <input
                        type="text"
                        value={formData.arrestName}
                        onChange={(e) => setFormData({ ...formData, arrestName: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                        placeholder="ชื่อ-นามสกุล"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">คดีที่โดนจับ</label>
                      <select
                        value={formData.crimeType}
                        onChange={(e) => setFormData({ ...formData, crimeType: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                      >
                        <option value="">เลือกคดี</option>
                        <option value="จกปูน">จกปูน</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ค่าปรับ (บาท)</label>
                      <input
                        type="number"
                        value={formData.fineAmount}
                        onChange={(e) => setFormData({ ...formData, fineAmount: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">เวลาติดคุก</label>
                      <input
                        type="text"
                        value={formData.jailTime}
                        onChange={(e) => setFormData({ ...formData, jailTime: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                        placeholder="30 นาที, 1 ชั่วโมง"
                      />
                    </div>
                  </div>
                </div>

                {/* Arrest Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    รูปตอนจับพร้อมบัตร <span className="text-xs text-gray-500">(Max 10MB)</span>
                  </label>
                  <label className="flex items-center justify-center w-full px-6 py-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-smooth">
                    <div className="flex flex-col items-center space-y-2">
                      <Camera className="w-8 h-8 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600">คลิกเพื่ออัปโหลดรูปตอนจับพร้อมบัตร</span>
                      <span className="text-xs text-gray-500">รองรับไฟล์ขนาดไม่เกิน 10MB</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleArrestImageUpload(e.target.files)}
                    />
                  </label>
                  {arrestImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-4">
                      {arrestImages.map((url, index) => (
                        <div key={index} className="relative">
                          <img src={url} alt={`Arrest ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => {
                              const newImages = arrestImages.filter((_, i) => i !== index);
                              setArrestImages(newImages);
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit */}
                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                  >
                    ยกเลิก
                  </Button>
                  <Button type="submit" variant="success" isLoading={isSubmitting}>
                    บันทึกคดี
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && selectedCase && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <h2 className="text-2xl font-bold text-white">{selectedCase.caseNumber}</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">สถานะ</label>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(selectedCase.status).color}`}>
                      {getStatusBadge(selectedCase.status).label}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">ความสำคัญ</label>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getPriorityBadge(selectedCase.priority).color}`}>
                      {getPriorityBadge(selectedCase.priority).label}
                    </span>
                  </div>
                </div>

                {/* Arrest Information */}
                {(selectedCase.arrestName || selectedCase.crimeType || selectedCase.fineAmount || selectedCase.jailTime) && (
                  <div className="border-t-2 border-gray-200 pt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลการจับกุม</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedCase.arrestName && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">ชื่อ-นามสกุล IC</label>
                          <p className="mt-1 text-gray-900">{selectedCase.arrestName}</p>
                        </div>
                      )}
                      {selectedCase.crimeType && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">คดีที่โดนจับ</label>
                          <p className="mt-1 text-gray-900">{selectedCase.crimeType}</p>
                        </div>
                      )}
                      {selectedCase.fineAmount !== undefined && selectedCase.fineAmount !== null && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">ค่าปรับ</label>
                          <p className="mt-1 text-gray-900">{selectedCase.fineAmount.toLocaleString('th-TH')} บาท</p>
                        </div>
                      )}
                      {selectedCase.jailTime && (
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-gray-500">เวลาติดคุก</label>
                          <p className="mt-1 text-gray-900">{selectedCase.jailTime}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedCase.arrestImages && selectedCase.arrestImages.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">รูปตอนจับพร้อมบัตร</label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {selectedCase.arrestImages.map((url, index) => (
                        <img key={index} src={url} alt={`Arrest ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
