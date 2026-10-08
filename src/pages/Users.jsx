import React, { useEffect, useRef, useState } from 'react';
import { Ban, ChevronLeft, ChevronRight, Download, FileText, MessageSquare, RefreshCw, Send, UserCheck, UserX, Users as UsersIcon } from 'lucide-react';
import { api, errorMessage } from '../lib/api';
import { adUrl } from '../lib/site';
import {
  Badge, Button, Card, DataTable, EmptyState, Input, Loading, Modal, PageHeader, SearchInput, Select, downloadCsv, formatDate, formatPrice, timeAgo, useFeedback, useLoad,
} from '../ui';

const PAGE_SIZE = 50;

const initials = (name) => (name || '?').trim().slice(0, 2);
const phoneOf = (user) => user.mobile_number || user.phone || '';

function UserAds({ user }) {
  const { data, loading, error, reload } = useLoad(() => api.get(`/admin/users/${user.id}/ads`).then((response) => response.data), [user.id]);
  return (
    <DataTable
      loading={loading}
      error={error}
      onRetry={reload}
      rows={data}
      pageSize={10}
      empty={<EmptyState icon={FileText} title="لا توجد إعلانات لهذا المستخدم" />}
      columns={[
        {
          key: 'title',
          label: 'الإعلان',
          primary: true,
          render: (ad) => (
            <div>
              <a className="cell-title" href={adUrl(ad.id)} target="_blank" rel="noreferrer">
                {ad.title}
              </a>
              <div className="cell-sub">
                #{ad.id}
                {ad.category_name ? ` · ${ad.category_name}` : ''}
              </div>
            </div>
          ),
        },
        { key: 'price', label: 'السعر', sort: (ad) => ad.price, render: (ad) => <span className="num">{ad.price ? formatPrice(ad.price) : '—'}</span> },
        { key: 'status', label: 'الحالة', render: (ad) => <Badge>{ad.status}</Badge> },
        { key: 'created_at', label: 'أُضيف', sort: (ad) => ad.created_at, render: (ad) => formatDate(ad.created_at, false) },
      ]}
    />
  );
}

function SupportChat({ user }) {
  const { toast } = useFeedback();
  const { data, loading, error, reload } = useLoad(() => api.get(`/admin/users/${user.id}/chats`).then((response) => response.data), [user.id]);
  const [sent, setSent] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const end = useRef(null);
  const messages = [...(data || []), ...sent];

  useEffect(() => {
    if (end.current) end.current.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  const send = async (event) => {
    event.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const response = await api.post(`/admin/users/${user.id}/chats`, { message: text.trim() });
      setSent((list) => [...list, response.data]);
      setText('');
    } catch (failure) {
      toast(errorMessage(failure, 'تعذّر إرسال الرسالة.'), 'error');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <EmptyState title="تعذّر تحميل المحادثة" description={error}><Button variant="secondary" size="sm" onClick={reload}>إعادة المحاولة</Button></EmptyState>;

  return (
    <div className="chat">
      <div className="chat-log">
        {messages.length === 0 && <EmptyState icon={MessageSquare} title="لا توجد رسائل سابقة" description="اكتب أول رسالة لبدء المحادثة." />}
        {messages.map((message) => (
          <div key={message.id} className={`chat-bubble${message.sender === 'admin' ? ' is-admin' : ''}`}>
            <div>{message.message}</div>
            <div className="chat-meta">
              {formatDate(message.created_at)}
              {message.sender === 'user' && !message.is_read ? ' · غير مقروءة' : ''}
            </div>
          </div>
        ))}
        <div ref={end} />
      </div>
      <form className="chat-form" onSubmit={send}>
        <Input value={text} onChange={(event) => setText(event.target.value)} placeholder="اكتب رسالتك..." autoFocus />
        <Button type="submit" icon={Send} loading={sending} disabled={!text.trim()}>
          إرسال
        </Button>
      </form>
    </div>
  );
}

export default function Users() {
  const { toast, confirm } = useFeedback();
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const [patches, setPatches] = useState({});
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(null);

  const { data, loading, error, reload } = useLoad(
    () => api.get('/admin/users', { params: { q: submitted || undefined, skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE } }).then((response) => response.data),
    [submitted, page],
  );

  const users = (data || []).map((user) => ({ ...user, ...(patches[user.id] || {}) }));
  const visible = users.filter((user) => (filter === 'banned' ? user.is_banned : filter === 'inactive' ? !user.is_active : filter === 'active' ? user.is_active && !user.is_banned : true));
  const hasNext = (data || []).length === PAGE_SIZE;

  const search = (value) => {
    setPage(1);
    setSubmitted(value.trim());
  };

  const patch = (id, change) => setPatches((current) => ({ ...current, [id]: { ...(current[id] || {}), ...change } }));

  const toggleActive = async (user) => {
    if (user.is_active) {
      const agreed = await confirm({ title: 'تعطيل الحساب؟', message: `لن يتمكن «${user.full_name}» من استخدام حسابه حتى تعيد تفعيله.`, confirmLabel: 'تعطيل', danger: true });
      if (!agreed) return;
    }
    setBusy(user.id);
    try {
      await api.put(`/admin/users/${user.id}/status`, { is_active: !user.is_active });
      patch(user.id, { is_active: !user.is_active });
      toast(user.is_active ? 'تم تعطيل الحساب' : 'تم تفعيل الحساب');
    } catch (failure) {
      toast(errorMessage(failure, 'تعذّر تحديث حالة الحساب.'), 'error');
    } finally {
      setBusy(null);
    }
  };

  const toggleBan = async (user) => {
    if (!user.is_banned) {
      const agreed = await confirm({ title: 'حظر المستخدم؟', message: `سيُمنع «${user.full_name}» من الدخول والنشر.`, confirmLabel: 'حظر', danger: true });
      if (!agreed) return;
    }
    setBusy(user.id);
    try {
      await api.put(`/admin/users/${user.id}/ban`, { is_banned: !user.is_banned });
      patch(user.id, { is_banned: !user.is_banned });
      toast(user.is_banned ? 'تم فك الحظر' : 'تم حظر المستخدم');
    } catch (failure) {
      toast(errorMessage(failure, 'تعذّر تحديث الحظر.'), 'error');
    } finally {
      setBusy(null);
    }
  };

  const exportCsv = () =>
    downloadCsv(
      'users.csv',
      [
        { label: 'المعرّف', value: (user) => user.id },
        { label: 'الاسم', value: (user) => user.full_name },
        { label: 'الهاتف', value: phoneOf },
        { label: 'البريد', value: (user) => user.email },
        { label: 'نشط', value: (user) => (user.is_active ? 'نعم' : 'لا') },
        { label: 'محظور', value: (user) => (user.is_banned ? 'نعم' : 'لا') },
        { label: 'تاريخ الانضمام', value: (user) => formatDate(user.created_at) },
      ],
      visible,
    );

  const columns = [
    {
      key: 'user',
      label: 'المستخدم',
      primary: true,
      sort: (user) => user.full_name,
      render: (user) => (
        <div className="media">
          <span className="avatar">{initials(user.full_name)}</span>
          <div className="media-body">
            <div className="cell-title truncate">{user.full_name}</div>
            <div className="cell-sub num">#{user.id}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      label: 'التواصل',
      render: (user) => (
        <div>
          <div className="ltr">{phoneOf(user) || <span className="muted">بدون رقم</span>}</div>
          {user.email && <div className="cell-sub ltr">{user.email}</div>}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (user) => (
        <div className="row" style={{ gap: 6 }}>
          {user.is_banned ? (
            <Badge tone="red" dot>
              محظور
            </Badge>
          ) : user.is_active ? (
            <Badge tone="green" dot>
              نشط
            </Badge>
          ) : (
            <Badge dot>معطّل</Badge>
          )}
        </div>
      ),
    },
    { key: 'created_at', label: 'انضم', sort: (user) => user.created_at, render: (user) => <span title={formatDate(user.created_at)}>{timeAgo(user.created_at)}</span> },
    {
      key: 'actions',
      label: '',
      actions: true,
      render: (user) => (
        <div className="actions">
          <Button variant="ghost" size="sm" icon={FileText} title="إعلانات المستخدم" aria-label="إعلانات المستخدم" onClick={() => setModal({ type: 'ads', user })} />
          <Button variant="ghost" size="sm" icon={MessageSquare} title="مراسلة" aria-label="مراسلة" onClick={() => setModal({ type: 'chat', user })} />
          <Button variant="secondary" size="sm" icon={user.is_active ? UserX : UserCheck} disabled={busy === user.id} onClick={() => toggleActive(user)}>
            {user.is_active ? 'تعطيل' : 'تفعيل'}
          </Button>
          <Button variant={user.is_banned ? 'secondary' : 'danger-soft'} size="sm" icon={Ban} disabled={busy === user.id} onClick={() => toggleBan(user)}>
            {user.is_banned ? 'فك الحظر' : 'حظر'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="المستخدمون" subtitle="ابحث عن مستخدم، راجع إعلاناته، راسله، أو عطّل حسابه.">
        <Button variant="secondary" icon={Download} disabled={visible.length === 0} onClick={exportCsv}>
          تصدير الصفحة
        </Button>
        <Button variant="secondary" icon={RefreshCw} loading={loading} onClick={reload}>
          تحديث
        </Button>
      </PageHeader>

      <Card flush>
        <div className="toolbar">
          <SearchInput value={query} onChange={setQuery} onSubmit={search} placeholder="الاسم، البريد أو رقم الهاتف، ثم Enter" />
          <Button variant="secondary" onClick={() => search(query)}>
            بحث
          </Button>
          <div className="toolbar-spacer" />
          <Select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="تصفية حسب الحالة">
            <option value="all">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">معطّل</option>
            <option value="banned">محظور</option>
          </Select>
        </div>
        <DataTable
          columns={columns}
          rows={visible}
          loading={loading}
          error={error}
          onRetry={reload}
          pageSize={PAGE_SIZE}
          empty={<EmptyState icon={UsersIcon} title="لا يوجد مستخدمون مطابقون" description={submitted ? `لا نتائج لـ «${submitted}».` : undefined} />}
        />
        {(page > 1 || hasNext) && (
          <div className="pagination">
            <span>الصفحة {page}</span>
            <div className="pagination-pages">
              <Button variant="secondary" size="sm" icon={ChevronRight} disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>
                السابق
              </Button>
              <Button variant="secondary" size="sm" icon={ChevronLeft} disabled={!hasNext || loading} onClick={() => setPage(page + 1)}>
                التالي
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal
        open={!!modal}
        size="wide"
        title={modal ? `${modal.type === 'ads' ? 'إعلانات' : 'مراسلة'}: ${modal.user.full_name}` : ''}
        onClose={() => setModal(null)}
      >
        {modal && modal.type === 'ads' && <UserAds user={modal.user} />}
        {modal && modal.type === 'chat' && <SupportChat user={modal.user} />}
      </Modal>
    </>
  );
}
