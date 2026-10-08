import React, { useMemo, useState } from 'react';
import { Check, Download, ExternalLink, Flag, RefreshCw, Trash2, X } from 'lucide-react';
import { api, errorMessage } from '../lib/api';
import { adUrl } from '../lib/site';
import { Badge, Button, Card, DataTable, EmptyState, PageHeader, SearchInput, Tabs, downloadCsv, formatDate, timeAgo, useFeedback, useLoad } from '../ui';

const STATUS = {
  pending: { label: 'بانتظار المراجعة', tone: 'amber' },
  reviewed: { label: 'تمت المراجعة', tone: 'green' },
  dismissed: { label: 'مرفوض', tone: undefined },
};

export default function Reports() {
  const { toast, confirm } = useFeedback();
  const { data, loading, error, reload } = useLoad(() => api.get('/dashboard/reports').then((response) => response.data));
  const [tab, setTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(null);
  const [changes, setChanges] = useState({});

  // Status changes are shown at once, without waiting for the list to load again
  const reports = useMemo(
    () => (data || []).filter((report) => changes[report.id] !== 'deleted').map((report) => (changes[report.id] ? { ...report, status: changes[report.id] } : report)),
    [data, changes],
  );

  const counts = useMemo(() => {
    const result = { all: reports.length, pending: 0, reviewed: 0, dismissed: 0 };
    reports.forEach((report) => {
      if (result[report.status] !== undefined) result[report.status] += 1;
    });
    return result;
  }, [reports]);

  const visible = useMemo(() => {
    const text = search.trim().toLowerCase();
    return reports.filter((report) => {
      if (tab !== 'all' && report.status !== tab) return false;
      if (!text) return true;
      return [report.ad_title, report.reason, report.comments, report.reporter_name, report.reporter_phone, String(report.ad_id)].some(
        (value) => value && String(value).toLowerCase().includes(text),
      );
    });
  }, [reports, tab, search]);

  const setStatus = async (report, status) => {
    setBusy(report.id);
    try {
      await api.patch(`/dashboard/reports/${report.id}`, { status });
      setChanges((current) => ({ ...current, [report.id]: status }));
      toast(status === 'reviewed' ? 'تم تعليم البلاغ كمُراجَع' : status === 'dismissed' ? 'تم رفض البلاغ' : 'أُعيد البلاغ إلى قائمة الانتظار');
    } catch (failure) {
      toast(errorMessage(failure, 'تعذّر تحديث البلاغ.'), 'error');
    } finally {
      setBusy(null);
    }
  };

  const deleteAd = async (report) => {
    const agreed = await confirm({
      title: 'حذف الإعلان المبلَّغ عنه؟',
      message: `سيُحذف الإعلان #${report.ad_id} «${report.ad_title || 'بدون عنوان'}» نهائياً مع كل البلاغات المرتبطة به. لا يمكن التراجع.`,
      confirmLabel: 'حذف الإعلان',
      danger: true,
    });
    if (!agreed) return;
    setBusy(report.id);
    try {
      await api.delete(`/ads/${report.ad_id}`);
      toast('تم حذف الإعلان');
      reload();
    } catch (failure) {
      toast(errorMessage(failure, 'تعذّر حذف الإعلان.'), 'error');
    } finally {
      setBusy(null);
    }
  };

  const exportCsv = () =>
    downloadCsv(
      'reports.csv',
      [
        { label: 'رقم البلاغ', value: (row) => row.id },
        { label: 'رقم الإعلان', value: (row) => row.ad_id },
        { label: 'عنوان الإعلان', value: (row) => row.ad_title },
        { label: 'السبب', value: (row) => row.reason },
        { label: 'ملاحظات', value: (row) => row.comments },
        { label: 'المبلِّغ', value: (row) => row.reporter_name },
        { label: 'الهاتف', value: (row) => row.reporter_phone },
        { label: 'الحالة', value: (row) => (STATUS[row.status] || {}).label || row.status },
        { label: 'التاريخ', value: (row) => formatDate(row.created_at) },
      ],
      visible,
    );

  const columns = [
    {
      key: 'ad',
      label: 'الإعلان',
      primary: true,
      render: (report) => (
        <div>
          <a className="cell-title" href={adUrl(report.ad_id)} target="_blank" rel="noreferrer">
            {report.ad_title || 'إعلان محذوف'}
          </a>
          <div className="cell-sub num">
            إعلان #{report.ad_id} · بلاغ #{report.id}
          </div>
        </div>
      ),
    },
    {
      key: 'reason',
      label: 'السبب',
      sort: (report) => report.reason,
      render: (report) => (
        <div>
          <Badge tone="amber">{report.reason}</Badge>
          {report.comments && <div className="cell-sub" style={{ marginTop: 4, maxWidth: 320, whiteSpace: 'normal' }}>{report.comments}</div>}
        </div>
      ),
    },
    {
      key: 'reporter',
      label: 'المبلِّغ',
      render: (report) => (
        <div>
          <div>{report.reporter_name || 'زائر'}</div>
          {report.reporter_phone && <div className="cell-sub ltr">{report.reporter_phone}</div>}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'الحالة',
      sort: (report) => report.status,
      render: (report) => {
        const status = STATUS[report.status] || { label: report.status };
        return (
          <Badge tone={status.tone} dot>
            {status.label}
          </Badge>
        );
      },
    },
    {
      key: 'created_at',
      label: 'التاريخ',
      sort: (report) => report.created_at,
      render: (report) => <span title={formatDate(report.created_at)}>{timeAgo(report.created_at)}</span>,
    },
    {
      key: 'actions',
      label: '',
      actions: true,
      render: (report) => (
        <div className="actions">
          <a className="btn btn-ghost btn-sm btn-icon" href={adUrl(report.ad_id)} target="_blank" rel="noreferrer" title="فتح الإعلان">
            <ExternalLink size={15} />
          </a>
          {report.status !== 'reviewed' && (
            <Button variant="secondary" size="sm" icon={Check} disabled={busy === report.id} onClick={() => setStatus(report, 'reviewed')}>
              تمت المراجعة
            </Button>
          )}
          {report.status === 'pending' && (
            <Button variant="ghost" size="sm" icon={X} disabled={busy === report.id} onClick={() => setStatus(report, 'dismissed')}>
              رفض
            </Button>
          )}
          <Button variant="danger-soft" size="sm" icon={Trash2} disabled={busy === report.id} onClick={() => deleteAd(report)}>
            حذف الإعلان
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="البلاغات" subtitle="بلاغات المستخدمين عن الإعلانات. راجع الإعلان ثم علّم البلاغ أو احذف الإعلان المخالف.">
        <Button variant="secondary" icon={Download} disabled={visible.length === 0} onClick={exportCsv}>
          تصدير
        </Button>
        <Button variant="secondary" icon={RefreshCw} loading={loading} onClick={reload}>
          تحديث
        </Button>
      </PageHeader>

      <Card flush>
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'pending', label: 'بانتظار المراجعة', count: counts.pending },
            { value: 'reviewed', label: 'تمت المراجعة', count: counts.reviewed },
            { value: 'dismissed', label: 'مرفوضة', count: counts.dismissed },
            { value: 'all', label: 'الكل', count: counts.all },
          ]}
        />
        <div className="toolbar">
          <SearchInput value={search} onChange={setSearch} placeholder="ابحث في العنوان، السبب، أو رقم الإعلان..." />
        </div>
        <DataTable
          columns={columns}
          rows={visible}
          loading={loading}
          error={error}
          onRetry={reload}
          empty={<EmptyState icon={Flag} title={tab === 'pending' ? 'لا توجد بلاغات بانتظار المراجعة' : 'لا توجد بلاغات'} description={search ? 'جرّب كلمة بحث أخرى.' : undefined} />}
        />
      </Card>
    </>
  );
}
