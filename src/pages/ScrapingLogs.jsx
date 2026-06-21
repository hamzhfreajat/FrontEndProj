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

      <div className="card filter-card" style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#4b5563' }}>ابحث باسم المجموعة أو الصفحة</label>
            <input type="text" name="group_name" value={filters.group_name} onChange={handleFilterChange} placeholder="مثال: سيارات للبيع..." style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', transition: 'border-color 0.2s' }} onFocus={(e) => e.target.style.borderColor = '#3b82f6'} onBlur={(e) => e.target.style.borderColor = '#d1d5db'} />
          </div>
          <div style={{ flex: '1', minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#4b5563' }}>الحد الأدنى للمحفوظة</label>
            <input type="number" name="min_saved_ads" value={filters.min_saved_ads} onChange={handleFilterChange} placeholder="0" style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none' }} />
          </div>
          <div style={{ flex: '1', minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#4b5563' }}>الحد الأدنى للأخطاء</label>
            <input type="number" name="min_errors" value={filters.min_errors} onChange={handleFilterChange} placeholder="0" style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none' }} />
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={applyFilters} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' }}>تطبيق الفلاتر</button>
            <button onClick={clearFilters} style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>مسح</button>
            
            {/* Quick Sort Buttons */}
            <button 
              onClick={() => {
                setSortConfig({ key: 'group_name', direction: 'asc' });
                setPage(1);
              }} 
              style={{ background: '#8b5cf6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 2px 4px rgba(139, 92, 246, 0.2)' }}
            >
              <span>🗂️</span> تجميع المجموعات أسفل بعضها
            </button>
            <button 
              onClick={() => {
                setSortConfig({ key: 'saved_ads', direction: 'desc' });
                setPage(1);
              }} 
              style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)' }}
            >
              <span>🔥</span> الأعلى حفظاً
            </button>
            <button 
              onClick={() => {
                setSortConfig({ key: 'saved_ads', direction: 'asc' });
                setPage(1);
              }} 
              style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)' }}
            >
              <span>❄️</span> الأقل حفظاً
            </button>
          </div>
        </div>
      </div>

      <div className="card table-card" style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-state" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>جاري تحميل السجل...</div>
        ) : logs.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>لا يوجد سجلات سحب تطابق الفلاتر</div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th onClick={() => handleSort('id')} style={{ cursor: 'pointer', userSelect: 'none', padding: '15px', color: '#475569', fontWeight: '600' }}>
                      رقم {renderSortIcon('id')}
                    </th>
                    <th onClick={() => handleSort('group_name')} style={{ cursor: 'pointer', userSelect: 'none', padding: '15px', color: '#475569', fontWeight: '600' }}>
                      اسم المجموعة / الصفحة {renderSortIcon('group_name')}
                    </th>
                    <th onClick={() => handleSort('saved_ads')} style={{ cursor: 'pointer', userSelect: 'none', padding: '15px', color: '#475569', fontWeight: '600' }}>
                      تم الحفظ {renderSortIcon('saved_ads')}
                    </th>
                    <th onClick={() => handleSort('skipped_ads')} style={{ cursor: 'pointer', userSelect: 'none', padding: '15px', color: '#475569', fontWeight: '600' }}>
                      تخطى (مكرر/مرفوض) {renderSortIcon('skipped_ads')}
                    </th>
                    <th onClick={() => handleSort('errors_count')} style={{ cursor: 'pointer', userSelect: 'none', padding: '15px', color: '#475569', fontWeight: '600' }}>
                      أخطاء {renderSortIcon('errors_count')}
                    </th>
                    <th onClick={() => handleSort('created_at')} style={{ cursor: 'pointer', userSelect: 'none', padding: '15px', color: '#475569', fontWeight: '600' }}>
                      التاريخ والوقت {renderSortIcon('created_at')}
                    </th>
                    <th style={{ padding: '15px', color: '#475569', fontWeight: '600' }}>التفاصيل</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background-color 0.2s', ':hover': { backgroundColor: '#f8fafc' } }}>
                      <td style={{ padding: '15px', color: '#64748b' }}>#{log.id}</td>
                      <td style={{ padding: '15px' }}><span style={{ fontWeight: '600', color: '#0f172a' }}>{log.group_name || 'غير معروف'}</span></td>
                      <td style={{ padding: '15px' }}><span className="badge badge-success" style={{ background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold' }}>{log.saved_ads}</span></td>
                      <td style={{ padding: '15px' }}><span className="badge badge-warning" style={{ background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold' }}>{log.skipped_ads}</span></td>
                      <td style={{ padding: '15px' }}><span className="badge badge-danger" style={{ background: '#fee2e2', color: '#991b1b', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold' }}>{log.errors_count}</span></td>
                      <td dir="ltr" style={{ padding: '15px', color: '#475569', fontSize: '13px' }}>{formatDate(log.created_at)}</td>
                      <td style={{ padding: '15px', maxWidth: '350px' }}>
                        {log.json_data && log.json_data.length > 0 ? (
                          <details style={{ cursor: 'pointer' }}>
                            <summary style={{ color: '#2563eb', fontWeight: '500', outline: 'none' }}>تفاصيل السحب ({log.json_data.length})</summary>
                            <div style={{ textAlign: 'right', fontSize: '12px', maxHeight: '180px', overflowY: 'auto', background: '#f1f5f9', padding: '10px', marginTop: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#334155' }}>
                              <ul style={{ margin: 0, paddingInlineStart: '20px' }}>
                                {log.json_data.map((item, idx) => {
                                  if (item.status === 'skipped' || item.status === 'error') {
                                    return (
                                      <li key={idx} style={{ marginBottom: '4px', color: item.status === 'error' ? '#ef4444' : '#d97706' }}>
                                        <strong>مرفوض/متخطي:</strong> {item.reason || 'بدون سبب'}
                                      </li>
                                    );
                                  } else if (item.status === 'saved') {
                                    return (
                                      <li key={idx} style={{ marginBottom: '4px', color: '#10b981' }}>
                                        <strong>تم الحفظ:</strong> إعلان #{item.ad_id || '-'}
                                      </li>
                                    );
                                  }
                                  return null;
                                })}
                              </ul>
                              {log.json_data.filter(i => i.status === 'skipped' || i.status === 'error' || i.status === 'saved').length === 0 && (
                                <pre style={{ textAlign: 'left', direction: 'ltr', fontSize: '11px', margin: 0 }}>
                                  {JSON.stringify(log.json_data, null, 2)}
                                </pre>
                              )}
                            </div>
                          </details>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>-</span>
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
