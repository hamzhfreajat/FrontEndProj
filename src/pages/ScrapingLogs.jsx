import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const ScrapingLogs = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Pagination & Sorting
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  // Filters
  const [filters, setFilters] = useState({
    group_name: '',
    min_saved_ads: '',
    min_errors: ''
  });

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit,
        sort_by: sortConfig.key,
        sort_desc: sortConfig.direction === 'desc',
        t: Date.now()
      });

      if (filters.group_name) params.append('group_name', filters.group_name);
      if (filters.min_saved_ads) params.append('min_saved_ads', filters.min_saved_ads);
      if (filters.min_errors) params.append('min_errors', filters.min_errors);

      const res = await axios.get(`https://api.sooq-com.com/api/scraping-logs?${params.toString()}`);
      if (res.data.items) {
        setLogs(res.data.items);
        setTotal(res.data.total);
      } else {
        // Fallback if backend isn't updated yet
        setLogs(res.data);
        setTotal(res.data.length);
      }
    } catch (err) {
      console.error('Failed to fetch scraping logs', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortConfig, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
    setPage(1);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setPage(1);
    fetchLogs();
  };

  const clearFilters = () => {
    setFilters({ group_name: '', min_saved_ads: '', min_errors: '' });
    setPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-JO') + ' ' + date.toLocaleTimeString('ar-JO');
  };

  const totalPages = Math.ceil(total / limit);

  const renderSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return <span style={{opacity: 0.3, marginRight: '5px'}}>↕</span>;
    return sortConfig.direction === 'asc' ? <span style={{marginRight: '5px'}}>↑</span> : <span style={{marginRight: '5px'}}>↓</span>;
  };

  return (
    <div className="ads-container">
      <div className="ads-header">
        <h1>سجل سحب فيسبوك</h1>
        <button className="primary-btn" onClick={fetchLogs}>تحديث السجل</button>
      </div>

      <div className="card filter-card" style={{ marginBottom: '20px', padding: '15px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ flex: '1', minWidth: '200px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>اسم المجموعة</label>
          <input type="text" name="group_name" value={filters.group_name} onChange={handleFilterChange} placeholder="ابحث باسم المجموعة..." style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <div style={{ flex: '1', minWidth: '150px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>الحد الأدنى للمحفوظة</label>
          <input type="number" name="min_saved_ads" value={filters.min_saved_ads} onChange={handleFilterChange} placeholder="مثال: 5" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <div style={{ flex: '1', minWidth: '150px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>الحد الأدنى للأخطاء</label>
          <input type="number" name="min_errors" value={filters.min_errors} onChange={handleFilterChange} placeholder="مثال: 1" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          <button className="primary-btn" onClick={applyFilters}>تطبيق الفلاتر</button>
          <button className="secondary-btn" onClick={clearFilters} style={{ background: '#f8f9fa', border: '1px solid #ddd', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>مسح</button>
        </div>
      </div>

      <div className="card table-card">
        {loading ? (
          <div className="loading-state">جاري تحميل السجل...</div>
        ) : logs.length === 0 ? (
          <div className="empty-state">لا يوجد سجلات سحب تطابق الفلاتر</div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('id')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      رقم {renderSortIcon('id')}
                    </th>
                    <th onClick={() => handleSort('group_name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      اسم المجموعة / الصفحة {renderSortIcon('group_name')}
                    </th>
                    <th onClick={() => handleSort('saved_ads')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      تم الحفظ {renderSortIcon('saved_ads')}
                    </th>
                    <th onClick={() => handleSort('skipped_ads')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      تخطى (مكرر/مرفوض) {renderSortIcon('skipped_ads')}
                    </th>
                    <th onClick={() => handleSort('errors_count')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      أخطاء {renderSortIcon('errors_count')}
                    </th>
                    <th onClick={() => handleSort('created_at')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      التاريخ والوقت {renderSortIcon('created_at')}
                    </th>
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
            
            <div className="pagination" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderTop: '1px solid #eee' }}>
              <div style={{ fontSize: '14px', color: '#666' }}>
                إجمالي السجلات: <strong>{total}</strong> | صفحة {page} من {totalPages || 1}
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select 
                  value={limit} 
                  onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                  style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="20">20 سجل</option>
                  <option value="50">50 سجل</option>
                  <option value="100">100 سجل</option>
                </select>
                
                <button 
                  disabled={page === 1} 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  style={{ padding: '6px 12px', border: '1px solid #ddd', background: page === 1 ? '#f5f5f5' : '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', borderRadius: '4px' }}
                >
                  السابق
                </button>
                <button 
                  disabled={page >= totalPages} 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  style={{ padding: '6px 12px', border: '1px solid #ddd', background: page >= totalPages ? '#f5f5f5' : '#fff', cursor: page >= totalPages ? 'not-allowed' : 'pointer', borderRadius: '4px' }}
                >
                  التالي
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ScrapingLogs;
