import React, { useState, useEffect } from 'react';
import axios from 'axios';

function OtpLogs() {
  const [otps, setOtps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOtps();
  }, []);

  const fetchOtps = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
      const response = await axios.get(`${API_URL}/auth/admin/otps`);
      setOtps(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching OTP logs:', err);
      setError('حدث خطأ أثناء جلب سجلات التحقق');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>سجلات التحقق (OTP Logs)</h2>
        <button className="btn btn-primary" onClick={fetchOtps} disabled={loading}>
          {loading ? 'جاري التحديث...' : 'تحديث'}
        </button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee' }}>
              <th style={{ padding: '12px' }}>الرقم (ID)</th>
              <th style={{ padding: '12px' }}>رقم الهاتف</th>
              <th style={{ padding: '12px' }}>رمز التحقق (OTP)</th>
              <th style={{ padding: '12px' }}>تاريخ الإنشاء</th>
              <th style={{ padding: '12px' }}>تاريخ الانتهاء</th>
              <th style={{ padding: '12px' }}>المحاولات</th>
              <th style={{ padding: '12px' }}>IP عنوان</th>
            </tr>
          </thead>
          <tbody>
            {loading && otps.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>جاري التحميل...</td>
              </tr>
            ) : otps.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>لا توجد سجلات.</td>
              </tr>
            ) : (
              otps.map((otp) => (
                <tr key={otp.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>{otp.id}</td>
                  <td style={{ padding: '12px', direction: 'ltr' }}>{otp.mobile_number}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#e74c3c', letterSpacing: '2px' }}>{otp.otp_code}</td>
                  <td style={{ padding: '12px', direction: 'ltr' }}>{new Date(otp.created_at).toLocaleString('en-US')}</td>
                  <td style={{ padding: '12px', direction: 'ltr' }}>{new Date(otp.expires_at).toLocaleString('en-US')}</td>
                  <td style={{ padding: '12px' }}>{otp.attempts}</td>
                  <td style={{ padding: '12px', direction: 'ltr' }}>{otp.ip_address || 'N/A'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default OtpLogs;
