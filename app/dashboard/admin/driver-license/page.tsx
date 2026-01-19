'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useRouter } from 'next/navigation';
import { Car, Search, Check, X, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { getPoliceRankLabel } from '@/lib/police-ranks';

interface UserData {
  _id: string;
  username: string;
  name: string;
  policeRank?: string;
  role: 'officer' | 'admin';
  driverLicenseType?: '1' | '2' | '3';
}

export default function DriverLicensePage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [selectedType, setSelectedType] = useState<'1' | '2' | '3' | ''>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (user) =>
            user.name.toLowerCase().includes(query) ||
            user.username.toLowerCase().includes(query) ||
            user.policeRank?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Only show officers
      const officers = response.data.users.filter((user: UserData) => user.role === 'officer');
      setUsers(officers);
      setFilteredUsers(officers);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user: UserData) => {
    setSelectedUser(user);
    setSelectedType(user.driverLicenseType || '');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setSelectedType('');
  };

  const handleIssueLicense = async () => {
    if (!selectedUser || !selectedType) {
      toast.error('กรุณาเลือกประเภทใบอนุญาต');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `/api/admin/driver-license/${selectedUser._id}`,
        { driverLicenseType: selectedType },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(`ออกใบอนุญาต Type ${selectedType} ให้ ${selectedUser.name} เรียบร้อยแล้ว`);
      handleCloseModal();
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'ไม่สามารถออกใบอนุญาตได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeLicense = async (userId: string, userName: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการยกเลิกใบอนุญาตขับฮอของ ${userName}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `/api/admin/driver-license/${userId}`,
        { driverLicenseType: null },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(`ยกเลิกใบอนุญาตขับฮอของ ${userName} เรียบร้อยแล้ว`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'ไม่สามารถยกเลิกใบอนุญาตได้');
    }
  };

  const getLicenseTypeLabel = (type?: '1' | '2' | '3') => {
    if (!type) return 'ไม่มีใบอนุญาติ';
    const labels: Record<'1' | '2' | '3', string> = {
      '1': 'Type 1 - พื้นฐาน',
      '2': 'Type 2 - ขั้นกลาง',
      '3': 'Type 3 - ขั้นสูง',
    };
    return labels[type];
  };

  const getLicenseTypeColor = (type?: '1' | '2' | '3') => {
    if (!type) return 'bg-gray-100 text-gray-600';
    const colors: Record<'1' | '2' | '3', string> = {
      '1': 'bg-green-100 text-green-700',
      '2': 'bg-blue-100 text-blue-700',
      '3': 'bg-purple-100 text-purple-700',
    };
    return colors[type];
  };

  if (loading) {
    return (
      <Layout requireAuth={true} requireRole="admin">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout requireAuth={true} requireRole="admin">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Car className="w-8 h-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">ออกใบอนุญาติขับฮอ</h1>
          </div>
          <p className="text-gray-600">จัดการใบอนุญาตขับฮอสำหรับตำรวจ</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, username, หรือตำแหน่ง..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">ชื่อ</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Username</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">ตำแหน่ง</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">ใบอนุญาตขับฮอ</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      ไม่พบข้อมูลตำรวจ
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900 font-medium">{user.name}</td>
                      <td className="py-3 px-4 text-gray-600">{user.username}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {user.policeRank ? getPoliceRankLabel(user.policeRank) : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getLicenseTypeColor(
                            user.driverLicenseType
                          )}`}
                        >
                          {getLicenseTypeLabel(user.driverLicenseType)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end space-x-2">
                          {user.driverLicenseType ? (
                            <>
                  <button
                    onClick={() => handleOpenModal(user)}
                    className="flex items-center px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    แก้ไข
                  </button>
                              <button
                                onClick={() => handleRevokeLicense(user._id, user.name)}
                                className="flex items-center px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
                              >
                                <X className="w-4 h-4 mr-1" />
                                ยกเลิก
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleOpenModal(user)}
                              className="flex items-center px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              ออกใบอนุญาต
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal for Issuing/Editing License */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {selectedUser.driverLicenseType ? 'แก้ไข' : 'ออก'}ใบอนุญาตขับฮอ
              </h2>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">ตำรวจ</p>
                <p className="text-lg font-semibold text-gray-900">{selectedUser.name}</p>
                <p className="text-sm text-gray-500">{selectedUser.username}</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลือกประเภทใบอนุญาต
                </label>
                <div className="space-y-2">
                  {(['1', '2', '3'] as const).map((type) => (
                    <label
                      key={type}
                      className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                        selectedType === type
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="licenseType"
                        value={type}
                        checked={selectedType === type}
                        onChange={(e) => setSelectedType(e.target.value as '1' | '2' | '3')}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium text-gray-900">
                          Type {type} - {type === '1' ? 'พื้นฐาน' : type === '2' ? 'ขั้นกลาง' : 'ขั้นสูง'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {type === '1'
                            ? 'ระดับพื้นฐานสำหรับการขับขี่รถยนต์ทั่วไป'
                            : type === '2'
                            ? 'ระดับขั้นกลางสำหรับการขับขี่รถยนต์ที่มีความซับซ้อนมากขึ้น'
                            : 'ระดับขั้นสูงสำหรับการขับขี่รถยนต์ทุกประเภท'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleIssueLicense}
                  disabled={isSubmitting || !selectedType}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : selectedUser.driverLicenseType ? 'บันทึกการเปลี่ยนแปลง' : 'ออกใบอนุญาต'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
