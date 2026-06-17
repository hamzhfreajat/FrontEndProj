import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, Save, Search, AlertCircle } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.sooq-com.com/api';

const ChangeAdsLocation = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [editedLocations, setEditedLocations] = useState({});

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const fetchAds = async (pageNum = 1) => {
    setLoading(true);
    try {
      const skip = (pageNum - 1) * 20;
      const queryParams = new URLSearchParams({
        skip: skip.toString(),
        limit: '20',
        sort_by: 'strict_newest'
      });

      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }

      const res = await axios.get(`${API_BASE_URL}/ads?${queryParams.toString()}`);
      
      if (pageNum === 1) {
        setAds(res.data);
      } else {
        setAds(prev => [...prev, ...res.data]);
      }
      
      setHasMore(res.data.length === 20);
    } catch (error) {
      console.error('Error fetching ads:', error);
      showToast('حدث خطأ أثناء تحميل الإعلانات', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds(1);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAds(1);
  };

  const handleLocationChange = (id, newLocation) => {
    setEditedLocations(prev => ({
      ...prev,
      [id]: newLocation
    }));
  };

  const saveLocation = async (id) => {
    const newLocation = editedLocations[id];
    if (newLocation === undefined) return;

    setSavingId(id);
    try {
      await axios.put(`${API_BASE_URL}/ads/${id}`, {
        location: newLocation
      });
      
      // Update local state
      setAds(prev => prev.map(ad => 
        ad.id === id ? { ...ad, location: newLocation } : ad
      ));
      
      showToast('تم تحديث الموقع بنجاح');
      
      // Remove from edited state
      const newEdited = { ...editedLocations };
      delete newEdited[id];
      setEditedLocations(newEdited);
      
    } catch (error) {
      console.error('Error saving location:', error);
      showToast('فشل في تحديث الموقع', 'error');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="location-manager-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 1000,
          animation: 'slideIn 0.3s ease-out'
        }}>
          {toast.type === 'error' && <AlertCircle size={20} />}
          {toast.message}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MapPin size={28} color="#2563eb" />
          تغيير موقع الإعلانات
        </h1>
      </div>

      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={20} color="#6b7280" style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="ابحث عن إعلان بالعنوان أو الوصف..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '12px 45px 12px 15px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', fontSize: '15px' }}
            />
          </div>
          <button type="submit" style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '0 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            بحث
          </button>
        </form>
      </div>

      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '16px', color: '#475569', fontWeight: '600', width: '80px' }}>رقم</th>
                <th style={{ padding: '16px', color: '#475569', fontWeight: '600', width: '25%' }}>العنوان</th>
                <th style={{ padding: '16px', color: '#475569', fontWeight: '600', width: '35%' }}>الوصف</th>
                <th style={{ padding: '16px', color: '#475569', fontWeight: '600' }}>الموقع الجغرافي</th>
                <th style={{ padding: '16px', color: '#475569', fontWeight: '600', width: '120px' }}>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {ads.map((ad) => {
                const isEdited = editedLocations[ad.id] !== undefined;
                const currentValue = isEdited ? editedLocations[ad.id] : (ad.location || '');
                
                return (
                  <tr key={ad.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s', ':hover': { backgroundColor: '#f8fafc' } }}>
                    <td style={{ padding: '16px', color: '#64748b' }}>#{ad.id}</td>
                    <td style={{ padding: '16px', fontWeight: '600', color: '#0f172a' }}>{ad.title}</td>
                    <td style={{ padding: '16px', color: '#475569', fontSize: '14px' }}>
                      <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {ad.description || 'لا يوجد وصف'}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={16} color="#64748b" />
                        <input 
                          type="text"
                          value={currentValue}
                          onChange={(e) => handleLocationChange(ad.id, e.target.value)}
                          placeholder="أدخل الموقع..."
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: isEdited ? '1px solid #3b82f6' : '1px solid #cbd5e1',
                            outline: 'none',
                            backgroundColor: isEdited ? '#eff6ff' : '#ffffff',
                            transition: 'all 0.2s'
                          }}
                        />
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <button
                        onClick={() => saveLocation(ad.id)}
                        disabled={!isEdited || savingId === ad.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          fontWeight: 'bold',
                          cursor: (!isEdited || savingId === ad.id) ? 'not-allowed' : 'pointer',
                          backgroundColor: (!isEdited) ? '#e2e8f0' : '#10b981',
                          color: (!isEdited) ? '#94a3b8' : 'white',
                          transition: 'all 0.2s'
                        }}
                      >
                        {savingId === ad.id ? (
                          <span style={{ fontSize: '12px' }}>جاري...</span>
                        ) : (
                          <>
                            <Save size={16} />
                            حفظ
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {ads.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    لا توجد إعلانات مطابقة للبحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {loading && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
            جاري التحميل...
          </div>
        )}
        
        {!loading && hasMore && (
          <div style={{ padding: '20px', textAlign: 'center', borderTop: '1px solid #e2e8f0' }}>
            <button 
              onClick={() => {
                const nextPage = page + 1;
                setPage(nextPage);
                fetchAds(nextPage);
              }}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #cbd5e1',
                padding: '8px 24px',
                borderRadius: '6px',
                color: '#475569',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              تحميل المزيد
            </button>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes slideIn {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ChangeAdsLocation;
