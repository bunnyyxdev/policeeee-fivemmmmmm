'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Download, Upload, Database, AlertTriangle } from 'lucide-react';

export default function BackupRestorePage() {
  const [loading, setLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [backupData, setBackupData] = useState<any>(null);

  const handleBackup = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await axios.post(
        '/api/admin/backup',
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setBackupData(response.data.backup);
      
      // Download backup as JSON file
      const blob = new Blob([JSON.stringify(response.data.backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(response.data.message || 'สำรองข้อมูลสำเร็จ');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'ไม่สามารถสำรองข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          setBackupData(data);
          toast.success('โหลดไฟล์สำรองข้อมูลสำเร็จ');
        } catch (error) {
          toast.error('ไฟล์ไม่ถูกต้อง');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleRestore = async (clearExisting: boolean) => {
    if (!backupData) {
      toast.error('กรุณาโหลดไฟล์สำรองข้อมูลก่อน');
      return;
    }

    if (!confirm(`คุณแน่ใจหรือไม่ที่จะ${clearExisting ? 'ลบข้อมูลเดิมและ' : ''}คืนค่าข้อมูลจาก backup?`)) {
      return;
    }

    try {
      setRestoreLoading(true);
      const token = localStorage.getItem('token');

      const response = await axios.post(
        '/api/admin/restore',
        {
          backup: backupData,
          clearExisting,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(response.data.message || 'คืนค่าข้อมูลสำเร็จ');
      setBackupData(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'ไม่สามารถคืนค่าข้อมูลได้');
    } finally {
      setRestoreLoading(false);
    }
  };

  return (
    <Layout requireAuth={true} requireRole="admin">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">สำรองและคืนค่าข้อมูล</h1>
          <p className="text-gray-600">สำรองข้อมูลอัตโนมัติและคืนค่าข้อมูลเมื่อเกิดปัญหา</p>
        </div>

        {/* Backup Section */}
        <div className="card mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <Database className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">สำรองข้อมูล (Backup)</h2>
          </div>
          
          <p className="text-gray-600 mb-4">
            สร้างสำรองข้อมูลจากฐานข้อมูลทั้งหมดและดาวน์โหลดเป็นไฟล์ JSON
          </p>

          <Button
            variant="success"
            onClick={handleBackup}
            isLoading={loading}
          >
            <span className="flex items-center space-x-2">
              <Download className="w-5 h-5" />
              <span>สร้าง Backup</span>
            </span>
          </Button>
        </div>

        {/* Restore Section */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <Upload className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">คืนค่าข้อมูล (Restore)</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                โหลดไฟล์ Backup (JSON)
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              />
              {backupData && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>โหลดไฟล์สำเร็จ:</strong> Backup จาก {backupData.timestamp ? new Date(backupData.timestamp).toLocaleString('th-TH') : 'ไม่ทราบวันที่'}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Collections: {backupData.collections ? Object.keys(backupData.collections).length : 0}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 mb-1">คำเตือน</p>
                  <p className="text-xs text-yellow-700">
                    การคืนค่าข้อมูลจะเขียนทับข้อมูลเดิม กรุณาตรวจสอบให้แน่ใจว่ามี Backup ล่าสุดก่อนดำเนินการ
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="primary"
                onClick={() => handleRestore(false)}
                isLoading={restoreLoading}
                disabled={!backupData}
              >
                <span className="flex items-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span>คืนค่าข้อมูล (ไม่ลบข้อมูลเดิม)</span>
                </span>
              </Button>
              
              <Button
                variant="danger"
                onClick={() => handleRestore(true)}
                isLoading={restoreLoading}
                disabled={!backupData}
              >
                <span className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span>คืนค่าข้อมูล (ลบข้อมูลเดิม)</span>
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
