import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'https://api.sooq-com.com';

const FacebookAutoPost = () => {
  const [rules, setRules] = useState([]);
  const [newRegion, setNewRegion] = useState('');
  const [newThreshold, setNewThreshold] = useState(100);
  
  // Manual trigger state
  const [manualRegion, setManualRegion] = useState('');
  const [manualCount, setManualCount] = useState(10);
  const [manualText, setManualText] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchRules = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/facebook-rules`);
      setRules(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!newRegion) return;
    
    try {
      await axios.post(`${BASE_URL}/api/facebook-rules`, {
        region_name: newRegion,
        threshold: parseInt(newThreshold)
      });
      setNewRegion('');
      setNewThreshold(100);
      fetchRules();
    } catch (err) {
      alert("Error adding rule");
    }
  };

  const handleDeleteRule = async (region_name) => {
    if (window.confirm(`هل أنت متأكد من حذف القاعدة لمنطقة ${region_name}؟`)) {
      try {
        await axios.delete(`${BASE_URL}/api/facebook-rules/${region_name}`);
        fetchRules();
      } catch (err) {
        alert("Error deleting rule");
      }
    }
  };

  const handleManualPublish = async (e) => {
    e.preventDefault();
    if (!manualRegion) {
      alert("يرجى إدخال اسم المنطقة");
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const res = await axios.post(`${BASE_URL}/api/facebook/manual-publish`, {
        region_name: manualRegion,
        count: parseInt(manualCount),
        custom_text: manualText || undefined
      });
      setMessage(`تم النشر بنجاح! عدد العقارات المرفقة: ${res.data.posted_count}`);
      setManualText('');
      setManualRegion('');
    } catch (err) {
      setMessage(`خطأ: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 rtl text-right" dir="rtl">
      <h1 className="text-3xl font-bold mb-8 text-[#0a2342]">نظام النشر التلقائي على فيسبوك 🚀</h1>
      
      {/* Section A: Automated Rules */}
      <div className="bg-white p-6 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.05)] mb-8 border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-[#0a2342]">قواعد النشر التلقائي (حسب المنطقة)</h2>
        <p className="text-gray-600 mb-6">سيقوم النظام بجمع العقارات التي يتم إضافتها بواسطة البوت، وعندما يصل عددها إلى الرقم المحدد لأي منطقة سيقوم بنشر بوست تلقائياً على فيسبوك.</p>
        
        <form onSubmit={handleAddRule} className="flex gap-4 mb-6">
          <input 
            type="text" 
            placeholder="اسم المنطقة (مثال: تلاع العلي)" 
            className="border border-gray-300 p-2 rounded-lg flex-1 focus:ring-2 focus:ring-[#f0a500] outline-none"
            value={newRegion}
            onChange={(e) => setNewRegion(e.target.value)}
            required
          />
          <input 
            type="number" 
            placeholder="العدد المطلوب" 
            className="border border-gray-300 p-2 rounded-lg w-32 focus:ring-2 focus:ring-[#f0a500] outline-none"
            value={newThreshold}
            onChange={(e) => setNewThreshold(e.target.value)}
            required
          />
          <button type="submit" className="bg-[#f0a500] text-white px-6 py-2 rounded-lg hover:bg-orange-500 transition shadow">
            إضافة قاعدة
          </button>
        </form>

        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-700 border-b border-gray-200">
                <th className="p-4">المنطقة</th>
                <th className="p-4">عدد العقارات المطلوب (Threshold)</th>
                <th className="p-4">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 font-medium text-[#0a2342]">{rule.region_name}</td>
                  <td className="p-4 text-gray-600">{rule.threshold} عقار</td>
                  <td className="p-4">
                    <button 
                      onClick={() => handleDeleteRule(rule.region_name)}
                      className="text-red-500 hover:text-red-700 bg-red-50 px-3 py-1 rounded-full text-sm transition"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
              {rules.length === 0 && (
                <tr>
                  <td colSpan="3" className="text-center p-8 text-gray-500">لا توجد قواعد مضافة حالياً.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section B: Manual Trigger */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg shadow-sm border border-blue-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <h2 className="text-xl font-semibold mb-4 text-[#0a2342] relative z-10">النشر الفوري (نظام القائمة / الكتالوج)</h2>
        <p className="text-gray-700 mb-6 relative z-10">استخدم هذه الأداة لسحب أحدث عقارات من منطقة معينة ونشرها **فوراً** على صفحة الفيسبوك مع نص مخصص.</p>
        
        <form onSubmit={handleManualPublish} className="flex flex-col gap-5 max-w-2xl relative z-10">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm mb-1 text-gray-700 font-medium">المنطقة (مثال: شارع مكة)</label>
              <input 
                type="text" 
                className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-[#f0a500] outline-none shadow-sm"
                value={manualRegion}
                onChange={(e) => setManualRegion(e.target.value)}
                required
              />
            </div>
            <div className="w-32">
              <label className="block text-sm mb-1 text-gray-700 font-medium">عدد العقارات</label>
              <input 
                type="number" 
                className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-[#f0a500] outline-none shadow-sm"
                value={manualCount}
                onChange={(e) => setManualCount(e.target.value)}
                min="1"
                max="20"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm mb-1 text-gray-700 font-medium">النص الثابت (يظهر في بداية البوست)</label>
            <textarea 
              className="border border-gray-300 p-3 rounded-lg w-full h-28 focus:ring-2 focus:ring-[#f0a500] outline-none shadow-sm resize-none"
              placeholder="مثال: شاهد أقوى العروض الحالية في شارع مكة... (سيتم إرفاق قائمة العقارات وروابطها أسفل هذا النص تلقائياً)"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
            />
          </div>
          
          <button 
            type="submit" 
            className={`px-8 py-3 rounded-lg text-white font-bold text-lg shadow-md transition transform hover:-translate-y-0.5 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
            disabled={loading}
          >
            {loading ? 'جاري النشر...' : 'نشر الآن على فيسبوك! 📤'}
          </button>
          
          {message && (
            <div className={`p-4 rounded-lg mt-2 font-medium ${message.includes('خطأ') ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-green-100 text-green-800 border border-green-200'}`}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default FacebookAutoPost;
