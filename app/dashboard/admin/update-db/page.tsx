'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import Alert from '@/components/Alert';
import { Database, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function UpdateDBPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleUpdate = async () => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการอัปเดตฐานข้อมูล? การดำเนินการนี้อาจใช้เวลาสักครู่')) {
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/admin/update-db',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setResults(response.data.results);
      toast.success('อัปเดตฐานข้อมูลสำเร็จ');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'ไม่สามารถอัปเดตฐานข้อมูลได้');
      console.error('Update DB error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout requireAuth={true} requireRole="admin">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">อัปเดตฐานข้อมูล</h1>
          <p className="text-gray-600">อัปเดต indexes และข้อมูลใน MongoDB</p>
        </div>

        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Database className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">การดำเนินการ</h2>
            </div>
            <Button
              variant="primary"
              onClick={handleUpdate}
              isLoading={loading}
              description="อัปเดต indexes และข้อมูลในฐานข้อมูล"
            >
              <span className="flex items-center space-x-2">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>อัปเดตฐานข้อมูล</span>
              </span>
            </Button>
          </div>

          <Alert
            type="warning"
            title="คำเตือน"
            message="การอัปเดตฐานข้อมูลจะ: ลบและสร้าง indexes ใหม่ (เพื่อแก้ปัญหา duplicate indexes), อัปเดตเอกสารที่ไม่มี field ใหม่ (เช่น policeRank), แสดงสถิติฐานข้อมูล"
          />
        </div>

        {results && (
          <div className="space-y-6">
            {/* Indexes Results */}
            {results.indexes && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Indexes</span>
                </h3>
                {results.indexes.error ? (
                  <Alert type="error" title="Error" message={results.indexes.error} />
                ) : (
                  <div className="space-y-3">
                    {Object.entries(results.indexes).map(([collection, data]: [string, any]) => (
                      <div key={collection} className="bg-gray-50 p-4 rounded-lg">
                        <p className="font-medium text-gray-900 mb-2">
                          Collection: <span className="text-primary-600">{collection}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Indexes: {data.count} ({data.indexes?.join(', ') || 'N/A'})
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Documents Results */}
            {results.documents && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Documents</span>
                </h3>
                {results.documents.error ? (
                  <Alert type="error" title="Error" message={results.documents.error} />
                ) : (
                  <div className="space-y-3">
                    {Object.entries(results.documents).map(([collection, data]: [string, any]) => {
                      if (collection === 'error') return null;
                      return (
                        <div key={collection} className="bg-gray-50 p-4 rounded-lg">
                          <p className="font-medium text-gray-900 mb-2">
                            Collection: <span className="text-primary-600">{collection}</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Updated: {data.updated || 0} documents
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Database Stats */}
            {results.stats && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Database className="w-5 h-5 text-primary-600" />
                  <span>Database Statistics</span>
                </h3>
                {results.stats.error ? (
                  <Alert type="error" title="Error" message={results.stats.error} />
                ) : (
                  <div className="space-y-3">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium text-gray-900 mb-2">
                        Total Collections: <span className="text-primary-600">{results.stats.collections}</span>
                      </p>
                    </div>
                    {results.stats.details && (
                      <div className="space-y-2">
                        {Object.entries(results.stats.details).map(([collection, data]: [string, any]) => (
                          <div key={collection} className="bg-gray-50 p-4 rounded-lg">
                            <p className="font-medium text-gray-900 mb-2">
                              {collection}
                            </p>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>Documents: {data.documents}</p>
                              <p>Indexes: {data.indexes}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
