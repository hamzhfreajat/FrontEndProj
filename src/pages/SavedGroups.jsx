import React, { useMemo, useState } from 'react';
import { ExternalLink, Link2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { api, errorMessage } from '../lib/api';
import { EMPTY, Badge, Button, Card, DataTable, EmptyState, Field, Input, Modal, PageHeader, SearchInput, Select, formatDate, useFeedback, useLoad } from '../ui';

const BLANK = { name: '', url: '', categoryId: '' };
const isFacebookUrl = (value) => /^https?:\/\/([a-z0-9-]+\.)?(facebook|fb)\.com\//i.test(value.trim());

export default function SavedGroups() {
  const { toast, confirm } = useFeedback();
  const { data, loading, error, reload } = useLoad(() =>
    Promise.all([api.get('/saved-groups'), api.get('/categories')]).then(([groups, categories]) => ({ groups: groups.data, categories: categories.data })),
  );
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const groups = (data && data.groups) || EMPTY;
  const categories = (data && data.categories) || EMPTY;
  const categoryName = useMemo(() => {
    const names = {};
    categories.forEach((category) => {
      names[category.id] = category.name;
    });
    return names;
  }, [categories]);

  const visible = useMemo(() => {
    const text = search.trim().toLowerCase();
    return text ? groups.filter((group) => `${group.name} ${group.url}`.toLowerCase().includes(text)) : groups;
  }, [groups, search]);

  const duplicate = form && groups.some((group) => group.url.trim().replace(/\/$/, '') === form.url.trim().replace(/\/$/, ''));
  const urlProblem = form && form.url && !isFacebookUrl(form.url) ? 'الرابط يجب أن يكون لمجموعة أو صفحة على فيسبوك.' : duplicate ? 'هذا الرابط مضاف من قبل.' : '';

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/saved-groups', { name: form.name.trim(), url: form.url.trim(), category_id: form.categoryId ? Number(form.categoryId) : null, is_active: true });
      toast('تمت إضافة المجموعة');
      setForm(null);
      reload();
    } catch (failure) {
      toast(errorMessage(failure, 'تعذّرت إضافة المجموعة.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (group) => {
    if (!(await confirm({ title: 'حذف المجموعة؟', message: `لن يسحب النظام إعلانات جديدة من «${group.name}». الإعلانات المسحوبة سابقاً تبقى.`, confirmLabel: 'حذف', danger: true }))) return;
    try {
      await api.delete(`/saved-groups/${group.id}`);
      toast('تم حذف المجموعة');
      reload();
    } catch (failure) {
      toast(errorMessage(failure, 'تعذّر حذف المجموعة.'), 'error');
    }
  };

  return (
    <>
      <PageHeader title="مجموعات فيسبوك" subtitle="المجموعات والصفحات التي يسحب النظام الإعلانات منها. أضف مصادر للمناطق التي ينقصها إعلانات.">
        <Button variant="secondary" icon={RefreshCw} loading={loading} onClick={reload}>
          تحديث
        </Button>
        <Button icon={Plus} onClick={() => setForm(BLANK)}>
          إضافة مجموعة
        </Button>
      </PageHeader>

      <Card flush>
        <div className="toolbar">
          <SearchInput value={search} onChange={setSearch} placeholder="ابحث بالاسم أو الرابط..." />
          <div className="toolbar-spacer" />
          <span className="muted">{groups.length} مصدر</span>
        </div>
        <DataTable
          rows={visible}
          loading={loading}
          error={error}
          onRetry={reload}
          empty={
            <EmptyState icon={Link2} title={search ? 'لا توجد نتائج' : 'لا توجد مجموعات بعد'} description={search ? undefined : 'أضف أول مجموعة ليبدأ السحب منها.'}>
              {!search && (
                <Button icon={Plus} onClick={() => setForm(BLANK)}>
                  إضافة مجموعة
                </Button>
              )}
            </EmptyState>
          }
          columns={[
            {
              key: 'name',
              label: 'المجموعة',
              primary: true,
              sort: (group) => group.name,
              render: (group) => (
                <div style={{ maxWidth: 420 }}>
                  <div className="cell-title">{group.name}</div>
                  <a className="cell-sub ltr truncate" href={group.url} target="_blank" rel="noreferrer" style={{ display: 'block' }}>
                    {group.url}
                  </a>
                </div>
              ),
            },
            { key: 'category', label: 'القسم', sort: (group) => categoryName[group.category_id] || '', render: (group) => (group.category_id ? <Badge tone="blue">{categoryName[group.category_id] || `#${group.category_id}`}</Badge> : <span className="muted">تلقائي</span>) },
            { key: 'active', label: 'الحالة', render: (group) => <Badge tone={group.is_active ? 'green' : undefined} dot>{group.is_active ? 'مفعّل' : 'معطّل'}</Badge> },
            { key: 'created_at', label: 'أُضيف', sort: (group) => group.created_at, render: (group) => formatDate(group.created_at, false) },
            {
              key: 'actions',
              label: '',
              actions: true,
              render: (group) => (
                <div className="actions">
                  <a className="btn btn-ghost btn-sm btn-icon" href={group.url} target="_blank" rel="noreferrer" title="فتح على فيسبوك">
                    <ExternalLink size={15} />
                  </a>
                  <Button variant="danger-soft" size="sm" icon={Trash2} onClick={() => remove(group)}>
                    حذف
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        open={!!form}
        title="إضافة مجموعة فيسبوك"
        onClose={() => setForm(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)}>
              إلغاء
            </Button>
            <Button type="submit" form="group-form" loading={saving} disabled={!form || !form.name.trim() || !form.url.trim() || !!urlProblem}>
              حفظ
            </Button>
          </>
        }
      >
        {form && (
          <form id="group-form" className="stack" onSubmit={save}>
            <Field label="الاسم" hint="اسم يساعدك على تمييز المصدر، مثل: شقق للإيجار في الزرقاء">
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} autoFocus required />
            </Field>
            <Field label="رابط فيسبوك" error={urlProblem}>
              <Input className="ltr" type="url" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} placeholder="https://www.facebook.com/groups/..." required />
            </Field>
            <Field label="القسم (اختياري)" hint="اتركه فارغاً ليحدد النظام القسم من نص كل إعلان.">
              <Select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
                <option value="">تلقائي</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>
          </form>
        )}
      </Modal>
    </>
  );
}
