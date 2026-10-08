import React, { useEffect, useMemo, useRef, useState } from 'react';
import { collection, doc, increment, onSnapshot, orderBy, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { ArrowRight, CheckCheck, MessageSquare, Phone, Send } from 'lucide-react';
import { db } from '../firebase';
import { API_URL, api } from '../lib/api';
import { Button, EmptyState, Input, PageHeader, SearchInput, timeAgo, useFeedback } from '../ui';

/** Uploaded files are stored with a path on the API's host. */
const mediaUrl = (url) => (url && url.startsWith('/') ? API_URL.replace(/\/api$/, '') + url : url || '');

const clock = (date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

/** Every support conversation, newest first, kept live. */
function useThreads() {
  const [threads, setThreads] = useState(null);
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'chats'), where('participants', 'array-contains', 'admin')),
      (snapshot) => {
        const list = snapshot.docs.map((item) => {
          const data = item.data();
          const users = data.users || {};
          const otherId = (data.participants || []).find((id) => id !== 'admin') || '';
          const other = users[otherId] || {};
          return {
            id: item.id,
            adId: data.adId || '',
            adTitle: data.adTitle || 'خدمة العملاء',
            lastMessage: data.lastMessage || '',
            lastTime: data.lastMessageTime && data.lastMessageTime.toDate ? data.lastMessageTime.toDate() : new Date(0),
            unread: (users.admin && users.admin.unreadCount) || 0,
            userId: otherId,
            name: other.name || 'مستخدم',
            phone: other.phone || '',
            avatar: other.avatar || '',
          };
        });
        list.sort((a, b) => b.lastTime - a.lastTime);
        setThreads(list);
      },
      () => setThreads([]),
    );
    return () => unsubscribe();
  }, []);
  return threads;
}

function useMessages(threadId) {
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    if (!threadId) {
      setMessages([]);
      return undefined;
    }
    const unsubscribe = onSnapshot(query(collection(db, 'chats', threadId, 'messages'), orderBy('timestamp', 'asc')), (snapshot) => {
      setMessages(
        snapshot.docs.map((item) => {
          const data = item.data();
          return { id: item.id, ...data, timestamp: data.timestamp && data.timestamp.toDate ? data.timestamp.toDate() : new Date() };
        }),
      );
    });
    return () => unsubscribe();
  }, [threadId]);
  return messages;
}

function Avatar({ thread }) {
  return <span className="avatar">{thread.avatar ? <img src={mediaUrl(thread.avatar)} alt="" /> : thread.name.slice(0, 2)}</span>;
}

export default function Inbox() {
  const { toast } = useFeedback();
  const threads = useThreads();
  const [search, setSearch] = useState('');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const end = useRef(null);
  const typing = useRef(false);

  const open = useMemo(() => (threads || []).find((thread) => thread.id === openId) || null, [threads, openId]);
  const messages = useMessages(openId);
  const unreadTotal = (threads || []).reduce((sum, thread) => sum + thread.unread, 0);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (threads || []).filter((thread) => (!onlyUnread || thread.unread > 0) && (!term || thread.name.toLowerCase().includes(term) || thread.phone.includes(term)));
  }, [threads, search, onlyUnread]);

  // Opening a conversation marks it as read
  useEffect(() => {
    if (open && open.unread > 0) setDoc(doc(db, 'chats', open.id), { users: { admin: { unreadCount: 0 } } }, { merge: true }).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (end.current) end.current.scrollIntoView({ block: 'end' });
  }, [messages.length, openId]);

  const setTyping = (value) => {
    if (!open || typing.current === value) return;
    typing.current = value;
    setDoc(doc(db, 'chats', open.id), { typing: { admin: value } }, { merge: true }).catch(() => {});
  };

  const onType = (event) => {
    setText(event.target.value);
    setTyping(event.target.value.trim().length > 0);
  };

  const send = async (event) => {
    event.preventDefault();
    const message = text.trim();
    if (!message || !open) return;
    setSending(true);
    setText('');
    typing.current = false;
    try {
      const messageId = `admin_${Date.now()}`;
      await setDoc(doc(db, 'chats', open.id, 'messages', messageId), { senderId: 'admin', text: message, type: 'text', mediaUrl: null, status: 'sent', timestamp: serverTimestamp() });
      await setDoc(
        doc(db, 'chats', open.id),
        { lastMessage: message, lastMessageTime: serverTimestamp(), lastSenderId: 'admin', typing: { admin: false }, users: { [open.userId]: { unreadCount: increment(1) } } },
        { merge: true },
      );
      // The message is delivered either way; the push only tells the user's phone about it
      api
        .post('/notifications/chat-alert', {
          target_user_id: parseInt(open.userId, 10),
          sender_name: 'فريق الدعم الفني',
          message_preview: message,
          ad_id: open.adId || 'support',
          ad_title: open.adTitle || 'الدعم الفني',
          chat_id: open.id,
          message_id: messageId,
        })
        .catch(() => toast('أُرسلت الرسالة، لكن تعذّر إشعار هاتف المستخدم بها.', 'error'));
    } catch (failure) {
      setText(message);
      toast('تعذّر إرسال الرسالة.', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHeader title="رسائل الدعم" subtitle={unreadTotal > 0 ? `${unreadTotal} رسالة غير مقروءة` : 'محادثات المستخدمين مع فريق الدعم.'} />

      <div className={`card inbox${open ? ' has-open' : ''}`}>
        <div className="inbox-list">
          <div className="toolbar">
            <SearchInput value={search} onChange={setSearch} placeholder="الاسم أو رقم الهاتف..." />
            <label className="check">
              <input type="checkbox" checked={onlyUnread} onChange={(event) => setOnlyUnread(event.target.checked)} />
              غير المقروءة
            </label>
          </div>
          <div className="inbox-threads">
            {threads === null ? (
              <EmptyState title="جاري تحميل المحادثات..." />
            ) : visible.length === 0 ? (
              <EmptyState icon={MessageSquare} title={threads.length === 0 ? 'لا توجد محادثات بعد' : 'لا توجد محادثات مطابقة'} />
            ) : (
              visible.map((thread) => (
                <button key={thread.id} type="button" className={`thread${thread.id === openId ? ' active' : ''}${thread.unread > 0 ? ' unread' : ''}`} onClick={() => setOpenId(thread.id)}>
                  <Avatar thread={thread} />
                  <div className="grow">
                    <div className="row row-between" style={{ flexWrap: 'nowrap', gap: 6 }}>
                      <span className="thread-name truncate">{thread.name}</span>
                      <span className="cell-sub nowrap">{thread.lastTime.getTime() ? timeAgo(thread.lastTime) : ''}</span>
                    </div>
                    <div className="row row-between" style={{ flexWrap: 'nowrap', gap: 6 }}>
                      <span className="thread-preview truncate">{thread.lastMessage || 'بدون رسائل'}</span>
                      {thread.unread > 0 && <span className="nav-badge">{thread.unread}</span>}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="inbox-chat">
          {!open ? (
            <EmptyState icon={MessageSquare} title="اختر محادثة" description="اختر مستخدماً من القائمة لعرض رسائله والرد عليه." />
          ) : (
            <>
              <div className="inbox-chat-head">
                <Button variant="ghost" size="sm" icon={ArrowRight} className="only-mobile" onClick={() => setOpenId(null)} aria-label="رجوع" />
                <Avatar thread={open} />
                <div className="grow">
                  <div className="cell-title truncate">{open.name}</div>
                  <div className="cell-sub row" style={{ gap: 10 }}>
                    {open.phone && (
                      <a className="ltr" href={`tel:${open.phone}`}>
                        <Phone size={11} /> {open.phone}
                      </a>
                    )}
                    <span className="num">#{open.userId}</span>
                    {open.adTitle && <span className="truncate">{open.adTitle}</span>}
                  </div>
                </div>
              </div>

              <div className="chat-log">
                {messages.length === 0 && <EmptyState title="لا توجد رسائل في هذه المحادثة" />}
                {messages.map((message) => {
                  const mine = message.senderId === 'admin';
                  return (
                    <div key={message.id} className={`chat-bubble${mine ? ' is-admin' : ''}`}>
                      {message.type === 'audio' && message.mediaUrl ? (
                        <audio controls src={mediaUrl(message.mediaUrl)} style={{ maxWidth: 240 }} />
                      ) : message.type === 'image' && message.mediaUrl ? (
                        <a href={mediaUrl(message.mediaUrl)} target="_blank" rel="noreferrer">
                          <img src={mediaUrl(message.mediaUrl)} alt="صورة مرفقة" />
                        </a>
                      ) : (
                        <div>{message.text}</div>
                      )}
                      <div className="chat-meta">
                        {clock(message.timestamp)} {mine && <CheckCheck size={12} style={{ verticalAlign: 'middle', opacity: message.status === 'read' ? 1 : 0.5 }} />}
                      </div>
                    </div>
                  );
                })}
                <div ref={end} />
              </div>

              <form className="chat-form" onSubmit={send}>
                <Input value={text} onChange={onType} placeholder="اكتب ردّك..." />
                <Button type="submit" icon={Send} loading={sending} disabled={!text.trim()}>
                  إرسال
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
