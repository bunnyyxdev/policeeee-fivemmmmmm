'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import Alert from '@/components/Alert';
import { Settings, Upload, X, User, Mail, Award, Save, Car, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { POLICE_RANKS, getPoliceRankLabel } from '@/lib/police-ranks';
import PasswordInput from '@/components/PasswordInput';
import { isPasswordTooSimilar } from '@/lib/auth';

// Common weak passwords to check against (expanded list)
const COMMON_PASSWORDS = [
  // Numeric sequences
  '12345678', '123456789', '1234567890', '12345678901', '123456789012',
  '1234', '12345', '123456', '1234567', '87654321', '987654321',
  // Common words + numbers
  'password', 'password1', 'password12', 'password123', 'password1234',
  'admin', 'admin1', 'admin12', 'admin123', 'admin1234',
  'welcome', 'welcome1', 'welcome12', 'welcome123', 'welcome1234',
  'qwerty', 'qwerty1', 'qwerty12', 'qwerty123', 'qwerty1234',
  'letmein', 'letmein1', 'letmein12', 'letmein123',
  // Common words
  'monkey', 'dragon', 'master', 'sunshine', 'princess', 'football',
  'iloveyou', 'trustno1', 'baseball', 'shadow', 'superman',
  'michael', 'jordan', 'tigger', 'hunter', 'buster', 'thomas',
  'hockey', 'ranger', 'daniel', 'hannah', 'maggie', 'jessie',
  // Thai common passwords
  '123456', 'password', 'admin', 'welcome',
  // Patterns
  'qwertyuiop', 'asdfghjkl', 'zxcvbnm', 'qwerty', 'abc123',
  '11111111', '00000000', '88888888', '99999999',
  // Simple patterns
  'aaaaaa', 'aaaaaaa', 'aaaaaaaa', 'bbbbbb', 'cccccc',
];

// Check if password is common/weak
const isCommonPassword = (password: string): boolean => {
  if (!password || password.length < 4) return false;
  
  const lowerPassword = password.toLowerCase();
  const trimmedPassword = lowerPassword.trim();
  
  // Exact match
  if (COMMON_PASSWORDS.includes(trimmedPassword)) {
    return true;
  }
  
  // Contains common password
  if (COMMON_PASSWORDS.some(common => {
    if (common.length < 4) return false;
    return trimmedPassword.includes(common) || common.includes(trimmedPassword);
  })) {
    return true;
  }
  
  // Check for simple patterns (all same character, sequential numbers/letters)
  if (/^(.)\1+$/.test(trimmedPassword)) { // All same character (aaaa, 1111)
    return true;
  }
  
  // Check for sequential numbers (12345678, 87654321)
  if (/^[0-9]+$/.test(trimmedPassword)) {
    const isSequential = trimmedPassword.split('').every((char, index, arr) => {
      if (index === 0) return true;
      const prev = parseInt(arr[index - 1]);
      const curr = parseInt(char);
      return Math.abs(curr - prev) === 1 || (prev === 9 && curr === 0) || (prev === 0 && curr === 9);
    });
    if (isSequential && trimmedPassword.length >= 6) {
      return true;
    }
  }
  
  // Check for sequential letters (abcdef, zyxwvu)
  if (/^[a-z]+$/.test(trimmedPassword) && trimmedPassword.length >= 6) {
    const isSequential = trimmedPassword.split('').every((char, index, arr) => {
      if (index === 0) return true;
      const prev = arr[index - 1].charCodeAt(0);
      const curr = char.charCodeAt(0);
      return Math.abs(curr - prev) === 1;
    });
    if (isSequential) {
      return true;
    }
  }
  
  return false;
};

// Get password requirements checklist
const getPasswordRequirements = (password: string) => {
  return {
    minLength: password.length >= 8,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^a-zA-Z0-9]/.test(password),
    notCommon: !isCommonPassword(password),
  };
};

// Calculate password strength
const calculatePasswordStrength = (password: string): { score: number; label: string; color: string } => {
  if (!password) {
    return { score: 0, label: '', color: '' };
  }

  let score = 0;
  
  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  
  // Character variety checks
  if (/[a-z]/.test(password)) score += 1; // lowercase
  if (/[A-Z]/.test(password)) score += 1; // uppercase
  if (/[0-9]/.test(password)) score += 1; // numbers
  if (/[^a-zA-Z0-9]/.test(password)) score += 1; // special characters
  
  // Penalty for common passwords
  if (isCommonPassword(password)) {
    score = Math.max(0, score - 2);
  }
  
  // Determine strength level
  if (score <= 2) {
    return { score, label: 'อ่อนแอ', color: 'bg-red-500' };
  } else if (score <= 4) {
    return { score, label: 'ปานกลาง', color: 'bg-yellow-500' };
  } else if (score <= 6) {
    return { score, label: 'แข็งแกร่ง', color: 'bg-green-500' };
  } else {
    return { score, label: 'แข็งแกร่งมาก', color: 'bg-green-600' };
  }
};

interface UserData {
  _id: string;
  username: string;
  name: string;
  email?: string;
  policeRank?: string;
  role: 'officer' | 'admin';
  profileImage?: string;
  driverLicense?: string;
  createdAt: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    label: string;
    color: string;
  }>({ score: 0, label: '', color: '' });
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasLowercase: false,
    hasUppercase: false,
    hasNumber: false,
    hasSpecial: false,
    notCommon: true,
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      let userData: UserData;
      if (userStr) {
        userData = JSON.parse(userStr);
      } else {
        const response = await axios.get('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        userData = response.data.user;
        localStorage.setItem('user', JSON.stringify(userData));
      }

      setUser(userData);
    } catch (error: any) {
      toast.error('ไม่สามารถโหลดข้อมูลโปรไฟล์ได้');
      console.error('Profile error:', error);
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

      // Update user profile
      const updateResponse = await axios.put(
        '/api/auth/me',
        { profileImage: imageUrl },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUser(updateResponse.data.user);
      localStorage.setItem('user', JSON.stringify(updateResponse.data.user));
      toast.success('อัพโหลดรูปโปรไฟล์สำเร็จ');
      setImagePreview(null);
      
      // Trigger custom event to notify profile page
      window.dispatchEvent(new CustomEvent('profileImageUpdated', { 
        detail: { profileImage: updateResponse.data.user.profileImage } 
      }));
      
      // Also trigger storage event for cross-tab sync
      window.dispatchEvent(new Event('storage'));
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error || 'ไม่สามารถอัพโหลดรูปภาพได้');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      const updateResponse = await axios.put(
        '/api/auth/me',
        { profileImage: '' },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUser(updateResponse.data.user);
      localStorage.setItem('user', JSON.stringify(updateResponse.data.user));
      toast.success('ลบรูปโปรไฟล์สำเร็จ');
      
      // Trigger custom event to notify profile page
      window.dispatchEvent(new CustomEvent('profileImageUpdated', { 
        detail: { profileImage: updateResponse.data.user.profileImage || '' } 
      }));
      
      // Also trigger storage event for cross-tab sync
      window.dispatchEvent(new Event('storage'));
    } catch (error: any) {
      console.error('Remove image error:', error);
      toast.error('ไม่สามารถลบรูปภาพได้');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร');
      return;
    }

    // Check if new password is too similar to current password
    if (isPasswordTooSimilar(passwordData.newPassword, passwordData.currentPassword)) {
      toast.error('รหัสผ่านใหม่ต้องแตกต่างจากรหัสผ่านปัจจุบันอย่างน้อย 30%');
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const updateResponse = await axios.put(
        '/api/auth/me',
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUser(updateResponse.data.user);
      localStorage.setItem('user', JSON.stringify(updateResponse.data.user));
      toast.success('เปลี่ยนรหัสผ่านสำเร็จ');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Password change error:', error);
      toast.error(error.response?.data?.error || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
    } finally {
      setSaving(false);
    }
  };

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
            <Settings className="w-10 h-10 text-gray-400" />
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
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                ตั้งค่า
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">จัดการข้อมูลโปรไฟล์และตั้งค่าบัญชี</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Image Section */}
          <div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <User className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">รูปโปรไฟล์</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-col items-center space-y-6">
                  <div className="relative">
                    {user.profileImage || imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview || user.profileImage}
                          alt={user.name}
                          className="w-40 h-40 rounded-full object-cover border-4 border-indigo-200 shadow-lg"
                        />
                        {user.profileImage && !imagePreview && (
                          <button
                            onClick={handleRemoveImage}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                            title="ลบรูปภาพ"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="w-40 h-40 rounded-full bg-gradient-to-br from-indigo-200 to-purple-200 flex items-center justify-center border-4 border-indigo-200 shadow-lg">
                        <span className="text-5xl font-bold text-indigo-600">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="w-full">
                    <label className="block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        disabled={uploading}
                        id="profile-image-upload"
                      />
                      <Button
                        variant="primary"
                        onClick={() => document.getElementById('profile-image-upload')?.click()}
                        isLoading={uploading}
                        disabled={uploading}
                        className="w-full shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <span className="flex items-center justify-center space-x-2">
                          <Upload className="w-5 h-5" />
                          <span>{user.profileImage ? 'เปลี่ยนรูป' : 'อัพโหลดรูป'}</span>
                        </span>
                      </Button>
                    </label>
                    <p className="text-xs text-gray-500 mt-3 text-center">
                      รองรับไฟล์ PNG, JPG, GIF (สูงสุด 5MB)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Form */}
          <div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Lock className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">เปลี่ยนรหัสผ่าน</h2>
                </div>
              </div>
              <div className="p-6">
                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <div>
                    <PasswordInput
                      label="รหัสผ่านปัจจุบัน"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      required
                      placeholder="กรอกรหัสผ่านปัจจุบัน"
                    />
                  </div>

                  <div>
                    <PasswordInput
                      label="รหัสผ่านใหม่"
                      value={passwordData.newPassword}
                      onChange={(e) => {
                        const newPassword = e.target.value;
                        setPasswordData({ ...passwordData, newPassword });
                        setPasswordStrength(calculatePasswordStrength(newPassword));
                        setPasswordRequirements(getPasswordRequirements(newPassword));
                      }}
                      required
                      placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)"
                      minLength={8}
                    />
                    {passwordData.newPassword && (
                      <div className="mt-2 space-y-3">
                        {/* Password Strength Bar */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">ความแข็งแกร่งของรหัสผ่าน:</span>
                            <span className={`text-xs font-medium ${
                              passwordStrength.score <= 2 ? 'text-red-600' :
                              passwordStrength.score <= 4 ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>
                              {passwordStrength.label}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                              style={{
                                width: `${Math.min((passwordStrength.score / 7) * 100, 100)}%`
                              }}
                            />
                          </div>
                        </div>

                        {/* Password Requirements Checklist */}
                        <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                          <p className="text-xs font-medium text-gray-700 mb-2">ข้อกำหนดรหัสผ่าน:</p>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="flex items-center space-x-2">
                              <div className={`w-4 h-4 rounded flex items-center justify-center ${
                                passwordRequirements.minLength ? 'bg-green-500' : 'bg-gray-300'
                              }`}>
                                {passwordRequirements.minLength && (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <span className={`text-xs ${passwordRequirements.minLength ? 'text-green-700' : 'text-gray-600'}`}>
                                อย่างน้อย 8 ตัวอักษร
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className={`w-4 h-4 rounded flex items-center justify-center ${
                                passwordRequirements.hasLowercase ? 'bg-green-500' : 'bg-gray-300'
                              }`}>
                                {passwordRequirements.hasLowercase && (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <span className={`text-xs ${passwordRequirements.hasLowercase ? 'text-green-700' : 'text-gray-600'}`}>
                                ตัวพิมพ์เล็ก (a-z)
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className={`w-4 h-4 rounded flex items-center justify-center ${
                                passwordRequirements.hasUppercase ? 'bg-green-500' : 'bg-gray-300'
                              }`}>
                                {passwordRequirements.hasUppercase && (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <span className={`text-xs ${passwordRequirements.hasUppercase ? 'text-green-700' : 'text-gray-600'}`}>
                                ตัวพิมพ์ใหญ่ (A-Z)
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className={`w-4 h-4 rounded flex items-center justify-center ${
                                passwordRequirements.hasNumber ? 'bg-green-500' : 'bg-gray-300'
                              }`}>
                                {passwordRequirements.hasNumber && (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <span className={`text-xs ${passwordRequirements.hasNumber ? 'text-green-700' : 'text-gray-600'}`}>
                                ตัวเลข (0-9)
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className={`w-4 h-4 rounded flex items-center justify-center ${
                                passwordRequirements.hasSpecial ? 'bg-green-500' : 'bg-gray-300'
                              }`}>
                                {passwordRequirements.hasSpecial && (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <span className={`text-xs ${passwordRequirements.hasSpecial ? 'text-green-700' : 'text-gray-600'}`}>
                                อักขระพิเศษ (!@#$)
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className={`w-4 h-4 rounded flex items-center justify-center ${
                                passwordRequirements.notCommon ? 'bg-green-500' : 'bg-red-500'
                              }`}>
                                {passwordRequirements.notCommon ? (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                )}
                              </div>
                              <span className={`text-xs ${passwordRequirements.notCommon ? 'text-green-700' : 'text-red-700'}`}>
                                ไม่ใช่รหัสผ่านทั่วไป
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Warning for common passwords */}
                        {!passwordRequirements.notCommon && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                            <p className="text-xs text-red-700">
                              ⚠️ รหัสผ่านนี้เป็นรหัสผ่านที่ใช้บ่อย ควรเปลี่ยนเป็นรหัสผ่านที่ซับซ้อนกว่า
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <PasswordInput
                      label="ยืนยันรหัสผ่านใหม่"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                      placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                      minLength={8}
                    />
                    {passwordData.confirmPassword && (
                      <div className="mt-2">
                        {passwordData.newPassword === passwordData.confirmPassword ? (
                          <div className="flex items-center space-x-2 text-green-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-xs font-medium">รหัสผ่านตรงกัน</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 text-red-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="text-xs font-medium">รหัสผ่านไม่ตรงกัน</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 pt-4">
                    <Button type="submit" variant="primary" isLoading={saving} className="flex-1">
                      <span className="flex items-center justify-center space-x-2">
                        <Lock className="w-5 h-5" />
                        <span>เปลี่ยนรหัสผ่าน</span>
                      </span>
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => router.push('/dashboard/profile')}
                      className="flex-1"
                    >
                      ยกเลิก
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
