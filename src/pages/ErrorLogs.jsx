import React, { useMemo, useState } from 'react';
import { Bug, Download, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { EMPTY, Badge, Button, Card, DataTable, EmptyState, MeterList, Modal, PageHeader, SearchInput, Select, Stat, downloadCsv, formatDate, formatNumber, timeAgo, useLoad } from '../ui';

const DAY = 24 * 60 * 60 * 1000;

export default function ErrorLogs() {
  const { data, loading, error, reload } = useLoad(() => api.get('/telemetry/errors').then((response) => response.data));
  const [search, setSearch] = useState('');
  const [screen, setScreen] = useState('');
  const [open, setOpen] = useState(null);
  const errors = data || EMPTY;

  const screens = useMemo(() => {
    const counts = {};
    errors.forEach((item) => {
      const name = item.screen_name || 'غير معروفة';
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.keys(counts)
      .map((name) => ({ label: name, value: counts[name] }))
      .sort((a, b) => b.value - a.value);
  }, [errors]);

  const today = useMemo(() => errors.filter((item) => Date.now() - new Date(item.timestamp).getTime() < DAY).length, [errors]);
  const affected = useMemo(() => new Set(errors.map((item) => item.user_id).filter(Boolean)).size, [errors]);

  const visible = useMemo(() => {
    const text = search.trim().toLowerCase();
    return errors.filter((item) => {
      if (screen && (item.screen_name || 'غير معروفة') !== screen) return false;
      if (!text) return true;
      return [item.error_message, item.user_name, item.user_phone, item.screen_name].some((value) => value && String(value).toLowerCase().includes(text));
    });
  }, [errors, search, screen]);

  const exportCsv = () =>
    downloadCsv(
      'app-errors.csv',
      [
        { label: 'الوقت', value: (row) => formatDate(row.timestamp) },
        { label: 'المستخدم', value: (row) => row.user_name },
        { label: 'الهاتف', value: (row) => row.user_phone },
        { label: 'الشاشة', value: (row) => row.screen_name },
        { label: 'الخطأ', value: (row) => row.error_message },
      ],
      visible,
    );

  return (
    <div className="stack">
      <PageHeader title="سجل الأخطاء" subtitle="الأخطاء التي حدثت داخل تطبيق الهاتف عند المستخدمين.">
        <Button variant="secondary" icon={Download} disabled={visible.length === 0} onClick={exportCsv}>
          تصدير
        </Button>
        <Button variant="secondary" icon={RefreshCw} loading={loading} onClick={reload}>
          تحديث
        </Button>
      </PageHeader>

      <div className="grid grid-3">
        <Stat icon={Bug} tone="red" label="أخطاء مسجّلة" value={formatNumber(errors.length)} hint="في القائمة المحمّلة" />
        <Stat icon={Bug} tone="amber" label="خلال آخر 24 ساعة" value={formatNumber(today)} />
        <Stat icon={Bug} tone="slate" label="مستخدمون متأثرون" value={formatNumber(affected)} />
      </div>

      <div className="grid grid-main">
        <Card flush>
          <div className="toolbar">
            <SearchInput value={search} onChange={setSearch} placeholder="ابحث في نص الخطأ أو اسم المستخدم..." />
            <Select value={screen} onChange={(event) => setScreen(event.target.value)} aria-label="الشاشة">
              <option value="">كل الشاشات</option>
              {screens.map((item) => (
                <option key={item.label} value={item.label}>
                  {item.label} ({item.value})
                </option>
              ))}
            </Select>
          </div>
          <DataTable
            rows={visible}
            loading={loading}
            error={error}
            onRetry={reload}
            onRowClick={setOpen}
            empty={<EmptyState icon={Bug} title="لا توجد أخطاء مسجّلة" description={search || screen ? 'لا نتائج لهذه التصفية.' : 'هذا خبر جيد.'} />}
            columns={[
              {
                key: 'error',
                label: 'الخطأ',
                primary: true,
                render: (item) => (
                  <div style={{ maxWidth: 460 }}>
                    <div className="cell-title ltr" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', overflowWrap: 'anywhere' }}>
                      {item.error_message || 'بدون رسالة'}
                    </div>
                  </div>
                ),
              },
              { key: 'screen', label: 'الشاشة', sort: (item) => item.screen_name, render: (item) => <Badge>{item.screen_name || 'غير معروفة'}</Badge> },
              {
                key: 'user',
                label: 'المستخدم',
                render: (item) => (
                  <div>
                    <div>{item.user_name || 'زائر'}</div>
                    {(item.user_phone || item.user_id) && <div className="cell-sub ltr">{item.user_phone || item.user_id}</div>}
                  </div>
                ),
              },
              { key: 'timestamp', label: 'الوقت', sort: (item) => item.timestamp, render: (item) => <span title={formatDate(item.timestamp)}>{timeAgo(item.timestamp)}</span> },
            ]}
          />
        </Card>

        <Card title="الشاشات الأكثر أخطاء">
          <MeterList items={screens.slice(0, 8)} />
        </Card>
      </div>

      <Modal open={!!open} size="wide" title="تفاصيل الخطأ" onClose={() => setOpen(null)}>
        {open && (
          <div className="stack">
            <dl className="kv">
              <dt>الوقت</dt>
              <dd>{formatDate(open.timestamp)}</dd>
              <dt>الشاشة</dt>
              <dd>{open.screen_name || 'غير معروفة'}</dd>
              <dt>المستخدم</dt>
              <dd>
                {open.user_name || 'زائر'} {open.user_phone ? <span className="ltr">({open.user_phone})</span> : null}
              </dd>
            </dl>
            <div>
              <div className="field-label">رسالة الخطأ</div>
              <div className="code">{open.error_message || '—'}</div>
            </div>
            <div>
              <div className="field-label">تتبّع الخطأ (Stack trace)</div>
              <div className="code">{open.stack_trace || 'غير متوفر'}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
