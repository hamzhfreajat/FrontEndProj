import React, { useState, useEffect } from 'react';
import { Search, Ban, UserX, MessageSquare, Image as ImageIcon, X, CheckCircle, XCircle } from 'lucide-react';
import './Users.css';

const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/admin/users`;

const Users = () => {
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Modals state
    const [selectedUser, setSelectedUser] = useState(null);
    const [modalType, setModalType] = useState(null); // 'ads' or 'chat'
    const [userAds, setUserAds] = useState([]);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async (query = '') => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}?q=${query}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error('فشل في جلب البيانات');
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        if (e.key === 'Enter') {
            fetchUsers(e.target.value);
        }
    };

    const toggleUserStatus = async (userId, currentStatus) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/${userId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ is_active: !currentStatus })
            });
            if (res.ok) {
                setUsers(users.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u));
            }
        } catch (err) {
            console.error('Failed to update status');
        }
    };

    const toggleUserBan = async (userId, currentBanStatus) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/${userId}/ban`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ is_banned: !currentBanStatus })
            });
            if (res.ok) {
                setUsers(users.map(u => u.id === userId ? { ...u, is_banned: !currentBanStatus } : u));
            }
        } catch (err) {
            console.error('Failed to update ban status');
        }
    };

    const openAdsModal = async (user) => {
        setSelectedUser(user);
        setModalType('ads');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/${user.id}/ads`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setUserAds(data);
        } catch (err) {
            console.error(err);
        }
    };

    const openChatModal = async (user) => {
        setSelectedUser(user);
        setModalType('chat');
        fetchChatMessages(user.id);
    };

    const fetchChatMessages = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/${userId}/chats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setChatMessages(data);
        } catch (err) {
            console.error(err);
        }
    };

    const sendChatMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/${selectedUser.id}/chats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: newMessage })
            });
            const data = await res.json();
            setChatMessages([...chatMessages, data]);
            setNewMessage('');
        } catch (err) {
            console.error(err);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'غير معروف';
        return new Date(dateStr).toLocaleDateString('ar-JO', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="users-page">
            <div className="users-header">
                <div>
                    </div>
            </div>

            <div className="users-actions">
                <div className="search-box">
                    <Search className="search-icon" size={20} />
                    <input 
                        type="text" 
                        placeholder="ابحث بالاسم، الإيميل، أو رقم الهاتف..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearch}
                    />
                </div>
            </div>

            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>المستخدم</th>
                            <th>معلومات التواصل</th>
                            <th>الحالة</th>
                            <th>تاريخ الانضمام</th>
                            <th>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{textAlign: 'center'}}>جاري التحميل...</td></tr>
                        ) : error ? (
                            <tr><td colSpan="5" style={{textAlign: 'center', color: 'red'}}>{error}</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan="5" style={{textAlign: 'center'}}>لا يوجد نتائج</td></tr>
                        ) : (
                            users.map(user => (
                                <tr key={user.id}>
                                    <td>
                                        <div className="user-info-cell">
                                            <div className="user-avatar-placeholder">
                                                {user.full_name ? user.full_name.substring(0, 2) : 'US'}
                                            </div>
                                            <div className="user-details">
                                                <h4>{user.full_name}</h4>
                                                <span>ID: {user.id}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="user-details">
                                            <div>{user.mobile_number || user.phone || 'لا يوجد رقم'}</div>
                                            <span>{user.email || 'لا يوجد بريد'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                                            <span className={`status-badge ${user.is_active ? 'status-active' : 'status-inactive'}`}>
                                                {user.is_active ? <CheckCircle size={14}/> : <XCircle size={14}/>}
                                                {user.is_active ? 'نشط' : 'معطل'}
                                            </span>
                                            {user.is_banned && (
                                                <span className="status-badge status-banned">
                                                    <Ban size={14}/> محظور
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td>{formatDate(user.created_at)}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="btn-icon ads" title="عرض إعلانات المستخدم" onClick={() => openAdsModal(user)}>
                                                <ImageIcon size={18} />
                                            </button>
                                            <button className="btn-icon chat" title="محادثة الدعم" onClick={() => openChatModal(user)}>
                                                <MessageSquare size={18} />
                                            </button>
                                            <button 
                                                className="btn-icon toggle" 
                                                title={user.is_active ? "تعطيل الحساب" : "تفعيل الحساب"}
                                                onClick={() => toggleUserStatus(user.id, user.is_active)}
                                            >
                                                <UserX size={18} />
                                            </button>
                                            <button 
                                                className="btn-icon ban" 
                                                title={user.is_banned ? "فك الحظر" : "حظر المستخدم"}
                                                onClick={() => toggleUserBan(user.id, user.is_banned)}
                                            >
                                                <Ban size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modals */}
            {modalType && (
                <div className="modal-overlay" onClick={() => setModalType(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>
                                {modalType === 'ads' ? `إعلانات المستخدم: ${selectedUser?.full_name}` : `محادثة الدعم: ${selectedUser?.full_name}`}
                            </h2>
                            <button className="close-btn" onClick={() => setModalType(null)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="modal-body">
                            {modalType === 'ads' ? (
                                <div className="ads-grid">
                                    {userAds.length === 0 ? <p>لا يوجد إعلانات لهذا المستخدم.</p> : null}
                                    {userAds.map(ad => (
                                        <div className="ad-card" key={ad.id}>
                                            <h3 className="ad-title">{ad.title}</h3>
                                            <div className="ad-price">{ad.price} دينار</div>
                                            <div className="ad-meta">
                                                <span>{ad.category_name}</span>
                                                <span style={{color: ad.status === 'active' ? '#16a34a' : '#94a3b8'}}>{ad.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="chat-container">
                                    <div className="chat-messages">
                                        {chatMessages.length === 0 ? (
                                            <p style={{textAlign: 'center', color: '#64748b', marginTop: '20px'}}>لا توجد رسائل سابقة. ابدأ المحادثة الآن.</p>
                                        ) : null}
                                        {chatMessages.map(msg => (
                                            <div key={msg.id} className={`message-bubble ${msg.sender === 'admin' ? 'message-admin' : 'message-user'}`}>
                                                {msg.message}
                                                <span className="message-time">{formatDate(msg.created_at)} {msg.sender === 'user' && !msg.is_read ? '(غير مقروءة)' : ''}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <form className="chat-input" onSubmit={sendChatMessage}>
                                        <input 
                                            type="text" 
                                            placeholder="اكتب رسالتك هنا..." 
                                            value={newMessage}
                                            onChange={e => setNewMessage(e.target.value)}
                                        />
                                        <button type="submit" className="btn-send">إرسال</button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
