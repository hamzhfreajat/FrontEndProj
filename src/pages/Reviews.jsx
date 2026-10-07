import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Star, RefreshCw, EyeOff, Eye, Trash2, AlertTriangle, X } from 'lucide-react';
import './Reviews.css';

const API_URL = `${process.env.REACT_APP_API_URL}/dashboard/reviews`;
const ADS_URL = `${process.env.REACT_APP_API_URL}/ads`;
const PAGE_SIZE = 50;
// Must match AD_REVIEW_NEGATIVE_MAX_RATING in backend/schemas.py
const NEGATIVE_MAX_RATING = 2;

const Stars = ({ value }) => (
  <span className="reviews-stars" title={`${value} من 5`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} size={15} fill={i <= value ? '#FFB300' : 'none'} color={i <= value ? '#FFB300' : '#D1D5DB'} />
    ))}
  </span>
);

// Who put the ad on the site: a person through the app, or the scraper
const SourceBadge = ({ type }) => {
  if (!type) return null;
  const organic = type === 'ORGANIC_USER';
  return (
    <span className={`badge ${organic ? 'badge-success' : 'badge-warning'} reviews-source-badge`}>
      {organic ? 'عضوي (مستخدم)' : 'مستخرج آلياً'}
    </span>
  );
};

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [flaggedAds, setFlaggedAds] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const [adIdInput, setAdIdInput] = useState('');
  const [filters, setFilters] = useState({ adId: '', rating: '', status: '', flaggedOnly: false });

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = { skip: page * PAGE_SIZE, limit: PAGE_SIZE };
      if (filters.adId) params.ad_id = filters.adId;
      if (filters.rating) params.rating = filters.rating;
      if (filters.status) params.is_hidden = filters.status === 'hidden';
      if (filters.flaggedOnly) params.flagged_only = true;

      const res = await axios.get(API_URL, { params });
      setReviews(res.data.reviews);
      setFlaggedAds(res.data.flagged_ads);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Failed to fetch reviews', err);
      setError('تعذر تحميل التقييمات. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const updateFilters = (changes) => {
    setPage(0);
    setFilters((prev) => ({ ...prev, ...changes }));
  };

  const applyAdId = (e) => {
    e.preventDefault();
    updateFilters({ adId: adIdInput.trim() });
  };

  const filterByAd = (adId) => {
    setAdIdInput(String(adId));
    updateFilters({ adId: String(adId), flaggedOnly: false });
  };

  const resetFilters = () => {
    setAdIdInput('');
    updateFilters({ adId: '', rating: '', status: '', flaggedOnly: false });
  };

  const toggleHidden = async (review) => {
    try {
      setBusyId(review.id);
      await axios.patch(`${API_URL}/${review.id}`, { is_hidden: !review.is_hidden });
      await fetchReviews();
    } catch (err) {
      console.error('Failed to update review', err);
      alert('تعذر تحديث التقييم');
    } finally {
      setBusyId(null);
    }
  };

  const deleteReview = async (review) => {
    if (!window.confirm(`هل أنت متأكد من حذف التقييم #${review.id} نهائياً؟`)) return;
    try {
      setBusyId(review.id);
      await axios.delete(`${API_URL}/${review.id}`);
      await fetchReviews();
    } catch (err) {
      console.error('Failed to delete review', err);
      alert('تعذر حذف التقييم');
    } finally {
      setBusyId(null);
    }
  };

  // Removes the ad itself, and with it every review it has
  const deleteAd = async (review) => {
    const title = review.ad_title ? ` "${review.ad_title}"` : '';
    const message = `هل أنت متأكد من حذف الإعلان #${review.ad_id}${title} نهائياً؟
سيُحذف الإعلان مع جميع تقييماته، ولا يمكن التراجع عن ذلك.`;
    if (!window.confirm(message)) return;
    try {
      setBusyId(review.id);
      await axios.delete(`${ADS_URL}/${review.ad_id}`);
      await fetchReviews();
    } catch (err) {
      console.error('Failed to delete ad', err);
      alert('تعذر حذف الإعلان');
    } finally {
      setBusyId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-JO') + ' ' + date.toLocaleTimeString('ar-JO');
  };

  const hasFilters = filters.adId || filters.rating || filters.status || filters.flaggedOnly;
  const pageCount = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="reviews-page">
      <div className="reviews-header">
        <div>
          <h2>تقييمات الإعلانات</h2>
          <p>{total} تقييم</p>
        </div>
        <button className="btn btn-primary" onClick={fetchReviews} disabled={loading}>
          <RefreshCw size={16} />
          تحديث
        </button>
      </div>

      {flaggedAds.length > 0 && (
        <div className="reviews-flagged">
          <div className="reviews-flagged-title">
            <AlertTriangle size={18} />
            <span>إعلانات عليها تقييمات سلبية كثيرة ({flaggedAds.length})</span>
          </div>
          <div className="reviews-flagged-list">
            {flaggedAds.map((ad) => (
              <button key={ad.ad_id} className="reviews-flagged-item" onClick={() => filterByAd(ad.ad_id)}>
                <span className="reviews-flagged-ad">
                  #{ad.ad_id} {ad.ad_title ? `· ${ad.ad_title}` : ''}
                  <SourceBadge type={ad.ad_source_type} />
                </span>
                <span className="reviews-flagged-meta">
                  <span className="badge badge-danger">{ad.negative_count} سلبي</span>
                  <span>من {ad.reviews_count}</span>
                  <span className="reviews-flagged-avg">
                    <Star size={13} fill="#FFB300" color="#FFB300" /> {ad.average_rating.toFixed(1)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="reviews-filters">
        <form onSubmit={applyAdId} className="reviews-filter-ad">
          <input
            className="form-control"
            type="number"
            min="1"
            placeholder="رقم الإعلان"
            value={adIdInput}
            onChange={(e) => setAdIdInput(e.target.value)}
          />
          <button type="submit" className="btn btn-outline">بحث</button>
        </form>
        <select className="form-control" value={filters.rating} onChange={(e) => updateFilters({ rating: e.target.value })}>
          <option value="">كل النجوم</option>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>{r} نجوم</option>
          ))}
        </select>
        <select className="form-control" value={filters.status} onChange={(e) => updateFilters({ status: e.target.value })}>
          <option value="">كل الحالات</option>
          <option value="visible">ظاهر</option>
          <option value="hidden">مخفي</option>
        </select>
        <label className="reviews-filter-check">
          <input
            type="checkbox"
            checked={filters.flaggedOnly}
            onChange={(e) => updateFilters({ flaggedOnly: e.target.checked })}
          />
          الإعلانات المُعلَّمة فقط
        </label>
        {hasFilters && (
          <button className="reviews-reset" onClick={resetFilters}>
            <X size={14} />
            مسح الفلاتر
          </button>
        )}
      </div>

      <div className="reviews-table-card">
        {loading ? (
          <div className="reviews-state">جاري تحميل التقييمات...</div>
        ) : error ? (
          <div className="reviews-state reviews-state-error">{error}</div>
        ) : reviews.length === 0 ? (
          <div className="reviews-state">{hasFilters ? 'لا توجد تقييمات مطابقة للفلاتر' : 'لا توجد تقييمات حالياً'}</div>
        ) : (
          <div className="reviews-table-scroll">
            <table className="reviews-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>الإعلان</th>
                  <th>المقيّم</th>
                  <th>التقييم</th>
                  <th>الأوصاف</th>
                  <th>التعليق</th>
                  <th>التاريخ</th>
                  <th>الحالة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review.id} className={review.is_hidden ? 'reviews-row-hidden' : ''}>
                    <td>#{review.id}</td>
                    <td>
                      <button className="reviews-ad-link" onClick={() => filterByAd(review.ad_id)} title="عرض تقييمات هذا الإعلان">
                        #{review.ad_id}
                      </button>
                      <div className="reviews-ad-title">{review.ad_title || '-'}</div>
                      <SourceBadge type={review.ad_source_type} />
                      {review.ad_flagged && (
                        <span className="badge badge-danger reviews-flag-badge">
                          <AlertTriangle size={12} />
                          تقييمات سلبية كثيرة
                        </span>
                      )}
                    </td>
                    <td>
                      <div>{review.reviewer_name || 'مستخدم'}</div>
                      {review.reviewer_phone && <div className="reviews-phone">{review.reviewer_phone}</div>}
                    </td>
                    <td><Stars value={review.rating} /></td>
                    <td>
                      <div className="reviews-tags">
                        {review.tags.length === 0
                          ? '-'
                          : review.tags.map((tag) => (
                              <span key={tag} className={`badge ${review.rating <= NEGATIVE_MAX_RATING ? 'badge-danger' : 'badge-primary'}`}>
                                {tag}
                              </span>
                            ))}
                      </div>
                    </td>
                    <td className="reviews-comment">{review.comment || '-'}</td>
                    <td dir="ltr" className="reviews-date">{formatDate(review.created_at)}</td>
                    <td>
                      <span className={`badge ${review.is_hidden ? 'badge-warning' : 'badge-success'}`}>
                        {review.is_hidden ? 'مخفي' : 'ظاهر'}
                      </span>
                    </td>
                    <td>
                      <div className="reviews-actions">
                        <button
                          className="reviews-action"
                          onClick={() => toggleHidden(review)}
                          disabled={busyId === review.id}
                          title={review.is_hidden ? 'إظهار التقييم' : 'إخفاء التقييم'}
                        >
                          {review.is_hidden ? <Eye size={16} /> : <EyeOff size={16} />}
                          {review.is_hidden ? 'إظهار' : 'إخفاء'}
                        </button>
                        <button
                          className="reviews-action reviews-action-danger"
                          onClick={() => deleteReview(review)}
                          disabled={busyId === review.id}
                          title="حذف التقييم"
                        >
                          <Trash2 size={16} />
                          حذف التقييم
                        </button>
                        <button
                          className="reviews-action reviews-action-delete-ad"
                          onClick={() => deleteAd(review)}
                          disabled={busyId === review.id}
                          title="حذف الإعلان نفسه مع جميع تقييماته"
                        >
                          <Trash2 size={16} />
                          حذف الإعلان
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pageCount > 1 && (
        <div className="reviews-pagination">
          <button className="btn btn-outline" onClick={() => setPage((p) => p - 1)} disabled={page === 0 || loading}>
            السابق
          </button>
          <span>صفحة {page + 1} من {pageCount}</span>
          <button className="btn btn-outline" onClick={() => setPage((p) => p + 1)} disabled={page + 1 >= pageCount || loading}>
            التالي
          </button>
        </div>
      )}
    </div>
  );
};

export default Reviews;
