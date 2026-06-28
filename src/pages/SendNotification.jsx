import React, { useState } from 'react';

const SendNotification = () => {
    const [targetType, setTargetType] = useState('all'); // 'all' or 'specific'
    const [targetUserId, setTargetUserId] = useState('');
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [type, setType] = useState('admin_alert');
    const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: string }
    const [isLoading, setIsLoading] = useState(false);

    // You should configure the base API URL properly based on your environment
    // Using the same convention as the mobile app for now, but pointing to local server
    const API_URL = process.env.REACT_APP_API_URL || 'https://api.sooq-com.com/api';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus(null);

        // Basic validation
        if (!title.trim() || !body.trim()) {
            setStatus({ type: 'error', message: 'يرجى إدخال عنوان ونص الإشعار' });
            setIsLoading(false);
            return;
        }

        if (targetType === 'specific' && !targetUserId.trim()) {
            setStatus({ type: 'error', message: 'يرجى إدخال معرف المستخدم' });
            setIsLoading(false);
            return;
        }

        try {
            // Create request payload matching Auth rules.
            // Assuming dashboard users need a token, handle the authorization header accordingly.
            // For this simple implementation, we assume the backend doesn't strictly validate tokens for testing 
            // or you will inject the token if you have one stored in localStorage.
            const token = localStorage.getItem('token') || '';

            const payload = {
                target_user_id: targetType === 'all' ? 'all' : targetUserId,
                title,
                body,
                type
            };

            const response = await fetch(`${API_URL}/notifications/admin/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                setStatus({ type: 'success', message: data.message || 'تم إرسال الإشعار بنجاح!' });
                // Clear form
                setTitle('');
                setBody('');
                if (targetType === 'specific') setTargetUserId('');
            } else {
                setStatus({ type: 'error', message: data.detail || 'حدث خطأ أثناء إرسال الإشعار' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'فشل الاتصال بالخادم. يرجى المحاولة لاحقاً.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="send-notification-page">
            

            <div className="card form-card">
                {status && (
                    <div className={`alert alert-${status.type}`}>
                        {status.message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="notification-form">
                    <div className="form-group">
                        <label className="form-label">الفئة المستهدفة</label>
                        <div className="radio-group">
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    name="targetType"
                                    value="all"
                                    checked={targetType === 'all'}
                                    onChange={() => setTargetType('all')}
                                />
                                جميع المستخدمين
                            </label>
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    name="targetType"
                                    value="specific"
                                    checked={targetType === 'specific'}
                                    onChange={() => setTargetType('specific')}
                                />
                                مستخدم محدد
                            </label>
                        </div>
                    </div>

                    {targetType === 'specific' && (
                        <div className="form-group slide-in">
                            <label htmlFor="targetUserId" className="form-label">رقم تعريف المستخدم (User ID)</label>
                            <input
                                type="number"
                                id="targetUserId"
                                className="form-control"
                                placeholder="أدخل ID المستخدم..."
                                value={targetUserId}
                                onChange={(e) => setTargetUserId(e.target.value)}
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="title" className="form-label">عنوان الإشعار</label>
                        <input
                            type="text"
                            id="title"
                            className="form-control"
                            placeholder="مثال: تحديث هام، عرض خاص..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={100}
                        />
                        <small className="form-hint">{title.length}/100 حرف</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="body" className="form-label">نص الإشعار</label>
                        <textarea
                            id="body"
                            className="form-control textarea"
                            placeholder="اكتب تفاصيل الإشعار هنا..."
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={4}
                            maxLength={500}
                        />
                        <small className="form-hint">{body.length}/500 حرف</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="type" className="form-label">نوع الإشعار (لأغراض النظام)</label>
                        <select
                            id="type"
                            className="form-control"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="admin_alert">تنبيه إداري</option>
                            <option value="system">رسالة نظام</option>
                            <option value="promotion">عرض / ترويج</option>
                        </select>
                    </div>

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="flex-center gap-2">
                                    <span className="spinner"></span> جاري الإرسال...
                                </span>
                            ) : (
                                'إرسال الإشعار الآن'
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <style jsx="true">{`
        .send-notification-page {
          max-width: 800px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 24px;
        }

        .page-title {
          font-size: 24px;
          font-weight: 800;
          color: var(--text-dark);
          margin-bottom: 8px;
        }

        .page-subtitle {
          color: var(--text-gray);
          font-size: 14px;
        }

        .form-card {
          padding: 32px;
          border-radius: 16px;
          background: var(--white);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }

        .notification-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-label {
          font-weight: 700;
          font-size: 14px;
          color: var(--text-dark);
        }

        .form-control {
          padding: 12px 16px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          font-size: 15px;
          background-color: #fafafa;
          transition: border-color 0.2s;
        }

        .form-control:focus {
          outline: none;
          border-color: var(--primary-color);
          background-color: var(--white);
          box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
        }

        .textarea {
          resize: vertical;
          min-height: 100px;
        }

        .form-hint {
          align-self: flex-end;
          font-size: 12px;
          color: var(--text-gray);
        }

        .radio-group {
          display: flex;
          gap: 24px;
          padding: 12px 0;
        }

        .radio-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 15px;
        }

        .radio-label input[type="radio"] {
          width: 18px;
          height: 18px;
          accent-color: var(--primary-color);
        }

        .form-actions {
          margin-top: 16px;
          padding-top: 24px;
          border-top: 1px solid var(--border-color);
          display: flex;
          justify-content: flex-end;
        }

        .btn-lg {
          padding: 14px 32px;
          font-size: 16px;
          font-weight: 700;
          border-radius: 8px;
        }

        .alert {
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          font-weight: 600;
        }

        .alert-success {
          background-color: rgba(46, 125, 50, 0.1);
          color: #2e7d32;
          border: 1px solid rgba(46, 125, 50, 0.2);
        }

        .alert-error {
          background-color: rgba(211, 47, 47, 0.1);
          color: #d32f2f;
          border: 1px solid rgba(211, 47, 47, 0.2);
        }

        .slide-in {
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .flex-center {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .gap-2 { gap: 8px; }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};

export default SendNotification;
