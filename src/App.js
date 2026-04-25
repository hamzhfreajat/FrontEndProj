import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Ads from './pages/Ads';
import Categories from './pages/Categories';
import Users from './pages/Users';
import SavedGroups from './pages/SavedGroups';
import SendNotification from './pages/SendNotification';

// Simple placeholder auth logic for now
const isAuthenticated = true;

const PrivateRoute = ({ children }) => {
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Placeholder for Login */}
        <Route path="/login" element={<div style={{ padding: '50px', textAlign: 'center' }}><h2>Login Page</h2></div>} />

        {/* Protected Dashboard Routes */}
        <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="ads" element={<Ads />} />
          <Route path="categories" element={<Categories />} />
          <Route path="users" element={<Users />} />
          <Route path="saved-groups" element={<SavedGroups />} />
          <Route path="send-notification" element={<SendNotification />} />
          <Route path="settings" element={<div className="card"><h2>الإعدادات</h2><p>قريباً...</p></div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
