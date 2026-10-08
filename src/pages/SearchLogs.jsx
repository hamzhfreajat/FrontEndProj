import React, { useMemo, useState } from 'react';
import { Activity, Download, RefreshCw, Search, SearchX, TrendingUp } from 'lucide-react';
import { api } from '../lib/api';
import { EMPTY, Badge, Button, Card, DataTable, EmptyState, MeterList, PageHeader, SearchInput, Stat, downloadCsv, formatDate, formatNumber, timeAgo, useLoad } from '../ui';

const LIMIT = 500;

/** The searches made most often, optionally only those that found nothing. */
function topQueries(logs, onlyEmpty) {
  const counts = {};
  logs.forEach((log) => {
    if (onlyEmpty && log.results_count !== 0) return;
    const text = (log.query_text || '').trim();
    if (text) counts[text] = (counts[text] || 0) + 1;
  });
  return Object.keys(counts)
    .map((text) => ({ label: text, value: counts[text] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

export default function SearchLogs() {
  const [onlyEmpty, setOnlyEmpty] = useState(false);
  const [search, setSearch] = useState('');
  const { data, loading, error, reload } = useLoad(
    () => api.get('/admin/search_logs', { params: { limit: LIMIT, results_count: onlyEmpty ? 0 : undefined } }).then((response) => response.data),
    [onlyEmpty],
  );
  const logs = data || EMPTY;

  const stats = useMemo(() => {
    const empty = logs.filter((log) => log.results_count === 0).length;
    return { total: logs.length, empty, rate: logs.length ? Math.round(((logs.length - empty) / logs.length) * 100) : 0 };
  }, [logs]);

  const visible = useMemo(() => {
    const text = search.trim().toLowerCase();
    if (!text) return logs;
    return logs.filter((log) => (log.query_text || '').toLowerCase().includes(text) || (log.user && log.user.name && log.user.name.toLowerCase().includes(text)));
  }, [logs, search]);

  const exportCsv = () =>
    downloadCsv(
      'searches.csv',
      [
        { label: 'نص البحث', value: (log) => log.query_text },
        { label: 'النتائج', value: (log) => log.results_count },
        { label: 'القسم', value: (log) => log.category_name },
        { label: 'الفلاتر', value: (log) => log.extracted_tags },
        { label: 'المستخدم', value: (log) => (log.user ? log.user.name || log.user.email : 'زائر') },
        { label: 'الوقت', value: (log) => formatDate(log.created_at) },
      ],
      visible,
    );

  return (
    <div className="stack">
      <PageHeader title="عمليات البحث" subtitle={`آخر ${LIMIT} عملية بحث في التطبيق والموقع. البحث الذي لا يجد نتائج يدلّ على إعلانات ناقصة.`}>
        <Button variant="secondary" icon={Download} disabled={visible.length === 0} onClick={exportCsv}>
          تصدير
        </Button>
        <Button variant="secondary" icon={RefreshCw} loading={loading} onClick={reload}>
          تحديث
        </Button>
      </PageHeader>

      <div className="grid grid-3">
        <Stat icon={Activity} label="عمليات البحث المحمّلة" value={formatNumber(stats.total)} />
        <Stat icon={SearchX} tone="red" label="بدون أي نتيجة" value={formatNumber(stats.empty)} hint={onlyEmpty ? 'القائمة مقتصرة عليها الآن' : undefined} />
        <Stat icon={TrendingUp} tone="green" label="نسبة البحث الناجح" value={onlyEmpty ? '—' : `${stats.rate}%`} hint="بحث وجد إعلاناً واحداً على الأقل" />
      </div>

      <div className="grid grid-2">
        <Card title="الأكثر بحثاً">
          <MeterList items={topQueries(logs, false)} />
        </Card>
        <Card title="بحث بلا نتائج" subtitle="كلمات يبحث عنها الناس ولا يجدون إعلانات لها">
          <MeterList items={topQueries(logs, true)} />
        </Card>
      </div>

      <Card flush>
        <div className="toolbar">
          <SearchInput value={search} onChange={setSearch} placeholder="ابحث في السجل بكلمة أو باسم مستخدم..." />
          <label className="check">
            <input type="checkbox" checked={onlyEmpty} onChange={(event) => setOnlyEmpty(event.target.checked)} />
            بدون نتائج فقط
          </label>
        </div>
        <DataTable
          rows={visible}
          loading={loading}
          error={error}
          onRetry={reload}
          pageSize={50}
          initialSort={{ key: 'created_at', dir: 'desc' }}
          empty={<EmptyState icon={Search} title="لا توجد عمليات بحث مطابقة" />}
          columns={[
            { key: 'query', label: 'نص البحث', primary: true, sort: (log) => log.query_text, render: (log) => <span className="cell-title" style={{ overflowWrap: 'anywhere' }}>{log.query_text}</span> },
            {
              key: 'results',
              label: 'النتائج',
              sort: (log) => log.results_count,
              render: (log) => <Badge tone={log.results_count === 0 ? 'red' : 'green'}>{log.results_count === 0 ? 'لا نتائج' : `${formatNumber(log.results_count)} إعلان`}</Badge>,
            },
            { key: 'category', label: 'القسم', render: (log) => (log.category_name ? <Badge tone="blue">{log.category_name}</Badge> : <span className="muted">—</span>) },
            {
              key: 'tags',
              label: 'الفلاتر المستخرجة',
              render: (log) =>
                log.extracted_tags ? (
                  <div className="chips" style={{ maxWidth: 280 }}>
                    {log.extracted_tags.split(',').map((tag, index) => (
                      <Badge key={index}>{tag.trim()}</Badge>
                    ))}
                  </div>
                ) : (
                  <span className="muted">—</span>
                ),
            },
            {
              key: 'user',
              label: 'المستخدم',
              render: (log) =>
                log.user ? (
                  <div>
                    <div>{log.user.name || 'مستخدم'}</div>
                    {log.user.email && <div className="cell-sub ltr">{log.user.email}</div>}
                  </div>
                ) : (
                  <span className="muted">زائر</span>
                ),
            },
            { key: 'created_at', label: 'الوقت', sort: (log) => log.created_at, render: (log) => <span title={formatDate(log.created_at)}>{timeAgo(log.created_at)}</span> },
          ]}
        />
      </Card>
    </div>
  );
}
