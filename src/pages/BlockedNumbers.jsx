import React, { useMemo, useState } from 'react';
import { PhoneOff, Plus, RefreshCw, ShieldAlert, Trash2 } from 'lucide-react';
import { api, errorMessage } from '../lib/api';
import { Alert, Button, Card, DataTable, EmptyState, Field, Input, PageHeader, SearchInput, formatDate, timeAgo, useFeedback, useLoad } from '../ui';

export default function BlockedNumbers() {
  const { toast, confirm } = useFeedback();
  const { data, loading, error, reload } = useLoad(() => api.get('/blacklist/phones').then((response) => response.data));
  const [number, setNumber] = useState('');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);

  const cleaned = number.replace(/[^\d+]/g, '');
  const rows = useMemo(() => (data || []).filter((row) => !search.trim() || String(row.phone_number).includes(search.trim())), [data, search]);

  const block = async (event) => {
    event.preventDefault();
    if (!cleaned) return;
    const agreed = await confirm({
      title: 'حظر هذا الرقم؟',
      message: `سيُحذف كل إعلان يحتوي على الرقم ${cleaned}، ولن يسحب النظام أي إعلان جديد منه. حذف الإعلانات لا يمكن التراجع عنه.`,
      confirmLabel: 'حظر وحذف الإعلانات',
      danger: true,
    });
    if (!agreed) return;
    setBusy(true);
    try {
      await api.post('/blacklist/phones', { phone_number: cleaned });
      setNumber('');
      toast('تم حظر الرقم');
      reload();
    } catch (failure) {
      toast(errorMessage(failure, 'تعذّر حظر الرقم.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const unblock = async (row) => {
    const agreed = await confirm({ title: 'إلغاء حظر الرقم؟', message: `سيعود النظام إلى سحب الإعلانات من الرقم ${row.phone_number}. الإعلانات المحذوفة سابقاً لا تعود.`, confirmLabel: 'إلغاء الحظر' });
    if (!agreed) return;
    setBusy(true);
    try {
      await api.delete(`/blacklist/phones/${encodeURIComponent(row.phone_number)}`);
      toast('تم إلغاء الحظر');
      reload();
    } catch (failure) {
      toast(errorMessage(failure, 'تعذّر إلغاء الحظر.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack">
      <PageHeader title="الأرقام المحظورة" subtitle="أرقام لا يُقبل منها أي إعلان، سواء من السحب الآلي أو من الإعلانات الموجودة.">
        <Button variant="secondary" icon={RefreshCw} loading={loading} onClick={reload}>
          تحديث
        </Button>
      </PageHeader>

      <Card title="حظر رقم جديد">
        <form className="stack" onSubmit={block}>
          <Alert tone="amber" icon={ShieldAlert}>
            حظر الرقم يحذف فوراً كل الإعلانات الحالية التي تحتويه، ويمنع سحب أي إعلان جديد منه.
          </Alert>
          <div className="row" style={{ alignItems: 'flex-end' }}>
            <Field label="رقم الهاتف" className="grow">
              <Input className="ltr" inputMode="tel" value={number} onChange={(event) => setNumber(event.target.value)} placeholder="0791234567" disabled={busy} />
            </Field>
            <Button type="submit" variant="danger" icon={Plus} loading={busy} disabled={!cleaned}>
              حظر الرقم
            </Button>
          </div>
        </form>
      </Card>

      <Card title={`القائمة (${(data || []).length})`} flush>
        <div className="toolbar">
          <SearchInput value={search} onChange={setSearch} placeholder="ابحث عن رقم..." />
        </div>
        <DataTable
          rowKey="phone_number"
          rows={rows}
          loading={loading}
          error={error}
          onRetry={reload}
          empty={<EmptyState icon={PhoneOff} title="لا توجد أرقام محظورة" />}
          columns={[
            { key: 'phone_number', label: 'رقم الهاتف', primary: true, render: (row) => <span className="cell-title ltr">{row.phone_number}</span> },
            { key: 'created_at', label: 'تاريخ الحظر', sort: (row) => row.created_at, render: (row) => <span title={formatDate(row.created_at)}>{timeAgo(row.created_at)}</span> },
            {
              key: 'actions',
              label: '',
              actions: true,
              render: (row) => (
                <Button variant="secondary" size="sm" icon={Trash2} disabled={busy} onClick={() => unblock(row)}>
                  إلغاء الحظر
                </Button>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
