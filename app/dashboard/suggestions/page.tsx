'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import Alert from '@/components/Alert';
import toast from 'react-hot-toast';
import axios from 'axios';
import { MessageSquare, Send, ThumbsUp, Users, Plus, X, FileText, Lightbulb, Bug, Sparkles, MoreHorizontal, CheckCircle2, Clock, AlertCircle, XCircle, Info, User, Calendar } from 'lucide-react';
import Select from '@/components/Select';

interface Suggestion {
  _id: string;
  title: string;
  content: string;
  category: 'improvement' | 'bug' | 'feature' | 'other';
  submittedByName: string;
  status: 'pending' | 'under-review' | 'approved' | 'rejected' | 'implemented';
  likesCount: number;
  isAnonymous: boolean;
  createdAt: string;
}

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'other' as 'improvement' | 'bug' | 'feature' | 'other',
    isAnonymous: false,
  });

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/suggestions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuggestions(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/suggestions',
        {
          title: formData.title,
          content: formData.content,
          category: formData.category,
          isAnonymous: formData.isAnonymous,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('ส่งความคิดเห็นสำเร็จ');
      setFormData({
        title: '',
        content: '',
        category: 'other',
        isAnonymous: false,
      });
      setShowForm(false);
      fetchSuggestions();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'ไม่สามารถส่งความคิดเห็นได้';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      improvement: 'การปรับปรุง',
      bug: 'บั๊ก/ข้อผิดพลาด',
      feature: 'ฟีเจอร์ใหม่',
      other: 'อื่นๆ',
    };
    return labels[category] || category;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'รอตรวจสอบ',
      'under-review': 'กำลังตรวจสอบ',
      approved: 'อนุมัติ',
      rejected: 'ปฏิเสธ',
      implemented: 'ดำเนินการแล้ว',
    };
    return labels[status] || status;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'improvement':
        return <Lightbulb className="w-4 h-4" />;
      case 'bug':
        return <Bug className="w-4 h-4" />;
      case 'feature':
        return <Sparkles className="w-4 h-4" />;
      default:
        return <MoreHorizontal className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'improvement':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'bug':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'feature':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'implemented':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'under-review':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'implemented':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'under-review':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const categoryOptions = [
    { value: 'improvement', label: 'การปรับปรุง' },
    { value: 'bug', label: 'บั๊ก/ข้อผิดพลาด' },
    { value: 'feature', label: 'ฟีเจอร์ใหม่' },
    { value: 'other', label: 'อื่นๆ' },
  ];

  return (
    <Layout requireAuth={true}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  ประวัติความคิดเห็นของทุกคน
                </h1>
                <p className="text-gray-500 text-sm mt-0.5">ดูประวัติการเสนอความคิดเห็นของทุกคนในระบบ</p>
              </div>
            </div>
            <Button 
              variant="primary" 
              onClick={() => setShowForm(!showForm)}
              className="shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <span className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>เสนอความคิดเห็น</span>
              </span>
            </Button>
          </div>
        </div>

        {/* Form Section */}
        {showForm && (
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-white" />
                    <h2 className="text-xl font-semibold text-white">ฟอร์มเสนอความคิดเห็น</h2>
                  </div>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setFormData({
                        title: '',
                        content: '',
                        category: 'other',
                        isAnonymous: false,
                      });
                    }}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">หัวข้อ *</label>
                    <input
                      type="text"
                      required
                      maxLength={200}
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      placeholder="กรอกหัวข้อ"
                    />
                  </div>

                  <div>
                    <Select
                      label="หมวดหมู่ *"
                      value={formData.category}
                      onChange={(value) => setFormData({ ...formData, category: value as any })}
                      options={categoryOptions}
                      required
                      placeholder="เลือกหมวดหมู่"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">เนื้อหา *</label>
                    <textarea
                      required
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none"
                      rows={6}
                      placeholder="กรอกเนื้อหา"
                    />
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="isAnonymous"
                      checked={formData.isAnonymous}
                      onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                      className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="isAnonymous" className="text-sm font-medium text-gray-700">
                      ไม่ระบุชื่อ
                    </label>
                  </div>

                  <div className="flex items-center space-x-4 pt-4">
                    <Button type="submit" variant="primary" isLoading={loading} className="flex-1 sm:flex-none">
                      <span className="flex items-center space-x-2">
                        <Send className="w-5 h-5" />
                        <span>ส่งความคิดเห็น</span>
                      </span>
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setShowForm(false);
                        setFormData({
                          title: '',
                          content: '',
                          category: 'other',
                          isAnonymous: false,
                        });
                      }}
                      className="flex-1 sm:flex-none"
                    >
                      <span className="flex items-center space-x-2">
                        <X className="w-5 h-5" />
                        <span>ยกเลิก</span>
                      </span>
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Suggestions List */}
        <div>
          {suggestions.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-50 to-pink-50 rounded-full mb-4">
                <Info className="w-10 h-10 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">ยังไม่มีความคิดเห็น</h3>
              <p className="text-gray-500">ยังไม่มีข้อมูลความคิดเห็นในระบบ</p>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion._id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center flex-wrap gap-2 mb-3">
                          <h3 className="text-xl font-semibold text-gray-900">{suggestion.title}</h3>
                          <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium border ${getCategoryColor(suggestion.category)}`}>
                            {getCategoryIcon(suggestion.category)}
                            <span>{getCategoryLabel(suggestion.category)}</span>
                          </span>
                          <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(suggestion.status)}`}>
                            {getStatusIcon(suggestion.status)}
                            <span>{getStatusLabel(suggestion.status)}</span>
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <span className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>โดย: {suggestion.isAnonymous ? 'ไม่ระบุชื่อ' : suggestion.submittedByName}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(suggestion.createdAt).toLocaleDateString('th-TH')}</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 px-4 py-2 bg-purple-50 rounded-lg border border-purple-200">
                        <ThumbsUp className="w-5 h-5 text-purple-600" />
                        <span className="text-lg font-bold text-purple-700">{suggestion.likesCount}</span>
                      </div>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{suggestion.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
