import React, { useEffect, useState } from 'react';
import { Save, Smartphone } from 'lucide-react';
import { api, errorMessage } from '../lib/api';
import { Alert, Button, Card, ErrorState, Field, Input, PageHeader, SkeletonRows, useFeedback, useLoad } from '../ui';

const EMPTY = { latest_version: '', min_required_version: '', store_url_android: '', store_url_ios: '' };
const VERSION = /^\d+(\.\d+){1,3}$/;

/** -1, 0 or 1 for two dotted versions ("1.0.9" < "1.0.10"). */
function compareVersions(a, b) {
  const left = a.split('.').map(Number);
  const right = b.split('.').map(Number);
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const difference = (left[index] || 0) - (right[index] || 0);
    if (difference !== 0) return difference > 0 ? 1 : -1;
  }
  return 0;
}

export default function AppSettings() {
  const { toast } = useFeedback();
  const { data, loading, error, reload } = useLoad(() => api.get('/config/version').then((response) => response.data));
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setForm({ ...EMPTY, ...Object.keys(EMPTY).reduce((all, key) => ({ ...all, [key]: data[key] || '' }), {}) });
  }, [data]);

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  const problems = {
    latest_version: form.latest_version && !VERSION.test(form.latest_version) ? 'اكتب الرقم بصيغة 1.0.12' : '',
    min_required_version: form.min_required_version && !VERSION.test(form.min_required_version) ? 'اكتب الرقم بصيغة 1.0.10' : '',
  };
  const minAboveLatest =
    VERSION.test(form.latest_version) && VERSION.test(form.min_required_version) && compareVersions(form.min_required_version, form.latest_version) > 0;
  const changed = data && Object.keys(EMPTY).some((key) => (data[key] || '') !== form[key]);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.put('/config/version', form);
      toast('تم حفظ الإعدادات');
      reload();
    } catch (failure) {
      toast(errorMessage(failure, 'تعذّر حفظ الإعدادات.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="إعدادات التطبيق" subtitle="أرقام الإصدارات التي تتحكم برسائل التحديث داخل تطبيق الهاتف." />

      {error ? (
        <div className="card">
          <ErrorState message={error} onRetry={reload} />
        </div>
      ) : loading && !data ? (
        <div className="card">
          <SkeletonRows rows={5} columns={2} />
        </div>
      ) : (
        <form className="stack" onSubmit={save} style={{ maxWidth: 820 }}>
          <Card title="إصدارات التطبيق" subtitle="تُطبَّق على أندرويد و iOS معاً">
            <div className="stack">
              {minAboveLatest && (
                <Alert tone="red">الحد الأدنى المطلوب أعلى من أحدث إصدار. بهذا الإعداد سيُمنع كل المستخدمين من دخول التطبيق.</Alert>
              )}
              <div className="form-grid">
                <Field label="أحدث إصدار متاح" hint="من يملك إصداراً أقدم يرى رسالة تحديث اختياري." error={problems.latest_version}>
                  <Input className="ltr" value={form.latest_version} onChange={set('latest_version')} placeholder="1.0.12" required />
                </Field>
                <Field label="الحد الأدنى المطلوب" hint="من يملك إصداراً أقدم يُجبَر على التحديث قبل الدخول." error={problems.min_required_version}>
                  <Input className="ltr" value={form.min_required_version} onChange={set('min_required_version')} placeholder="1.0.10" required />
                </Field>
              </div>
            </div>
          </Card>

          <Card title="روابط المتاجر" subtitle="يُفتح الرابط عند الضغط على زر التحديث">
            <div className="stack">
              <Field label="Google Play (أندرويد)">
                <Input className="ltr" type="url" value={form.store_url_android} onChange={set('store_url_android')} placeholder="https://play.google.com/store/apps/details?id=..." required />
              </Field>
              <Field label="App Store (iOS)">
                <Input className="ltr" type="url" value={form.store_url_ios} onChange={set('store_url_ios')} placeholder="https://apps.apple.com/app/..." required />
              </Field>
            </div>
          </Card>

          <div className="row">
            <Button type="submit" size="lg" icon={Save} loading={saving} disabled={!changed || !!problems.latest_version || !!problems.min_required_version}>
              حفظ الإعدادات
            </Button>
            {!changed && (
              <span className="muted row" style={{ gap: 6 }}>
                <Smartphone size={15} /> لا توجد تغييرات غير محفوظة
              </span>
            )}
          </div>
        </form>
      )}
    </>
  );
}
