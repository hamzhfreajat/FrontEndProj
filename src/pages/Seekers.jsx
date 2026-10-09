import React, { useState } from 'react';
import { Check, ClipboardList, Copy, ExternalLink, EyeOff, MapPin, RefreshCw, RotateCcw, SearchCheck, Users } from 'lucide-react';
import { api, errorMessage } from '../lib/api';
import { SITE_URL } from '../lib/site';
import { Alert, Badge, Button, Card, EmptyState, ErrorState, PageHeader, Pagination, SearchInput, Select, SkeletonRows, Tabs, timeAgo, useFeedback, useLoad } from '../ui';

const PAGE_SIZE = 30;
const PERIODS = [
  { value: 'today', label: 'اليوم' },
  { value: 'week', label: 'آخر 7 أيام' },
  { value: '', label: 'الكل' },
];
const DEALS = { rent: { label: 'للإيجار', slug: 'للإيجار' }, sale: { label: 'للبيع', slug: 'للبيع' } };
/** What the person asked for -> its name, and the address word the website uses for that kind of property. */
const KINDS = {
  apartment: { label: 'شقة', plural: 'شقق', slug: 'شقق' },
  studio: { label: 'استوديو', plural: 'استوديوهات', slug: 'استوديو' },
  house: { label: 'بيت', plural: 'بيوت', slug: 'بيوت' },
  villa: { label: 'فيلا', plural: 'فلل', slug: 'فلل' },
  room: { label: 'غرفة', plural: 'غرف', slug: 'غرف', only: 'rent' },
  land: { label: 'أرض', plural: 'أراضي', slug: 'أراضي', only: 'sale' },
  shop: { label: 'محل', plural: 'محلات', slug: 'محلات' },
  office: { label: 'مكتب', plural: 'مكاتب', slug: 'مكاتب' },
  farm: { label: 'مزرعة', plural: 'مزارع', slug: 'مزارع' },
  chalet: { label: 'شاليه', plural: 'شاليهات', slug: 'شاليهات', only: 'rent' },
  housing: { label: 'سكن', plural: 'شقق', slug: 'شقق' },
  roof: { label: 'روف', plural: 'شقق', slug: 'شقق' },
  floor: { label: 'طابق', plural: 'شقق', slug: 'شقق' },
  building: { label: 'عمارة', plural: 'عقارات' },
  warehouse: { label: 'مخزن', plural: 'عقارات' },
};

/** The same rule the website uses to turn a place name into an address part. */
const slug = (name) => name.trim().toLowerCase().replace(/[\s/\\()،,.'"`]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

/**
 * The page on the website that answers this request, and the words to describe it:
 * "شقق للإيجار في طبربور، عمان" -> /للإيجار/شقق/عمان/طبربور
 */
function matchingPage(post) {
  const kind = KINDS[post.kind];
  const deal = DEALS[post.deal] || (kind && kind.only ? DEALS[kind.only] : DEALS.rent);
  const parts = [deal.slug];
  let title = `${kind ? kind.plural : 'عقارات'} ${deal.label}`;
  const typed = kind && kind.slug && (!kind.only || DEALS[kind.only] === deal);
  if (typed) parts.push(kind.slug);
  const [city, region] = (post.location || '').split(',').map((part) => part.trim());
  // An area only has its own page under a property type
  if (city && typed) {
    parts.push(slug(city));
    if (region && region !== 'أخرى') {
      parts.push(slug(region));
      title += ` في ${region}، ${city}`;
    } else {
      title += ` في ${city}`;
    }
  } else if (city) {
    title += ` في ${city}`;
  }
  return { title, url: `${SITE_URL}/${parts.map(encodeURIComponent).join('/')}` };
}

const suggestedComment = (post) => {
  const page = matchingPage(post);
  return `مرحباً، تجد ${page.title} مع الصور والأسعار وأرقام المعلنين على موقع سوقكم:\n${decodeURI(page.url)}`;
};

function Request({ post, busy, onStatus }) {
  const { toast } = useFeedback();
  const [expanded, setExpanded] = useState(false);
  const page = matchingPage(post);
  const long = post.text.length > 260;
  const kind = KINDS[post.kind];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(suggestedComment(post));
      toast('نُسخ التعليق. الصقه في المنشور.');
    } catch (failure) {
      toast('تعذّر النسخ. انسخ النص يدوياً من المعاينة.', 'error');
    }
  };

  return (
    <article className="request">
      <div className="row" style={{ gap: 6 }}>
        {kind && <Badge tone="blue">{kind.label}</Badge>}
        {post.deal && <Badge tone={post.deal === 'rent' ? 'green' : 'violet'}>{DEALS[post.deal].label}</Badge>}
        {post.location ? (
          <Badge>
            <MapPin size={11} /> {post.location}
          </Badge>
        ) : (
          <Badge tone="amber">الموقع غير مذكور</Badge>
        )}
        <span className="toolbar-spacer" />
        <span className="cell-sub">
          {post.author ? `${post.author} · ` : ''}
          {post.group ? `${post.group} · ` : ''}
          {post.posted_at || timeAgo(post.created_at)}
        </span>
      </div>

      <p className="fix-text" style={{ fontSize: '0.92rem' }}>
        {expanded || !long ? post.text : `${post.text.slice(0, 260)}…`}
        {long && (
          <button type="button" className="btn-link" style={{ color: 'var(--brand-600)', marginInlineStart: 6 }} onClick={() => setExpanded(!expanded)}>
            {expanded ? 'أقل' : 'المزيد'}
          </button>
        )}
      </p>

      <div className="request-reply">
        <div className="cell-sub">تعليق مقترح</div>
        <div style={{ whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{suggestedComment(post)}</div>
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <a className="btn" href={post.post_url} target="_blank" rel="noreferrer">
          <ExternalLink size={16} /> <span>فتح المنشور</span>
        </a>
        <Button variant="secondary" icon={Copy} onClick={copy}>
          نسخ التعليق
        </Button>
        <a className="btn btn-ghost btn-sm" href={page.url} target="_blank" rel="noreferrer">
          معاينة الصفحة
        </a>
        <span className="toolbar-spacer" />
        {post.status === 'new' ? (
          <>
            <Button variant="success" icon={Check} disabled={busy} onClick={() => onStatus(post, 'commented')}>
              تم التعليق
            </Button>
            <Button variant="ghost" icon={EyeOff} disabled={busy} onClick={() => onStatus(post, 'ignored')}>
              تجاهل
            </Button>
          </>
        ) : (
          <Button variant="ghost" icon={RotateCcw} disabled={busy} onClick={() => onStatus(post, 'new')}>
            إعادة إلى الجديدة
          </Button>
        )}
      </div>
    </article>
  );
}

export default function Seekers() {
  const { toast } = useFeedback();
  const [status, setStatus] = useState('new');
  const [deal, setDeal] = useState('');
  const [period, setPeriod] = useState('today');
  const [copying, setCopying] = useState(false);
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(null);
  const filters = { status, deal: deal || undefined, q: submitted || undefined, period: period || undefined };

  const { data, loading, error, reload } = useLoad(
    () => api.get('/dashboard/seekers', { params: { ...filters, page, limit: PAGE_SIZE } }).then((response) => response.data),
    [status, deal, submitted, period, page],
  );

  const items = (data && data.items) || [];
  const counts = (data && data.counts) || {};
  const total = (data && data.total) || 0;

  const change = (setter) => (value) => {
    setPage(1);
    setter(value);
  };

  /** Copies the Facebook link of every request matching the filters, one per line. */
  const copyLinks = async () => {
    setCopying(true);
    try {
      const { data: body } = await api.get('/dashboard/seekers/links', { params: filters });
      if (body.links.length === 0) {
        toast('لا توجد روابط لنسخها.', 'error');
        return;
      }
      await navigator.clipboard.writeText(body.links.join('\n'));
      toast(`نُسخ ${body.links.length} رابط${body.links.length >= body.limit ? ` (الحد الأقصى ${body.limit})` : ''}`);
    } catch (failure) {
      toast(errorMessage(failure, 'تعذّر نسخ الروابط.'), 'error');
    } finally {
      setCopying(false);
    }
  };

  const setPostStatus = async (post, next) => {
    setBusy(post.id);
    try {
      await api.patch(`/dashboard/seekers/${post.id}`, { status: next });
      toast(next === 'commented' ? 'عُلِّم الطلب كمُجاب' : next === 'ignored' ? 'تم تجاهل الطلب' : 'أُعيد الطلب إلى الجديدة');
      reload();
    } catch (failure) {
      toast(errorMessage(failure, 'تعذّر تحديث الطلب.'), 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="stack">
      <PageHeader title="طلبات العقارات" subtitle="منشورات على فيسبوك لأشخاص يبحثون عن عقار. افتح المنشور وعلّق برابط الإعلانات المطابقة على الموقع.">
        <Button icon={ClipboardList} loading={copying} disabled={total === 0} onClick={copyLinks}>
          نسخ كل الروابط{total ? ` (${total})` : ''}
        </Button>
        <Button variant="secondary" icon={RefreshCw} loading={loading} onClick={reload}>
          تحديث
        </Button>
      </PageHeader>

      <Alert icon={Users}>
        يجمع النظام هذه المنشورات تلقائياً أثناء السحب من مجموعات فيسبوك. لكل طلب تعليق جاهز فيه رابط صفحة الإعلانات المناسبة: انسخه، افتح المنشور، والصقه. ثم اضغط «تم التعليق».
      </Alert>

      <Card flush>
        <Tabs
          value={status}
          onChange={change(setStatus)}
          tabs={[
            { value: 'new', label: 'جديدة', count: counts.new },
            { value: 'commented', label: 'تم التعليق', count: counts.commented },
            { value: 'ignored', label: 'متجاهَلة', count: counts.ignored },
          ]}
        />
        <div className="toolbar">
          <div className="chips">
            {PERIODS.map((item) => (
              <button key={item.value} type="button" className={`chip${period === item.value ? ' active' : ''}`} onClick={() => change(setPeriod)(item.value)}>
                {item.label}
              </button>
            ))}
          </div>
          <SearchInput value={query} onChange={setQuery} onSubmit={change(setSubmitted)} placeholder="ابحث في النص أو المنطقة، ثم Enter" />
          <Select value={deal} onChange={(event) => change(setDeal)(event.target.value)} aria-label="نوع الطلب">
            <option value="">إيجار وشراء</option>
            <option value="rent">للإيجار</option>
            <option value="sale">للشراء</option>
          </Select>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading && items.length === 0 ? (
          <SkeletonRows rows={6} columns={3} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={SearchCheck}
            title={period === 'today' ? 'لا توجد طلبات اليوم' : status === 'new' ? 'لا توجد طلبات جديدة' : 'لا توجد طلبات هنا'}
            description={period ? 'جرّب «آخر 7 أيام» أو «الكل».' : status === 'new' && !submitted && !deal ? 'ستظهر الطلبات هنا بعد التشغيل التالي للسحب من فيسبوك.' : undefined}
          />
        ) : (
          items.map((post) => <Request key={post.id} post={post} busy={busy === post.id} onStatus={setPostStatus} />)
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
      </Card>
    </div>
  );
}
