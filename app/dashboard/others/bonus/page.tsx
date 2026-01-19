'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Gift, Users, DollarSign, Calendar, FileText, User, Info } from 'lucide-react';

interface Bonus {
  _id: string;
  amount: number;
  reason: string;
  bonusType: string;
  recipientName: string;
  reportedByName: string;
  date: string;
  status: string;
  createdAt: string;
}

export default function BonusPage() {
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBonuses();
  }, []);

  const fetchBonuses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/bonus', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBonuses(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch bonuses:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = bonuses.reduce((sum, bonus) => sum + bonus.amount, 0);

  return (
    <Layout requireAuth={true}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                ประวัติแจ้งเหม๋อของทุกคน
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">ดูประวัติการแจ้งเหม๋อของทุกคนในระบบ</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">ยอดรวมเหม๋อ</p>
                  <p className="text-2xl font-bold text-purple-700">{totalAmount.toLocaleString()} บาท</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">จำนวนรายการ</p>
                  <p className="text-2xl font-bold text-blue-700">{bonuses.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Gift className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* History Section */}
        <div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-200 rounded-lg">
                  <FileText className="w-5 h-5 text-gray-700" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">ประวัติแจ้งเหม๋อของทุกคน</h2>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-purple-600 mb-4"></div>
                <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
              </div>
            ) : bonuses.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-50 to-pink-50 rounded-full mb-4">
                  <Info className="w-10 h-10 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">ยังไม่มีการแจ้งเหม๋อ</h3>
                <p className="text-gray-500">ยังไม่มีข้อมูลการแจ้งเหม๋อในระบบ</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {bonuses.map((bonus, index) => (
                  <div
                    key={bonus._id}
                    className="p-6 hover:bg-gray-50 transition-colors duration-200"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Amount Section */}
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-50 rounded-lg">
                          <DollarSign className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">จำนวนเงิน</p>
                          <p className="text-lg font-bold text-purple-700">{bonus.amount.toLocaleString()} บาท</p>
                        </div>
                      </div>

                      {/* Middle Section */}
                      <div className="flex-1 space-y-2">
                        <p className="text-sm text-gray-700 line-clamp-2">{bonus.reason}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <p className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>ผู้รับ: {bonus.recipientName}</span>
                          </p>
                          <span>•</span>
                          <p className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>แจ้งโดย: {bonus.reportedByName}</span>
                          </p>
                        </div>
                      </div>

                      {/* Date Section */}
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">วันที่</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {new Date(bonus.date).toLocaleDateString('th-TH', {
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
