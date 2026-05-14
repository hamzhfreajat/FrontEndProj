import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Ads from './pages/Ads';
import Categories from './pages/Categories';
import Users from './pages/Users';
import SavedGroups from './pages/SavedGroups';
import SendNotification from './pages/SendNotification';
import Reports from './pages/Reports';
import SearchLogs from './pages/SearchLogs';
import ScrapingLogs from './pages/ScrapingLogs';
import OtpLogs from './pages/OtpLogs';

import Login from './pages/Login';
import axios from 'axios';

// Configure Axios auth interceptor
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401, token expired or invalid
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('adminToken');
      // Only redirect if we are not already on login
      if (window.location.pathname !== '/login') {
          window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

const isAuthenticated = () => {
  return !!localStorage.getItem('adminToken');
};

const PrivateRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard Routes */}
        <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="ads" element={<Ads />} />
          <Route path="categories" element={<Categories />} />
          <Route path="users" element={<Users />} />
          <Route path="saved-groups" element={<SavedGroups />} />
          <Route path="send-notification" element={<SendNotification />} />
          <Route path="reports" element={<Reports />} />
          <Route path="searches" element={<SearchLogs />} />
          <Route path="scraping-logs" element={<ScrapingLogs />} />
          <Route path="otp-logs" element={<OtpLogs />} />
          <Route path="settings" element={<div className="card"><h2>الإعدادات</h2><p>قريباً...</p></div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
