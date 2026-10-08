import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './layouts/AppShell';
import { isSignedIn } from './lib/api';
import { FeedbackProvider, Loading } from './ui';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

// Each page is loaded when it is first opened, so the panel starts quickly
const Overview = lazy(() => import('./pages/Overview'));
const Ads = lazy(() => import('./pages/Ads'));
const Categories = lazy(() => import('./pages/Categories'));
const Reviews = lazy(() => import('./pages/Reviews'));
const Reports = lazy(() => import('./pages/Reports'));
const Users = lazy(() => import('./pages/Users'));
const Inbox = lazy(() => import('./pages/Inbox'));
const SendNotification = lazy(() => import('./pages/SendNotification'));
const BlockedNumbers = lazy(() => import('./pages/BlockedNumbers'));
const LocationsManager = lazy(() => import('./pages/LocationsManager'));
const ChangeAdsLocation = lazy(() => import('./pages/ChangeAdsLocation'));
const SavedGroups = lazy(() => import('./pages/SavedGroups'));
const FacebookAutoPost = lazy(() => import('./pages/FacebookAutoPost'));
const ScrapingLogs = lazy(() => import('./pages/ScrapingLogs'));
const Seekers = lazy(() => import('./pages/Seekers'));
const UserRegistrationAnalytics = lazy(() => import('./pages/UserRegistrationAnalytics'));
const UserTrackingAnalytics = lazy(() => import('./pages/UserTrackingAnalytics'));
const AdsRegionCategoryAnalytics = lazy(() => import('./pages/AdsRegionCategoryAnalytics'));
const SearchLogs = lazy(() => import('./pages/SearchLogs'));
const ApiHitsAnalytics = lazy(() => import('./pages/ApiHitsAnalytics'));
const ErrorLogs = lazy(() => import('./pages/ErrorLogs'));
const AppSettings = lazy(() => import('./pages/AppSettings'));

const Private = ({ children }) => (isSignedIn() ? children : <Navigate to="/login" replace />);

const page = (Component) => (
  <Suspense fallback={<Loading />}>
    <Component />
  </Suspense>
);

function App() {
  return (
    <FeedbackProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <Private>
                <AppShell />
              </Private>
            }
          >
            <Route index element={page(Overview)} />
            <Route path="ads" element={page(Ads)} />
            <Route path="categories" element={page(Categories)} />
            <Route path="reviews" element={page(Reviews)} />
            <Route path="reports" element={page(Reports)} />
            <Route path="users" element={page(Users)} />
            <Route path="inbox" element={page(Inbox)} />
            <Route path="send-notification" element={page(SendNotification)} />
            <Route path="blocked-numbers" element={page(BlockedNumbers)} />
            <Route path="locations-manager" element={page(LocationsManager)} />
            <Route path="change-ads-location" element={page(ChangeAdsLocation)} />
            <Route path="saved-groups" element={page(SavedGroups)} />
            <Route path="facebook-autopost" element={page(FacebookAutoPost)} />
            <Route path="scraping-logs" element={page(ScrapingLogs)} />
            <Route path="seekers" element={page(Seekers)} />
            <Route path="user-analytics" element={page(UserRegistrationAnalytics)} />
            <Route path="user-tracking" element={page(UserTrackingAnalytics)} />
            <Route path="geo-analytics" element={page(AdsRegionCategoryAnalytics)} />
            <Route path="searches" element={page(SearchLogs)} />
            <Route path="api-hits" element={page(ApiHitsAnalytics)} />
            <Route path="errors" element={page(ErrorLogs)} />
            <Route path="app-settings" element={page(AppSettings)} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </FeedbackProvider>
  );
}

export default App;
