'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import Alert from '@/components/Alert';
import toast from 'react-hot-toast';
import axios from 'axios';
import { FileText, Plus, Filter, Search, X, ChevronDown, Calendar, User, AlertCircle } from 'lucide-react';
import CustomDatePicker from '@/components/DatePicker';
import Select from '@/components/Select';

interface Officer {
  _id: string;
  name: string;
  username: string;
  policeRank?: string;
}

interface DisciplineRecord {
  _id: string;
  officerName: string;
  officerId?: string;
  violation: string;
  violationDate?: string;
  issuedByName: string;
  status: 'pending' | 'issued' | 'appealed' | 'resolved';
  notes?: string;
  createdAt: string;
}

const VIOLATION_OPTIONS = [
  'ลาออก / ถูกปลดออกก่อนอายุการทำงานครบ 30 วัน',
  'ขาดงานเกิน 5 วัน หรือเวลาทำงานต่ำกว่า 10 ช.ม./สัปดาห์ (โดยไม่มีการแจ้งลา)',
  'ไม่เปลี่ยนชื่อ Steam เป็นชื่อ IC และมี Tag [MD] ด้านหน้าชื่อ',
  'ใส่ชุดของหน่วยงานตำรวจไปทำอย่างอื่น นอกเหนือจากการทำงาน',
  'รับฝากสิ่งของผิดกฏหมาย (ทุกประเภท)',
  'ใช้คำพูดไม่เหมาะสม (หยาบคาย , ด่าทอ)',
  'ตำรวจพูดจายุยง ปลุกปั่นให้เกิดสตอรี่ต่าง ๆ',
  'อุ้มปชช. แก๊งค์ หรือครอบครัว รวมถึงตำรวจด้วยกันในระหว่างเข้าเวร (ยกเว้น เพื่อการรักษา)',
  'นำรถ , ฮอของหน่วยงานตำรวจ ไปใช้นอกเหนือจากการทำงาน',
  'นำเรื่องภายในหน่วยงาน ข้อมูลต่าง ๆ ที่มีผลต่อองค์กร หรือสตอรี่ ไปเผยแพร่ด้านนอก',
  'ทำรถตำรวจหลุด / ทำฮอตำรวจหลุด',
  'AFK , Warzone , เลี้ยงสัตว์ , ทำงานขาว ในขณะเข้าเวร',
  'ทำงานดำ , เล่นลูปต่าง ๆ ในขณะเข้าเวร',
  'ละเลยการปฏิบัติหน้าที่ เช่น เข้าเวรยืนประจำหน้าโรงพยาบาล แต่ยืนเหม่อ',
  'เหม่อในขณะเข้าเวร เกิน 15 นาที',
  'ทำผิดกฎต่าง ๆ ที่ห้ามประชาชนทำ (เกี่ยวกับหน่วยงานตำรวจ) หรือการทำผิดกฎการใช้โรงพยาบาล เช่น กดเคสมาแล้วชุบกันเองตอนออกเวร',
];

export default function DisciplinePage() {
  const [records, setRecords] = useState<DisciplineRecord[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    startDate: '',
    endDate: '',
  });
  const [formData, setFormData] = useState({
    officerId: '',
    officerName: '',
    violation: '',
    violationDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    fetchOfficers();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [filters]);

  const fetchOfficers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const officerList = response.data.users.filter((user: any) => user.role === 'officer');
      setOfficers(officerList);
    } catch (error) {
      console.error('Failed to fetch officers:', error);
    }
  };

  const fetchRecords = async () => {
    try {
      setFetching(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await axios.get(`/api/discipline?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecords(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch records:', error);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/discipline',
        {
          officerId: formData.officerId,
          officerName: formData.officerName,
          violation: formData.violation,
          violationDate: formData.violationDate,
          notes: formData.notes || undefined,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('บันทึกโทษวินัยสำเร็จ');
      setFormData({
        officerId: '',
        officerName: '',
        violation: '',
        violationDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setShowForm(false);
      fetchRecords();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'ไม่สามารถบันทึกโทษวินัยได้';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'รอดำเนินการ',
      issued: 'ออกแล้ว',
      appealed: 'อุทธรณ์',
      resolved: 'แก้ไขแล้ว',
    };
    return labels[status] || status;
  };

  return (
    <Layout requireAuth={true}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-lg shadow-lg relative animate-pulse-slow hover:scale-110 transition-transform duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                <FileText className="w-6 h-6 text-white relative z-10" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  โทษวินัยตำรวจ
                </h1>
                <p className="text-gray-600 mt-1">บันทึกโทษวินัยตำรวจ</p>
              </div>
            </div>
          </div>
          <Button 
            variant="warning" 
            onClick={() => setShowForm(!showForm)}
            className="w-full sm:w-auto transform hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <span className="flex items-center space-x-2">
              {showForm ? (
                <>
                  <X className="w-5 h-5 animate-rotate-in" />
                  <span>ปิดฟอร์ม</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 animate-bounce-slow" />
                  <span>บันทึกโทษวินัย</span>
                </>
              )}
            </span>
          </Button>
        </div>

        {/* Form Section with smooth animation */}
        {showForm && (
          <div 
            className="bg-white rounded-xl shadow-lg border-2 border-orange-100 mb-6 overflow-visible transform transition-all duration-500 ease-out"
            style={{ zIndex: 100 }}
          >
            <div className="bg-gradient-to-r from-orange-500 to-yellow-500 px-6 py-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-10 animate-shimmer"></div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2 relative z-10">
                <AlertCircle className="w-5 h-5 animate-pulse" />
                <span>ฟอร์มบันทึกโทษวินัย</span>
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6 relative" style={{ zIndex: 100 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Officer Selection */}
                <div className="md:col-span-2 animate-slide-in-left" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
                  <Select
                    label="ชื่อตำรวจ"
                    value={formData.officerId}
                    onChange={(value) => {
                      const selectedOfficer = officers.find(d => d._id === value);
                      setFormData({ 
                        ...formData, 
                        officerId: value,
                        officerName: selectedOfficer?.name || ''
                      });
                    }}
                    options={officers.map(officer => ({
                      value: officer._id,
                      label: `${officer.name} ${officer.policeRank ? `(${officer.policeRank})` : ''} ${officer.username ? `[${officer.username}]` : ''}`
                    }))}
                    required
                    placeholder="เลือกตำรวจ"
                    searchable={true}
                  />
                </div>

                {/* Violation Date */}
                <div className="animate-slide-in-left" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
                  <CustomDatePicker
                    label="วันที่กระทำผิด"
                    value={formData.violationDate}
                    onChange={(date) => setFormData({ ...formData, violationDate: date })}
                    required
                    placeholder="เลือกวันที่กระทำผิด"
                  />
                </div>

                {/* Violation Type */}
                <div className="animate-slide-in-right" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
                  <Select
                    label="ความผิด"
                    value={formData.violation}
                    onChange={(value) => setFormData({ ...formData, violation: value })}
                    options={VIOLATION_OPTIONS.map((violation, index) => ({
                      value: violation,
                      label: violation
                    }))}
                    required
                    placeholder="เลือกความผิด"
                    searchable={true}
                  />
                </div>

                {/* Notes */}
                <div className="md:col-span-2 animate-slide-in-up" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    หมายเหตุ
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 resize-none hover:border-gray-300"
                    rows={4}
                    placeholder="กรอกหมายเหตุ (ถ้ามี)"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({
                      officerId: '',
                      officerName: '',
                      violation: '',
                      violationDate: new Date().toISOString().split('T')[0],
                      notes: '',
                    });
                  }}
                  className="w-full sm:w-auto transform hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  ยกเลิก
                </Button>
                <Button 
                  type="submit" 
                  variant="warning" 
                  isLoading={loading}
                  className="w-full sm:w-auto transform hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <span className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>บันทึกโทษวินัย</span>
                  </span>
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 mb-6 overflow-hidden transform transition-all duration-300 hover:shadow-lg">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-600 animate-spin-slow" />
              <h2 className="text-lg font-semibold text-gray-900">ตัวกรอง</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหา</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all duration-200"
                    placeholder="ค้นหาชื่อตำรวจ, ความผิด"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">วันที่เริ่มต้น</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">วันที่สิ้นสุด</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Records Table Section */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-gray-600" />
              <span>ประวัติโทษวินัย</span>
              {records.length > 0 && (
                <span className="ml-2 px-3 py-1 bg-orange-100 text-orange-700 text-sm font-semibold rounded-full">
                  {records.length} รายการ
                </span>
              )}
            </h2>
          </div>
          {fetching ? (
            <div className="p-12">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg bg-[length:200%_100%] animate-shimmer"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : records.length === 0 ? (
            <div className="p-12">
              <Alert type="info" message="ยังไม่มีการบันทึกโทษวินัย" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      ชื่อตำรวจ
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      วันที่กระทำผิด
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      ความผิด
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      ออกโดย
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      วันที่ออก
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {records.map((record, index) => (
                    <tr 
                      key={record._id} 
                      className="hover:bg-gray-50 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-md animate-slide-in-up"
                      style={{ 
                        animationDelay: `${index * 0.05}s`,
                        animationFillMode: 'both'
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{record.officerName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>
                            {record.violationDate 
                              ? new Date(record.violationDate).toLocaleDateString('th-TH', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })
                              : '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-md">
                          <p className="truncate" title={record.violation}>
                            {record.violation}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transform transition-all duration-200 hover:scale-110 ${
                            record.status === 'resolved'
                              ? 'bg-green-100 text-green-800 border border-green-200 hover:bg-green-200'
                              : record.status === 'appealed'
                              ? 'bg-yellow-100 text-yellow-800 border border-yellow-200 hover:bg-yellow-200'
                              : record.status === 'issued'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200'
                              : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'
                          }`}
                        >
                          {getStatusLabel(record.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {record.issuedByName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(record.createdAt).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
