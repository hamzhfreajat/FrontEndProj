import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Filter, Trash2, Eye, X, ChevronRight, ChevronLeft, MapPin, Tag, Clock, User, Bot } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.sooq-com.com/api';
const API_HEADERS = { 'ngrok-skip-browser-warning': 'true', 'Bypass-Tunnel-Reminder': 'true' };
const getAuthHeaders = () => {
  const token = localStorage.getItem("token") || localStorage.getItem("adminLoggedIn");
  return { ...API_HEADERS, ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const Ads = () => {
  const [ads, setAds] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category_id: '',
    location: '',
    min_price: '',
    max_price: '',
    is_hot: '',
    is_published: '',
    source_type: 'ORGANIC_USER'
  });

  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [limit, setLimit] = useState(50);

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setLimit(newLimit);
    setPage(1);
    fetchAds(1, newLimit);
  };

  // View Popup State
  const [selectedAd, setSelectedAd] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Real Estate Options Constants
  const OPT_ROOMS = ['ستوديو', '1', '2', '3', '4', '5', '6+'];
  const OPT_BATHS = ['1', '2', '3', '4', '5', '6+'];
  const OPT_FURNISHED = [
    'مفروش (فرش كامل / فرش فندقي)',
    'شبه مفروش (مطبخ أو أجهزة فقط)',
    'فارغ',
    'جديد لم يسكن / بناء حديث'
  ];
  const OPT_FLOOR = [
    'طابق تسوية (معلقة / مهوية)',
    'طابق أرضي / شبه أرضي',
    'طوابق علوية (أول، ثاني، إلخ)',
    'أخير مع رووف'
  ];
  const OPT_AGE = ['0 - 11 شهر', '1 - 5 سنوات', '6 - 9 سنوات', '10 - 19 سنوات', '20+ سنة'];
  const OPT_RENT_DUR = ['يومي', 'أسبوعي', 'شهري', 'سنوي'];
  const OPT_VIEW = ['شمالية', 'جنوبية', 'شرقية', 'غربية', 'شمالية شرقية', 'شمالية غربية', 'جنوبية شرقية', 'جنوبية غربية'];

  const OPT_KEY_FEAT = [
    'تكييف / مكيفات إنفيرتر', 'تدفئة (مركزية / غاز)', 'شرفة / بلكونة', 'غرفة خادمة / غرفة غسيل',
    'خزائن حائط', 'زجاج دبل جلاس / أباجورات كهرباء', 'سخان شمسي / كيزر', 'نقطة شحن سيارة كهربائية'
  ];
  const OPT_ADD_FEAT = [
    'مصعد', 'حديقة', 'كراج خاص / موقف سيارة', 'حارس عمارة', 'كاميرات مراقبة / إنتركم',
    'مطبخ راكب (أمريكي أو منفصل)', 'بلكونة / ترس خارجي', 'منطقة شواء',
    'نظام كهرباء احتياطي للطوارئ', 'تسهيلات لأصحاب الهمم'
  ];
  const OPT_TARGET_AUDIENCE = [
    'عائلات', 'عرسان / عائلة صغيرة', 'طلاب / طالبات', 'موظفين'
  ];
  const OPT_PAYMENT_METHOD = [
    'من المالك مباشرة (بدون عمولة)', 'مكتب عقاري (تضاف عمولة)',
    'الدفع شهري / الدفع سنوي / دفعات', 'إيجار يومي',
    'تقسيط', 'السعر نهائي / قابل للتفاوض'
  ];
  const OPT_NEARBY = [
    'بنك / صراف الآلي', 'دراي كلين', 'سوبر ماركت', 'صالة رياضية / جيم',
    'صيدلية', 'محطة باصات', 'مدرسة', 'مستشفى', 'مسجد', 'مطعم', 'موقف سيارات', 'مول / مركز تسوق'
  ];

  // Toast Notification State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  useEffect(() => {
    fetchCategories();
    fetchAds(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchAds = async (pageNum = page, currentLimit = limit) => {
    setLoading(true);
    try {
      const skip = (pageNum - 1) * currentLimit;
      const queryParams = new URLSearchParams({
        skip: skip.toString(),
        limit: currentLimit.toString()
      });

      if (filters.search) queryParams.append('search', filters.search);
      if (filters.category_id) queryParams.append('category_id', filters.category_id);
      if (filters.location) queryParams.append('location', filters.location);
      if (filters.min_price) queryParams.append('min_price', filters.min_price);
      if (filters.max_price) queryParams.append('max_price', filters.max_price);
      if (filters.is_hot !== '') queryParams.append('is_hot', filters.is_hot);
      if (filters.is_published !== '') queryParams.append('is_published', filters.is_published);
      if (filters.source_type) queryParams.append('source_type', filters.source_type);
      
      queryParams.append('sort_by', 'strict_newest');

      const res = await fetch(`${API_BASE_URL}/ads?${queryParams.toString()}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAds(data);
        // If we got fewer ads than the limit, we've reached the end
        setHasMore(data.length === currentLimit);
      }

      // Fetch the count using the same query params except skip/limit
      const countParams = new URLSearchParams(queryParams);
      countParams.delete('skip');
      countParams.delete('limit');

      const countRes = await fetch(`${API_BASE_URL}/ads/count?${countParams.toString()}`, { headers: getAuthHeaders() });
      if (countRes.ok) {
        const countData = await countRes.json();
        setTotalCount(countData.total_count);
      }

    } catch (error) {
      console.error('Error fetching ads or count:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? true : '') : value
    }));
  };

  const applyFilters = () => {
    setPage(1);
    fetchAds(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category_id: '',
      location: '',
      min_price: '',
      max_price: '',
      is_hot: '',
      is_published: '',
      source_type: 'ORGANIC_USER'
    });
    setPage(1);
    resetAndFetch();
  };

  const resetAndFetch = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ads?skip=0&limit=${limit}&source_type=ORGANIC_USER`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAds(data);
        setHasMore(data.length === limit);
      }

      const countRes = await fetch(`${API_BASE_URL}/ads/count?source_type=ORGANIC_USER`, { headers: getAuthHeaders() });
      if (countRes.ok) {
        const countData = await countRes.json();
        setTotalCount(countData.total_count);
      }
    } catch (e) {
      console.error('Error fetching ads or count during reset:', e);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (id) => {
    const cat = categories.find(c => c.id === id);
    return cat ? cat.name : 'غير محدد';
  };

  const handleNextPage = () => {
    if (hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchAds(nextPage);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      const prevPage = page - 1;
      setPage(prevPage);
      fetchAds(prevPage);
    }
  };

  const handleTogglePublish = async (adId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/ads/${adId}/toggle-publish`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const updatedAd = await res.json();
        setAds(ads.map(ad => ad.id === adId ? { ...ad, is_published: updatedAd.is_published } : ad));
        // Update selectedAd if the popup is currently open
        if (selectedAd && selectedAd.id === adId) {
          setSelectedAd({ ...selectedAd, is_published: updatedAd.is_published });
        }
        showToast(updatedAd.is_published ? 'تم نشر الإعلان بنجاح' : 'تم إلغاء نشر الإعلان', 'success');
      } else {
        showToast('حدث خطأ أثناء تغيير حالة النشر', 'error');
      }
    } catch (error) {
      console.error('Error toggling publish status:', error);
      showToast('حدث خطأ في الاتصال بالخادم', 'error');
    }
  };

  const handleDeleteAd = async (adId) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا الإعلان بشكل نهائي؟')) {
      try {
        const res = await fetch(`${API_BASE_URL}/ads/${adId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        if (res.ok) {
          setAds(ads.filter(ad => ad.id !== adId));
          setTotalCount(prev => prev - 1);
          showToast('تم حذف الإعلان بنجاح', 'success');
        } else {
          showToast('حدث خطأ أثناء حذف الإعلان', 'error');
        }
      } catch (error) {
        console.error('Error deleting ad:', error);
        showToast('حدث خطأ في الاتصال بالخادم', 'error');
      }
    }
  };

  const openAdDetails = (ad) => {
    setSelectedAd(ad);

    // Flatten the nest for easy editing in state
    const flattenedForm = { ...ad };
    if (ad.real_estate_detail) {
      Object.assign(flattenedForm, ad.real_estate_detail);
    }
    setEditForm(flattenedForm);

    setCurrentImageIndex(0);
    setIsEditing(false);
  };

  const closeAdDetails = () => {
    setSelectedAd(null);
    setIsEditing(false);
  };

  const handleEditChange = (name, value, isArray = false) => {
    if (isArray) {
      const currentArr = editForm[name] || [];
      const newArr = currentArr.includes(value)
        ? currentArr.filter(item => item !== value)
        : [...currentArr, value];
      setEditForm({ ...editForm, [name]: newArr });
    } else {
      setEditForm({ ...editForm, [name]: value });
    }
  };

  const saveAdChanges = async () => {
    try {
      // Re-pack real estate fields into the nested object
      const payload = { ...editForm };

      const realEstateFields = [
        'bathrooms', 'furnished', 'build_area', 'floor', 'building_age',
        'rent_duration', 'view_orientation', 'key_features',
        'additional_features', 'nearby_locations'
      ];

      const realEstateDetail = {};
      let hasRealEstateData = false;

      realEstateFields.forEach(field => {
        if (payload[field] !== undefined) {
          realEstateDetail[field] = payload[field];
          hasRealEstateData = true;
          delete payload[field]; // Remove from root payload
        }
      });

      if (hasRealEstateData) {
        payload.real_estate_detail = realEstateDetail;
      }

      // Remove any previously nested object from the old state so it doesn't double up
      if (payload.real_estate_detail && Object.keys(payload.real_estate_detail).length === 0) {
        delete payload.real_estate_detail;
      }

      const res = await fetch(`${API_BASE_URL}/ads/${selectedAd.id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updatedAd = await res.json();
        setAds(ads.map(a => a.id === updatedAd.id ? updatedAd : a));
        setSelectedAd(updatedAd);
        setIsEditing(false);
        showToast('تم حفظ التعديلات بنجاح', 'success');
      } else {
        showToast('فشل في حفظ التعديلات', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('خطأ في الاتصال بالخادم', 'error');
    }
  };

  // Helper to bypass local ISP blocks on Facebook CDN
  const getProxiedImageUrl = (url) => {
    if (!url) return "";
    if (url.includes("fbcdn.net")) {
      return `https://wsrv.nl/?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  const getMainImage = (image_url) => {
    if (!image_url) return "";
    try {
      const parsed = JSON.parse(image_url);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return getProxiedImageUrl(parsed[0]);
      }
    } catch (e) {
      // not json
    }
    return getProxiedImageUrl(image_url);
  };

  // Helper for slider
  const getAdImages = (ad) => {
    if (!ad) return [];

    // If we have scraped multiple images, use them
    if (ad.image_urls && ad.image_urls.length > 0) {
      return ad.image_urls.map(getProxiedImageUrl);
    }

    // Fallback to organic single image or json array string
    if (ad.image_url) {
      try {
        const parsed = JSON.parse(ad.image_url);
        if (Array.isArray(parsed)) {
          return parsed.map(getProxiedImageUrl);
        }
      } catch (e) {
        // not json, proceed to return as single image
      }
      return [getProxiedImageUrl(ad.image_url)];
    }

    return [];
  };

  return (
    <div className="ads-container">
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <div className="badge" style={{ marginTop: '10px', background: 'var(--primary-light)', color: 'var(--primary-color)', fontSize: '0.9rem', display: 'inline-block', padding: '6px 12px' }}>
            إجمالي الإعلانات: <strong>{totalCount}</strong>
          </div>
        </div>
        <button className="btn btn-primary">
          إعلان جديد +
        </button>
      </div>

      <div className="card filters-card">
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            placeholder="البحث بالكلمات المفتاحية..."
            className="form-control pl-10"
          />
        </div>
        <div className="filter-actions">
          <button className="btn btn-primary" onClick={applyFilters} style={{ marginLeft: '10px' }}>
            بحث
          </button>
          <button className={`btn btn-outline ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
            <Filter size={18} />
            {showFilters ? 'إخفاء الفلاتر' : 'تصفية متقدمة'}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="card advanced-filters mt-4" style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label>القسم</label>
            <input
              name="category_search"
              className="form-control"
              list="categories-list"
              placeholder="ابحث عن قسم..."
              onChange={(e) => {
                const selectedName = e.target.value;
                const cat = categories.find(c => c.name === selectedName);
                if (cat) {
                  setFilters(prev => ({ ...prev, category_id: cat.id }));
                } else if (selectedName === '') {
                  setFilters(prev => ({ ...prev, category_id: '' }));
                }
              }}
              defaultValue={filters.category_id ? getCategoryName(filters.category_id) : ''}
            />
            <datalist id="categories-list">
              {categories.map(c => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </div>
          <div>
            <label>الموقع</label>
            <input
              type="text"
              name="location"
              list="locations-list"
              className="form-control"
              placeholder="مدينة أو منطقة"
              value={filters.location}
              onChange={handleFilterChange}
            />
            <datalist id="locations-list">
              {/* Some suggested default locations in Jordan */}
              <option value="عمان" />
              <option value="إربد" />
              <option value="الزرقاء" />
              <option value="العقبة" />
              <option value="عبدون" />
              <option value="دابوق" />
            </datalist>
          </div>
          <div>
            <label>السعر من</label>
            <input type="number" name="min_price" className="form-control" placeholder="أقل سعر" value={filters.min_price} onChange={handleFilterChange} />
          </div>
          <div>
            <label>السعر إلى</label>
            <input type="number" name="max_price" className="form-control" placeholder="أعلى سعر" value={filters.max_price} onChange={handleFilterChange} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '10px' }}>
              <input type="checkbox" name="is_hot" checked={filters.is_hot === true} onChange={handleFilterChange} />
              إعلان مميز (Hot)
            </label>
          </div>
          <div>
            <label>حالة الإعلان</label>
            <select name="is_published" className="form-control" value={filters.is_published} onChange={handleFilterChange}>
              <option value="">الكل</option>
              <option value="true">منشور</option>
              <option value="false">قيد المراجعة</option>
            </select>
          </div>
          <div>
            <label>مصدر الإعلان</label>
            <select name="source_type" className="form-control" value={filters.source_type} onChange={handleFilterChange}>
              <option value="">الكل</option>
              <option value="ORGANIC_USER">مستخدمين (عضوي)</option>
              <option value="SCRAPER_BOT">مستخرج آلياً (Scraper)</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
            <button className="btn btn-outline" onClick={clearFilters} style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}>
              <X size={18} /> مسح الفلاتر
            </button>
          </div>
        </div>
      )}

      <div className="card table-card mt-4">
        <div className="table-responsive">
          <table className="sleek-table">
            <thead>
              <tr>
                <th>رقم</th>
                <th>عنوان الإعلان</th>
                <th>القسم</th>
                <th>الموقع</th>
                <th>السعر</th>
                <th>تاريخ النشر</th>
                <th>الحالة</th>
                <th>نشر</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>جاري التحميل...</td>
                </tr>
              ) : ads.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>لا توجد إعلانات تطابق بحثك</td>
                </tr>
              ) : (
                ads.map(ad => (
                  <tr key={ad.id}>
                    <td>#{ad.id}</td>
                    <td>
                      <div className="ad-title-cell">
                        {ad.image_url && getMainImage(ad.image_url) ? (
                          <img src={getMainImage(ad.image_url)} alt={ad.title} referrerPolicy="no-referrer" style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover' }} />
                        ) : (
                          <div className="ad-img-placeholder">📦</div>
                        )}
                        <span style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span>{ad.title}</span>
                          {ad.source_type === 'SCRAPER_BOT' && (
                            <span className="badge" style={{ background: '#e0f2fe', color: '#0284c7', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', width: 'max-content' }}>
                              <Bot size={12} /> مستخرج آلياً
                            </span>
                          )}
                        </span>
                        {ad.is_hot && <span className="badge badge-warning" style={{ fontSize: '0.7rem', marginRight: '5px' }}>🔥 مميز</span>}
                      </div>
                    </td>
                    <td>{getCategoryName(ad.category_id)}</td>
                    <td>{ad.location}</td>
                    <td className="price">{ad.price} دينار</td>
                    <td>{new Date(ad.created_at).toLocaleDateString('ar-JO')}</td>
                    <td>
                      {ad.is_published ? (
                        <span className="badge badge-success">منشور</span>
                      ) : (
                        <span className="badge badge-warning" style={{ background: 'rgba(245, 135, 33, 0.1)', color: 'var(--accent-color)', whiteSpace: 'nowrap' }}>قيد المراجعة</span>
                      )}
                    </td>
                    <td>
                      <label className="ad-toggle-switch" title={ad.is_published ? "إلغاء النشر" : "نشر الإعلان"}>
                        <input
                          type="checkbox"
                          checked={ad.is_published}
                          onChange={() => handleTogglePublish(ad.id)}
                        />
                        <span className="ad-toggle-slider"></span>
                      </label>
                    </td>
                    <td>
                      <div className="actions">
                        <button className="btn-icon" onClick={() => openAdDetails(ad)}><Eye size={18} color="var(--primary-color)" /></button>
                        <button className="btn-icon" onClick={() => handleDeleteAd(ad.id)}><Trash2 size={18} color="var(--danger-color)" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="pagination-container" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>
              إجمالي الإعلانات: <strong>{totalCount}</strong>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>عرض:</span>
              <select
                className="form-control"
                style={{ width: 'auto', padding: '4px 30px 4px 12px', height: '32px', fontSize: '0.9rem' }}
                value={limit}
                onChange={handleLimitChange}
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="75">75</option>
                <option value="100">100</option>
                <option value="500">500</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>
              الصفحة {page}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-outline"
                onClick={handleNextPage}
                disabled={!hasMore || loading}
                style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronRight size={18} />
              </button>
              <button
                className="btn btn-outline"
                onClick={handlePrevPage}
                disabled={page === 1 || loading}
                style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronLeft size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ad Details Modal */}
      {selectedAd && createPortal(
        <div className="modal-overlay" onClick={closeAdDetails}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>تفاصيل الإعلان #{selectedAd.id}</h2>
              <button className="btn-icon" onClick={closeAdDetails}><X size={24} /></button>
            </div>

            <div className="modal-body">
              {isEditing ? (
                <div className="edit-ad-form" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="form-group grid-2">
                    <div>
                      <label>عنوان الإعلان</label>
                      <input className="form-control" value={editForm.title || ''} onChange={(e) => handleEditChange('title', e.target.value)} />
                    </div>
                    <div>
                      <label>السعر (دينار)</label>
                      <input type="number" className="form-control" value={editForm.price || ''} onChange={(e) => handleEditChange('price', parseFloat(e.target.value))} />
                    </div>
                  </div>

                  <div className="form-group grid-2">
                    <div>
                      <label>الموقع</label>
                      <input className="form-control" value={editForm.location || ''} onChange={(e) => handleEditChange('location', e.target.value)} />
                    </div>
                    <div>
                      <label>مساحة البناء (متر مربع)</label>
                      <input type="number" className="form-control" value={editForm.build_area || ''} onChange={(e) => handleEditChange('build_area', parseInt(e.target.value))} />
                    </div>
                  </div>

                  <div className="form-group grid-4">
                    <div>
                      <label>عدد الغرف</label>
                      <select className="form-control" value={editForm.rooms || ''} onChange={(e) => handleEditChange('rooms', e.target.value)}>
                        <option value="">غير محدد</option>
                        {OPT_ROOMS.map(o => <option key={o} value={o === 'ستوديو' ? 0 : parseInt(o)}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label>عدد الحمامات</label>
                      <select className="form-control" value={editForm.bathrooms || ''} onChange={(e) => handleEditChange('bathrooms', parseInt(e.target.value))}>
                        <option value="">غير محدد</option>
                        {OPT_BATHS.map(o => <option key={o} value={parseInt(o)}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label>مفروشة / غير مفروشة</label>
                      <select className="form-control" value={editForm.furnished || ''} onChange={(e) => handleEditChange('furnished', e.target.value)}>
                        <option value="">غير محدد</option>
                        {OPT_FURNISHED.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label>الطابق</label>
                      <select className="form-control" value={editForm.floor || ''} onChange={(e) => handleEditChange('floor', e.target.value)}>
                        <option value="">غير محدد</option>
                        {OPT_FLOOR.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-group grid-3">
                    <div>
                      <label>عمر البناء</label>
                      <select className="form-control" value={editForm.building_age || ''} onChange={(e) => handleEditChange('building_age', e.target.value)}>
                        <option value="">غير محدد</option>
                        {OPT_AGE.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label>مدة الإيجار</label>
                      <select className="form-control" value={editForm.rent_duration || ''} onChange={(e) => handleEditChange('rent_duration', e.target.value)}>
                        <option value="">غير محدد</option>
                        {OPT_RENT_DUR.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label>الواجهة</label>
                      <select className="form-control" value={editForm.view_orientation || ''} onChange={(e) => handleEditChange('view_orientation', e.target.value)}>
                        <option value="">غير محدد</option>
                        {OPT_VIEW.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-group custom-feature-grid">
                    <label>المزايا الرئيسية</label>
                    <div className="checkbox-grid">
                      {OPT_KEY_FEAT.map(feat => (
                        <label key={feat} className="checkbox-label">
                          <input type="checkbox" checked={(editForm.key_features || []).includes(feat)} onChange={() => handleEditChange('key_features', feat, true)} />
                          {feat}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-group custom-feature-grid">
                    <label>المزايا الإضافية</label>
                    <div className="checkbox-grid">
                      {OPT_ADD_FEAT.map(feat => (
                        <label key={feat} className="checkbox-label">
                          <input type="checkbox" checked={(editForm.additional_features || []).includes(feat)} onChange={() => handleEditChange('additional_features', feat, true)} />
                          {feat}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-group custom-feature-grid">
                    <label>مواقع قريبة</label>
                    <div className="checkbox-grid">
                      {OPT_NEARBY.map(feat => (
                        <label key={feat} className="checkbox-label">
                          <input type="checkbox" checked={(editForm.nearby_locations || []).includes(feat)} onChange={() => handleEditChange('nearby_locations', feat, true)} />
                          {feat}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-group custom-feature-grid">
                    <label>الفئة المستهدفة</label>
                    <div className="checkbox-grid">
                      {OPT_TARGET_AUDIENCE.map(feat => (
                        <label key={feat} className="checkbox-label">
                          <input type="checkbox" checked={(editForm.attributes?.target_audience || []).includes(feat)} onChange={(e) => {
                            const current = editForm.attributes?.target_audience || [];
                            const newArr = current.includes(feat) ? current.filter(i => i !== feat) : [...current, feat];
                            setEditForm({ ...editForm, attributes: { ...editForm.attributes, target_audience: newArr } });
                          }} />
                          {feat}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-group custom-feature-grid">
                    <label>طريقة الدفع ونوع المعلن</label>
                    <div className="checkbox-grid">
                      {OPT_PAYMENT_METHOD.map(feat => (
                        <label key={feat} className="checkbox-label">
                          <input type="checkbox" checked={(editForm.attributes?.payment_method || []).includes(feat)} onChange={(e) => {
                            const current = editForm.attributes?.payment_method || [];
                            const newArr = current.includes(feat) ? current.filter(i => i !== feat) : [...current, feat];
                            setEditForm({ ...editForm, attributes: { ...editForm.attributes, payment_method: newArr } });
                          }} />
                          {feat}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>وصف الإعلان</label>
                    <textarea className="form-control" rows="6" value={editForm.description || ''} onChange={(e) => handleEditChange('description', e.target.value)}></textarea>
                  </div>
                </div>
              ) : (
                <>
                  <div className="ad-slider-container">
                    {getAdImages(selectedAd).length > 0 ? (
                      <div className="slider-wrapper">
                        <img src={getAdImages(selectedAd)[currentImageIndex]} alt="Ad" className="slider-image" referrerPolicy="no-referrer" />
                        {getAdImages(selectedAd).length > 1 && (
                          <>
                            <button
                              className="slider-btn prev"
                              onClick={() => setCurrentImageIndex(prev => prev === 0 ? getAdImages(selectedAd).length - 1 : prev - 1)}
                            ><ChevronRight size={24} /></button>
                            <button
                              className="slider-btn next"
                              onClick={() => setCurrentImageIndex(prev => prev === getAdImages(selectedAd).length - 1 ? 0 : prev + 1)}
                            ><ChevronLeft size={24} /></button>
                            <div className="slider-dots">
                              {getAdImages(selectedAd).map((_, idx) => (
                                <span key={idx} className={`dot ${idx === currentImageIndex ? 'active' : ''}`}></span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="slider-placeholder">لا يوجد صور متاحة</div>
                    )}
                  </div>

                  <div className="ad-details-info">
                    <h3>{selectedAd.title}</h3>
                    <p className="ad-price">{selectedAd.price} دينار</p>

                    <div className="ad-meta-grid">
                      <div className="meta-item"><Tag size={18} /> <span>{getCategoryName(selectedAd.category_id)}</span></div>
                      <div className="meta-item"><MapPin size={18} /> <span>{selectedAd.location}</span></div>
                      <div className="meta-item"><Clock size={18} /> <span>{new Date(selectedAd.created_at).toLocaleDateString('ar-JO')}</span></div>
                      <div className="meta-item"><User size={18} /> <span>المستخدم #{selectedAd.user_id}</span></div>
                    </div>

                    {/* Display Real Estate Fields if present */}
                    {selectedAd.real_estate_detail && (selectedAd.real_estate_detail.rooms !== null || selectedAd.real_estate_detail.bathrooms || selectedAd.real_estate_detail.floor || selectedAd.real_estate_detail.build_area) && (
                      <div className="real-estate-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', background: 'var(--primary-light)', padding: '12px', borderRadius: '8px', marginTop: '16px', fontSize: '0.9rem' }}>
                        {selectedAd.rooms !== null && selectedAd.rooms !== undefined && <div><strong>الغرف:</strong> {selectedAd.rooms === 0 ? 'ستوديو' : selectedAd.rooms}</div>}
                        {selectedAd.real_estate_detail.bathrooms && <div><strong>الحمامات:</strong> {selectedAd.real_estate_detail.bathrooms}</div>}
                        {selectedAd.real_estate_detail.build_area && <div><strong>المساحة:</strong> {selectedAd.real_estate_detail.build_area} م²</div>}
                        {selectedAd.real_estate_detail.floor && <div><strong>الطابق:</strong> {selectedAd.real_estate_detail.floor}</div>}
                        {selectedAd.real_estate_detail.furnished && <div><strong>الفرش:</strong> {selectedAd.real_estate_detail.furnished}</div>}
                        {selectedAd.real_estate_detail.rent_duration && <div><strong>المدة:</strong> {selectedAd.real_estate_detail.rent_duration}</div>}
                        {selectedAd.real_estate_detail.building_age && <div><strong>العمر:</strong> {selectedAd.real_estate_detail.building_age}</div>}
                        {selectedAd.real_estate_detail.view_orientation && <div><strong>الواجهة:</strong> {selectedAd.real_estate_detail.view_orientation}</div>}
                      </div>
                    )}

                    <div className="ad-description mt-4">
                      <h4>وصف الإعلان:</h4>
                      <p style={{ whiteSpace: 'pre-wrap' }}>{selectedAd.description}</p>
                    </div>

                    {selectedAd.real_estate_detail && (selectedAd.real_estate_detail.key_features?.length > 0 || selectedAd.real_estate_detail.additional_features?.length > 0 || selectedAd.real_estate_detail.nearby_locations?.length > 0) && (
                      <div className="ad-features-lists mt-4">
                        <h4>المرافق والمزايا:</h4>
                        {selectedAd.real_estate_detail.key_features?.length > 0 && <div className="mb-2"><strong>رئيسية:</strong> {selectedAd.real_estate_detail.key_features.join('، ')}</div>}
                        {selectedAd.real_estate_detail.additional_features?.length > 0 && <div className="mb-2"><strong>إضافية:</strong> {selectedAd.real_estate_detail.additional_features.join('، ')}</div>}
                        {selectedAd.real_estate_detail.nearby_locations?.length > 0 && <div className="mb-2"><strong>قريب من:</strong> {selectedAd.real_estate_detail.nearby_locations.join('، ')}</div>}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={closeAdDetails}>إغلاق</button>

              {isEditing ? (
                <button className="btn btn-primary" onClick={saveAdChanges}>حفظ التعديلات</button>
              ) : (
                <button className="btn btn-outline" style={{ borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }} onClick={() => setIsEditing(true)}>تعديل البيانات</button>
              )}

              <button
                className={`btn ${selectedAd.is_published ? 'btn-outline' : 'btn-primary'}`}
                onClick={() => handleTogglePublish(selectedAd.id)}
              >
                {selectedAd.is_published ? 'إلغاء نشر الإعلان' : 'نشر الإعلان'}
              </button>
              <button className="btn btn-outline" style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}>
                <Trash2 size={18} style={{ marginLeft: '8px' }} /> حذف الإعلان
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Toast Notification */}
      {toast.show && createPortal(
        <div className={`custom-toast toast-${toast.type}`}>
          {toast.message}
        </div>,
        document.body
      )}

      <style jsx="true">{`
        .page-header {
          margin-bottom: 24px;
        }
        
        .filters-card {
          display: flex;
          justify-content: space-between;
          padding: 16px 24px;
          gap: 16px;
        }

        .search-box {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .search-icon {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-gray);
        }

        .search-box input {
          padding-right: 48px;
        }

        .mt-4 {
          margin-top: 24px;
        }

        .table-card {
          padding: 0;
          overflow: hidden;
        }

        .sleek-table {
          width: 100%;
          border-collapse: collapse;
          text-align: right;
          table-layout: auto;
        }

        .sleek-table th {
          background-color: var(--secondary-color);
          padding: 10px 10px;
          font-weight: 700;
          font-size: 0.8rem;
          color: var(--text-gray);
          border-bottom: 1px solid var(--border-color);
          white-space: nowrap;
        }

        .sleek-table td {
          padding: 10px 10px;
          border-bottom: 1px solid var(--border-color);
          vertical-align: middle;
          font-weight: 600;
          font-size: 0.8rem;
        }

        .sleek-table tr:last-child td {
          border-bottom: none;
        }

        .sleek-table tr:hover td {
          background-color: rgba(0, 117, 255, 0.02);
        }

        .ad-title-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ad-img-placeholder {
          width: 40px;
          height: 40px;
          background-color: var(--primary-light);
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }

        .price {
          color: var(--primary-color);
          font-weight: 900 !important;
        }

        .actions {
          display: flex;
          gap: 8px;
        }
        
        .btn-icon {
          cursor: pointer;
        }

        .btn-icon:hover {
          background-color: var(--secondary-color);
        }
        
        button, .btn {
          cursor: pointer;
        }

        /* Toast Styles */
        :global(.custom-toast) {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          padding: 12px 24px;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          z-index: 999999;
          animation: slideUpFade 0.3s ease forwards;
        }

        :global(.toast-success) { background-color: var(--success-color); }
        :global(.toast-error) { background-color: var(--danger-color); }

        @keyframes slideUpFade {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }

        /* Toggle Switch */
        .ad-toggle-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }

        .ad-toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .ad-toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #cbd5e1;
          transition: .4s;
          border-radius: 24px;
        }

        .ad-toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          right: 3px;
          bottom: 3px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }

        .ad-toggle-switch input:checked + .ad-toggle-slider {
          background-color: var(--success-color);
        }

        .ad-toggle-switch input:checked + .ad-toggle-slider:before {
          transform: translateX(-20px);
        }

        .advanced-filters label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: var(--text-dark);
            font-size: 0.9rem;
        }

        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        /* Modal Styles */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            backdrop-filter: blur(4px);
        }

        .modal-content {
            background: white;
            border-radius: var(--radius-lg);
            width: 90vw;
            max-width: 90vw;
            height: 90vh;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            animation: modalFadeIn 0.3s ease;
        }

        @keyframes modalFadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .modal-header {
            padding: 24px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .modal-header h2 {
            margin: 0;
            font-size: 1.25rem;
            color: var(--text-dark);
        }

        .modal-body {
            padding: 24px;
            overflow-y: auto;
            flex: 1;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
        }

        /* Slider Styles */
        .ad-slider-container {
            width: 100%;
            height: 100%;
            min-height: 400px;
            background: var(--bg-color);
            border-radius: var(--radius-md);
            overflow: hidden;
            position: relative;
        }

        .slider-wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #000;
        }

        .slider-image {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }

        .slider-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-gray);
            font-weight: 500;
            background: #f1f5f9;
        }

        .slider-btn {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(255,255,255,0.8);
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: all 0.2s;
            color: var(--text-dark);
        }

        .slider-btn:hover {
            background: white;
            transform: translateY(-50%) scale(1.05);
        }

        .slider-btn.prev { right: 10px; }
        .slider-btn.next { left: 10px; }

        .slider-dots {
            position: absolute;
            bottom: 16px;
            left: 0;
            right: 0;
            display: flex;
            justify-content: center;
            gap: 8px;
        }

        .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: rgba(255,255,255,0.5);
            transition: all 0.2s;
        }

        .dot.active {
            background: white;
            transform: scale(1.2);
        }

        /* Details Info */
        .ad-details-info h3 {
            margin: 0 0 8px 0;
            font-size: 1.5rem;
            color: var(--text-dark);
        }

        .ad-details-info .ad-price {
            font-size: 1.5rem;
            font-weight: 900;
            color: var(--primary-color);
            margin: 0 0 24px 0;
        }

        .ad-meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 24px;
            background: #f8fafc;
            padding: 16px;
            border-radius: var(--radius-md);
        }

        .meta-item {
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--text-gray);
            font-size: 0.95rem;
        }

        .ad-description h4 {
            margin: 0 0 8px 0;
            color: var(--text-dark);
            font-size: 1.1rem;
        }

        .ad-description p {
            color: var(--text-gray);
            line-height: 1.6;
            margin: 0;
            white-space: pre-wrap;
        }

        .modal-footer {
            padding: 24px;
            border-top: 1px solid var(--border-color);
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        }
        .checkbox-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 12px;
            margin-top: 8px;
        }

        .checkbox-label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.9rem;
            cursor: pointer;
            color: var(--text-dark);
            margin: 0 !important;
        }

        .checkbox-label input[type="checkbox"] {
            width: 16px;
            height: 16px;
            accent-color: var(--primary-color);
            cursor: pointer;
        }

        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
        .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 16px; }

        .edit-ad-form label {
            display: block;
            margin-bottom: 6px;
            font-weight: 600;
            color: var(--text-dark);
            font-size: 0.85rem;
        }
        
        .custom-feature-grid label {
            font-size: 0.95rem;
            margin-bottom: 12px;
        }

        .mb-2 { margin-bottom: 8px; }
      `}</style>
    </div>
  );
};

export default Ads;

