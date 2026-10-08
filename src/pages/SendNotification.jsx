import React, { useState } from 'react';
import { BellRing, Send, Smartphone, User, Users } from 'lucide-react';
import { api, errorMessage } from '../lib/api';
import { Alert, Button, Card, Field, Input, PageHeader, Select, Textarea, useFeedback } from '../ui';

const TITLE_MAX = 100;
const BODY_MAX = 500;
const TYPES = [
  { value: 'admin_alert', label: 'تنبيه إداري' },
  { value: 'system', label: 'رسالة نظام' },
  { value: 'promotion', label: 'عرض / ترويج' },
];

export default function SendNotification() {
  const { toast, confirm } = useFeedback();
  const [target, setTarget] = useState('all');
  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('admin_alert');
  const [sending, setSending] = useState(false);
  const [last, setLast] = useState(null);

  const ready = title.trim() && body.trim() && (target === 'all' || userId.trim());

  const send = async (event) => {
    event.preventDefault();
    if (!ready) return;
    if (target === 'all') {
      const agreed = await confirm({
        title: 'إرسال إلى جميع المستخدمين؟',
        message: 'سيصل هذا الإشعار إلى هاتف كل مستخدم للتطبيق، ولا يمكن سحبه بعد الإرسال.',
        confirmLabel: 'إرسال للجميع',
      });
      if (!agreed) return;
    }
    setSending(true);
    try {
      const { data } = await api.post('/notifications/admin/send', { target_user_id: target === 'all' ? 'all' : userId.trim(), title: title.trim(), body: body.trim(), type });
      toast((data && data.message) || 'تم إرسال الإشعار');
      setLast({ title: title.trim(), target: target === 'all' ? 'جميع المستخدمين' : `المستخدم #${userId.trim()}`, at: new Date() });
      setTitle('');
      setBody('');
    } catch (failure) {
      toast(errorMessage(failure, 'تعذّر إرسال الإشعار.'), 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHeader title="إرسال إشعار" subtitle="إشعار يصل إلى هواتف مستخدمي التطبيق فوراً." />

      <div className="grid grid-main">
        <Card title="محتوى الإشعار">
          <form className="stack" onSubmit={send}>
            <Field label="المستلمون">
              <div className="chips">
                <button type="button" className={`chip${target === 'all' ? ' active' : ''}`} onClick={() => setTarget('all')}>
                  <Users size={15} /> جميع المستخدمين
                </button>
                <button type="button" className={`chip${target === 'one' ? ' active' : ''}`} onClick={() => setTarget('one')}>
                  <User size={15} /> مستخدم محدد
                </button>
              </div>
            </Field>

            {target === 'one' && (
              <Field label="رقم المستخدم" hint="الرقم الظاهر بجانب اسم المستخدم في صفحة «المستخدمون».">
                <Input className="ltr" type="number" min="1" value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="مثال: 1542" style={{ maxWidth: 220 }} />
              </Field>
            )}

            <Field label="العنوان" hint={`${title.length} / ${TITLE_MAX}`}>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={TITLE_MAX} placeholder="مثال: تحديث جديد متاح" />
            </Field>

            <Field label="النص" hint={`${body.length} / ${BODY_MAX}`}>
              <Textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={BODY_MAX} rows={5} placeholder="اكتب نص الإشعار..." />
            </Field>

            <Field label="النوع" hint="يحدد أيقونة الإشعار وتصنيفه داخل التطبيق.">
              <Select value={type} onChange={(event) => setType(event.target.value)} style={{ maxWidth: 260 }}>
                {TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </Field>

            <div>
              <Button type="submit" size="lg" icon={Send} loading={sending} disabled={!ready}>
                {target === 'all' ? 'إرسال للجميع' : 'إرسال'}
              </Button>
            </div>
          </form>
        </Card>

        <div className="stack">
          <Card title="معاينة" subtitle="هكذا يظهر على الهاتف">
            <div className="phone-note">
              <div className="phone-note-icon">
                <BellRing size={18} />
              </div>
              <div className="grow">
                <div className="row row-between">
                  <span className="cell-sub">سوقكم</span>
                  <span className="cell-sub">الآن</span>
                </div>
                <div className="cell-title" style={{ overflowWrap: 'anywhere' }}>
                  {title || 'عنوان الإشعار'}
                </div>
                <div style={{ overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{body || 'نص الإشعار يظهر هنا.'}</div>
              </div>
            </div>
          </Card>

          {last && (
            <Alert tone="green" icon={Smartphone}>
              آخر إرسال: «{last.title}» إلى {last.target}.
            </Alert>
          )}
        </div>
      </div>
    </>
  );
}
