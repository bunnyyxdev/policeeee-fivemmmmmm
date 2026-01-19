'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import PasswordInput from '@/components/PasswordInput';
import toast from 'react-hot-toast';
import axios from 'axios';
import { User, Shield, Award, Upload, X } from 'lucide-react';
import { POLICE_RANKS } from '@/lib/police-ranks';

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    policeRank: '' as string,
    role: 'officer' as 'officer' | 'admin',
    profileImage: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/admin/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const user = response.data.user;
      setFormData({
        username: user.username || '',
        password: '', // Don't pre-fill password
        name: user.name || '',
        policeRank: user.policeRank || '',
        role: user.role || 'officer',
        profileImage: user.profileImage || '',
      });
      if (user.profileImage) {
        setImagePreview(user.profileImage);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
      router.push('/dashboard/admin/users');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Only include password if it's provided
      const updateData: any = {
        name: formData.name,
        username: formData.username,
        policeRank: formData.policeRank || undefined,
        role: formData.role,
        profileImage: formData.profileImage || undefined,
      };

      if (formData.password && formData.password.length > 0) {
        updateData.password = formData.password;
      }

      await axios.put(
        `/api/admin/users/${userId}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success('อัปเดตข้อมูลผู้ใช้สำเร็จ');
      router.push('/dashboard/admin/users');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้');
    } finally {
      setLoading(false);
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

      // Upload image
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
      setFormData({ ...formData, profileImage: imageUrl });
      toast.success('อัพโหลดรูปโปรไฟล์สำเร็จ');
      
      // Clean up preview URL if it was a file preview
      const oldPreview = imagePreview;
      setImagePreview(imageUrl);
      if (oldPreview && oldPreview.startsWith('blob:')) {
        URL.revokeObjectURL(oldPreview);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error || 'ไม่สามารถอัพโหลดรูปภาพได้');
      // Revert preview on error
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      const userResponse = await axios.get(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (userResponse.data.user.profileImage) {
        setImagePreview(userResponse.data.user.profileImage);
        setFormData({ ...formData, profileImage: userResponse.data.user.profileImage });
      } else {
        setImagePreview(null);
        setFormData({ ...formData, profileImage: '' });
      }
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    // Clean up blob URL if exists
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setFormData({ ...formData, profileImage: '' });
    setImagePreview(null);
  };

  if (fetching) {
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
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">แก้ไขข้อมูลผู้ใช้</h1>
          <p className="text-gray-600">แก้ไขข้อมูลบัญชีแพทย์</p>
        </div>

        <div className="card">
          {/* Profile Image Section */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">รูปโปรไฟล์</h2>
            <div className="flex items-center space-x-6">
              <div className="relative">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt={formData.name || 'Profile'}
                      className="w-32 h-32 rounded-full object-cover border-4 border-primary-200"
                    />
                    {formData.profileImage && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        title="ลบรูปภาพ"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-primary-200">
                    <span className="text-4xl font-bold text-gray-400">
                      {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
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
                    id="profile-image-upload"
                  />
                  <span className="inline-block">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => document.getElementById('profile-image-upload')?.click()}
                      isLoading={uploading}
                      disabled={uploading}
                    >
                      <span className="flex items-center space-x-2">
                        <Upload className="w-4 h-4" />
                        <span>{formData.profileImage ? 'เปลี่ยนรูป' : 'อัพโหลดรูป'}</span>
                      </span>
                    </Button>
                  </span>
                </label>
                <p className="text-base text-gray-500 mt-2">
                  รองรับไฟล์ PNG, JPG, GIF (สูงสุด 5MB) - GIF จะแสดงแบบ animated
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="flex items-center space-x-2">
                  <Award className="w-4 h-4" />
                  <span>ตำแหน่งตำรวจ</span>
                </span>
              </label>
              <select
                value={formData.policeRank}
                onChange={(e) => setFormData({ ...formData, policeRank: e.target.value })}
                className="input"
              >
                <option value="">เลือกตำแหน่งตำรวจ (ไม่บังคับ)</option>
                {POLICE_RANKS.map((rank) => (
                  <option key={rank.value} value={rank.value}>
                    {rank.value}. {rank.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">เลือกตำแหน่งตำรวจ</p>
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
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="กรอกชื่อ-นามสกุลตามบัตรประชาชน"
              />
              <p className="mt-1 text-xs text-gray-500">ชื่อเต็มตามบัตรประชาชนหรือชื่อที่ใช้ในระบบ</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>User หมอ *</span>
                </span>
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="input"
                placeholder="กรอกชื่อผู้ใช้สำหรับเข้าสู่ระบบ"
              />
              <p className="mt-1 text-xs text-gray-500">ชื่อผู้ใช้ที่แพทย์จะใช้สำหรับเข้าสู่ระบบ</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="flex items-center space-x-2">
                  <span>รหัส Login หมอ (ไม่บังคับ - ปล่อยว่างถ้าไม่ต้องการเปลี่ยน)</span>
                </span>
              </label>
              <PasswordInput
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="กรอกรหัสผ่านใหม่ (ขั้นต่ำ 8 ตัวอักษร) - ปล่อยว่างถ้าไม่ต้องการเปลี่ยน"
                autoComplete="new-password"
              />
              <p className="mt-1 text-xs text-gray-500">กรอกเพื่อเปลี่ยนรหัสผ่าน หรือปล่อยว่างเพื่อคงรหัสผ่านเดิม</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>บทบาท *</span>
                </span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'officer' | 'admin' })}
                className="input"
              >
                <option value="officer">ตำรวจ</option>
                <option value="admin">ผู้ดูแลระบบ</option>
              </select>
            </div>

            <div className="flex items-center space-x-4 pt-4">
              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
                description="บันทึกการแก้ไขข้อมูลผู้ใช้"
              >
                บันทึกการแก้ไข
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/dashboard/admin/users')}
              >
                ยกเลิก
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
