import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Facebook, 
  Settings, 
  Trash2, 
  Send, 
  MapPin, 
  Hash, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  Loader2,
  ChevronDown
} from 'lucide-react';

const BASE_URL = process.env.REACT_APP_API_URL || 'https://api.sooq-com.com';

const FacebookAutoPost = () => {
  const [rules, setRules] = useState([]);
  const [availableRegions, setAvailableRegions] = useState([]);
  
  const [newRegion, setNewRegion] = useState('');
  const [newThreshold, setNewThreshold] = useState(100);
  
  // Manual trigger state
  const [manualRegion, setManualRegion] = useState('');
  const [manualCount, setManualCount] = useState(10);
  const [manualText, setManualText] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchData = async () => {
    setRulesLoading(true);
    try {
      const [rulesRes, locRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/facebook-rules`),
        axios.get(`${BASE_URL}/api/locations`).catch(() => ({ data: [] }))
      ]);
      setRules(rulesRes.data);
      
      // Flatten locations
      const regionsList = [];
      if (Array.isArray(locRes.data)) {
        locRes.data.forEach(city => {
          if (city.name_ar) regionsList.push(city.name_ar);
          if (city.regions && Array.isArray(city.regions)) {
            city.regions.forEach(r => {
              if (r.name_ar) regionsList.push(r.name_ar);
            });
          }
        });
      }
      setAvailableRegions([...new Set(regionsList)]);
      
    } catch (err) {
      console.error(err);
    } finally {
      setRulesLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
      
      // Refresh rules silently
      const res = await axios.get(`${BASE_URL}/api/facebook-rules`);
      setRules(res.data);
    } catch (err) {
      alert("Error adding rule");
    }
  };

  const handleDeleteRule = async (region_name) => {
    if (window.confirm(`هل أنت متأكد من حذف القاعدة لمنطقة ${region_name}؟`)) {
      try {
        await axios.delete(`${BASE_URL}/api/facebook-rules/${region_name}`);
        const res = await axios.get(`${BASE_URL}/api/facebook-rules`);
        setRules(res.data);
      } catch (err) {
        alert("Error deleting rule");
      }
    }
  };

  const handleManualPublish = async (e) => {
    e.preventDefault();
    if (!manualRegion) {
      setMessage({ text: "يرجى إدخال اسم المنطقة", type: "error" });
      return;
    }
    
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const res = await axios.post(`${BASE_URL}/api/facebook/manual-publish`, {
        region_name: manualRegion,
        count: parseInt(manualCount),
        custom_text: manualText || undefined
      });
      setMessage({ text: `تم النشر بنجاح! عدد العقارات المرفقة: ${res.data.posted_count}`, type: "success" });
      setManualText('');
      setManualRegion('');
    } catch (err) {
      setMessage({ text: `خطأ: ${err.response?.data?.detail || err.message}`, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 rtl text-right" dir="rtl" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* Hidden Datalist for autocomplete */}
      <datalist id="regions-list">
        {availableRegions.map((region, idx) => (
          <option key={idx} value={region} />
        ))}
      </datalist>

      {/* Header Section */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-blue-600 p-3 rounded-lg shadow-lg shadow-blue-200">
          <Facebook className="text-white w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">نظام النشر على فيسبوك</h1>
          <p className="text-slate-500 mt-1">أتمتة النشر وإدارة الكتالوجات الفورية باحترافية</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Section A: Automated Rules */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <Settings className="text-slate-400 w-5 h-5" />
            <h2 className="text-lg font-semibold text-slate-700">قواعد النشر التلقائي</h2>
          </div>
          
          <div className="p-6 flex-1 flex flex-col">
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              سيقوم النظام بجمع العقارات التي يتم إضافتها، وعندما يصل عددها إلى الرقم المحدد لأي منطقة سيتم نشر بوست تلقائياً.
            </p>
            
            <form onSubmit={handleAddRule} className="flex flex-col sm:flex-row gap-3 mb-8">
              <div className="relative flex-1">
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  list="regions-list"
                  placeholder="اختر أو اكتب اسم المنطقة..." 
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                  value={newRegion}
                  onChange={(e) => setNewRegion(e.target.value)}
                  required
                />
              </div>
              <div className="relative w-full sm:w-32">
                <Hash className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="number" 
                  placeholder="العدد" 
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="flex items-center justify-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium">
                <Plus className="w-4 h-4" /> إضافة
              </button>
            </form>

            <div className="flex-1 rounded-xl border border-slate-200 overflow-hidden bg-white">
              {rulesLoading ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              ) : (
                <table className="w-full text-sm text-right">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-semibold text-slate-600">المنطقة</th>
                      <th className="py-3 px-4 font-semibold text-slate-600">العدد المطلوب</th>
                      <th className="py-3 px-4 font-semibold text-slate-600 w-24">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 text-slate-700 font-medium">{rule.region_name}</td>
                        <td className="py-3 px-4 text-slate-600">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                            {rule.threshold} عقار
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button 
                            type="button"
                            onClick={() => handleDeleteRule(rule.region_name)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-md"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {rules.length === 0 && (
                      <tr>
                        <td colSpan="3" className="text-center py-12 text-slate-400 flex flex-col items-center gap-2">
                          <Settings className="w-8 h-8 opacity-20" />
                          <span>لا توجد قواعد مضافة حالياً.</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Section B: Manual Trigger */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative group">
          {/* Subtle gradient accent at top */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <Send className="text-blue-500 w-5 h-5" />
            <h2 className="text-lg font-semibold text-slate-700">النشر الفوري (كتالوج)</h2>
          </div>
          
          <div className="p-6">
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
              اختر منطقة لنشر أحدث عقاراتها فوراً ككتالوج في فيسبوك مع إرفاق صور العقارات.
            </p>
            
            <form onSubmit={handleManualPublish} className="flex flex-col gap-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">المنطقة المُستهدفة</label>
                  <div className="relative">
                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                      type="text" 
                      list="regions-list"
                      className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                      placeholder="اختر أو اكتب اسم المنطقة..."
                      value={manualRegion}
                      onChange={(e) => setManualRegion(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">العدد الأقصى للعقارات</label>
                  <div className="relative">
                    <Hash className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                      type="number" 
                      className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                      value={manualCount}
                      onChange={(e) => setManualCount(e.target.value)}
                      min="1"
                      max="20"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">النص الافتتاحي للبوست (اختياري)</label>
                <div className="relative">
                  <MessageSquare className="absolute right-3 top-3 text-slate-400 w-4 h-4" />
                  <textarea 
                    className="w-full pl-3 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm h-32 resize-none"
                    placeholder="اكتب رسالة جذابة... (سيتم إرفاق قائمة العقارات وصورها تلقائياً أسفل هذا النص)"
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-medium shadow-sm transition-all
                    ${loading 
                      ? 'bg-slate-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5'
                    }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> جاري النشر...
                    </>
                  ) : (
                    <>
                      <Facebook className="w-5 h-5" /> نشر الكتالوج الآن
                    </>
                  )}
                </button>
              </div>
              
              {message.text && (
                <div className={`flex items-start gap-3 p-4 rounded-xl mt-2 text-sm font-medium border
                  ${message.type === 'error' 
                    ? 'bg-red-50 text-red-700 border-red-100' 
                    : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  }`}
                >
                  {message.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                  <p className="pt-0.5">{message.text}</p>
                </div>
              )}
            </form>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default FacebookAutoPost;
