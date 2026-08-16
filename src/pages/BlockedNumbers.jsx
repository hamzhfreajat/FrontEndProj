import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BlockedNumbers = () => {
  const [blockedNumbers, setBlockedNumbers] = useState([]);
  const [newNumber, setNewNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const apiUrl = process.env.REACT_APP_API_URL || 'https://api.sooq-com.com';

  useEffect(() => {
    fetchBlockedNumbers();
  }, []);

  const fetchBlockedNumbers = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${apiUrl}/blacklist/phones`);
      setBlockedNumbers(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('فشل في جلب قائمة الأرقام المحظورة');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockNumber = async (e) => {
    e.preventDefault();
    if (!newNumber.trim()) return;

    if (!window.confirm(`هل أنت متأكد من حظر الرقم ${newNumber}؟ سيتم حذف جميع الإعلانات المرتبطة بهذا الرقم.`)) {
        return;
    }

    try {
      setActionLoading(true);
      await axios.post(`${apiUrl}/blacklist/phones`, { phone_number: newNumber.trim() });
      setNewNumber('');
      fetchBlockedNumbers();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'فشل في حظر الرقم');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblock = async (phone) => {
    if (!window.confirm(`هل أنت متأكد من إلغاء حظر الرقم ${phone}؟`)) return;

    try {
      setActionLoading(true);
      await axios.delete(`${apiUrl}/blacklist/phones/${phone}`);
      fetchBlockedNumbers();
    } catch (err) {
      console.error(err);
      setError('فشل في إلغاء حظر الرقم');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>الأرقام المحظورة</h2>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div style={{ marginBottom: '30px', padding: '20px', background: '#f5f7fa', borderRadius: '8px' }}>
        <h3>حظر رقم جديد</h3>
        <p style={{ color: '#666', marginBottom: '15px' }}>
            بإضافة رقم إلى هذه القائمة، لن يقوم نظام الذكاء الاصطناعي بسحب أي إعلانات تحتوي على هذا الرقم. كما سيتم حذف الإعلانات الحالية التي تحتوي على هذا الرقم.
        </p>
        <form onSubmit={handleBlockNumber} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="أدخل رقم الهاتف (مثال: 0791234567)"
            value={newNumber}
            onChange={(e) => setNewNumber(e.target.value)}
            style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
            disabled={actionLoading}
          />
          <button 
            type="submit" 
            className="btn primary" 
            disabled={actionLoading || !newNumber.trim()}
            style={{ padding: '10px 20px' }}
          >
            {actionLoading ? 'جاري التنفيذ...' : 'حظر الرقم وحذف الإعلانات'}
          </button>
        </form>
      </div>

      {loading ? (
        <p>جاري التحميل...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '12px' }}>رقم الهاتف</th>
                <th style={{ padding: '12px' }}>تاريخ الحظر</th>
                <th style={{ padding: '12px' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {blockedNumbers.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                    لا توجد أرقام محظورة
                  </td>
                </tr>
              ) : (
                blockedNumbers.map((block) => (
                  <tr key={block.phone_number} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px', direction: 'ltr', textAlign: 'right' }}>{block.phone_number}</td>
                    <td style={{ padding: '12px', direction: 'ltr', textAlign: 'right' }}>
                        {new Date(block.created_at).toLocaleString('ar-EG')}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button
                        className="btn danger"
                        onClick={() => handleUnblock(block.phone_number)}
                        disabled={actionLoading}
                        style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                      >
                        إلغاء الحظر
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BlockedNumbers;
