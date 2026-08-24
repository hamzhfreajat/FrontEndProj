import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await axios.get('https://staging.sooq-com.com/api/dashboard/reports');
      setReports(res.data);
    } catch (err) {
      console.error('Failed to fetch reports', err);
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
        <button className="primary-btn" onClick={fetchReports}>تحديث البلاغات</button>
      </div>

      <div className="card table-card">
        {loading ? (
          <div className="loading-state">جاري تحميل البلاغات...</div>
        ) : reports.length === 0 ? (
          <div className="empty-state">لا توجد بلاغات حالياً</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>رقم البلاغ</th>
                  <th>رقم الإعلان</th>
                  <th>عنوان الإعلان</th>
                  <th>المبلغ</th>
                  <th>سبب البلاغ</th>
                  <th>ملاحظات إضافية</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>#{report.id}</td>
                    <td>#{report.ad_id}</td>
                    <td>{report.ad_title || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{report.reporter_name || 'زائر مجهول'}</span>
                        {report.reporter_phone && (
                          <span style={{ fontSize: '0.85em', color: 'gray', direction: 'ltr' }}>
                            {report.reporter_phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="badge warning-badge">
                        {report.reason}
                      </span>
                    </td>
                    <td>{report.comments || '-'}</td>
                    <td dir="ltr">{formatDate(report.created_at)}</td>
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

export default Reports;
