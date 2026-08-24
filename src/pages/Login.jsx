import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const API_URL = process.env.REACT_APP_API_URL || 'https://staging.sooq-com.com/api';
            const res = await axios.post(`${API_URL}/auth/admin-login`, {
                username,
                password
            });

            if (res.data) {
                localStorage.setItem('adminLoggedIn', 'true');
                if (res.data.token) {
                    localStorage.setItem('token', res.data.token);
                }
                if (res.data.refresh_token) {
                    localStorage.setItem('refresh_token', res.data.refresh_token);
                }
                // Force a page reload to reset everything and properly boot the internal router
                window.location.href = '/';
            }
        } catch (err) {
            console.error("Login failed:", err);
            setError(err.response?.data?.detail || 'فشل تسجيل الدخول. تأكد من صحة البيانات.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h2>تسجيل الدخول (الإدارة)</h2>
                    <p>لوحة التحكم بالمنصات المفتوحة</p>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label>اسم المستخدم</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="admin"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>كلمة المرور</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••"
                            required
                        />
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? 'جاري التحقق...' : 'دخول'}
                    </button>
                </form>
            </div>

            <style jsx>{`
                .login-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f0f4f8;
                    direction: rtl;
                }
                .login-card {
                    background: white;
                    padding: 40px;
                    border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                    width: 100%;
                    max-width: 400px;
                }
                .login-header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .login-header h2 {
                    color: var(--primary-color);
                    margin-bottom: 8px;
                }
                .login-header p {
                    color: #666;
                    font-size: 0.95rem;
                }
                .form-group {
                    margin-bottom: 20px;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: bold;
                    color: #333;
                }
                .form-group input {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    font-size: 1rem;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .form-group input:focus {
                    border-color: var(--primary-color);
                }
                .login-btn {
                    width: 100%;
                    padding: 14px;
                    background: var(--primary-color);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 1.1rem;
                    font-weight: bold;
                    cursor: pointer;
                    transition: opacity 0.2s;
                }
                .login-btn:hover {
                    opacity: 0.9;
                }
                .login-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
                .error-message {
                    background: #fee2e2;
                    color: #b91c1c;
                    padding: 12px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    font-size: 0.9rem;
                    text-align: center;
                }
            `}</style>
        </div>
    );
};

export default Login;
