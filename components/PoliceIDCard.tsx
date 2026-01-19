'use client';

import React from 'react';
import { User, Shield, Mail, Calendar, Car } from 'lucide-react';
import { getPoliceRankLabel } from '@/lib/police-ranks';

interface PoliceIDCardProps {
  name: string;
  policeRank?: string;
  username: string;
  email?: string;
  role: 'officer' | 'admin';
  profileImage?: string;
  driverLicenseType?: '1' | '2' | '3';
  createdAt?: string | Date;
  className?: string;
}

export default function PoliceIDCard({
  name,
  policeRank,
  username,
  email,
  role,
  profileImage,
  driverLicenseType,
  createdAt,
  className = '',
}: PoliceIDCardProps) {
  const formatDate = (date?: string | Date) => {
    if (!date) return '-';
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      // Check if date is valid
      if (isNaN(d.getTime())) {
        return '-';
      }
      // Format: วันที เดือน ปี พ.ศ.
      const day = d.getDate();
      const month = d.toLocaleDateString('th-TH', { month: 'long' });
      const year = d.getFullYear() + 543; // Convert to Buddhist era
      return `${day} ${month} ${year}`;
    } catch (error) {
      return '-';
    }
  };

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl shadow-xl overflow-hidden border-2 border-blue-200 ${className}`}>
      {/* Header with pattern */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.1) 10px, rgba(255,255,255,.1) 20px)'
          }}></div>
        </div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white rounded-full p-2">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">บัตรประจำตัวตำรวจ</h3>
              <p className="text-blue-100 text-xs">Police ID Card</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white text-xs font-medium">ระบบตำรวจ Preview City</p>
            <p className="text-blue-100 text-xs">Police Management System</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="flex items-start space-x-4 mb-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {profileImage ? (
              <img
                src={profileImage}
                alt={name}
                className="w-24 h-24 rounded-xl object-cover shadow-lg border-4 border-white"
              />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg border-4 border-white">
                <User className="w-12 h-12 text-white" />
              </div>
            )}
          </div>

          {/* Name and Rank */}
          <div className="flex-1">
            <div className="mb-2">
              {policeRank && (
                <span className="inline-block bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-semibold mb-2">
                  {getPoliceRankLabel(policeRank)}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {name}
            </h2>
            <p className="text-gray-600 text-sm">
              {role === 'admin' ? 'ผู้ดูแลระบบ' : getPoliceRankLabel(policeRank) || 'ตำรวจ'}
            </p>
          </div>
        </div>

        {/* Details Grid - 2 Columns */}
        <div className="grid grid-cols-2 gap-3 border-t border-gray-200 pt-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 rounded-lg p-2">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-0.5">User ตำรวจ</p>
              <p className="text-sm font-semibold text-gray-900">{username}</p>
            </div>
          </div>

          {driverLicenseType ? (
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 rounded-lg p-2">
                <Car className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-0.5">ใบอนุญาติขับฮอ</p>
                <p className="text-sm font-semibold text-gray-900">
                  Type {driverLicenseType} - {driverLicenseType === '1' ? 'พื้นฐาน' : driverLicenseType === '2' ? 'ขั้นกลาง' : 'ขั้นสูง'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="bg-gray-100 rounded-lg p-2">
                <Car className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-0.5">ใบอนุญาติขับฮอ</p>
                <p className="text-sm font-semibold text-gray-500">ไม่มีใบอนุญาติ</p>
              </div>
            </div>
          )}

          {createdAt && formatDate(createdAt) !== '-' && (
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 rounded-lg p-2">
                <Calendar className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-0.5">วันที่สร้างบัญชี</p>
                <p className="text-sm font-semibold text-gray-900">{formatDate(createdAt)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>ID: {username}</span>
          <span>© Preview City Police System</span>
        </div>
      </div>
    </div>
  );
}
