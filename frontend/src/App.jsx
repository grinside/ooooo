import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from '@store/authStore';
import Loader from '@components/UI/Loader';

// Lazy load pages for code splitting
// Public pages
const Landing = lazy(() => import('@pages/public/Landing'));
const PaymentPage = lazy(() => import('@pages/public/PaymentPage'));
const SuccessPage = lazy(() => import('@pages/public/SuccessPage'));

// Affiliate pages
const AffiliateRegister = lazy(() => import('@pages/affiliate/Register'));
const AffiliateLogin = lazy(() => import('@pages/affiliate/Login'));
const AffiliateForgotPin = lazy(() => import('@pages/affiliate/ForgotPin'));
const AffiliateDashboard = lazy(() => import('@pages/affiliate/Dashboard'));
const AffiliateNetwork = lazy(() => import('@pages/affiliate/Network'));
const AffiliateCommissions = lazy(() => import('@pages/affiliate/Commissions'));
const AffiliatePayouts = lazy(() => import('@pages/affiliate/Payouts'));
const AffiliateQRCode = lazy(() => import('@pages/affiliate/QRCode'));
const AffiliateProfile = lazy(() => import('@pages/affiliate/Profile'));

// Admin pages
const AdminLogin = lazy(() => import('@pages/admin/Login'));
const AdminDashboard = lazy(() => import('@pages/admin/Dashboard'));
const AdminAffiliates = lazy(() => import('@pages/admin/Affiliates'));
const AdminSubscriptions = lazy(() => import('@pages/admin/Subscriptions'));
const AdminPayouts = lazy(() => import('@pages/admin/Payouts'));
const AdminOffers = lazy(() => import('@pages/admin/Offers'));
const AdminReports = lazy(() => import('@pages/admin/Reports'));
const AdminSystem = lazy(() => import('@pages/admin/System'));

// Protected Route Component
const ProtectedRoute = ({ children, requireAuth = true, requiredUserType = null }) => {
  const { isAuthenticated, userType } = useAuthStore();

  if (requireAuth && !isAuthenticated) {
    return <Navigate to={requiredUserType === 'admin' ? '/admin/login' : '/affiliate/login'} replace />;
  }

  if (requiredUserType && userType !== requiredUserType) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Guest Route Component (redirect if authenticated)
const GuestRoute = ({ children, redirectTo = null }) => {
  const { isAuthenticated, userType } = useAuthStore();

  if (isAuthenticated) {
    const defaultRedirect = userType === 'admin' ? '/admin/dashboard' : '/affiliate/dashboard';
    return <Navigate to={redirectTo || defaultRedirect} replace />;
  }

  return children;
};

// 404 Not Found Page
const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-8">Page not found</p>
      <a
        href="/"
        className="inline-block px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
      >
        Go Home
      </a>
    </div>
  </div>
);

// Loading fallback
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader size="lg" text="Loading..." />
  </div>
);

function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/payment/:id" element={<PaymentPage />} />
        <Route path="/success/:reference" element={<SuccessPage />} />

        {/* Affiliate Auth Routes (Guest only) */}
        <Route
          path="/affiliate/register"
          element={
            <GuestRoute>
              <AffiliateRegister />
            </GuestRoute>
          }
        />
        <Route
          path="/affiliate/login"
          element={
            <GuestRoute>
              <AffiliateLogin />
            </GuestRoute>
          }
        />
        <Route
          path="/affiliate/forgot-pin"
          element={
            <GuestRoute>
              <AffiliateForgotPin />
            </GuestRoute>
          }
        />

        {/* Affiliate Protected Routes */}
        <Route
          path="/affiliate/dashboard"
          element={
            <ProtectedRoute requiredUserType="affiliate">
              <AffiliateDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/affiliate/network"
          element={
            <ProtectedRoute requiredUserType="affiliate">
              <AffiliateNetwork />
            </ProtectedRoute>
          }
        />
        <Route
          path="/affiliate/commissions"
          element={
            <ProtectedRoute requiredUserType="affiliate">
              <AffiliateCommissions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/affiliate/payouts"
          element={
            <ProtectedRoute requiredUserType="affiliate">
              <AffiliatePayouts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/affiliate/qr-code"
          element={
            <ProtectedRoute requiredUserType="affiliate">
              <AffiliateQRCode />
            </ProtectedRoute>
          }
        />
        <Route
          path="/affiliate/profile"
          element={
            <ProtectedRoute requiredUserType="affiliate">
              <AffiliateProfile />
            </ProtectedRoute>
          }
        />

        {/* Admin Auth Routes (Guest only) */}
        <Route
          path="/admin/login"
          element={
            <GuestRoute redirectTo="/admin/dashboard">
              <AdminLogin />
            </GuestRoute>
          }
        />

        {/* Admin Protected Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredUserType="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/affiliates"
          element={
            <ProtectedRoute requiredUserType="admin">
              <AdminAffiliates />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/subscriptions"
          element={
            <ProtectedRoute requiredUserType="admin">
              <AdminSubscriptions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/payouts"
          element={
            <ProtectedRoute requiredUserType="admin">
              <AdminPayouts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/offers"
          element={
            <ProtectedRoute requiredUserType="admin">
              <AdminOffers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute requiredUserType="admin">
              <AdminReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/system"
          element={
            <ProtectedRoute requiredUserType="admin">
              <AdminSystem />
            </ProtectedRoute>
          }
        />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;
