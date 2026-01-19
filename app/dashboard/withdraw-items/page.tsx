'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import Alert from '@/components/Alert';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Package, Plus, Upload, X, Search, AlertCircle, Users, Box, User, Calendar, FileText, Info, CheckCircle2, ArrowRight } from 'lucide-react';

interface WithdrawItem {
  _id: string;
  itemName: string;
  quantity: number;
  unit?: string;
  withdrawnByName: string;
  notes?: string;
  imageUrl?: string;
  createdAt: string;
}

interface InventoryItem {
  _id: string;
  itemName: string;
  currentStock: number;
  unit: string;
  minStock?: number;
}

export default function WithdrawItemsPage() {
  const [items, setItems] = useState<WithdrawItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    itemName: '',
    quantity: '',
    unit: 'ชิ้น',
    notes: '',
    image: null as File | null,
    imagePreview: '',
  });

  useEffect(() => {
    fetchItems();
    fetchInventory();
  }, []);

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/withdraw-items', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    }
  };

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/inventory', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInventoryItems(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    }
  };

  const handleItemNameChange = (value: string) => {
    setFormData({ ...formData, itemName: value });
    // Find matching inventory item
    const inventoryItem = inventoryItems.find(
      (item) => item.itemName.toLowerCase() === value.toLowerCase()
    );
    setSelectedItem(inventoryItem || null);
    if (inventoryItem) {
      setFormData((prev) => ({ ...prev, unit: inventoryItem.unit }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('ขนาดไฟล์เกิน 10MB');
        return;
      }
      setFormData({
        ...formData,
        image: file,
        imagePreview: URL.createObjectURL(file),
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      let imageUrl = '';

      // Upload image if provided
      if (formData.image) {
        try {
          const formDataToUpload = new FormData();
          formDataToUpload.append('file', formData.image);
          const uploadResponse = await axios.post(
            `/api/upload/image?folder=withdraw-items`,
            formDataToUpload,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
              },
            }
          );
          imageUrl = uploadResponse.data.data.url;
        } catch (uploadError: any) {
          console.error('Image upload error:', uploadError);
          toast.error('ไม่สามารถอัพโหลดรูปภาพได้');
          setLoading(false);
          return;
        }
      }

      // Create withdraw item
      const response = await axios.post(
        '/api/withdraw-items',
        {
          itemName: formData.itemName,
          quantity: parseInt(formData.quantity),
          unit: formData.unit,
          notes: formData.notes,
          imageUrl: imageUrl || undefined,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('เบิกของสำเร็จ');
      setFormData({
        itemName: '',
        quantity: '',
        unit: 'ชิ้น',
        notes: '',
        image: null,
        imagePreview: '',
      });
      setSelectedItem(null);
      setShowForm(false);
      fetchItems();
      fetchInventory(); // Refresh inventory to show updated stock
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'ไม่สามารถเบิกของได้';
      toast.error(errorMessage);
      
      // Show stock info if available
      if (error.response?.data?.availableStock !== undefined) {
        toast.error(
          `สต๊อกคงเหลือ: ${error.response.data.availableStock} ${selectedItem?.unit || 'ชิ้น'}`,
          { duration: 5000 }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredInventory = inventoryItems.filter((item) =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout requireAuth={true}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  ประวัติการเบิกของของทุกคน
                </h1>
                <p className="text-gray-500 text-sm mt-0.5">ดูประวัติการเบิกของของทุกคนในระบบ</p>
              </div>
            </div>
            <Button 
              variant="primary" 
              onClick={() => setShowForm(!showForm)}
              className="shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <span className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>เบิกของ</span>
              </span>
            </Button>
          </div>
        </div>

        {/* Form Section */}
        {showForm && (
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-white" />
                    <h2 className="text-xl font-semibold text-white">ฟอร์มเบิกของ</h2>
                  </div>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setFormData({
                        itemName: '',
                        quantity: '',
                        unit: 'ชิ้น',
                        notes: '',
                        image: null,
                        imagePreview: '',
                      });
                      setSelectedItem(null);
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ชื่อของ * (เลือกจากรายการหรือพิมพ์ใหม่)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formData.itemName}
                        onChange={(e) => handleItemNameChange(e.target.value)}
                        onFocus={() => setSearchTerm(formData.itemName)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="พิมพ์ชื่อของหรือเลือกจากรายการ"
                        list="inventory-items"
                      />
                      {formData.itemName && (
                        <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                          {filteredInventory
                            .filter((item) =>
                              item.itemName.toLowerCase().includes(formData.itemName.toLowerCase())
                            )
                            .slice(0, 5)
                            .map((item) => (
                              <button
                                key={item._id}
                                type="button"
                                onClick={() => {
                                  handleItemNameChange(item.itemName);
                                  setSearchTerm('');
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center justify-between transition-colors"
                              >
                                <span className="font-medium">{item.itemName}</span>
                                <span className="text-sm text-gray-500">
                                  สต๊อก: {item.currentStock} {item.unit}
                                </span>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                    {selectedItem && (
                      <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">สต๊อกคงเหลือ:</span>
                          <span
                            className={`text-lg font-bold ${
                              selectedItem.currentStock < (selectedItem.minStock || 0)
                                ? 'text-red-600'
                                : selectedItem.currentStock < (selectedItem.minStock || 0) * 1.5
                                ? 'text-yellow-600'
                                : 'text-green-600'
                            }`}
                          >
                            {selectedItem.currentStock} {selectedItem.unit}
                          </span>
                        </div>
                        {selectedItem.minStock && selectedItem.currentStock < selectedItem.minStock && (
                          <div className="mt-2 flex items-center text-xs text-red-600">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            <span>สต๊อกต่ำกว่าจำนวนขั้นต่ำ ({selectedItem.minStock} {selectedItem.unit})</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">จำนวน *</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="กรอกจำนวน"
                      />
                      <input
                        type="text"
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="w-32 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="หน่วย"
                      />
                    </div>
                    {selectedItem && formData.quantity && (
                      <div className="mt-3">
                        {parseInt(formData.quantity) > selectedItem.currentStock ? (
                          <div className="flex items-center text-sm text-red-600 p-3 bg-red-50 rounded-lg border border-red-200">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            <span>
                              สต๊อกไม่พอ! มีเพียง {selectedItem.currentStock} {selectedItem.unit}
                            </span>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600 p-3 bg-green-50 rounded-lg border border-green-200">
                            หลังเบิกจะเหลือ: {selectedItem.currentStock - parseInt(formData.quantity)}{' '}
                            {selectedItem.unit}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">หมายเหตุ</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                      rows={3}
                      placeholder="กรอกหมายเหตุ (ถ้ามี)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">รูปภาพ (ไม่บังคับ)</label>
                    {formData.imagePreview ? (
                      <div className="relative">
                        <img
                          src={formData.imagePreview}
                          alt="Preview"
                          className="w-full h-64 object-contain rounded-xl border-2 border-gray-200 bg-gray-50"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, image: null, imagePreview: '' })}
                          className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-blue-300 transition-all duration-200">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-10 h-10 mb-2 text-gray-400" />
                          <p className="mb-1 text-sm font-medium text-gray-600">คลิกเพื่อเลือกรูปภาพ</p>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF (MAX. 10MB)</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </label>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 pt-4">
                    <Button type="submit" variant="primary" isLoading={loading} className="flex-1 sm:flex-none">
                      <span className="flex items-center space-x-2">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>บันทึก</span>
                      </span>
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setShowForm(false);
                        setFormData({
                          itemName: '',
                          quantity: '',
                          unit: 'ชิ้น',
                          notes: '',
                          image: null,
                          imagePreview: '',
                        });
                        setSelectedItem(null);
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

        {/* History Section */}
        <div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-200 rounded-lg">
                  <FileText className="w-5 h-5 text-gray-700" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">ประวัติการเบิกของของทุกคน</h2>
              </div>
            </div>
            {items.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-full mb-4">
                  <Info className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">ยังไม่มีการเบิกของ</h3>
                <p className="text-gray-500">ยังไม่มีข้อมูลการเบิกของในระบบ</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {items.map((item, index) => (
                  <div
                    key={item._id}
                    className="p-6 hover:bg-gray-50 transition-colors duration-200"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Image Section */}
                      <div className="flex-shrink-0">
                        {item.imageUrl ? (
                          <a
                            href={item.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block"
                          >
                            <img
                              src={item.imageUrl}
                              alt={item.itemName}
                              className="w-24 h-24 object-cover rounded-xl border-2 border-gray-200 hover:opacity-80 transition-opacity cursor-pointer"
                            />
                          </a>
                        ) : (
                          <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-gray-200">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Middle Section */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <Box className="w-4 h-4 text-blue-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">{item.itemName}</h3>
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                            {item.quantity} {item.unit || 'ชิ้น'}
                          </span>
                        </div>
                        {item.notes && (
                          <p className="text-sm text-gray-700 line-clamp-2">{item.notes}</p>
                        )}
                        <p className="text-xs text-gray-500 flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>เบิกโดย: {item.withdrawnByName}</span>
                        </p>
                      </div>

                      {/* Date Section */}
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                          <Calendar className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">วันที่</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {new Date(item.createdAt).toLocaleDateString('th-TH', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(item.createdAt).toLocaleTimeString('th-TH', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
