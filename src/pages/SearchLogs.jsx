import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Search, User, AlertCircle, Activity, TrendingUp, Filter, RefreshCw, Calendar } from 'lucide-react';

const SearchLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterZero, setFilterZero] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  useEffect(() => {
    fetchLogs();
  }, [filterZero]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let url = 'https://staging.sooq-com.com/api/admin/search_logs?limit=500';
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
    return date.toLocaleDateString('ar-JO') + ' ' + date.toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Derived stats
  const stats = useMemo(() => {
    if (!logs.length) return { total: 0, zero: 0, popular: '-', rate: 0 };
    const zero = logs.filter(l => l.results_count === 0).length;
    
    // Most popular
    const counts = {};
    let max = 0;
    let popular = '-';
    logs.forEach(l => {
      counts[l.query_text] = (counts[l.query_text] || 0) + 1;
      if (counts[l.query_text] > max) {
        max = counts[l.query_text];
        popular = l.query_text;
      }
    });

    return {
      total: logs.length,
      zero,
      popular,
      rate: Math.round(((logs.length - zero) / logs.length) * 100)
    };
  }, [logs]);

  // Client-side search and sort filter
  const filteredAndSortedLogs = useMemo(() => {
    let result = [...logs];

    // Filter
    if (searchTerm) {
      result = result.filter(l => 
        l.query_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.user && l.user.name && l.user.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return result;
  }, [logs, searchTerm, sortConfig]);

  return (
    <div className="search-logs-page animate-fade-in" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={24} color="var(--primary-color)" />
            مراقبة محركات البحث
          </h1>
          <p style={{ color: 'var(--text-gray)', margin: '4px 0 0 0', fontSize: '14px' }}>
            تتبع سلوك المستخدمين والكلمات الأكثر بحثاً لتحسين تجربة المنصة
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn" 
            style={{ 
              background: filterZero ? 'var(--danger-color)' : 'var(--white)',
              color: filterZero ? 'white' : 'var(--text-dark)',
              border: filterZero ? 'none' : '1px solid var(--border-color)'
            }}
            onClick={() => setFilterZero(!filterZero)}
          >
            <Filter size={18} />
            {filterZero ? 'عرض الكل' : 'صفر نتائج فقط'}
          </button>
          <button className="btn btn-primary" onClick={fetchLogs} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spin' : ''} />
            تحديث
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        <div className="card stat-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-gray)', fontWeight: 'bold' }}>إجمالي العمليات المراقبة</p>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '24px' }}>{stats.total}</h3>
          </div>
        </div>

        <div className="card stat-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(229, 57, 53, 0.1)', color: 'var(--danger-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-gray)', fontWeight: 'bold' }}>عمليات بصفر نتائج</p>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '24px' }}>{stats.zero}</h3>
          </div>
        </div>

        <div className="card stat-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(124, 179, 66, 0.1)', color: 'var(--success-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-gray)', fontWeight: 'bold' }}>نسبة النجاح (إيجاد نتائج)</p>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '24px' }}>{stats.rate}%</h3>
          </div>
        </div>

        <div className="card stat-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 135, 33, 0.1)', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Search size={24} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-gray)', fontWeight: 'bold' }}>الكلمة الأكثر بحثاً</p>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '20px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {stats.popular}
            </h3>
          </div>
        </div>

      </div>

      {/* MAIN TABLE CONTENT */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        
        {/* Table Toolbar */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAFAFA' }}>
          <h2 style={{ fontSize: '16px', margin: 0 }}>سجل البحث التفصيلي</h2>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={16} color="var(--text-gray)" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="ابحث في السجل (كلمة أو مستخدم)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingRight: '36px', height: '40px' }}
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-gray)' }}>
            <RefreshCw size={32} className="spin" style={{ marginBottom: '16px' }} />
            <p>جاري تحميل البيانات...</p>
          </div>
        ) : filteredAndSortedLogs.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-gray)' }}>
            <AlertCircle size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p>لا توجد بيانات مطابقة للبحث</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ background: '#F3F4F6', color: 'var(--text-gray)', fontSize: '13px' }}>
                  <th onClick={() => handleSort('id')} style={{ padding: '12px 20px', fontWeight: 'bold', cursor: 'pointer' }}>
                    رقم {sortConfig.key === 'id' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleSort('query_text')} style={{ padding: '12px 20px', fontWeight: 'bold', cursor: 'pointer' }}>
                    نص البحث {sortConfig.key === 'query_text' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ padding: '12px 20px', fontWeight: 'bold' }}>المستخدم</th>
                  <th onClick={() => handleSort('results_count')} style={{ padding: '12px 20px', fontWeight: 'bold', textAlign: 'center', cursor: 'pointer' }}>
                    النتائج {sortConfig.key === 'results_count' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ padding: '12px 20px', fontWeight: 'bold', textAlign: 'center' }}>التصنيف</th>
                  <th style={{ padding: '12px 20px', fontWeight: 'bold', textAlign: 'center' }}>الفلاتر المستخرجة</th>
                  <th onClick={() => handleSort('created_at')} style={{ padding: '12px 20px', fontWeight: 'bold', cursor: 'pointer' }}>
                    الوقت {sortConfig.key === 'created_at' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} className="table-row-hover">
                    <td style={{ padding: '12px 20px', color: 'var(--text-gray)', fontSize: '13px' }}>#{log.id}</td>
                    
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--secondary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Search size={14} color="var(--text-dark)" />
                        </div>
                        <span style={{ fontWeight: 'bold', color: 'var(--text-dark)' }}>{log.query_text}</span>
                      </div>
                    </td>

                    <td style={{ padding: '12px 20px' }}>
                      {log.user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                            {log.user.name ? log.user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-dark)' }}>{log.user.name || 'مستخدم'}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-gray)' }}>{log.user.email}</span>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F3F4F6', color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={14} />
                          </div>
                          <span style={{ fontSize: '13px', color: 'var(--text-gray)' }}>زائر (Guest)</span>
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                      <span 
                        style={{ 
                          padding: '4px 12px', 
                          borderRadius: '20px', 
                          fontSize: '12px', 
                          fontWeight: 'bold',
                          background: log.results_count === 0 ? 'rgba(229, 57, 53, 0.1)' : 'rgba(124, 179, 66, 0.1)',
                          color: log.results_count === 0 ? 'var(--danger-color)' : 'var(--success-color)'
                        }}
                      >
                        {log.results_count} إعلان
                      </span>
                    </td>

                    <td style={{ padding: '12px 20px', textAlign: 'center', fontSize: '13px' }}>
                      {log.category_name ? (
                        <span style={{ background: '#F3F4F6', padding: '4px 8px', borderRadius: '4px', fontWeight: '500' }}>
                          {log.category_name}
                        </span>
                      ) : '-'}
                    </td>
                    
                    <td style={{ padding: '12px 20px', textAlign: 'center', fontSize: '13px' }}>
                      {log.extracted_tags ? (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                          {log.extracted_tags.split(',').map((tag, i) => (
                            <span key={i} style={{ background: 'var(--primary-light)', color: 'var(--primary-color)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      ) : '-'}
                    </td>

                    <td style={{ padding: '12px 20px', color: 'var(--text-gray)', fontSize: '13px', direction: 'ltr', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                        {formatDate(log.created_at)}
                        <Calendar size={14} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .table-row-hover:hover {
          background-color: var(--secondary-color) !important;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        
        /* Mobile overrides */
        @media (max-width: 768px) {
          .search-logs-page {
            padding: 12px !important;
          }
          .stat-card {
            padding: 16px !important;
          }
          .data-table th, .data-table td {
            padding: 10px !important;
            font-size: 12px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SearchLogs;
