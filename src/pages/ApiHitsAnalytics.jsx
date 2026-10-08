import React, { useMemo, useState } from 'react';
import { Gauge, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { EMPTY, Badge, Button, Card, DataTable, EmptyState, Modal, PageHeader, SearchInput, Select, Stat, formatDate, formatNumber, useLoad } from '../ui';

const PERIODS = [
  { value: '', label: 'كل الفترات' },
  { value: 'today', label: 'اليوم' },
  { value: 'yesterday', label: 'أمس' },
  { value: 'week', label: 'آخر 7 أيام' },
  { value: 'month', label: 'آخر 30 يوماً' },
];

const errorTone = (rate) => (rate >= 5 ? 'red' : rate > 0 ? 'amber' : 'green');
const speedTone = (ms) => (ms >= 1500 ? 'red' : ms >= 600 ? 'amber' : 'green');
const statusTone = (code) => (code >= 500 ? 'red' : code >= 400 ? 'amber' : 'green');

function EndpointRequests({ endpoint, period }) {
  const { data, loading, error, reload } = useLoad(
    () => api.get(`/tracking/api_hits/${encodeURIComponent(endpoint)}`, { params: { limit: 100, date_filter: period || undefined } }).then((response) => response.data),
    [endpoint, period],
  );
  return (
    <DataTable
      rows={data}
      rowKey={(row) => `${row.ip_address}-${row.created_at}`}
      loading={loading}
      error={error}
      onRetry={reload}
      pageSize={20}
      empty={<EmptyState title="لا توجد طلبات مسجّلة" />}
      columns={[
        { key: 'ip', label: 'عنوان IP', primary: true, render: (row) => <span className="cell-title ltr">{row.ip_address}</span> },
        { key: 'time', label: 'الوقت', sort: (row) => row.created_at, render: (row) => formatDate(row.created_at) },
        { key: 'ms', label: 'زمن الاستجابة', sort: (row) => row.response_time_ms, render: (row) => <span className="num ltr">{formatNumber(row.response_time_ms)} ms</span> },
        { key: 'status', label: 'الحالة', sort: (row) => row.status_code, render: (row) => <Badge tone={statusTone(row.status_code)}>{row.status_code}</Badge> },
        { key: 'agent', label: 'المتصفح / التطبيق', render: (row) => <div className="cell-sub ltr truncate" style={{ maxWidth: 260 }} title={row.user_agent}>{row.user_agent || 'غير معروف'}</div> },
      ]}
    />
  );
}

export default function ApiHitsAnalytics() {
  const [period, setPeriod] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(null);
  const { data, loading, error, reload } = useLoad(() => api.get('/tracking/api_hits', { params: { date_filter: period || undefined } }).then((response) => response.data), [period]);
  const rows = data || EMPTY;

  const totals = useMemo(() => {
    const hits = rows.reduce((sum, row) => sum + (row.total_hits || 0), 0);
    const weighted = rows.reduce((sum, row) => sum + (row.average_response_time_ms || 0) * (row.total_hits || 0), 0);
    const failing = rows.filter((row) => row.error_rate_percent > 0).length;
    return { hits, average: hits ? Math.round(weighted / hits) : 0, failing };
  }, [rows]);

  const visible = useMemo(() => {
    const text = search.trim().toLowerCase();
    return text ? rows.filter((row) => (row.endpoint_name || '').toLowerCase().includes(text)) : rows;
  }, [rows, search]);

  return (
    <div className="stack">
      <PageHeader title="استهلاك الواجهة البرمجية" subtitle="عدد الطلبات على كل خدمة، سرعتها ونسبة الأخطاء فيها.">
        <Select value={period} onChange={(event) => setPeriod(event.target.value)} aria-label="الفترة" style={{ width: 'auto' }}>
          {PERIODS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
        <Button variant="secondary" icon={RefreshCw} loading={loading} onClick={reload}>
          تحديث
        </Button>
      </PageHeader>

      <div className="grid grid-3">
        <Stat icon={Gauge} label="إجمالي الطلبات" value={formatNumber(totals.hits)} hint={`${rows.length} خدمة`} />
        <Stat icon={Gauge} tone={speedTone(totals.average)} label="متوسط زمن الاستجابة" value={<span className="ltr">{formatNumber(totals.average)} ms</span>} />
        <Stat icon={Gauge} tone={totals.failing ? 'red' : 'green'} label="خدمات فيها أخطاء" value={formatNumber(totals.failing)} />
      </div>

      <Card flush>
        <div className="toolbar">
          <SearchInput value={search} onChange={setSearch} placeholder="ابحث باسم الخدمة..." />
        </div>
        <DataTable
          rows={visible}
          rowKey="endpoint_name"
          loading={loading}
          error={error}
          onRetry={reload}
          onRowClick={(row) => setOpen(row.endpoint_name)}
          initialSort={{ key: 'hits', dir: 'desc' }}
          empty={<EmptyState icon={Gauge} title="لا توجد بيانات لهذه الفترة" />}
          columns={[
            { key: 'endpoint', label: 'الخدمة', primary: true, sort: (row) => row.endpoint_name, render: (row) => <span className="cell-title ltr" style={{ overflowWrap: 'anywhere' }}>{row.endpoint_name}</span> },
            { key: 'hits', label: 'الطلبات', sort: (row) => row.total_hits, render: (row) => <span className="num strong">{formatNumber(row.total_hits)}</span> },
            { key: 'ips', label: 'عناوين IP مختلفة', sort: (row) => row.unique_ips, render: (row) => <span className="num">{formatNumber(row.unique_ips)}</span> },
            { key: 'ms', label: 'متوسط الاستجابة', sort: (row) => row.average_response_time_ms, render: (row) => <Badge tone={speedTone(row.average_response_time_ms)}><span className="ltr">{formatNumber(row.average_response_time_ms)} ms</span></Badge> },
            { key: 'errors', label: 'نسبة الأخطاء', sort: (row) => row.error_rate_percent, render: (row) => <Badge tone={errorTone(row.error_rate_percent)}>{row.error_rate_percent}%</Badge> },
          ]}
        />
      </Card>

      <Modal open={!!open} size="wide" title={open ? `آخر الطلبات: ${open}` : ''} onClose={() => setOpen(null)}>
        {open && <EndpointRequests endpoint={open} period={period} />}
      </Modal>
    </div>
  );
}
