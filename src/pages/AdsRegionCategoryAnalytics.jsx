import React, { useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { Download, Globe2, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { Button, Card, DataTable, EmptyState, ErrorState, PageHeader, SearchInput, SkeletonRows, downloadCsv, formatNumber, useLoad } from '../ui';

const FALLBACK_SERIES = ['للإيجار', 'للبيع', 'الأراضي'];
const COLORS = ['#1557f5', '#079455', '#dc6803', '#6938ef', '#d92d20', '#0e9384', '#c11574', '#475467'];
const CHART_ROWS = 20;

export default function AdsRegionCategoryAnalytics() {
  const [search, setSearch] = useState('');
  const { data, loading, error, reload } = useLoad(() =>
    api.get('/tracking/regional-category-stats').then((response) => {
      const body = response.data;
      // The endpoint used to answer with the rows alone
      return body && body.data ? { rows: body.data, names: (body.series_meta || []).map((meta) => meta.name) } : { rows: body || [], names: FALLBACK_SERIES };
    }),
  );

  const names = (data && data.names.length ? data.names : FALLBACK_SERIES) || FALLBACK_SERIES;
  const rows = useMemo(
    () =>
      ((data && data.rows) || [])
        .map((row) => ({ ...row, total: names.reduce((sum, name) => sum + (row[name] || 0), 0) }))
        .sort((a, b) => b.total - a.total),
    [data, names],
  );

  const visible = useMemo(() => {
    const text = search.trim();
    return text ? rows.filter((row) => (row.region || '').includes(text)) : rows;
  }, [rows, search]);

  const top = rows.slice(0, CHART_ROWS);
  const options = {
    chart: { type: 'bar', stacked: true, toolbar: { show: false }, fontFamily: 'inherit' },
    colors: COLORS,
    plotOptions: { bar: { horizontal: true, barHeight: '70%', borderRadius: 3 } },
    dataLabels: { enabled: false },
    xaxis: { categories: top.map((row) => row.region), labels: { style: { fontFamily: 'inherit' } } },
    yaxis: { labels: { style: { fontFamily: 'inherit', fontSize: '12px' }, maxWidth: 180 } },
    grid: { borderColor: '#e6e9ef', strokeDashArray: 4 },
    legend: { position: 'top', fontFamily: 'inherit' },
    tooltip: { y: { formatter: (value) => `${formatNumber(value)} إعلان` } },
  };
  const series = names.map((name) => ({ name, data: top.map((row) => row[name] || 0) }));

  const exportCsv = () =>
    downloadCsv('ads-by-region.csv', [{ label: 'المنطقة', value: (row) => row.region }, ...names.map((name) => ({ label: name, value: (row) => row[name] || 0 })), { label: 'المجموع', value: (row) => row.total }], visible);

  return (
    <div className="stack">
      <PageHeader title="الإعلانات حسب المنطقة" subtitle="توزيع الإعلانات على المناطق وأنواعها. يوضّح أين المخزون قوي وأين ينقص.">
        <Button variant="secondary" icon={Download} disabled={visible.length === 0} onClick={exportCsv}>
          تصدير
        </Button>
        <Button variant="secondary" icon={RefreshCw} loading={loading} onClick={reload}>
          تحديث
        </Button>
      </PageHeader>

      {error ? (
        <div className="card">
          <ErrorState message={error} onRetry={reload} />
        </div>
      ) : !data ? (
        <div className="card">
          <SkeletonRows rows={8} />
        </div>
      ) : rows.length === 0 ? (
        <div className="card">
          <EmptyState icon={Globe2} title="لا توجد بيانات بعد" />
        </div>
      ) : (
        <>
          <Card title={`أكثر ${top.length} منطقة إعلانات`} subtitle="مقسّمة حسب النوع">
            <ReactApexChart options={options} series={series} type="bar" height={Math.max(320, top.length * 30)} />
          </Card>

          <Card title={`كل المناطق (${rows.length})`} flush>
            <div className="toolbar">
              <SearchInput value={search} onChange={setSearch} placeholder="ابحث عن منطقة..." />
            </div>
            <DataTable
              rows={visible}
              rowKey="region"
              pageSize={25}
              initialSort={{ key: 'total', dir: 'desc' }}
              empty={<EmptyState title="لا توجد مناطق مطابقة" />}
              columns={[
                { key: 'region', label: 'المنطقة', primary: true, sort: (row) => row.region, render: (row) => <span className="cell-title">{row.region}</span> },
                ...names.map((name) => ({ key: name, label: name, sort: (row) => row[name] || 0, render: (row) => <span className="num">{formatNumber(row[name] || 0)}</span> })),
                { key: 'total', label: 'المجموع', sort: (row) => row.total, render: (row) => <span className="num strong">{formatNumber(row.total)}</span> },
              ]}
            />
          </Card>
        </>
      )}
    </div>
  );
}
