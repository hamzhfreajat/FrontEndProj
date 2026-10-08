import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, MapPin, RefreshCw, Save } from 'lucide-react';
import { api, errorMessage } from '../lib/api';
import { adUrl } from '../lib/site';
import { Alert, Badge, Button, Card, EmptyState, ErrorState, Input, PageHeader, SearchInput, SkeletonRows, formatNumber, useFeedback, useLoad } from '../ui';

const PAGE_SIZE = 20;
const UNKNOWN = 'غير محدد';

/** One ad with its text and a box to pick the right place for it. */
function AdRow({ ad, known, onSaved }) {
  const { toast } = useFeedback();
  const [value, setValue] = useState(ad.location || '');
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  const trimmed = value.trim();
  const changed = trimmed !== (ad.location || '').trim();
  // Only a city or "city, area" that exists may be saved: a typed-in name would file the ad nowhere
  const valid = known.has(trimmed);
  const text = ad.description || '';
  const long = text.length > 180;

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/ads/${ad.id}`, { location: trimmed });
      toast('تم تحديث موقع الإعلان');
      onSaved(ad.id, trimmed);
    } catch (failure) {
      toast(errorMessage(failure, 'تعذّر تحديث الموقع.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fix-row">
      <div className="grow">
        <div className="row" style={{ gap: 8 }}>
          <a className="cell-title" href={adUrl(ad.id)} target="_blank" rel="noreferrer">
            {ad.title || 'بدون عنوان'} <ExternalLink size={12} />
          </a>
          <span className="cell-sub num">#{ad.id}</span>
          <Badge tone={ad.location === UNKNOWN || !ad.location ? 'red' : /أخرى/.test(ad.location) ? 'amber' : undefined}>{ad.location || 'بلا موقع'}</Badge>
        </div>
        <p className="fix-text">
          {text ? (expanded || !long ? text : `${text.slice(0, 180)}…`) : <span className="muted">لا يوجد وصف</span>}
          {long && (
            <button type="button" className="btn-link" style={{ color: 'var(--brand-600)', marginInlineStart: 6 }} onClick={() => setExpanded(!expanded)}>
              {expanded ? 'أقل' : 'المزيد'}
            </button>
          )}
        </p>
      </div>
      <div className="fix-edit">
        <div className="search">
          <MapPin size={16} />
          <Input list="known-locations" value={value} onChange={(event) => setValue(event.target.value)} placeholder="اكتب واختر من القائمة..." aria-label="الموقع الجديد" />
        </div>
        <Button icon={Save} loading={saving} disabled={!changed || !valid} onClick={save}>
          حفظ
        </Button>
        {changed && !valid && <div className="field-error" style={{ flexBasis: '100%' }}>اختر مدينة أو «مدينة, منطقة» من القائمة.</div>}
      </div>
    </div>
  );
}

export default function ChangeAdsLocation() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [onlyOthers, setOnlyOthers] = useState(false);
  const [ads, setAds] = useState([]);
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ loading: true, error: null, total: 0, hasMore: false });
  // Bumped to load the first page again with the same filters
  const [refreshes, setRefreshes] = useState(0);

  const locations = useLoad(() => api.get('/locations', { params: { t: Date.now() } }).then((response) => response.data));

  /** Every place an ad may be filed under: each city, and each "city, area". */
  const options = useMemo(() => {
    const list = [];
    (locations.data || []).forEach((city) => {
      list.push(city.name_ar);
      (city.regions || []).forEach((region) => list.push(`${city.name_ar}, ${region.name_ar}`));
    });
    return list;
  }, [locations.data]);
  const known = useMemo(() => new Set(options), [options]);

  useEffect(() => {
    let cancelled = false;
    setState((current) => ({ ...current, loading: true, error: null }));
    const filters = {};
    if (submitted) filters.location_search = submitted;
    if (onlyOthers) filters.only_others = 'true';
    Promise.all([
      api.get('/ads', { params: { skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE, sort_by: 'strict_newest', ...filters } }),
      api.get('/ads/count', { params: filters }),
    ])
      .then(([list, count]) => {
        if (cancelled) return;
        setAds((current) => (page === 1 ? list.data : [...current, ...list.data]));
        setState({ loading: false, error: null, total: count.data.total_count || 0, hasMore: list.data.length === PAGE_SIZE });
      })
      .catch((failure) => {
        if (!cancelled) setState((current) => ({ ...current, loading: false, error: errorMessage(failure, 'تعذّر تحميل الإعلانات.') }));
      });
    return () => {
      cancelled = true;
    };
  }, [submitted, onlyOthers, page, refreshes]);

  const search = (value) => {
    setPage(1);
    setSubmitted(value.trim());
  };

  const refresh = () => {
    setPage(1);
    setRefreshes((count) => count + 1);
  };

  const quick = (value) => {
    setQuery(value);
    search(value);
  };

  const onSaved = (id, location) => setAds((current) => current.map((ad) => (ad.id === id ? { ...ad, location } : ad)));

  return (
    <>
      <PageHeader title="تصحيح مواقع الإعلانات" subtitle="اقرأ نص الإعلان واختر مدينته ومنطقته الصحيحة. الإعلان بلا مدينة لا يظهر في أي صفحة مدينة على الموقع.">
        <Button variant="secondary" icon={RefreshCw} loading={state.loading} onClick={refresh}>
          تحديث
        </Button>
      </PageHeader>

      <div className="stack">
        <Alert>
          يُحفظ الموقع فقط إذا كان مدينة أو «مدينة, منطقة» موجودة في قائمة <a href="/locations-manager">المدن والمناطق</a>. إن كانت المنطقة غير موجودة فأضفها من هناك أولاً.
        </Alert>

        <Card flush>
          <div className="toolbar">
            <SearchInput value={query} onChange={setQuery} onSubmit={search} placeholder="ابحث بالموقع الحالي للإعلان، ثم Enter" />
            <Button variant="secondary" onClick={() => search(query)}>
              بحث
            </Button>
            <div className="chips">
              <button type="button" className={`chip${submitted === UNKNOWN ? ' active' : ''}`} onClick={() => quick(submitted === UNKNOWN ? '' : UNKNOWN)}>
                بلا مدينة
              </button>
              <button type="button" className={`chip${onlyOthers ? ' active' : ''}`} onClick={() => { setPage(1); setOnlyOthers(!onlyOthers); }}>
                منطقة «أخرى»
              </button>
            </div>
            <div className="toolbar-spacer" />
            <span className="muted">{formatNumber(state.total)} إعلان</span>
          </div>

          {state.error ? (
            <ErrorState message={state.error} onRetry={refresh} />
          ) : state.loading && ads.length === 0 ? (
            <SkeletonRows rows={6} columns={3} />
          ) : ads.length === 0 ? (
            <EmptyState icon={MapPin} title="لا توجد إعلانات مطابقة" />
          ) : (
            <>
              {ads.map((ad) => (
                <AdRow key={ad.id} ad={ad} known={known} onSaved={onSaved} />
              ))}
              {state.hasMore && (
                <div className="card-foot" style={{ justifyContent: 'center' }}>
                  <Button variant="secondary" loading={state.loading} onClick={() => setPage(page + 1)}>
                    تحميل المزيد
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      <datalist id="known-locations">
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </>
  );
}
