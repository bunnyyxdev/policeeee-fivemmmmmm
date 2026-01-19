'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Alert from '@/components/Alert';
import PasswordInput from '@/components/PasswordInput';
import toast from 'react-hot-toast';
import axios from 'axios';
import { User, Shield, Award, Lock, ArrowLeft } from 'lucide-react';
import { POLICE_RANKS } from '@/lib/police-ranks';

export default function CreateUserPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    policeRank: '' as string,
    role: 'officer' as 'officer' | 'admin',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/admin/users',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success('สร้างบัญชีผู้ใช้สำเร็จ');
      router.push('/dashboard/admin/users');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'ไม่สามารถสร้างบัญชีผู้ใช้ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout requireAuth={true} requireRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">กลับ</span>
            </button>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                เพิ่มชื่อตำรวจ
              </h1>
              <p className="text-gray-600">สร้างบัญชีตำรวจใหม่ในระบบ</p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
              <h2 className="text-lg font-semibold text-white">ข้อมูลบัญชีตำรวจ</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Police Rank Field */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <Award className="w-5 h-5 text-blue-600" />
                  <span>ตำแหน่งตำรวจในโรงพยาบาล</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.policeRank}
                    onChange={(e) => setFormData({ ...formData, policeRank: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white text-gray-900 appearance-none cursor-pointer hover:border-gray-300"
                  >
                    <option value="">เลือกตำแหน่งตำรวจ (ไม่บังคับ)</option>
                    {POLICE_RANKS.map((rank) => (
                      <option key={rank.value} value={rank.value}>
                        {rank.value}. {rank.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500 ml-7">เลือกตำแหน่งตำรวจในโรงพยาบาล</p>
              </div>

              {/* Name Field */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <User className="w-5 h-5 text-blue-600" />
                  <span>ชื่อ - นามสกุล IC <span className="text-red-500">*</span></span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white text-gray-900 placeholder-gray-400 hover:border-gray-300"
                  placeholder="กรอกชื่อ-นามสกุลตามบัตรประชาชน (เช่น นายตำรวจ สมชาย ใจดี)"
                />
                <p className="text-xs text-gray-500 ml-7">ชื่อเต็มตามบัตรประชาชนหรือชื่อที่ใช้ในระบบ</p>
              </div>

              {/* Username Field */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <User className="w-5 h-5 text-blue-600" />
                  <span>User ตำรวจ <span className="text-red-500">*</span></span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white text-gray-900 placeholder-gray-400 hover:border-gray-300"
                  placeholder="กรอกชื่อผู้ใช้สำหรับเข้าสู่ระบบ (เช่น officer01)"
                />
                <p className="text-xs text-gray-500 ml-7">ชื่อผู้ใช้ที่ตำรวจจะใช้สำหรับเข้าสู่ระบบ</p>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <Lock className="w-5 h-5 text-blue-600" />
                  <span>รหัส Login ตำรวจ <span className="text-red-500">*</span></span>
                </label>
                <PasswordInput
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="กรอกรหัสผ่านสำหรับเข้าสู่ระบบ (ขั้นต่ำ 8 ตัวอักษร)"
                  autoComplete="new-password"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white text-gray-900 placeholder-gray-400 hover:border-gray-300"
                />
                <p className="text-xs text-gray-500 ml-7">รหัสผ่านที่ตำรวจจะใช้สำหรับเข้าสู่ระบบ</p>
              </div>

              {/* Role Field */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span>บทบาท <span className="text-red-500">*</span></span>
                </label>
                <div className="relative">
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'officer' | 'admin' })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white text-gray-900 appearance-none cursor-pointer hover:border-gray-300"
                  >
                    <option value="officer">ตำรวจ</option>
                    <option value="admin">ผู้ดูแลระบบ</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 pt-6"></div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
                >
                  ยกเลิก
                </button>
                <Button
                  type="submit"
                  variant="success"
                  isLoading={loading}
                  description="สร้างบัญชีตำรวจใหม่ในระบบ"
                >
                  เพิ่มตำรวจ
                </Button>
              </div>
            </form>
          </div>
          
          {/* Help Text */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>หมายเหตุ:</strong> สร้างบัญชีตำรวจใหม่ในระบบ หลังจากสร้างแล้วตำรวจสามารถใช้ชื่อผู้ใช้และรหัสผ่านที่ระบุเข้าสู่ระบบได้ทันที
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
