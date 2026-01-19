'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import PoliceIDCard from '@/components/PoliceIDCard';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { getPoliceRankLabel } from '@/lib/police-ranks';
import { UserCircle, Shield, Award, Car, Calendar, Info, Settings as SettingsIcon, CreditCard } from 'lucide-react';

interface UserData {
  _id: string;
  username: string;
  name: string;
  email?: string;
  policeRank?: string;
  role: 'officer' | 'admin';
  profileImage?: string;
  driverLicense?: string;
  driverLicenseType?: '1' | '2' | '3';
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        // No token, try localStorage fallback
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          setUser(userData);
        }
        setLoading(false);
        return;
      }
      
      // Always fetch from API to get latest data including profileImage
      const response = await axios.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    } catch (error: any) {
      // Silently handle 404 (deployment issue) - use localStorage fallback
      const status = error?.response?.status;
      
      // Fallback to localStorage if API fails
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          setUser(userData);
        } catch (parseError) {
          // Silent error - localStorage parsing failed
        }
      } else {
        // Only show error if we have no fallback data and it's not a 404
        if (status !== 404) {
          toast.error('ไม่สามารถโหลดข้อมูลโปรไฟล์ได้');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    
    // Listen for profile image updates from settings page
    const handleProfileImageUpdate = (event: CustomEvent) => {
      if (event.detail?.profileImage !== undefined) {
        setUser((prevUser) => {
          if (prevUser) {
            const updatedUser = { ...prevUser, profileImage: event.detail.profileImage };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            return updatedUser;
          }
          return prevUser;
        });
      } else {
        fetchUserProfile();
      }
    };
    
    // Listen for storage changes (when user updates profile in settings)
    const handleStorageChange = () => {
      fetchUserProfile();
    };
    
    // Also check on focus (when returning from settings page)
    const handleFocus = () => {
      fetchUserProfile();
    };
    
    window.addEventListener('profileImageUpdated', handleProfileImageUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('profileImageUpdated', handleProfileImageUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []); // Empty dependency array - only run once on mount

  if (loading) {
    return (
      <Layout requireAuth={true}>
        <div className="flex items-center justify-center h-64">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout requireAuth={true}>
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-4">
            <Info className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-500">ไม่พบข้อมูลผู้ใช้</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout requireAuth={true}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <UserCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                โปรไฟล์
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">ข้อมูลบัญชีและบัตรประจำตัวตำรวจ</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ID Card Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">บัตรประจำตัวตำรวจ</h2>
                </div>
              </div>
              <div className="p-6">
                <PoliceIDCard
                  name={user.name}
                  policeRank={user.policeRank}
                  username={user.username}
                  email={user.email}
                  role={user.role}
                  profileImage={user.profileImage}
                  driverLicenseType={user.driverLicenseType}
                  createdAt={user.createdAt}
                  className="max-w-md mx-auto"
                />
              </div>
            </div>
          </div>

          {/* Info Cards Section */}
          <div className="space-y-6">
            {/* Role Card */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-100 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">บทบาท</h3>
              </div>
              <p className="text-xl font-bold text-blue-700">
                {user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ตำรวจ'}
              </p>
            </div>

            {/* Police Rank Card */}
            {user.policeRank && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-100 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Award className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">ตำแหน่งตำรวจ</h3>
                </div>
                <p className="text-xl font-bold text-amber-700">
                  {user.policeRank}. {getPoliceRankLabel(user.policeRank)}
                </p>
              </div>
            )}

            {/* Driver License Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border-2 border-emerald-100 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Car className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">ใบอนุญาติขับฮอ</h3>
              </div>
              <p className="text-base font-semibold text-emerald-700 mb-2">
                {user.driverLicenseType 
                  ? `Type ${user.driverLicenseType} - ${user.driverLicenseType === '1' ? 'พื้นฐาน' : user.driverLicenseType === '2' ? 'ขั้นกลาง' : 'ขั้นสูง'}`
                  : 'ไม่มีใบอนุญาติ'}
              </p>
              {user.driverLicense && (
                <p className="text-sm text-gray-600">เลขที่: {user.driverLicense}</p>
              )}
            </div>

            {/* Created Date Card */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-100 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">วันที่สร้างบัญชี</h3>
              </div>
              <p className="text-base font-semibold text-purple-700">
                {user.createdAt ? (() => {
                  try {
                    const date = new Date(user.createdAt);
                    if (isNaN(date.getTime())) {
                      return '-';
                    }
                    const day = date.getDate();
                    const month = date.toLocaleDateString('th-TH', { month: 'long' });
                    const year = date.getFullYear() + 543;
                    return `${day} ${month} ${year}`;
                  } catch (error) {
                    return '-';
                  }
                })() : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="mt-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-200 rounded-lg">
                  <Info className="w-5 h-5 text-gray-700" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">ข้อมูลเพิ่มเติม</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <CreditCard className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">User ID</p>
                    <p className="text-sm font-mono font-semibold text-gray-900 break-all">{user._id}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <SettingsIcon className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">สถานะบัญชี</p>
                    <p className="text-sm font-semibold text-gray-900">ใช้งานปกติ</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
