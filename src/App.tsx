import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';

import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { RestaurantsPage } from './pages/Restaurants';
import { CaptainsPage } from './pages/Captains';
import { OrdersPage } from './pages/Orders';
import { SubscriptionsPage } from './pages/Subscriptions';
import { PaymentsPage } from './pages/Payments';
import { SettingsPage } from './pages/Settings';
import { SendOrderPage } from './pages/SendOrder';
import { AdminsPage } from './pages/Admins';
import { GoogleSheetsPage } from './pages/GoogleSheets';
import { LiveMapPage } from './pages/LiveMap';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Login route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Admin Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/live-map" element={<LiveMapPage />} />
                <Route path="/send-order" element={<SendOrderPage />} />
                <Route path="/restaurants" element={<RestaurantsPage />} />
                <Route path="/restaurants/:restaurantId/orders" element={<OrdersPage />} />
                <Route path="/captains" element={<CaptainsPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/subscriptions" element={<SubscriptionsPage />} />
                <Route path="/payments" element={<PaymentsPage />} />
                <Route path="/sheets" element={<GoogleSheetsPage />} />
                <Route path="/admins" element={<AdminsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
