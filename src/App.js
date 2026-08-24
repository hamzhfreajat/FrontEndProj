import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import UserRegistrationAnalytics from './pages/UserRegistrationAnalytics';
import AdsRegionCategoryAnalytics from './pages/AdsRegionCategoryAnalytics';
import UserTrackingAnalytics from './pages/UserTrackingAnalytics';
import Ads from './pages/Ads';
import Categories from './pages/Categories';
import Users from './pages/Users';
import SavedGroups from './pages/SavedGroups';
import SendNotification from './pages/SendNotification';
import Reports from './pages/Reports';
import SearchLogs from './pages/SearchLogs';
import ScrapingLogs from './pages/ScrapingLogs';
import ChangeAdsLocation from './pages/ChangeAdsLocation';
import LocationsManager from './pages/LocationsManager';
import Inbox from './pages/Inbox';
import FacebookAutoPost from './pages/FacebookAutoPost';
import ErrorLogs from './pages/ErrorLogs';
import AppSettings from './pages/AppSettings';
import ApiHitsAnalytics from './pages/ApiHitsAnalytics';
import BlockedNumbers from './pages/BlockedNumbers';


import Login from './pages/Login';
import axios from 'axios';

// Configure Axios auth interceptor
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401, token expired or invalid
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return axios(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const apiUrl = process.env.REACT_APP_API_URL || 'https://staging.sooq-com.com';
          const { data } = await axios.post(`${apiUrl}/api/auth/refresh`, { refresh_token: refreshToken });
          
          localStorage.setItem('token', data.token);
          if (data.refresh_token) {
              localStorage.setItem('refresh_token', data.refresh_token);
          }
          
          originalRequest.headers['Authorization'] = 'Bearer ' + data.token;
          
          processQueue(null, data.token);
          return axios(originalRequest);
        } catch (err) {
          processQueue(err, null);
          localStorage.removeItem('adminLoggedIn');
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          if (window.location.pathname !== '/login') {
              window.location.href = '/login';
          }
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      } else {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

const isAuthenticated = () => {
  return !!localStorage.getItem('adminLoggedIn');
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
          <Route index element={<Navigate to="/user-analytics" replace />} />
          <Route path="user-analytics" element={<UserRegistrationAnalytics />} />
          <Route path="geo-analytics" element={<AdsRegionCategoryAnalytics />} />
          <Route path="user-tracking" element={<UserTrackingAnalytics />} />
          <Route path="api-hits" element={<ApiHitsAnalytics />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="ads" element={<Ads />} />
          <Route path="categories" element={<Categories />} />
          <Route path="users" element={<Users />} />
          <Route path="saved-groups" element={<SavedGroups />} />
          <Route path="send-notification" element={<SendNotification />} />
          <Route path="reports" element={<Reports />} />
          <Route path="searches" element={<SearchLogs />} />
          <Route path="scraping-logs" element={<ScrapingLogs />} />
          <Route path="change-ads-location" element={<ChangeAdsLocation />} />
          <Route path="locations-manager" element={<LocationsManager />} />
          <Route path="facebook-autopost" element={<FacebookAutoPost />} />
          <Route path="errors" element={<ErrorLogs />} />
          <Route path="app-settings" element={<AppSettings />} />
          <Route path="blocked-numbers" element={<BlockedNumbers />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
