'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useRouter } from 'next/navigation';
import { UserPlus, Edit, Trash2, Shield, User, X, Award, Upload } from 'lucide-react';
import Button from '@/components/Button';
import Alert from '@/components/Alert';
import PasswordInput from '@/components/PasswordInput';
import toast from 'react-hot-toast';
import axios from 'axios';
import { getPoliceRankLabel, POLICE_RANKS } from '@/lib/police-ranks';

interface UserData {
  _id: string;
  username: string;
  name: string;
  email?: string;
  policeRank?: string;
  role: 'officer' | 'admin';
  profileImage?: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [failedUserIds, setFailedUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Clear any stale failed user IDs on mount (allow them to be checked again)
    // This helps recover if database was cleaned up
    setFailedUserIds(new Set());
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    // Prevent multiple simultaneous fetches
    if (refreshing) {
      return;
    }
    
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Log database name for debugging
      if (response.data._dbName) {
        // Database name is in the response - check MongoDB Compass for this database
        // The "admin" database is a system database, not where your app data is stored
      }

      // Ensure all user IDs are valid strings and filter out previously failed users
      const allUsers = (response.data.users || []).filter((user: UserData) => {
        return user && 
               user._id && 
               typeof user._id === 'string' && 
               user._id.length === 24;
      });

      // Filter out failed users (keep them filtered even if API returns them)
      const validUsers = allUsers.filter((user: UserData) => !failedUserIds.has(user._id));

      setUsers(validUsers);
      
      // Only remove failed IDs if the user was successfully validated (not just returned by API)
      // This prevents deleted users from reappearing
      // Failed users stay in the set until they're successfully fetched individually
      // We don't clear failedUserIds here - they persist across refreshes
    } catch (error: any) {
      // More detailed error handling
      const status = error.response?.status;
      const errorMessage = error.response?.data?.error;
      
      // Handle different error types
      if (status === 401) {
        toast.error('ไม่มีสิทธิ์เข้าถึง - กรุณาเข้าสู่ระบบใหม่');
      } else if (status === 403) {
        toast.error('ไม่มีสิทธิ์เข้าถึงข้อมูลผู้ใช้');
      } else if (status === 503 || error.message?.includes('MongoDB') || error.message?.includes('connect')) {
        toast.error('ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้ - กรุณาตรวจสอบการเชื่อมต่อ');
      } else if (status >= 500) {
        toast.error('เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ - กรุณาลองใหม่อีกครั้ง');
      } else if (errorMessage) {
        toast.error(errorMessage);
      } else if (error.message) {
        toast.error(`ไม่สามารถโหลดข้อมูลผู้ใช้ได้: ${error.message}`);
      } else {
        toast.error('ไม่สามารถโหลดข้อมูลผู้ใช้ได้ - กรุณาลองใหม่อีกครั้ง');
      }
      
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const [editFormData, setEditFormData] = useState({
    username: '',
    password: '',
    name: '',
    policeRank: '' as string,
    role: 'officer' as 'officer' | 'admin',
    profileImage: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editFetching, setEditFetching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleEditClick = async (user: UserData) => {
    // Prevent multiple clicks while fetching
    if (editFetching) {
      return;
    }
    
    // Check if this user has already failed before
    if (failedUserIds.has(user._id)) {
      // Remove from list and refresh
      setUsers(prevUsers => prevUsers.filter(u => u._id !== user._id));
      toast.error('ผู้ใช้ไม่พบในระบบ - ถูกลบออกจากรายการแล้ว');
      if (!refreshing) {
        fetchUsers();
      }
      return;
    }
    
    // Check if user still exists in the list (might have been removed)
    const userExists = users.some(u => u._id === user._id);
    if (!userExists) {
      toast.error('ผู้ใช้ถูกลบออกจากระบบแล้ว');
      return;
    }
    
    setSelectedUser(user);
    setShowEditModal(true);
    setEditFetching(true);
    
    // Always fetch fresh data from database to ensure sync
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/admin/users/${user._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        // Suppress console errors for 404s (expected for deleted users)
        validateStatus: (status) => status < 500,
      });

      // Populate form with fresh data from database
      const userData = response.data.user;
      setEditFormData({
        username: userData.username || '',
        password: '',
        name: userData.name || '',
        policeRank: userData.policeRank || '',
        role: userData.role || 'officer',
        profileImage: userData.profileImage || '',
      });
      
      // Set image preview from database
      if (userData.profileImage) {
        setImagePreview(userData.profileImage);
      } else {
        setImagePreview(null);
      }
    } catch (error: any) {
      const status = error.response?.status;
      
      // If user not found (404), mark as failed and close modal
      if (status === 404) {
        // Mark this user ID as failed to prevent future requests
        setFailedUserIds(prev => new Set(prev).add(user._id));
        
        // Remove user from local state immediately
        setUsers(prevUsers => prevUsers.filter(u => u._id !== user._id));
        
        // Close modal before showing toast
        setShowEditModal(false);
        setSelectedUser(null);
        
        toast.error('ผู้ใช้ไม่พบในระบบ - ถูกลบออกจากรายการแล้ว');
        
        // Refresh the user list in the background (will filter out failed users)
        if (!refreshing) {
          setTimeout(() => fetchUsers(), 100); // Small delay to ensure state updates
        }
        return; // Exit early to prevent further processing
      } else {
        // For other errors, show error and close modal
        const errorMessage = error.response?.data?.error || 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้';
        toast.error(errorMessage);
        setShowEditModal(false);
      }
    } finally {
      setEditFetching(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setEditLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const updateData: any = {
        name: editFormData.name,
        username: editFormData.username,
        policeRank: editFormData.policeRank || undefined,
        role: editFormData.role,
        profileImage: editFormData.profileImage || undefined,
      };

      if (editFormData.password && editFormData.password.length > 0) {
        updateData.password = editFormData.password;
      }

      await axios.put(
        `/api/admin/users/${selectedUser._id}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success('อัปเดตข้อมูลผู้ใช้สำเร็จ');
      setShowEditModal(false);
      setSelectedUser(null);
      setImagePreview(null);
      
      // Refresh user list from database to sync with latest changes
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้');
    } finally {
      setEditLoading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('ขนาดไฟล์เกิน 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('กรุณาเลือกรูปภาพเท่านั้น');
      return;
    }

    setImagePreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const token = localStorage.getItem('token');
      const formDataToUpload = new FormData();
      formDataToUpload.append('file', file);

      const uploadResponse = await axios.post(
        '/api/upload/image?folder=profiles',
        formDataToUpload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const imageUrl = uploadResponse.data.data.url;
      setEditFormData({ ...editFormData, profileImage: imageUrl });
      setImagePreview(imageUrl);
      toast.success('อัพโหลดรูปโปรไฟล์สำเร็จ');
      
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'ไม่สามารถอัพโหลดรูปภาพได้');
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setEditFormData({ ...editFormData, profileImage: '' });
    setImagePreview(null);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้นี้?')) {
      return;
    }

    setDeleteLoading(userId);

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success('ลบผู้ใช้สำเร็จ');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'ไม่สามารถลบผู้ใช้ได้');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDeleteAll = async () => {
    // Double confirmation
    const firstConfirm = window.confirm(
      '⚠️ คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ทั้งหมด?\n\nการดำเนินการนี้จะลบผู้ใช้ทั้งหมดยกเว้นบัญชีของคุณเอง\n\nกด "OK" เพื่อยืนยัน'
    );
    
    if (!firstConfirm) {
      return;
    }

    const secondConfirm = window.confirm(
      '⚠️ การยืนยันครั้งสุดท้าย\n\nคุณแน่ใจ 100% ว่าต้องการลบผู้ใช้ทั้งหมดหรือไม่?\n\nการดำเนินการนี้ไม่สามารถยกเลิกได้!'
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

      const response = await axios.delete('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        // Add cache-busting
        params: {
          _t: Date.now()
        }
      });

      if (response.data && response.data.deletedCount !== undefined) {
        toast.success(`ลบผู้ใช้ทั้งหมดสำเร็จ (${response.data.deletedCount} รายการ)`);
        setUsers([]); // Clear the list immediately
        setFailedUserIds(new Set()); // Clear failed user IDs
        
        // Wait a bit before refreshing to ensure DB is updated
        setTimeout(async () => {
          await fetchUsers(); // Refresh to show only the current admin
        }, 500);
      } else {
        toast.error('ไม่ได้รับข้อมูลการลบจากเซิร์ฟเวอร์');
      }
    } catch (error: any) {
      const status = error.response?.status;
      const errorData = error.response?.data;
      let errorMessage = errorData?.error || error.message || 'ไม่สามารถลบผู้ใช้ทั้งหมดได้';
      
      // Handle specific error cases
      if (status === 401) {
        if (errorData?.code === 'INVALID_TOKEN') {
          errorMessage = 'Token ไม่ถูกต้อง - กรุณาเข้าสู่ระบบใหม่';
          // Redirect to login after a delay
          setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/login');
          }, 2000);
        } else {
          errorMessage = 'กรุณาเข้าสู่ระบบใหม่';
        }
      } else if (status === 403) {
        errorMessage = 'คุณไม่มีสิทธิ์ในการดำเนินการนี้';
      } else if (status === 500) {
        errorMessage = 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ - กรุณาลองอีกครั้ง';
      }
      
      toast.error(errorMessage);
      
      // Log detailed error in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Delete all users error:', {
          status,
          data: errorData,
          message: error.message,
          fullError: error
        });
      }
    } finally {
      setDeleteAllLoading(false);
    }
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">จัดการผู้ใช้</h1>
            <p className="text-gray-600">เพิ่ม แก้ไข และลบบัญชีตำรวจ</p>
          </div>
          <div className="flex items-center space-x-3">
            {users.length > 1 && (
              <Button
                variant="danger"
                onClick={handleDeleteAll}
                disabled={deleteAllLoading || deleteLoading !== null}
                description="ลบผู้ใช้ทั้งหมด (ยกเว้นบัญชีของคุณ)"
              >
                <span className="flex items-center space-x-2">
                  <Trash2 className="w-5 h-5" />
                  <span>{deleteAllLoading ? 'กำลังลบ...' : 'ลบทั้งหมด'}</span>
                </span>
              </Button>
            )}
            <Button
              variant="success"
              onClick={() => router.push('/dashboard/admin/users/create')}
              description="เพิ่มบัญชีตำรวจใหม่"
            >
              <span className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5" />
                <span>เพิ่มตำรวจ</span>
              </span>
            </Button>
          </div>
        </div>

        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รูปโปรไฟล์</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ตำรวจ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ยศตำรวจ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อ - นามสกุล IC</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">อีเมล</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">บทบาท</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่สร้าง</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      ไม่มีผู้ใช้ในระบบ
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.profileImage ? (
                          <div className="relative group">
                            <img
                              src={user.profileImage}
                              alt={user.name || user.username}
                              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 cursor-pointer hover:border-blue-500 transition-all"
                              onClick={() => {
                                // Open image in new tab to view full size
                                window.open(user.profileImage, '_blank');
                              }}
                              title="คลิกเพื่อดูรูปเต็ม"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-200 to-indigo-200 flex items-center justify-center border-2 border-gray-200">
                            <span className="text-lg font-bold text-blue-600">
                              {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.policeRank ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {user.policeRank}. {getPoliceRankLabel(user.policeRank)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {user.role === 'admin' ? (
                            <>
                              <Shield className="w-3 h-3 mr-1" />
                              Admin
                            </>
                          ) : (
                            <>
                              <User className="w-3 h-3 mr-1" />
                              ตำรวจ
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString('th-TH')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleEditClick(user)}
                            disabled={editFetching || deleteLoading === user._id || failedUserIds.has(user._id)}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title={failedUserIds.has(user._id) ? 'ผู้ใช้ไม่พบในระบบ' : 'แก้ไขผู้ใช้'}
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(user._id)}
                            disabled={deleteLoading === user._id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 transition-colors"
                            title="ลบผู้ใช้"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit User Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between sticky top-0 z-10 rounded-t-2xl">
                <h2 className="text-2xl font-bold text-white">แก้ไขข้อมูลผู้ใช้</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                    setImagePreview(null);
                    setEditFormData({
                      username: '',
                      password: '',
                      name: '',
                      policeRank: '',
                      role: 'officer',
                      profileImage: '',
                    });
                  }}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              {editFetching ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
                </div>
              ) : (
                <div className="p-6">
                  {/* Profile Image Section */}
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">รูปโปรไฟล์</h3>
                    <div className="flex items-center space-x-6">
                      <div className="relative">
                        {imagePreview ? (
                          <div className="relative">
                            <img
                              src={imagePreview}
                              alt={editFormData.name || 'Profile'}
                              className="w-32 h-32 rounded-full object-cover border-4 border-blue-200 shadow-lg"
                            />
                            {editFormData.profileImage && (
                              <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                                title="ลบรูปภาพ"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-200 to-indigo-200 flex items-center justify-center border-4 border-blue-200 shadow-lg">
                            <span className="text-4xl font-bold text-blue-600">
                              {editFormData.name ? editFormData.name.charAt(0).toUpperCase() : '?'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <label className="block">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            disabled={uploading}
                            id="edit-profile-image-upload"
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => document.getElementById('edit-profile-image-upload')?.click()}
                            isLoading={uploading}
                            disabled={uploading}
                          >
                            <span className="flex items-center space-x-2">
                              <Upload className="w-4 h-4" />
                              <span>{editFormData.profileImage ? 'เปลี่ยนรูป' : 'อัพโหลดรูป'}</span>
                            </span>
                          </Button>
                        </label>
                        <p className="text-sm text-gray-500 mt-2">
                          รองรับไฟล์ PNG, JPG, GIF (สูงสุด 5MB)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Edit Form */}
                  <form onSubmit={handleEditSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="flex items-center space-x-2">
                          <Award className="w-4 h-4" />
                          <span>ตำแหน่งตำรวจในโรงพยาบาล</span>
                        </span>
                      </label>
                      <select
                        value={editFormData.policeRank}
                        onChange={(e) => setEditFormData({ ...editFormData, policeRank: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">เลือกตำแหน่งตำรวจ (ไม่บังคับ)</option>
                        {POLICE_RANKS.map((rank) => (
                          <option key={rank.value} value={rank.value}>
                            {rank.value}. {rank.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>ชื่อ - นามสกุล IC *</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        required
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="กรอกชื่อ-นามสกุลตามบัตรประชาชน"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>User ตำรวจ *</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        required
                        value={editFormData.username}
                        onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="กรอกชื่อผู้ใช้สำหรับเข้าสู่ระบบ"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        รหัส Login ตำรวจ (ไม่บังคับ - ปล่อยว่างถ้าไม่ต้องการเปลี่ยน)
                      </label>
                      <PasswordInput
                        minLength={8}
                        value={editFormData.password}
                        onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                        placeholder="กรอกรหัสผ่านใหม่ (ขั้นต่ำ 8 ตัวอักษร) - ปล่อยว่างถ้าไม่ต้องการเปลี่ยน"
                        autoComplete="new-password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="flex items-center space-x-2">
                          <Shield className="w-4 h-4" />
                          <span>บทบาท *</span>
                        </span>
                      </label>
                      <select
                        value={editFormData.role}
                        onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as 'officer' | 'admin' })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="officer">ตำรวจ</option>
                        <option value="admin">ผู้ดูแลระบบ</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
                      <Button
                        type="submit"
                        variant="primary"
                        isLoading={editLoading}
                        className="flex-1"
                      >
                        บันทึกการแก้ไข
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setShowEditModal(false);
                          setSelectedUser(null);
                          setImagePreview(null);
                          setEditFormData({
                            username: '',
                            password: '',
                            name: '',
                            policeRank: '',
                            role: 'officer',
                            profileImage: '',
                          });
                        }}
                        className="flex-1"
                      >
                        ยกเลิก
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
