import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SearchLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterZero, setFilterZero] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [filterZero]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let url = 'https://api.sooq-com.com/api/admin/search_logs?limit=200';
      if (filterZero) {
        url += '&results_count=0';
      }
      const res = await axios.get(url);
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
      <div className="ads-header" style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
        <button className="btn btn-primary" onClick={fetchLogs}>تحديث السجل</button>
        <button 
          className={`btn ${filterZero ? 'btn-danger' : 'btn-outline'}`}
          onClick={() => setFilterZero(!filterZero)}
        >
          {filterZero ? 'إظهار جميع عمليات البحث' : 'عرض عمليات البحث بصفر نتائج'}
        </button>
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
                  <th>عدد النتائج</th>
                  <th>التاريخ والوقت</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>#{log.id}</td>
                    <td><span style={{ fontWeight: 'bold' }}>{log.query_text}</span></td>
                    <td>
                      <span className={`badge ${log.results_count === 0 ? 'badge-danger' : 'badge-success'}`}>
                        {log.results_count !== undefined ? log.results_count : '-'}
                      </span>
                    </td>
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
