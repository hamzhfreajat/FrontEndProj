import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { LogIn } from 'lucide-react';
import { API_URL, errorMessage, isSignedIn, saveSession } from '../lib/api';
import { Alert, Button, Field, Input } from '../ui';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isSignedIn()) return <Navigate to="/" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/auth/admin-login`, { username, password });
      saveSession(data);
      // A full reload, so every part of the panel starts with the new session
      window.location.href = '/';
    } catch (failure) {
      const status = failure.response && failure.response.status;
      setError(status === 401 ? 'اسم المستخدم أو كلمة المرور غير صحيحة.' : status === 429 ? 'محاولات كثيرة. انتظر دقيقة ثم حاول مجدداً.' : errorMessage(failure, 'فشل تسجيل الدخول.'));
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand">
          <img src="/logo192.png" alt="" />
          <div>
            <h1>لوحة إدارة سوقكم</h1>
            <p className="muted">سجّل الدخول بحساب المدير للمتابعة</p>
          </div>
        </div>
        <div className="stack">
          {error && <Alert tone="red">{error}</Alert>}
          <Field label="اسم المستخدم">
            <Input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" autoFocus required />
          </Field>
          <Field label="كلمة المرور">
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
          </Field>
          <Button type="submit" size="lg" block icon={LogIn} loading={loading}>
            تسجيل الدخول
          </Button>
        </div>
      </form>
    </div>
  );
}
