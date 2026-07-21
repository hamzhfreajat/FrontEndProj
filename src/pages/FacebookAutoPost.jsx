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
  Loader2 
} from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.sooq-com.com/api';

const FacebookAutoPost = () => {
  const [rules, setRules] = useState([]);
  const [availableRegions, setAvailableRegions] = useState([]);
  
  const [newRegion, setNewRegion] = useState('');
  const [newThreshold, setNewThreshold] = useState(100);
  
  // Manual trigger state
  const [manualRegion, setManualRegion] = useState('');
  const [manualCategory, setManualCategory] = useState('');
  const [manualCount, setManualCount] = useState(10);
  const [manualText, setManualText] = useState('');
  
  const [availableCategories, setAvailableCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchData = async () => {
    setRulesLoading(true);
    try {
      const [rulesRes, locRes, catRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/facebook-rules`),
        axios.get(`${API_BASE_URL}/locations`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/categories`).catch(() => ({ data: [] }))
      ]);
      setRules(rulesRes.data);
      const catData = catRes.data || [];
      const rootIds = catData
        .filter(c => c.name && (c.name.includes("عقارات للايجار") || c.name.includes("عقارات للبيع")))
        .map(c => c.id);
        
      const descendantIds = new Set(rootIds);
      let changed = true;
      while (changed) {
        changed = false;
        catData.forEach(c => {
          if (c.parent_id && descendantIds.has(c.parent_id) && !descendantIds.has(c.id)) {
            descendantIds.add(c.id);
            changed = true;
          }
        });
      }
      
      const filteredCategories = catData.filter(c => descendantIds.has(c.id));
      setAvailableCategories(filteredCategories);
      
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
      console.error("Error fetching data:", err);
    } finally {
      setRulesLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (manualRegion || manualCategory) {
      const categoryPart = manualCategory ? `/category/${manualCategory}` : '';
      const locationPart = manualRegion ? `?locations=${encodeURIComponent(manualRegion)}` : '';
      const link = `https://share.sooq-com.com${categoryPart}${locationPart}`;
      
      const text = `تبحث عن عقار في ${manualRegion || 'منطقتك'}؟ 🏡✨\nاكتشف أحدث وأفضل العقارات المعروضة لدينا في هذه المجموعة المميزة! 🌟\n\nيمكنك تصفح المزيد عبر التطبيق:\n${link}`;
      
      setManualText(text);
    }
  }, [manualRegion, manualCategory]);

  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!newRegion) return;
    
    try {
      await axios.post(`${API_BASE_URL}/facebook-rules`, {
        region_name: newRegion,
        threshold: parseInt(newThreshold)
      });
      setNewRegion('');
      setNewThreshold(100);
      
      const res = await axios.get(`${API_BASE_URL}/facebook-rules`);
      setRules(res.data);
    } catch (err) {
      alert("Error adding rule");
    }
  };

  const handleDeleteRule = async (region_name) => {
    if (window.confirm(`هل أنت متأكد من حذف القاعدة لمنطقة ${region_name}؟`)) {
      try {
        await axios.delete(`${API_BASE_URL}/facebook-rules/${region_name}`);
        const res = await axios.get(`${API_BASE_URL}/facebook-rules`);
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
      let category_id = undefined;
      if (manualCategory) {
        const foundCat = availableCategories.find(c => c.name === manualCategory);
        if (foundCat) category_id = foundCat.id;
      }

      const res = await axios.post(`${API_BASE_URL}/facebook/manual-publish`, {
        region_name: manualRegion,
        count: parseInt(manualCount),
        custom_text: manualText || undefined,
        category_id: category_id

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

  const styles = {
    container: { padding: '30px', maxWidth: '1400px', margin: '0 auto', direction: 'rtl', fontFamily: "'Cairo', sans-serif" },
    headerBox: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' },
    iconBox: { backgroundColor: '#1877F2', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 15px rgba(24, 119, 242, 0.2)' },
    title: { margin: 0, fontSize: '28px', fontWeight: '800', color: '#1e293b' },
    subtitle: { margin: '4px 0 0 0', fontSize: '15px', color: '#64748b' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '30px' },
    card: { backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
    cardHeader: { padding: '20px 24px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' },
    cardTitle: { margin: 0, fontSize: '18px', fontWeight: '700', color: '#334155' },
    cardBody: { padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' },
    description: { fontSize: '14px', color: '#64748b', marginBottom: '24px', lineHeight: '1.6' },
    formRow: { display: 'flex', gap: '15px', marginBottom: '24px', flexWrap: 'wrap' },
    inputGroup: { position: 'relative', flex: '1 1 auto', minWidth: '200px' },
    inputLabel: { display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' },
    input: { width: '100%', padding: '12px 16px 12px 40px', fontSize: '14px', border: '1px solid #e2e8f0', borderRadius: '10px', backgroundColor: '#f8fafc', outline: 'none', transition: 'all 0.2s ease', color: '#334155', fontWeight: '500' },
    textarea: { width: '100%', padding: '14px 16px 14px 40px', fontSize: '14px', border: '1px solid #e2e8f0', borderRadius: '10px', backgroundColor: '#f8fafc', outline: 'none', transition: 'all 0.2s ease', minHeight: '120px', resize: 'vertical', color: '#334155' },
    inputIcon: { position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' },
    textareaIcon: { position: 'absolute', left: '14px', top: '14px', color: '#94a3b8' },
    buttonPrimary: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#1e293b', color: '#ffffff', border: 'none', padding: '12px 24px', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 4px 6px rgba(15, 23, 42, 0.1)', height: '46px', minWidth: '120px' },
    buttonFacebook: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#1877F2', color: '#ffffff', border: 'none', padding: '14px 24px', borderRadius: '10px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 6px 12px rgba(24, 119, 242, 0.2)', width: '100%', marginTop: '10px' },
    tableContainer: { border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '14px' },
    th: { padding: '14px 20px', backgroundColor: '#f8fafc', color: '#475569', fontWeight: '700', borderBottom: '1px solid #e2e8f0' },
    td: { padding: '14px 20px', borderBottom: '1px solid #f1f5f9', color: '#334155', fontWeight: '500' },
    badge: { display: 'inline-flex', alignItems: 'center', backgroundColor: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' },
    actionBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', border: 'none', backgroundColor: '#fef2f2', color: '#ef4444', cursor: 'pointer', transition: 'all 0.2s ease' },
    messageAlert: { display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', borderRadius: '10px', marginTop: '16px', fontWeight: '600', fontSize: '14px' },
    successAlert: { backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' },
    errorAlert: { backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }
  };

  return (
    <div style={styles.container}>
      <datalist id="regions-list">
        {availableRegions.map((region, idx) => (
          <option key={idx} value={region} />
        ))}
      </datalist>

      <div style={styles.headerBox}>
        <div style={styles.iconBox}>
          <Facebook size={28} color="white" />
        </div>
        <div>
          </div>
      </div>

      <div style={styles.grid}>
        
        {/* Automated Rules Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <Settings size={22} color="#64748b" />
            <h2 style={styles.cardTitle}>قواعد النشر التلقائي</h2>
          </div>
          
          <div style={styles.cardBody}>
            <p style={styles.description}>
              سيقوم النظام بجمع العقارات التي يتم إضافتها، وعندما يصل عددها إلى الرقم المحدد لأي منطقة سيتم نشر بوست تلقائياً.
            </p>
            
            <form onSubmit={handleAddRule} style={styles.formRow}>
              <div style={styles.inputGroup}>
                <MapPin size={18} style={styles.inputIcon} />
                <input 
                  type="text" 
                  list="regions-list"
                  placeholder="اختر أو اكتب اسم المنطقة..." 
                  style={{ ...styles.input, paddingLeft: '40px', paddingRight: '16px' }}
                  value={newRegion}
                  onChange={(e) => setNewRegion(e.target.value)}
                  required
                />
              </div>
              <div style={{ ...styles.inputGroup, flex: '0 1 120px', minWidth: '120px' }}>
                <Hash size={18} style={styles.inputIcon} />
                <input 
                  type="number" 
                  placeholder="العدد" 
                  style={{ ...styles.input, paddingLeft: '40px', paddingRight: '16px' }}
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(e.target.value)}
                  required
                />
              </div>
              <button type="submit" style={styles.buttonPrimary}>
                <Plus size={18} /> إضافة
              </button>
            </form>

            <div style={styles.tableContainer}>
              {rulesLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                  <Loader2 size={32} color="#2563eb" className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>المنطقة</th>
                      <th style={styles.th}>العدد المطلوب</th>
                      <th style={{ ...styles.th, width: '80px', textAlign: 'center' }}>إجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((rule) => (
                      <tr key={rule.id}>
                        <td style={styles.td}>{rule.region_name}</td>
                        <td style={styles.td}>
                          <span style={styles.badge}>{rule.threshold} عقار</span>
                        </td>
                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          <button 
                            type="button"
                            onClick={() => handleDeleteRule(rule.region_name)}
                            style={styles.actionBtn}
                            title="حذف"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {rules.length === 0 && (
                      <tr>
                        <td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                          <Settings size={32} style={{ opacity: 0.2, margin: '0 auto 10px auto', display: 'block' }} />
                          لا توجد قواعد مضافة حالياً.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Manual Trigger Card */}
        <div style={styles.card}>
          <div style={{ height: '4px', background: 'linear-gradient(90deg, #1877F2 0%, #8b5cf6 100%)', width: '100%' }}></div>
          <div style={styles.cardHeader}>
            <Send size={22} color="#1877F2" />
            <h2 style={styles.cardTitle}>النشر الفوري (كتالوج)</h2>
          </div>
          
          <div style={styles.cardBody}>
            <p style={styles.description}>
              اختر منطقة لنشر أحدث عقاراتها فوراً ككتالوج في فيسبوك مع إرفاق صور العقارات بشكل جذاب.
            </p>
            
            <form onSubmit={handleManualPublish} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={styles.inputLabel}>المنطقة المُستهدفة</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={18} style={styles.inputIcon} />
                    <input 
                      type="text" 
                      list="regions-list"
                      placeholder="اختر اسم المنطقة..."
                      style={{ ...styles.input, paddingLeft: '40px', paddingRight: '16px' }}
                      value={manualRegion}
                      onChange={(e) => setManualRegion(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={styles.inputLabel}>القسم (اختياري)</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      list="categories-list"
                      placeholder="اختر أو اكتب القسم..."
                      style={{ ...styles.input, paddingLeft: '16px', paddingRight: '16px' }}
                      value={manualCategory}
                      onChange={(e) => setManualCategory(e.target.value)}
                    />
                    <datalist id="categories-list">
                      {availableCategories.map(cat => (
                        <option key={cat.id} value={cat.name} />
                      ))}
                    </datalist>
                  </div>
                </div>
                
                <div>
                  <label style={styles.inputLabel}>العدد الأقصى</label>
                  <div style={{ position: 'relative' }}>
                    <Hash size={18} style={styles.inputIcon} />
                    <input 
                      type="number" 
                      style={{ ...styles.input, paddingLeft: '40px', paddingRight: '16px' }}
                      value={manualCount}
                      onChange={(e) => setManualCount(e.target.value)}
                      min="1"
                      max="20"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label style={styles.inputLabel}>النص الافتتاحي للبوست (اختياري)</label>
                <div style={{ position: 'relative' }}>
                  <MessageSquare size={18} style={styles.textareaIcon} />
                  <textarea 
                    style={{ ...styles.textarea, paddingLeft: '40px', paddingRight: '16px' }}
                    placeholder="اكتب رسالة جذابة... (سيتم إرفاق قائمة العقارات وصورها تلقائياً أسفل هذا النص)"
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                style={{ ...styles.buttonFacebook, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? (
                  <><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> جاري النشر...</>
                ) : (
                  <><Facebook size={20} /> نشر الكتالوج الآن</>
                )}
              </button>
              
              {message.text && (
                <div style={{ ...styles.messageAlert, ...(message.type === 'error' ? styles.errorAlert : styles.successAlert) }}>
                  {message.type === 'error' ? <AlertCircle size={20} style={{ flexShrink: 0 }} /> : <CheckCircle2 size={20} style={{ flexShrink: 0 }} />}
                  <span>{message.text}</span>
                </div>
              )}
            </form>
          </div>
        </div>
        
      </div>
      
      {/* Required for simple rotation animation since we don't have Tailwind classes */}
      <style>
        {`
          @keyframes spin { 100% { transform: rotate(360deg); } }
          .animate-spin { animation: spin 1s linear infinite; }
        `}
      </style>
    </div>
  );
};

export default FacebookAutoPost;
