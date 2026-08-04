import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

const API_BASE_URL = 'https://api.sooq-com.com';

export default function AppSettings() {
  const [config, setConfig] = useState({
    latest_version: '',
    min_required_version: '',
    store_url_android: '',
    store_url_ios: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/config/version`);
      if (res.data) {
        setConfig({
          latest_version: res.data.latest_version || '',
          min_required_version: res.data.min_required_version || '',
          store_url_android: res.data.store_url_android || '',
          store_url_ios: res.data.store_url_ios || ''
        });
      }
    } catch (err) {
      console.error('Failed to fetch app config', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });
    try {
      await axios.put(`${API_BASE_URL}/api/config/version`, config);
      setMessage({ text: 'تم حفظ الإعدادات بنجاح!', type: 'success' });
    } catch (err) {
      setMessage({ text: 'حدث خطأ أثناء حفظ الإعدادات.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>جاري التحميل...</div>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <Settings size={32} color="#2563EB" />
        <h1 style={{ margin: 0, fontSize: '28px', color: '#1E293B', fontWeight: 'bold' }}>إعدادات التطبيق والتحديثات</h1>
      </div>

      {message.text && (
        <div style={{
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: message.type === 'success' ? '#ECFDF5' : '#FEF2F2',
          color: message.type === 'success' ? '#059669' : '#DC2626',
          border: '1px solid ' + (message.type === 'success' ? '#A7F3D0' : '#FECACA')
        }}>
          {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
          <span style={{ fontWeight: '500', fontSize: '16px' }}>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', color: '#334155', marginBottom: '8px', fontWeight: 'bold' }}>أحدث إصدار متاح (Latest Version)</h3>
          <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '12px' }}>سيتم إظهار رسالة <b>تحديث اختياري</b> للمستخدمين الذين يمتلكون إصداراً أقدم من هذا الرقم.</p>
          <input
            type="text"
            value={config.latest_version}
            onChange={e => setConfig({...config, latest_version: e.target.value})}
            style={inputStyle}
            placeholder="مثال: 1.0.12"
            required
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', color: '#334155', marginBottom: '8px', fontWeight: 'bold' }}>الحد الأدنى المطلوب (Min Required Version)</h3>
          <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '12px' }}>سيتم إظهار شاشة <b>تحديث إجباري</b> تمنع الدخول للتطبيق لمن يمتلكون إصداراً أقدم من هذا الرقم.</p>
          <input
            type="text"
            value={config.min_required_version}
            onChange={e => setConfig({...config, min_required_version: e.target.value})}
            style={inputStyle}
            placeholder="مثال: 1.0.10"
            required
          />
        </div>

        <div style={{ marginBottom: '24px', marginTop: '40px', borderTop: '1px solid #E2E8F0', paddingTop: '24px' }}>
          <h3 style={{ fontSize: '18px', color: '#334155', marginBottom: '8px', fontWeight: 'bold' }}>رابط التطبيق على متجر أندرويد (Google Play)</h3>
          <input
            type="url"
            value={config.store_url_android}
            onChange={e => setConfig({...config, store_url_android: e.target.value})}
            style={inputStyle}
            placeholder="https://play.google.com/..."
            required
          />
        </div>

        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', color: '#334155', marginBottom: '8px', fontWeight: 'bold' }}>رابط التطبيق على متجر آبل (App Store)</h3>
          <input
            type="url"
            value={config.store_url_ios}
            onChange={e => setConfig({...config, store_url_ios: e.target.value})}
            style={inputStyle}
            placeholder="https://apps.apple.com/..."
            required
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: '#2563EB',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            opacity: saving ? 0.7 : 1,
            transition: 'all 0.2s'
          }}
        >
          <Save size={24} />
          {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '8px',
  border: '1px solid #CBD5E1',
  fontSize: '16px',
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box'
};
