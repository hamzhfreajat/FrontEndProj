import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SearchLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('https://api.sooq-com.com/api/admin/search_logs');
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch search logs', err);
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
        <button className="primary-btn" onClick={fetchLogs}>تحديث السجل</button>
      </div>

      <div className="card table-card">
        {loading ? (
          <div className="loading-state">جاري تحميل السجل...</div>
        ) : logs.length === 0 ? (
          <div className="empty-state">لا يوجد عمليات بحث حالياً</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>رقم</th>
                  <th>نص البحث</th>
                  <th>التاريخ والوقت</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>#{log.id}</td>
                    <td><span style={{ fontWeight: 'bold' }}>{log.query_text}</span></td>
                    <td dir="ltr">{formatDate(log.created_at)}</td>
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

export default SearchLogs;
