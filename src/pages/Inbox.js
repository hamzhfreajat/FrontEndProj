import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { Search, Send, User, Phone, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import axios from 'axios';
import './Inbox.css';

const API_BASE_URL = 'https://api.sooq-com.com/api'

export default function Inbox() {
  const [threads, setThreads] = useState([]);
  const [filteredThreads, setFilteredThreads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const isTypingRef = useRef(false);

  // Fetch Inbox Threads
  useEffect(() => {
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', 'admin')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedThreads = snapshot.docs.map(doc => {
        const data = doc.data();
        const users = data.users || {};
        const adminData = users['admin'] || {};

        // Find the other user's ID
        const otherUserId = data.participants.find(id => id !== 'admin') || '';
        const otherUser = users[otherUserId] || {};

        return {
          id: doc.id,
          adId: data.adId || '',
          adTitle: data.adTitle || 'خدمة العملاء',
          lastMessage: data.lastMessage || '',
          lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
          unreadCount: adminData.unreadCount || 0,
          otherUserId,
          otherUserName: otherUser.name || 'مستخدم',
          otherUserPhone: otherUser.phone || '',
          otherUserAvatar: otherUser.avatar || '',
        };
      });

      // Sort by latest
      fetchedThreads.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
      setThreads(fetchedThreads);
      setFilteredThreads(fetchedThreads);
    }, (error) => {
      console.error("Error fetching threads:", error);
    });

    return () => unsubscribe();
  }, []);

  // Filter threads
  useEffect(() => {
    if (!searchTerm) {
      setFilteredThreads(threads);
      return;
    }
    const lower = searchTerm.toLowerCase();
    setFilteredThreads(threads.filter(t =>
      t.otherUserName.toLowerCase().includes(lower) ||
      t.otherUserPhone.includes(lower)
    ));
  }, [searchTerm, threads]);

  // Fetch Messages for Selected Thread
  useEffect(() => {
    if (!selectedThread) {
      setMessages([]);
      return;
    }

    // Mark as read immediately
    if (selectedThread.unreadCount > 0) {
      setDoc(doc(db, 'chats', selectedThread.id), {
        users: {
          'admin': {
            unreadCount: 0
          }
        }
      }, { merge: true });
    }

    const q = query(
      collection(db, 'chats', selectedThread.id, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMsgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      }));
      setMessages(fetchedMsgs);
      setTimeout(scrollToBottom, 100);
    });

    return () => unsubscribe();
  }, [selectedThread]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleTyping = async (e) => {
    const val = e.target.value;
    setNewMessage(val);

    if (!selectedThread) return;

    const currentlyTyping = val.trim().length > 0;
    if (currentlyTyping !== isTypingRef.current) {
      isTypingRef.current = currentlyTyping;
      try {
        await setDoc(doc(db, 'chats', selectedThread.id), {
          typing: {
            admin: currentlyTyping
          }
        }, { merge: true });
      } catch (err) {
        console.error("Failed to update typing status", err);
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedThread) return;

    const messageText = newMessage.trim();
    setNewMessage(''); // optimistic clear
    isTypingRef.current = false;

    try {
      const messageId = `admin_${Date.now()}`;

      // 1. Save to messages subcollection
      await setDoc(doc(db, 'chats', selectedThread.id, 'messages', messageId), {
        senderId: 'admin',
        text: messageText,
        type: 'text',
        mediaUrl: null,
        status: 'sent',
        timestamp: serverTimestamp(),
      });

      // 2. Update parent chat doc
      await setDoc(doc(db, 'chats', selectedThread.id), {
        lastMessage: messageText,
        lastMessageTime: serverTimestamp(),
        lastSenderId: 'admin',
        typing: {
          admin: false
        },
        users: {
          [selectedThread.otherUserId]: {
            unreadCount: increment(1)
          }
        }
      }, { merge: true });

      // 3. Trigger Push Notification to User
      try {
        const token = localStorage.getItem('adminToken');
        await axios.post(`${API_BASE_URL}/notifications/chat-alert`, {
          target_user_id: parseInt(selectedThread.otherUserId),
          sender_name: 'فريق الدعم الفني',
          message_preview: messageText,
          ad_id: selectedThread.adId || 'support',
          ad_title: selectedThread.adTitle || 'الدعم الفني',
          chat_id: selectedThread.id,
          message_id: messageId,
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (pushErr) {
        console.error("Failed to trigger push notification:", pushErr);
      }

    } catch (err) {
      console.error("Failed to send message:", err);
      alert('حدث خطأ أثناء إرسال الرسالة');
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`inbox-container animate-fade-in ${selectedThread ? 'chat-active' : ''}`}>
      <div className="inbox-header">
        <h1>البريد الوارد (خدمة العملاء)</h1>
        <p>إدارة محادثات الدعم الفني واستفسارات المستخدمين</p>
      </div>

      <div className="inbox-card glass-panel">
        {/* LEFT PANE - THREADS */}
        <div className="threads-pane">
          <div className="threads-search">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="ابحث بالاسم أو رقم الهاتف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="threads-list">
            {filteredThreads.map(thread => (
              <div
                key={thread.id}
                className={`thread-item ${selectedThread?.id === thread.id ? 'active' : ''} ${thread.unreadCount > 0 ? 'unread' : ''}`}
                onClick={() => setSelectedThread(thread)}
              >
                <div className="thread-avatar">
                  {thread.otherUserAvatar ? (
                    <img src={thread.otherUserAvatar} alt="avatar" />
                  ) : (
                    <User size={24} />
                  )}
                  {thread.unreadCount > 0 && (
                    <span className="unread-badge">{thread.unreadCount}</span>
                  )}
                </div>
                <div className="thread-info">
                  <div className="thread-top">
                    <span className="thread-name">{thread.otherUserName}</span>
                    <span className="thread-time">{formatTime(thread.lastMessageTime)}</span>
                  </div>
                  {thread.otherUserPhone && (
                    <div className="thread-phone" style={{ fontSize: '0.75rem', color: 'var(--text-gray)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={10} />
                      <span dir="ltr">{thread.otherUserPhone}</span>
                    </div>
                  )}
                  <div className="thread-bottom">
                    <span className="thread-preview">{thread.lastMessage}</span>
                  </div>
                </div>
              </div>
            ))}
            {filteredThreads.length === 0 && (
              <div className="no-threads">
                <p>لا توجد محادثات مطابقة</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE - CHAT VIEW */}
        <div className="chat-pane">
          {selectedThread ? (
            <>
              <div className="chat-header">
                <button className="mobile-back-btn btn-icon" onClick={() => setSelectedThread(null)}>
                  <ArrowRight size={24} />
                </button>
                <div className="chat-header-info">
                  <h2>{selectedThread.otherUserName}</h2>
                  <div className="chat-meta">
                    {selectedThread.otherUserPhone && (
                      <span className="meta-item"><Phone size={14} /> {selectedThread.otherUserPhone}</span>
                    )}
                    <span className="meta-item"><User size={14} /> ID: {selectedThread.otherUserId}</span>
                  </div>
                </div>
              </div>

              <div className="chat-messages">
                {messages.map((msg, index) => {
                  const isAdmin = msg.senderId === 'admin';
                  return (
                    <div key={msg.id || index} className={`message-wrapper ${isAdmin ? 'admin' : 'user'}`}>
                      <div className="message-bubble">
                        <p>{msg.text}</p>
                        <div className="message-time">
                          {formatTime(msg.timestamp)}
                          {isAdmin && (
                            <CheckCircle2 size={12} className={msg.status === 'read' ? 'read-check' : 'sent-check'} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-input-area">
                <form onSubmit={handleSendMessage} className="chat-form">
                  <input
                    type="text"
                    placeholder="اكتب رسالتك هنا..."
                    value={newMessage}
                    onChange={handleTyping}
                  />
                  <button type="submit" disabled={!newMessage.trim()} className="send-btn">
                    <Send size={20} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="empty-chat-state">
              <div className="empty-icon-wrapper">
                <Clock size={48} />
              </div>
              <h3>اختر محادثة للبدء</h3>
              <p>قم باختيار مستخدم من القائمة الجانبية لعرض الرسائل والرد عليها</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
