import React, { useState } from 'react';
import { RefreshCw, ScrollText, X } from 'lucide-react';
import { api } from '../lib/api';
import { adUrl } from '../lib/site';
import { Badge, Button, Card, DataTable, EmptyState, Input, Modal, PageHeader, SearchInput, Select, formatDate, formatNumber, timeAgo, useLoad } from '../ui';

const NO_FILTERS = { group_name: '', min_saved_ads: '', min_errors: '' };
const SORTS = [
  { value: 'created_at:desc', label: 'الأحدث أولاً' },
  { value: 'created_at:asc', label: 'الأقدم أولاً' },
  { value: 'saved_ads:desc', label: 'الأكثر حفظاً' },
  { value: 'saved_ads:asc', label: 'الأقل حفظاً' },
  { value: 'errors_count:desc', label: 'الأكثر أخطاء' },
  { value: 'group_name:asc', label: 'حسب اسم المجموعة' },
];

/** What happened to each post of a run: saved as an ad, skipped, or failed. */
function RunDetails({ log }) {
  const items = Array.isArray(log.json_data) ? log.json_data : [];
  const known = items.filter((item) => ['saved', 'skipped', 'error'].includes(item.status));
  if (items.length === 0) return <EmptyState title="لا توجد تفاصيل لهذا التشغيل" />;
  if (known.length === 0) return <div className="code">{JSON.stringify(items, null, 2)}</div>;
  return (
    <div className="stack-sm">
      {known.map((item, index) => (
        <div key={index} className="row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
          {item.status === 'saved' ? <Badge tone="green">حُفظ</Badge> : item.status === 'error' ? <Badge tone="red">خطأ</Badge> : <Badge tone="amber">تخطّي</Badge>}
          <div className="grow" style={{ overflowWrap: 'anywhere' }}>
            {item.status === 'saved' ? (
              item.ad_id ? (
                <a href={adUrl(item.ad_id)} target="_blank" rel="noreferrer">
                  إعلان #{item.ad_id}
                </a>
              ) : (
                'إعلان جديد'
              )
            ) : (
              item.reason || 'بدون سبب مسجّل'
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ScrapingLogs() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sort, setSort] = useState('created_at:desc');
  const [draft, setDraft] = useState(NO_FILTERS);
  const [filters, setFilters] = useState(NO_FILTERS);
  const [open, setOpen] = useState(null);

  const { data, loading, error, reload } = useLoad(() => {
    const [key, direction] = sort.split(':');
    const params = { page, limit: pageSize, sort_by: key, sort_desc: direction === 'desc', t: Date.now() };
    Object.keys(filters).forEach((name) => {
      if (filters[name] !== '') params[name] = filters[name];
    });
    return api.get('/scraping-logs', { params }).then((response) => (response.data.items ? response.data : { items: response.data, total: response.data.length }));
  }, [page, pageSize, sort, filters]);

  const logs = (data && data.items) || [];
  const total = (data && data.total) || 0;
  const hasFilters = Object.keys(filters).some((name) => filters[name] !== '');

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

  return (
    <>
      <PageHeader title="سجل السحب" subtitle="كل تشغيل للسحب الآلي من فيسبوك: كم إعلاناً حُفظ، كم تُخطّي، وكم خطأ حدث.">
        <Button variant="secondary" icon={RefreshCw} loading={loading} onClick={reload}>
          تحديث
        </Button>
      </PageHeader>

      <Card flush>
        <form className="toolbar" onSubmit={apply}>
          <SearchInput value={draft.group_name} onChange={(value) => setDraft({ ...draft, group_name: value })} placeholder="اسم المجموعة أو الصفحة..." />
          <Input type="number" min="0" value={draft.min_saved_ads} onChange={(event) => setDraft({ ...draft, min_saved_ads: event.target.value })} placeholder="أقل محفوظ" style={{ width: 120 }} aria-label="الحد الأدنى للمحفوظ" />
          <Input type="number" min="0" value={draft.min_errors} onChange={(event) => setDraft({ ...draft, min_errors: event.target.value })} placeholder="أقل أخطاء" style={{ width: 120 }} aria-label="الحد الأدنى للأخطاء" />
          <Button type="submit" variant="secondary">
            تطبيق
          </Button>
          {hasFilters && (
            <Button variant="ghost" size="sm" icon={X} onClick={clear}>
              مسح
            </Button>
          )}
          <div className="toolbar-spacer" />
          <Select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} aria-label="الترتيب">
            {SORTS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
          <Select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} aria-label="عدد الصفوف">
            {[20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size} صف
              </option>
            ))}
          </Select>
        </form>
        <DataTable
          rows={logs}
          loading={loading}
          error={error}
          onRetry={reload}
          onRowClick={setOpen}
          serverPaging={{ page, pageSize, total, onPage: setPage }}
          empty={<EmptyState icon={ScrollText} title={hasFilters ? 'لا توجد سجلات مطابقة' : 'لا توجد سجلات سحب بعد'} />}
          columns={[
            {
              key: 'group',
              label: 'المجموعة',
              primary: true,
              render: (log) => (
                <div>
                  <div className="cell-title">{log.group_name || 'غير معروف'}</div>
                  <div className="cell-sub num">تشغيل #{log.id}</div>
                </div>
              ),
            },
            { key: 'saved', label: 'حُفظ', render: (log) => <Badge tone={log.saved_ads > 0 ? 'green' : undefined}>{formatNumber(log.saved_ads)}</Badge> },
            { key: 'skipped', label: 'تُخطّي', render: (log) => <Badge tone={log.skipped_ads > 0 ? 'amber' : undefined}>{formatNumber(log.skipped_ads)}</Badge> },
            { key: 'errors', label: 'أخطاء', render: (log) => <Badge tone={log.errors_count > 0 ? 'red' : undefined}>{formatNumber(log.errors_count)}</Badge> },
            { key: 'created_at', label: 'الوقت', render: (log) => <span title={formatDate(log.created_at)}>{timeAgo(log.created_at)}</span> },
            {
              key: 'actions',
              label: '',
              actions: true,
              render: (log) => (
                <Button variant="secondary" size="sm" disabled={!log.json_data || log.json_data.length === 0} onClick={() => setOpen(log)}>
                  التفاصيل
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Modal open={!!open} size="wide" title={open ? `تشغيل #${open.id} · ${open.group_name || 'غير معروف'}` : ''} onClose={() => setOpen(null)}>
        {open && (
          <div className="stack">
            <div className="row">
              <Badge tone="green">حُفظ {formatNumber(open.saved_ads)}</Badge>
              <Badge tone="amber">تُخطّي {formatNumber(open.skipped_ads)}</Badge>
              <Badge tone="red">أخطاء {formatNumber(open.errors_count)}</Badge>
              <span className="muted">{formatDate(open.created_at)}</span>
            </div>
            <RunDetails log={open} />
          </div>
        )}
      </Modal>
    </>
  );
}
