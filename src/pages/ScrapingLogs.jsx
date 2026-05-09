import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ScrapingLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`https://api.sooq-com.com/api/scraping-logs?t=${Date.now()}`);
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch scraping logs', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-JO') + ' ' + date.toLocaleTimeString('ar-JO');
  };

  return (
    <div className="ads-container">
      <div className="ads-header">
        <h1>سجل سحب فيسبوك</h1>
        <button className="primary-btn" onClick={fetchLogs}>تحديث السجل</button>
      </div>

      <div className="card table-card">
        {loading ? (
          <div className="loading-state">جاري تحميل السجل...</div>
        ) : logs.length === 0 ? (
          <div className="empty-state">لا يوجد سجلات سحب حالياً</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>رقم</th>
                  <th>اسم المجموعة / الصفحة</th>
                  <th>تم الحفظ</th>
                  <th>تخطى (مكرر/مرفوض)</th>
                  <th>أخطاء</th>
                  <th>التاريخ والوقت</th>
                  <th>التفاصيل</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>#{log.id}</td>
                    <td><span style={{ fontWeight: 'bold' }}>{log.group_name || 'غير معروف'}</span></td>
                    <td><span className="badge badge-success">{log.saved_ads}</span></td>
                    <td><span className="badge badge-warning">{log.skipped_ads}</span></td>
                    <td><span className="badge badge-danger">{log.errors_count}</span></td>
                    <td dir="ltr">{formatDate(log.created_at)}</td>
                    <td>
                      {log.json_data && log.json_data.length > 0 ? (
                        <details style={{ cursor: 'pointer' }}>
                          <summary style={{ color: '#007bff' }}>عرض</summary>
                          <pre style={{ textAlign: 'left', direction: 'ltr', fontSize: '11px', maxHeight: '150px', overflowY: 'auto', background: '#f8f9fa', padding: '5px', marginTop: '5px', borderRadius: '4px' }}>
                            {JSON.stringify(log.json_data, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScrapingLogs;
