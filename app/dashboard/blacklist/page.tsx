'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import Alert from '@/components/Alert';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Ban, Plus, X, Users, FileText, CheckCircle2, Info, User, Calendar, Trash2, AlertCircle, ChevronDown, CheckCircle, XCircle, CheckSquare, Square } from 'lucide-react';
import { BLACKLIST_CHARGES } from '@/lib/blacklist-charges';

interface BlacklistItem {
  _id: string;
  name: string;
  reason: string;
  fineAmount?: number;
  paymentStatus?: 'unpaid' | 'paid';
  paidAt?: string;
  paidByName?: string;
  createdAt: string;
  addedByName: string;
}

export default function BlacklistPage() {
  const [blacklist, setBlacklist] = useState<BlacklistItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    charge: '', // ข้อหาจาก dropdown
    reason: '', // รายละเอียดเพิ่มเติม (optional)
    fineAmount: '', // ราคาค่าปรับ
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    fetchBlacklist();
  }, []);

  const fetchBlacklist = async () => {
    try {
      setFetching(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('/api/blacklist', {
        headers: { Authorization: `Bearer ${token}` },
        params: { _t: Date.now() },
      });

      setBlacklist(response.data.data || []);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast.error('ไม่สามารถโหลดรายการ Blacklist ได้');
      }
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('กรุณาเข้าสู่ระบบ');
        return;
      }

      const response = await axios.post(
        '/api/blacklist',
        {
          name: formData.name,
          charge: formData.charge,
          reason: formData.reason,
          fineAmount: formData.fineAmount || undefined,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('เพิ่มในแบล็คลิสสำเร็จ');
      setFormData({ name: '', charge: '', reason: '', fineAmount: '' });
      setShowForm(false);
      fetchBlacklist(); // Refresh list
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'ไม่สามารถเพิ่มในแบล็คลิสได้';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้ออกจากแบล็คลิส?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('กรุณาเข้าสู่ระบบ');
        return;
      }

      await axios.delete(`/api/blacklist/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('ลบออกจากแบล็คลิสแล้ว');
      fetchBlacklist(); // Refresh list
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'ไม่สามารถลบรายการได้';
      toast.error(errorMsg);
    }
  };

  const handleUpdatePaymentStatus = async (id: string, currentStatus: 'unpaid' | 'paid' | undefined) => {
    const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
    const confirmMessage = newStatus === 'paid' 
      ? 'ยืนยันการอัปเดตสถานะเป็น "ชำระค่าปรับแล้ว"?'
      : 'ยืนยันการอัปเดตสถานะเป็น "ยังไม่ชำระค่าปรับ"?';

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('กรุณาเข้าสู่ระบบ');
        return;
      }

      await axios.put(
        `/api/blacklist/${id}`,
        { paymentStatus: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(newStatus === 'paid' ? 'อัปเดตสถานะเป็นชำระค่าปรับแล้ว' : 'อัปเดตสถานะเป็นยังไม่ชำระค่าปรับ');
      fetchBlacklist(); // Refresh list
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'ไม่สามารถอัปเดตสถานะได้';
      toast.error(errorMsg);
    }
  };

  // Bulk Actions Handlers
  const handleToggleSelection = (id: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const itemsWithFine = blacklist.filter((item) => item.fineAmount !== undefined && item.fineAmount > 0);
    if (selectedItems.size === itemsWithFine.length) {
      // Deselect all
      setSelectedItems(new Set());
    } else {
      // Select all items with fine
      setSelectedItems(new Set(itemsWithFine.map((item) => item._id)));
    }
  };

  const handleBulkUpdatePaymentStatus = async (status: 'paid' | 'unpaid') => {
    if (selectedItems.size === 0) {
      toast.error('กรุณาเลือกรายการที่ต้องการอัปเดต');
      return;
    }

    const confirmMessage = status === 'paid'
      ? `ยืนยันการอัปเดตสถานะเป็น "ชำระค่าปรับแล้ว" สำหรับ ${selectedItems.size} รายการ?`
      : `ยืนยันการอัปเดตสถานะเป็น "ยังไม่ชำระค่าปรับ" สำหรับ ${selectedItems.size} รายการ?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setBulkActionLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('กรุณาเข้าสู่ระบบ');
      setBulkActionLoading(false);
      return;
    }

    try {
      const selectedIds = Array.from(selectedItems);
      let successCount = 0;
      let failCount = 0;

      // Update each item sequentially
      for (const id of selectedIds) {
        try {
          await axios.put(
            `/api/blacklist/${id}`,
            { paymentStatus: status },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          successCount++;
        } catch (error) {
          failCount++;
          console.error(`Failed to update item ${id}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`อัปเดตสถานะสำเร็จ ${successCount} รายการ${failCount > 0 ? ` (ล้มเหลว ${failCount} รายการ)` : ''}`);
      } else {
        toast.error('ไม่สามารถอัปเดตสถานะได้');
      }

      setSelectedItems(new Set());
      fetchBlacklist();
    } catch (error: any) {
      toast.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) {
      toast.error('กรุณาเลือกรายการที่ต้องการลบ');
      return;
    }

    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ ${selectedItems.size} รายการออกจากแบล็คลิส?`)) {
      return;
    }

    setBulkActionLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('กรุณาเข้าสู่ระบบ');
      setBulkActionLoading(false);
      return;
    }

    try {
      const selectedIds = Array.from(selectedItems);
      let successCount = 0;
      let failCount = 0;

      // Delete each item sequentially
      for (const id of selectedIds) {
        try {
          await axios.delete(`/api/blacklist/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          successCount++;
        } catch (error) {
          failCount++;
          console.error(`Failed to delete item ${id}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`ลบรายการสำเร็จ ${successCount} รายการ${failCount > 0 ? ` (ล้มเหลว ${failCount} รายการ)` : ''}`);
      } else {
        toast.error('ไม่สามารถลบรายการได้');
      }

      setSelectedItems(new Set());
      fetchBlacklist();
    } catch (error: any) {
      toast.error('เกิดข้อผิดพลาดในการลบรายการ');
    } finally {
      setBulkActionLoading(false);
    }
  };

  return (
    <Layout requireAuth={true}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  แบล็คลิส
                </h1>
                <p className="text-gray-500 text-sm mt-0.5">จัดการรายการแบล็คลิส</p>
              </div>
            </div>
            <Button 
              variant="danger" 
              onClick={() => setShowForm(!showForm)}
              className="shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <span className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>เพิ่มรายการ</span>
              </span>
            </Button>
          </div>
        </div>

        {/* Form Section */}
        {showForm && (
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-white" />
                    <h2 className="text-xl font-semibold text-white">ฟอร์มเพิ่มรายการแบล็คลิส</h2>
                  </div>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setFormData({ name: '', charge: '', reason: '', fineAmount: '' });
                    }}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อ *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                      placeholder="กรอกชื่อ"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ข้อหา *</label>
                    <div className="relative">
                      <select
                        required
                        value={formData.charge}
                        onChange={(e) => setFormData({ ...formData, charge: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 appearance-none bg-white pr-10"
                      >
                        <option value="">-- เลือกข้อหา --</option>
                        {BLACKLIST_CHARGES.map((charge, index) => (
                          <option key={index} value={charge}>
                            {charge}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      รายละเอียดเพิ่มเติม <span className="text-gray-400 text-xs">(ไม่บังคับ)</span>
                    </label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 resize-none"
                      rows={3}
                      placeholder="กรอกรายละเอียดเพิ่มเติม (ถ้ามี)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ราคาค่าปรับ <span className="text-gray-400 text-xs">(ไม่บังคับ)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                        <span className="text-gray-400 font-medium">บาท</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.fineAmount}
                        onChange={(e) => setFormData({ ...formData, fineAmount: e.target.value })}
                        className="w-full pl-16 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                        placeholder="0.00"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">กรอกเป็นตัวเลข (บาท) เช่น 1000 หรือ 1500.50</p>
                  </div>
                  <div className="flex items-center space-x-4 pt-4">
                    <Button type="submit" variant="danger" isLoading={loading} className="flex-1 sm:flex-none">
                      <span className="flex items-center space-x-2">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>เพิ่มรายการ</span>
                      </span>
                    </Button>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={() => setShowForm(false)}
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
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-200 rounded-lg">
                    <FileText className="w-5 h-5 text-gray-700" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">รายการแบล็คลิส</h2>
                </div>
                
                {/* Bulk Actions */}
                {blacklist.length > 0 && (
                  <div className="flex items-center space-x-3">
                    {selectedItems.size > 0 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">เลือกแล้ว: {selectedItems.size} รายการ</span>
                        <button
                          onClick={() => setSelectedItems(new Set())}
                          className="text-xs text-gray-500 hover:text-gray-700 underline"
                          disabled={bulkActionLoading}
                        >
                          ล้างการเลือก
                        </button>
                      </div>
                    )}
                    <button
                      onClick={handleSelectAll}
                      disabled={bulkActionLoading || blacklist.filter((item) => item.fineAmount !== undefined && item.fineAmount > 0).length === 0}
                      className="px-3 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="เลือกทั้งหมด (เฉพาะรายการที่มีค่าปรับ)"
                    >
                      {selectedItems.size === blacklist.filter((item) => item.fineAmount !== undefined && item.fineAmount > 0).length ? 'ยกเลิกเลือกทั้งหมด' : 'เลือกทั้งหมด'}
                    </button>
                  </div>
                )}
              </div>

              {/* Bulk Action Buttons */}
              {selectedItems.size > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-300 flex items-center space-x-3 flex-wrap gap-2">
                  <span className="text-sm font-medium text-gray-700">Bulk Actions:</span>
                  <button
                    onClick={() => handleBulkUpdatePaymentStatus('paid')}
                    disabled={bulkActionLoading}
                    className="px-4 py-2 text-sm bg-green-50 hover:bg-green-100 text-green-700 rounded-lg border border-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>อัปเดตเป็น "ชำระแล้ว" ({selectedItems.size})</span>
                  </button>
                  <button
                    onClick={() => handleBulkUpdatePaymentStatus('unpaid')}
                    disabled={bulkActionLoading}
                    className="px-4 py-2 text-sm bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg border border-orange-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>อัปเดตเป็น "ยังไม่ชำระ" ({selectedItems.size})</span>
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={bulkActionLoading}
                    className="px-4 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border border-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>ลบที่เลือก ({selectedItems.size})</span>
                  </button>
                </div>
              )}
            </div>

            {fetching ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                  <Info className="w-10 h-10 text-gray-400 animate-pulse" />
                </div>
                <p className="text-gray-500">กำลังโหลด...</p>
              </div>
            ) : blacklist.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-50 to-emerald-50 rounded-full mb-4">
                  <Info className="w-10 h-10 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">ไม่มีรายการในแบล็คลิส</h3>
                <p className="text-gray-500">ไม่มีรายการในแบล็คลิส</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {blacklist.map((item, index) => {
                  const isSelected = selectedItems.has(item._id);
                  const canSelect = item.fineAmount !== undefined && item.fineAmount > 0;
                  
                  return (
                    <div
                      key={item._id}
                      className={`p-6 transition-colors duration-200 ${
                        isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
                      }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                        {/* Checkbox */}
                        {canSelect && (
                          <div className="flex items-start pt-1">
                            <button
                              onClick={() => handleToggleSelection(item._id)}
                              disabled={bulkActionLoading}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                isSelected
                                  ? 'bg-blue-500 border-blue-500 text-white'
                                  : 'border-gray-300 hover:border-blue-400'
                              }`}
                              title={isSelected ? 'ยกเลิกเลือก' : 'เลือก'}
                            >
                              {isSelected && <CheckCircle className="w-4 h-4" />}
                            </button>
                          </div>
                        )}
                        {/* Name Section */}
                        <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="p-2 bg-red-50 rounded-lg">
                            <Ban className="w-5 h-5 text-red-600" />
                          </div>
                          <h3 className="text-lg font-bold text-red-600">{item.name}</h3>
                        </div>
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700 whitespace-pre-line">{item.reason}</p>
                        </div>
                        {item.fineAmount !== undefined && item.fineAmount > 0 && (
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center space-x-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <span className="text-sm font-semibold text-yellow-700">
                                ค่าปรับ: {item.fineAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                              </span>
                            </div>
                            {/* Payment Status */}
                            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border ${
                              item.paymentStatus === 'paid' 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-red-50 border-red-200'
                            }`}>
                              {item.paymentStatus === 'paid' ? (
                                <>
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  <span className="text-sm font-semibold text-green-700">
                                    ชำระค่าปรับแล้ว
                                  </span>
                                  {item.paidAt && (
                                    <span className="text-xs text-green-600 ml-2">
                                      ({new Date(item.paidAt).toLocaleDateString('th-TH', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                      })})
                                    </span>
                                  )}
                                  {item.paidByName && (
                                    <span className="text-xs text-green-600 ml-1">
                                      โดย {item.paidByName}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 text-red-600" />
                                  <span className="text-sm font-semibold text-red-700">
                                    ยังไม่ชำระค่าปรับ
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="mt-2 text-xs text-gray-500">
                          เพิ่มโดย: {item.addedByName}
                        </div>
                      </div>

                      {/* Date & Actions Section */}
                      <div className="flex flex-col items-end space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(item.createdAt).toLocaleDateString('th-TH', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {/* Update Payment Status Button - Only show if there's a fine amount */}
                          {item.fineAmount !== undefined && item.fineAmount > 0 && (
                            <button
                              onClick={() => handleUpdatePaymentStatus(item._id, item.paymentStatus)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-1 ${
                                item.paymentStatus === 'paid'
                                  ? 'bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200'
                                  : 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'
                              }`}
                              title={item.paymentStatus === 'paid' ? 'เปลี่ยนเป็นยังไม่ชำระค่าปรับ' : 'เปลี่ยนเป็นชำระค่าปรับแล้ว'}
                            >
                              {item.paymentStatus === 'paid' ? (
                                <>
                                  <XCircle className="w-4 h-4" />
                                  <span>ยังไม่ชำระ</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  <span>ชำระแล้ว</span>
                                </>
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => handleRemove(item._id)}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors duration-200"
                            title="ลบรายการ"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
