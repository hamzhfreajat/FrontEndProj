import React, { useEffect, useMemo, useState } from 'react';
import {
  Bot, ChevronLeft, ChevronRight, Eye, ExternalLink, FileText, Filter, Flame, Heart, ImageOff, Layers, MapPin, MessageSquare, Pencil, RefreshCw, Save, Trash2,
  User, X,
} from 'lucide-react';
import { api, errorMessage } from '../lib/api';
import * as options from '../lib/adOptions';
import { adUrl, isOrganic } from '../lib/site';
import {
  EMPTY, Badge, Button, Card, DataTable, EmptyState, Field, Input, Loading, Modal, PageHeader, SearchInput, Select, Switch, Tabs, Textarea, formatDate, formatNumber,
  formatPrice, timeAgo, useFeedback, useLoad,
} from '../ui';

const NO_FILTERS = { search: '', phone: '', category_id: '', location: '', min_price: '', max_price: '', is_hot: '', is_published: '', duplicate_status: '' };
const SOURCES = [
  { value: 'ORGANIC_USER', label: 'من المستخدمين' },
  { value: 'SCRAPER_BOT', label: 'سحب آلي' },
  { value: '', label: 'الكل' },
];
const PRICE_STATUS = {
  BELOW_MARKET: { label: 'أقل من السوق', tone: 'green' },
  NOT_BELOW_MARKET: { label: 'سعر عادي', tone: undefined },
  NO_DATA: { label: 'لا بيانات', tone: undefined },
};
const CONFIDENCE = { high: 'عالية', medium: 'متوسطة', low: 'ضعيفة' };

const DuplicateBadge = ({ status }) => {
  const known = options.DUPLICATE_STATUS[status];
  return <Badge tone={known && known.tone}>{known ? known.label : status}</Badge>;
};

function Thumb({ ad }) {
  const [broken, setBroken] = useState(false);
  const image = options.adImages(ad)[0];
  if (!image || broken) {
    return (
      <span className="thumb" style={{ display: 'grid', placeItems: 'center', color: 'var(--faint)' }}>
        <ImageOff size={18} />
      </span>
    );
  }
  return <img className="thumb" src={image} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} />;
}

function Gallery({ ad }) {
  const images = useMemo(() => options.adImages(ad), [ad]);
  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [ad.id]);
  if (images.length === 0) {
    return (
      <div className="gallery">
        <EmptyState icon={ImageOff} title="لا توجد صور" />
      </div>
    );
  }
  const step = (delta) => setIndex((current) => (current + delta + images.length) % images.length);
  return (
    <div className="gallery">
      <img src={images[index]} alt="" referrerPolicy="no-referrer" />
      {images.length > 1 && (
        <>
          <button type="button" className="gallery-nav is-prev" onClick={() => step(-1)} aria-label="السابقة">
            <ChevronRight size={20} />
          </button>
          <button type="button" className="gallery-nav is-next" onClick={() => step(1)} aria-label="التالية">
            <ChevronLeft size={20} />
          </button>
          <span className="gallery-count num">
            {index + 1} / {images.length}
          </span>
        </>
      )}
    </div>
  );
}

function Checks({ label, choices, selected, onToggle }) {
  return (
    <Field label={label}>
      <div className="check-grid">
        {choices.map((choice) => (
          <label key={choice} className="check">
            <input type="checkbox" checked={selected.includes(choice)} onChange={() => onToggle(choice)} />
            {choice}
          </label>
        ))}
      </div>
    </Field>
  );
}

const Choice = ({ label, value, choices, onChange }) => (
  <Field label={label}>
    <Select value={value === null || value === undefined ? '' : value} onChange={(event) => onChange(event.target.value)}>
      <option value="">غير محدد</option>
      {choices.map((choice) => (
        <option key={typeof choice === 'object' ? choice.value : choice} value={typeof choice === 'object' ? choice.value : choice}>
          {typeof choice === 'object' ? choice.label : choice}
        </option>
      ))}
    </Select>
  </Field>
);

/** The edit form. Real-estate fields are kept flat here and packed back into their nested object on save. */
function AdForm({ form, setForm, locations }) {
  const set = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const toggle = (name) => (choice) =>
    setForm((current) => {
      const list = current[name] || [];
      return { ...current, [name]: list.includes(choice) ? list.filter((item) => item !== choice) : [...list, choice] };
    });
  const attributes = form.attributes || {};
  const toggleAttribute = (name) => (choice) =>
    setForm((current) => {
      const all = current.attributes || {};
      const list = all[name] || [];
      return { ...current, attributes: { ...all, [name]: list.includes(choice) ? list.filter((item) => item !== choice) : [...list, choice] } };
    });
  const number = (value, parse) => (value === '' ? null : parse(value));

  return (
    <div className="stack">
      <div className="form-grid">
        <Field label="عنوان الإعلان" className="span-2">
          <Input value={form.title || ''} onChange={(event) => set('title', event.target.value)} />
        </Field>
        <Field label="السعر (دينار)">
          <Input type="number" min="0" value={form.price === null || form.price === undefined ? '' : form.price} onChange={(event) => set('price', number(event.target.value, parseFloat))} />
        </Field>
        <Field label="الموقع" hint="مدينة أو «مدينة, منطقة» من القائمة">
          <Input list="ad-locations" value={form.location || ''} onChange={(event) => set('location', event.target.value)} />
        </Field>
        <Field label="مساحة البناء (م²)">
          <Input type="number" min="0" value={form.build_area || ''} onChange={(event) => set('build_area', number(event.target.value, (value) => parseInt(value, 10)))} />
        </Field>
        <Choice label="عدد الغرف" value={form.rooms} onChange={(value) => set('rooms', number(value, (text) => parseInt(text, 10)))} choices={options.ROOMS.map((room) => ({ value: room === 'ستوديو' ? 0 : parseInt(room, 10), label: room }))} />
        <Choice label="عدد الحمامات" value={form.bathrooms} onChange={(value) => set('bathrooms', number(value, (text) => parseInt(text, 10)))} choices={options.BATHS.map((bath) => ({ value: parseInt(bath, 10), label: bath }))} />
        <Choice label="الفرش" value={form.furnished} onChange={(value) => set('furnished', value)} choices={options.FURNISHED} />
        <Choice label="الطابق" value={form.floor} onChange={(value) => set('floor', value)} choices={options.FLOOR} />
        <Choice label="عمر البناء" value={form.building_age} onChange={(value) => set('building_age', value)} choices={options.AGE} />
        <Choice label="مدة الإيجار" value={form.rent_duration} onChange={(value) => set('rent_duration', value)} choices={options.RENT_DURATION} />
        <Choice label="الواجهة" value={form.view_orientation} onChange={(value) => set('view_orientation', value)} choices={options.VIEW} />
      </div>
      <Field label="وصف الإعلان">
        <Textarea rows={6} value={form.description || ''} onChange={(event) => set('description', event.target.value)} />
      </Field>
      <Checks label="المزايا الرئيسية" choices={options.KEY_FEATURES} selected={form.key_features || []} onToggle={toggle('key_features')} />
      <Checks label="المزايا الإضافية" choices={options.ADDITIONAL_FEATURES} selected={form.additional_features || []} onToggle={toggle('additional_features')} />
      <Checks label="مواقع قريبة" choices={options.NEARBY} selected={form.nearby_locations || []} onToggle={toggle('nearby_locations')} />
      <Checks label="الفئة المستهدفة" choices={options.TARGET_AUDIENCE} selected={attributes.target_audience || []} onToggle={toggleAttribute('target_audience')} />
      <Checks label="طريقة الدفع ونوع المعلن" choices={options.PAYMENT_METHOD} selected={attributes.payment_method || []} onToggle={toggleAttribute('payment_method')} />
      <datalist id="ad-locations">
        {locations.map((location) => (
          <option key={location} value={location} />
        ))}
      </datalist>
    </div>
  );
}

function AdDetails({ ad, categoryName }) {
  const detail = ad.real_estate_detail || {};
  const facts = [
    ['الغرف', ad.rooms === 0 ? 'ستوديو' : ad.rooms],
    ['الحمامات', detail.bathrooms],
    ['المساحة', detail.build_area ? `${formatNumber(detail.build_area)} م²` : null],
    ['الطابق', detail.floor],
    ['الفرش', detail.furnished],
    ['مدة الإيجار', detail.rent_duration],
    ['عمر البناء', detail.building_age],
    ['الواجهة', detail.view_orientation],
  ].filter(([, value]) => value !== null && value !== undefined && value !== '');
  const features = [
    ['مزايا رئيسية', detail.key_features],
    ['مزايا إضافية', detail.additional_features],
    ['قريب من', detail.nearby_locations],
  ].filter(([, list]) => Array.isArray(list) && list.length > 0);
  const price = PRICE_STATUS[ad.market_price_status];

  return (
    <div className="ad-view">
      <Gallery ad={ad} />
      <div className="stack">
        <div>
          <h3 style={{ fontSize: '1.15rem' }}>{ad.title || 'بدون عنوان'}</h3>
          <div className="stat-value" style={{ color: 'var(--brand-600)' }}>
            {ad.price ? formatPrice(ad.price) : 'بدون سعر'}
          </div>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <Badge tone={ad.is_published ? 'green' : 'amber'} dot>
            {ad.is_published ? 'منشور' : 'غير منشور'}
          </Badge>
          {isOrganic(ad.source_type) ? <Badge tone="green"><User size={12} /> مستخدم</Badge> : <Badge tone="amber"><Bot size={12} /> سحب آلي</Badge>}
          {ad.is_featured && <Badge tone="violet">مميّز</Badge>}
          {ad.is_hot && <Badge tone="red"><Flame size={12} /> لقطة</Badge>}
          {ad.duplicate_status && <DuplicateBadge status={ad.duplicate_status} />}
        </div>
        <dl className="kv">
          <dt>القسم</dt>
          <dd>{categoryName(ad.category_id)}</dd>
          <dt>الموقع</dt>
          <dd>{ad.location || '—'}</dd>
          <dt>أُضيف</dt>
          <dd>{formatDate(ad.original_created_at || ad.created_at)}</dd>
          <dt>المعلن</dt>
          <dd className="num">مستخدم #{ad.user_id}</dd>
          <dt>التفاعل</dt>
          <dd className="num">
            {formatNumber(ad.views || 0)} مشاهدة · {formatNumber(ad.chats_count || 0)} محادثة · {formatNumber(ad.favorites_count || 0)} مفضلة
          </dd>
          {facts.map(([label, value]) => (
            <React.Fragment key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </React.Fragment>
          ))}
        </dl>
        {price && ad.market_price_status !== 'NO_DATA' && (
          <div className="alert">
            <div>
              <strong>مؤشر السعر: {price.label}.</strong> قورن بـ {formatNumber(ad.comparables_count || 0)} إعلان مشابه، متوسطها {formatPrice(ad.market_average_price)}
              {ad.deviation_pct ? `، والفرق ${(ad.deviation_pct * 100).toFixed(1)}%` : ''}. موثوقية المقارنة: {CONFIDENCE[ad.confidence_level] || 'غير معروفة'}.
            </div>
          </div>
        )}
        <div>
          <div className="field-label">الوصف</div>
          <p style={{ whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{ad.description || <span className="muted">لا يوجد وصف</span>}</p>
        </div>
        {features.map(([label, list]) => (
          <div key={label}>
            <div className="field-label">{label}</div>
            <div className="chips">
              {list.map((item) => (
                <Badge key={item}>{item}</Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Duplicates({ adId }) {
  const { data, loading, error, reload } = useLoad(() => api.get(`/admin/ads/${adId}/check-duplicates`).then((response) => response.data), [adId]);
  return (
    <DataTable
      rows={data}
      rowKey="candidate_ad_id"
      loading={loading}
      error={error}
      onRetry={reload}
      empty={<EmptyState icon={Layers} title="لا توجد إعلانات مشابهة" description="لم يجد النظام إعلاناً آخر يشبه هذا الإعلان." />}
      columns={[
        {
          key: 'candidate',
          label: 'الإعلان المشابه',
          primary: true,
          render: (row) => (
            <a className="cell-title num" href={adUrl(row.candidate_ad_id)} target="_blank" rel="noreferrer">
              #{row.candidate_ad_id} <ExternalLink size={12} />
            </a>
          ),
        },
        { key: 'total', label: 'التشابه الكلي', sort: (row) => row.total_score, render: (row) => <strong className={`num ${row.total_score >= 80 ? '' : 'muted'}`} style={row.total_score >= 80 ? { color: 'var(--red-700)' } : undefined}>{row.total_score} / 100</strong> },
        { key: 'image', label: 'الصور', render: (row) => <span className="num">{(row.score_breakdown || {}).image}</span> },
        { key: 'text', label: 'النص', render: (row) => <span className="num">{(row.score_breakdown || {}).text}</span> },
        { key: 'specs', label: 'المواصفات', render: (row) => <span className="num">{(row.score_breakdown || {}).specs}</span> },
        { key: 'status', label: 'النتيجة', render: (row) => <DuplicateBadge status={row.status} /> },
      ]}
    />
  );
}

export default function Ads() {
  const { toast, confirm } = useFeedback();
  const [source, setSource] = useState('ORGANIC_USER');
  const [draft, setDraft] = useState(NO_FILTERS);
  const [filters, setFilters] = useState(NO_FILTERS);
  const [showMore, setShowMore] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [patches, setPatches] = useState({});
  const [removed, setRemoved] = useState({});
  const [open, setOpen] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [duplicatesFor, setDuplicatesFor] = useState(null);
  const [busy, setBusy] = useState(null);

  const meta = useLoad(() =>
    Promise.all([api.get('/categories'), api.get('/locations')]).then(([categories, cities]) => ({ categories: categories.data, cities: cities.data })),
  );
  const categories = (meta.data && meta.data.categories) || EMPTY;
  const locations = useMemo(() => {
    const list = [];
    ((meta.data && meta.data.cities) || []).forEach((city) => {
      list.push(city.name_ar);
      (city.regions || []).forEach((region) => list.push(`${city.name_ar}, ${region.name_ar}`));
    });
    return list;
  }, [meta.data]);
  const categoryNames = useMemo(() => {
    const names = {};
    categories.forEach((category) => {
      names[category.id] = category.name;
    });
    return names;
  }, [categories]);
  const categoryName = (id) => categoryNames[id] || 'غير محدد';

  const { data, loading, error, reload } = useLoad(() => {
    const params = { sort_by: 'dashboard_strict', _ts: Date.now() };
    if (source) params.source_type = source;
    Object.keys(filters).forEach((name) => {
      if (filters[name] !== '') params[name] = filters[name];
    });
    return Promise.all([api.get('/ads', { params: { ...params, skip: (page - 1) * pageSize, limit: pageSize } }), api.get('/ads/count', { params })]).then(([list, count]) => ({
      ads: list.data,
      total: count.data.total_count || 0,
    }));
  }, [source, filters, page, pageSize]);

  const ads = useMemo(() => ((data && data.ads) || EMPTY).filter((ad) => !removed[ad.id]).map((ad) => (patches[ad.id] ? { ...ad, ...patches[ad.id] } : ad)), [data, patches, removed]);
  const total = (data && data.total) || 0;
  const activeFilters = Object.keys(filters).filter((name) => filters[name] !== '').length;
  const current = open ? ads.find((ad) => ad.id === open) || null : null;

  const apply = (event) => {
    if (event) event.preventDefault();
    setPage(1);
    setFilters(draft);
  };

  const clear = () => {
    setDraft(NO_FILTERS);
    setFilters(NO_FILTERS);
    setPage(1);
  };

  const patch = (id, change) => setPatches((all) => ({ ...all, [id]: { ...(all[id] || {}), ...change } }));

  const toggle = async (ad, action, field, messages) => {
    setBusy(ad.id);
    try {
      const { data: updated } = await api.put(`/ads/${ad.id}/${action}`);
      patch(ad.id, { [field]: updated[field] });
      toast(updated[field] ? messages[0] : messages[1]);
    } catch (failure) {
      toast(errorMessage(failure, 'تعذّر تحديث الإعلان.'), 'error');
    } finally {
      setBusy(null);
    }
  };
  const togglePublish = (ad) => toggle(ad, 'toggle-publish', 'is_published', ['تم نشر الإعلان', 'تم إلغاء نشر الإعلان']);
  const toggleFeatured = (ad) => toggle(ad, 'toggle-featured', 'is_featured', ['تم تمييز الإعلان', 'تم إلغاء التمييز']);
  const toggleHot = (ad) => toggle(ad, 'toggle-hot', 'is_hot', ['تم تعيين الإعلان كلقطة', 'تم إلغاء اللقطة']);

  const remove = async (ad) => {
    if (!(await confirm({ title: 'حذف الإعلان؟', message: `سيُحذف الإعلان #${ad.id} «${ad.title || 'بدون عنوان'}» نهائياً. لا يمكن التراجع.`, confirmLabel: 'حذف الإعلان', danger: true }))) return;
    setBusy(ad.id);
    try {
      await api.delete(`/ads/${ad.id}`);
      setRemoved((all) => ({ ...all, [ad.id]: true }));
      if (open === ad.id) setOpen(null);
      toast('تم حذف الإعلان');
    } catch (failure) {
      toast(errorMessage(failure, 'تعذّر حذف الإعلان.'), 'error');
    } finally {
      setBusy(null);
    }
  };

  const startEdit = (ad) => setEditing({ ...ad, ...(ad.real_estate_detail || {}) });

  const save = async () => {
    setSaving(true);
    try {
      // Real-estate fields go back into their nested object
      const payload = { ...editing };
      const detail = {};
      options.REAL_ESTATE_FIELDS.forEach((field) => {
        if (payload[field] !== undefined) {
          detail[field] = payload[field];
          delete payload[field];
        }
      });
      if (Object.keys(detail).length > 0) payload.real_estate_detail = detail;
      else delete payload.real_estate_detail;
      const { data: updated } = await api.put(`/ads/${editing.id}`, payload);
      patch(editing.id, updated);
      setEditing(null);
      toast('تم حفظ التعديلات');
    } catch (failure) {
      toast(errorMessage(failure, 'تعذّر حفظ التعديلات.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'ad',
      label: 'الإعلان',
      primary: true,
      render: (ad) => (
        <div className="media">
          <Thumb ad={ad} />
          <div className="media-body" style={{ maxWidth: 320 }}>
            <button type="button" className="btn-link truncate" style={{ display: 'block', maxWidth: '100%' }} onClick={() => setOpen(ad.id)}>
              {ad.title || 'بدون عنوان'}
            </button>
            <div className="row" style={{ gap: 6, marginTop: 3 }}>
              <span className="cell-sub num">#{ad.id}</span>
              {!isOrganic(ad.source_type) && (
                <Badge tone="amber">
                  <Bot size={11} /> آلي
                </Badge>
              )}
              {ad.duplicate_status && ad.duplicate_status !== 'ACCEPTED' && <DuplicateBadge status={ad.duplicate_status} />}
              {ad.market_price_status === 'BELOW_MARKET' && <Badge tone="green">أقل من السوق</Badge>}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'place',
      label: 'القسم والموقع',
      render: (ad) => (
        <div>
          <div>{categoryName(ad.category_id)}</div>
          <div className="cell-sub">
            <MapPin size={11} /> {ad.location || 'بلا موقع'}
          </div>
        </div>
      ),
    },
    { key: 'price', label: 'السعر', render: (ad) => <span className="num strong">{ad.price ? formatPrice(ad.price) : <span className="muted">بدون سعر</span>}</span> },
    {
      key: 'stats',
      label: 'التفاعل',
      hideMobile: true,
      render: (ad) => (
        <div className="row nowrap cell-sub" style={{ gap: 10, flexWrap: 'nowrap' }}>
          <span title="مشاهدات"><Eye size={12} /> {formatNumber(ad.views || 0)}</span>
          <span title="محادثات"><MessageSquare size={12} /> {formatNumber(ad.chats_count || 0)}</span>
          <span title="مفضلة"><Heart size={12} /> {formatNumber(ad.favorites_count || 0)}</span>
        </div>
      ),
    },
    { key: 'date', label: 'أُضيف', render: (ad) => <span title={formatDate(ad.original_created_at || ad.created_at)}>{timeAgo(ad.original_created_at || ad.created_at)}</span> },
    { key: 'published', label: 'منشور', render: (ad) => <Switch checked={ad.is_published} disabled={busy === ad.id} onChange={() => togglePublish(ad)} label={ad.is_published ? 'إلغاء النشر' : 'نشر'} /> },
    { key: 'featured', label: 'مميّز', render: (ad) => <Switch checked={ad.is_featured} disabled={busy === ad.id} onChange={() => toggleFeatured(ad)} label="تمييز الإعلان" /> },
    { key: 'hot', label: 'لقطة', render: (ad) => <Switch checked={ad.is_hot} disabled={busy === ad.id} onChange={() => toggleHot(ad)} label="لقطة" /> },
    {
      key: 'actions',
      label: '',
      actions: true,
      render: (ad) => (
        <div className="actions">
          <Button variant="ghost" size="sm" icon={Eye} title="عرض التفاصيل" aria-label="عرض التفاصيل" onClick={() => setOpen(ad.id)} />
          <Button variant="ghost" size="sm" icon={Layers} title="فحص التكرار" aria-label="فحص التكرار" onClick={() => setDuplicatesFor(ad.id)} />
          <Button variant="ghost" size="sm" icon={Trash2} title="حذف" aria-label="حذف" disabled={busy === ad.id} onClick={() => remove(ad)} style={{ color: 'var(--red-600)' }} />
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="الإعلانات" subtitle={`${formatNumber(total)} إعلان${activeFilters ? ' مطابق للتصفية' : ''}. راجع، انشر، ميّز أو احذف.`}>
        <Button variant="secondary" icon={RefreshCw} loading={loading} onClick={reload}>
          تحديث
        </Button>
      </PageHeader>

      <Card flush>
        <Tabs value={source} onChange={(value) => { setSource(value); setPage(1); }} tabs={SOURCES} />
        <form className="toolbar" onSubmit={apply}>
          <SearchInput value={draft.search} onChange={(value) => setDraft({ ...draft, search: value })} placeholder="ابحث في العنوان والوصف..." />
          <Input className="ltr" value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} placeholder="رقم الهاتف" style={{ width: 150 }} inputMode="tel" />
          <Select value={draft.is_published} onChange={(event) => setDraft({ ...draft, is_published: event.target.value })} aria-label="حالة النشر">
            <option value="">كل الحالات</option>
            <option value="true">منشور</option>
            <option value="false">غير منشور</option>
          </Select>
          <Button type="submit">بحث</Button>
          <Button variant="secondary" icon={Filter} onClick={() => setShowMore(!showMore)}>
            تصفية{activeFilters ? ` (${activeFilters})` : ''}
          </Button>
          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" icon={X} onClick={clear}>
              مسح
            </Button>
          )}
        </form>
        {showMore && (
          <form className="toolbar" onSubmit={apply}>
            <Select value={draft.category_id} onChange={(event) => setDraft({ ...draft, category_id: event.target.value })} aria-label="القسم">
              <option value="">كل الأقسام</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            <Input list="ad-filter-locations" value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} placeholder="مدينة أو منطقة" style={{ width: 190 }} />
            <Input type="number" min="0" value={draft.min_price} onChange={(event) => setDraft({ ...draft, min_price: event.target.value })} placeholder="أقل سعر" style={{ width: 120 }} />
            <Input type="number" min="0" value={draft.max_price} onChange={(event) => setDraft({ ...draft, max_price: event.target.value })} placeholder="أعلى سعر" style={{ width: 120 }} />
            <Select value={draft.duplicate_status} onChange={(event) => setDraft({ ...draft, duplicate_status: event.target.value })} aria-label="حالة التكرار">
              <option value="">كل حالات التكرار</option>
              {Object.keys(options.DUPLICATE_STATUS).map((status) => (
                <option key={status} value={status}>
                  {options.DUPLICATE_STATUS[status].label}
                </option>
              ))}
            </Select>
            <label className="check">
              <input type="checkbox" checked={draft.is_hot === 'true'} onChange={(event) => setDraft({ ...draft, is_hot: event.target.checked ? 'true' : '' })} />
              اللقطات فقط
            </label>
            <Button type="submit" variant="secondary">
              تطبيق
            </Button>
            <datalist id="ad-filter-locations">
              {locations.map((location) => (
                <option key={location} value={location} />
              ))}
            </datalist>
          </form>
        )}
        <DataTable
          columns={columns}
          rows={ads}
          loading={loading}
          error={error}
          onRetry={reload}
          serverPaging={{ page, pageSize, total, onPage: setPage }}
          empty={<EmptyState icon={FileText} title="لا توجد إعلانات مطابقة" description={activeFilters ? 'جرّب تغيير التصفية أو مسحها.' : undefined} />}
        />
        <div className="card-foot">
          <span className="muted">عدد الصفوف في الصفحة</span>
          <Select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} style={{ width: 'auto' }} aria-label="عدد الصفوف">
            {[25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Modal
        open={!!current && !editing}
        size="wide"
        title={current ? `إعلان #${current.id}` : ''}
        onClose={() => setOpen(null)}
        footer={
          current && (
            <>
              <a className="btn btn-ghost" href={adUrl(current.id)} target="_blank" rel="noreferrer">
                <ExternalLink size={16} /> <span>فتح على الموقع</span>
              </a>
              <Button variant="secondary" icon={Layers} onClick={() => setDuplicatesFor(current.id)}>
                فحص التكرار
              </Button>
              <Button variant="secondary" icon={Pencil} onClick={() => startEdit(current)}>
                تعديل
              </Button>
              <Button variant={current.is_published ? 'secondary' : 'primary'} disabled={busy === current.id} onClick={() => togglePublish(current)}>
                {current.is_published ? 'إلغاء النشر' : 'نشر الإعلان'}
              </Button>
              <Button variant="danger" icon={Trash2} disabled={busy === current.id} onClick={() => remove(current)}>
                حذف
              </Button>
            </>
          )
        }
      >
        {current && <AdDetails ad={current} categoryName={categoryName} />}
      </Modal>

      <Modal
        open={!!editing}
        size="wide"
        title={editing ? `تعديل الإعلان #${editing.id}` : ''}
        onClose={() => setEditing(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              إلغاء
            </Button>
            <Button icon={Save} loading={saving} onClick={save}>
              حفظ التعديلات
            </Button>
          </>
        }
      >
        {editing && (meta.loading ? <Loading /> : <AdForm form={editing} setForm={setEditing} locations={locations} />)}
      </Modal>

      <Modal open={!!duplicatesFor} size="wide" title={duplicatesFor ? `إعلانات تشبه الإعلان #${duplicatesFor}` : ''} onClose={() => setDuplicatesFor(null)}>
        {duplicatesFor && <Duplicates adId={duplicatesFor} />}
      </Modal>
    </>
  );
}
