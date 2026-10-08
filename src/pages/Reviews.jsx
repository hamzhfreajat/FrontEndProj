import React, { useState } from 'react';
import { AlertTriangle, Bot, ExternalLink, Eye, EyeOff, RefreshCw, Star, Trash2, Users, X } from 'lucide-react';
import { api, errorMessage } from '../lib/api';
import { adUrl, isOrganic } from '../lib/site';
import { Badge, Button, Card, DataTable, EmptyState, Input, PageHeader, Select, formatDate, formatNumber, timeAgo, useFeedback, useLoad } from '../ui';

const PAGE_SIZE = 50;
// Must match AD_REVIEW_NEGATIVE_MAX_RATING in backend/schemas.py
const NEGATIVE_MAX_RATING = 2;
const NO_FILTERS = { adId: '', rating: '', status: '', flaggedOnly: false };

const Stars = ({ value }) => (
  <span className="nowrap" title={`${value} من 5`} style={{ display: 'inline-flex', gap: 1 }}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Star key={star} size={14} fill={star <= value ? '#f79009' : 'none'} color={star <= value ? '#f79009' : '#d0d5dd'} />
    ))}
  </span>
);

/** Who put the ad on the site: a person through the app, or the scraper. */
const Source = ({ type }) => {
  if (!type) return null;
  return isOrganic(type) ? (
    <Badge tone="green">
      <Users size={12} /> مستخدم
    </Badge>
  ) : (
    <Badge tone="amber">
      <Bot size={12} /> سحب آلي
    </Badge>
  );
};

export default function Reviews() {
  const { toast, confirm } = useFeedback();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(NO_FILTERS);
  const [adIdInput, setAdIdInput] = useState('');
  const [busy, setBusy] = useState(null);

  const { data, loading, error, reload } = useLoad(() => {
    const params = { skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE };
    if (filters.adId) params.ad_id = filters.adId;
    if (filters.rating) params.rating = filters.rating;
    if (filters.status) params.is_hidden = filters.status === 'hidden';
    if (filters.flaggedOnly) params.flagged_only = true;
    return api.get('/dashboard/reviews', { params }).then((response) => response.data);
  }, [page, filters]);

  const reviews = (data && data.reviews) || [];
  const flagged = (data && data.flagged_ads) || [];
  const total = (data && data.total) || 0;
  const hasFilters = !!(filters.adId || filters.rating || filters.status || filters.flaggedOnly);

  const update = (changes) => {
    setPage(1);
    setFilters((current) => ({ ...current, ...changes }));
  };

  const showAd = (adId) => {
    setAdIdInput(String(adId));
    update({ adId: String(adId), flaggedOnly: false });
  };

  const reset = () => {
    setAdIdInput('');
    setPage(1);
    setFilters(NO_FILTERS);
  };

  const run = async (review, action, done, failed) => {
    setBusy(review.id);
    try {
      await action();
      toast(done);
      reload();
    } catch (failure) {
      toast(errorMessage(failure, failed), 'error');
    } finally {
      setBusy(null);
    }
  };

  const toggleHidden = (review) =>
    run(review, () => api.patch(`/dashboard/reviews/${review.id}`, { is_hidden: !review.is_hidden }), review.is_hidden ? 'تم إظهار التقييم' : 'تم إخفاء التقييم', 'تعذّر تحديث التقييم.');

  const deleteReview = async (review) => {
    if (!(await confirm({ title: 'حذف التقييم؟', message: `سيُحذف التقييم #${review.id} نهائياً.`, confirmLabel: 'حذف التقييم', danger: true }))) return;
    run(review, () => api.delete(`/dashboard/reviews/${review.id}`), 'تم حذف التقييم', 'تعذّر حذف التقييم.');
  };

  // Removes the ad itself, and with it every review it has
  const deleteAd = async (review) => {
    const agreed = await confirm({
      title: 'حذف الإعلان؟',
      message: `سيُحذف الإعلان #${review.ad_id}${review.ad_title ? ` «${review.ad_title}»` : ''} نهائياً مع جميع تقييماته. لا يمكن التراجع.`,
      confirmLabel: 'حذف الإعلان',
      danger: true,
    });
    if (!agreed) return;
    run(review, () => api.delete(`/ads/${review.ad_id}`), 'تم حذف الإعلان', 'تعذّر حذف الإعلان.');
  };

  const columns = [
    {
      key: 'ad',
      label: 'الإعلان',
      primary: true,
      render: (review) => (
        <div style={{ maxWidth: 280 }}>
          <button type="button" className="btn-link cell-title" onClick={() => showAd(review.ad_id)} title="عرض تقييمات هذا الإعلان فقط">
            {review.ad_title || `إعلان #${review.ad_id}`}
          </button>
          <div className="row" style={{ gap: 6, marginTop: 4 }}>
            <span className="cell-sub num">#{review.ad_id}</span>
            <Source type={review.ad_source_type} />
            {review.ad_flagged && (
              <Badge tone="red">
                <AlertTriangle size={12} /> سلبيات كثيرة
              </Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'rating',
      label: 'التقييم',
      render: (review) => (
        <div>
          <Stars value={review.rating} />
          {review.tags && review.tags.length > 0 && (
            <div className="chips" style={{ marginTop: 6 }}>
              {review.tags.map((tag) => (
                <Badge key={tag} tone={review.rating <= NEGATIVE_MAX_RATING ? 'red' : 'blue'}>
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'comment',
      label: 'التعليق',
      render: (review) => <div style={{ maxWidth: 300, whiteSpace: 'normal', overflowWrap: 'anywhere' }}>{review.comment || <span className="muted">بدون تعليق</span>}</div>,
    },
    {
      key: 'reviewer',
      label: 'المقيّم',
      render: (review) => (
        <div>
          <div>{review.reviewer_name || 'مستخدم'}</div>
          {review.reviewer_phone && <div className="cell-sub ltr">{review.reviewer_phone}</div>}
        </div>
      ),
    },
    {
      key: 'state',
      label: 'الحالة',
      render: (review) => (
        <div>
          <Badge tone={review.is_hidden ? 'amber' : 'green'} dot>
            {review.is_hidden ? 'مخفي' : 'ظاهر'}
          </Badge>
          <div className="cell-sub" title={formatDate(review.created_at)} style={{ marginTop: 4 }}>
            {timeAgo(review.created_at)}
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      actions: true,
      render: (review) => (
        <div className="actions">
          <a className="btn btn-ghost btn-sm btn-icon" href={adUrl(review.ad_id)} target="_blank" rel="noreferrer" title="فتح الإعلان">
            <ExternalLink size={15} />
          </a>
          <Button variant="secondary" size="sm" icon={review.is_hidden ? Eye : EyeOff} disabled={busy === review.id} onClick={() => toggleHidden(review)}>
            {review.is_hidden ? 'إظهار' : 'إخفاء'}
          </Button>
          <Button variant="ghost" size="sm" icon={Trash2} disabled={busy === review.id} onClick={() => deleteReview(review)}>
            حذف التقييم
          </Button>
          <Button variant="danger-soft" size="sm" icon={Trash2} disabled={busy === review.id} onClick={() => deleteAd(review)}>
            حذف الإعلان
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="stack">
      <PageHeader title="التقييمات" subtitle={`${formatNumber(total)} تقييم${hasFilters ? ' مطابق للتصفية' : ''}. أخفِ التقييم المسيء أو احذف الإعلان الذي تتكرر عليه الشكاوى.`}>
        <Button variant="secondary" icon={RefreshCw} loading={loading} onClick={reload}>
          تحديث
        </Button>
      </PageHeader>

      {flagged.length > 0 && (
        <Card title={`إعلانات عليها تقييمات سلبية كثيرة (${flagged.length})`} subtitle="اضغط على إعلان لعرض تقييماته">
          <div className="grid grid-auto">
            {flagged.map((ad) => (
              <button key={ad.ad_id} type="button" className="flag-card" onClick={() => showAd(ad.ad_id)}>
                <div className="cell-title truncate">{ad.ad_title || `إعلان #${ad.ad_id}`}</div>
                <div className="row" style={{ gap: 6, marginTop: 6 }}>
                  <span className="cell-sub num">#{ad.ad_id}</span>
                  <Source type={ad.ad_source_type} />
                </div>
                <div className="row" style={{ gap: 8, marginTop: 8 }}>
                  <Badge tone="red">{ad.negative_count} سلبي</Badge>
                  <span className="cell-sub">من {ad.reviews_count}</span>
                  <span className="cell-sub nowrap">
                    <Star size={12} fill="#f79009" color="#f79009" /> {Number(ad.average_rating).toFixed(1)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      <Card flush>
        <div className="toolbar">
          <form
            className="row"
            style={{ gap: 8 }}
            onSubmit={(event) => {
              event.preventDefault();
              update({ adId: adIdInput.trim() });
            }}
          >
            <Input type="number" min="1" value={adIdInput} onChange={(event) => setAdIdInput(event.target.value)} placeholder="رقم الإعلان" style={{ width: 140 }} />
            <Button type="submit" variant="secondary">
              بحث
            </Button>
          </form>
          <Select value={filters.rating} onChange={(event) => update({ rating: event.target.value })} aria-label="عدد النجوم">
            <option value="">كل النجوم</option>
            {[5, 4, 3, 2, 1].map((rating) => (
              <option key={rating} value={rating}>
                {rating} نجوم
              </option>
            ))}
          </Select>
          <Select value={filters.status} onChange={(event) => update({ status: event.target.value })} aria-label="الحالة">
            <option value="">كل الحالات</option>
            <option value="visible">ظاهر</option>
            <option value="hidden">مخفي</option>
          </Select>
          <label className="check">
            <input type="checkbox" checked={filters.flaggedOnly} onChange={(event) => update({ flaggedOnly: event.target.checked })} />
            الإعلانات المُعلَّمة فقط
          </label>
          {hasFilters && (
            <Button variant="ghost" size="sm" icon={X} onClick={reset}>
              مسح التصفية
            </Button>
          )}
        </div>
        <DataTable
          columns={columns}
          rows={reviews}
          loading={loading}
          error={error}
          onRetry={reload}
          serverPaging={{ page, pageSize: PAGE_SIZE, total, onPage: setPage }}
          empty={<EmptyState icon={Star} title={hasFilters ? 'لا توجد تقييمات مطابقة' : 'لا توجد تقييمات بعد'} />}
        />
      </Card>
    </div>
  );
}
