import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';

import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import DashboardLayout from '@/layouts/DashboardLayout';
import DashboardPage from '@/pages/DashboardPage';
import ClientsPage from '@/pages/ClientsPage';
import ProjectsPage from '@/pages/ProjectsPage';
import TasksPage from '@/pages/TasksPage';
import VideosPage from '@/pages/VideosPage';
import VideoDetailPage from '@/pages/VideoDetailPage';
import InvoicesPage from '@/pages/InvoicesPage';
import SettingsPage from '@/pages/SettingsPage';
import LandingPage from '@/pages/LandingPage';
import PricingPage from '@/pages/PricingPage';
import PaymentSuccessPage from '@/pages/PaymentSuccessPage';
import CheckoutPage from '@/pages/CheckoutPage';
import SharedVideoPage from '@/pages/SharedVideoPage';
import RevisionsPage from '@/pages/RevisionsPage';
import NotFoundPage from '@/pages/NotFoundPage';
import ForbiddenPage from '@/pages/ForbiddenPage';
import ServerErrorPage from '@/pages/ServerErrorPage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { UpgradeModalProvider } from '@/contexts/UpgradeModalContext';
import BlogPage from '@/pages/BlogPage';
import BlogPostPage from '@/pages/BlogPostPage';
import { AboutPage, ContactPage, PrivacyPage, TermsPage, CookiesPage, RefundPolicyPage, AcceptableUsePage, SecurityPage, AdvertisingPolicyPage } from '@/pages/MarketingContentPage';
import { CookieConsent } from '@/components/marketing/CookieConsent';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminDashboardPage from '@/pages/admin/DashboardPage';
import AdminUsersPage from '@/pages/admin/UsersPage';
import AdminUserDetailPage from '@/pages/admin/UserDetailPage';
import AdminSubscriptionsPage from '@/pages/admin/SubscriptionsPage';
import AdminPaymentsPage from '@/pages/admin/PaymentsPage';
import AdminPlansPage from '@/pages/admin/PlansPage';
import AdminCouponsPage from '@/pages/admin/CouponsPage';
import AdminStoragePage from '@/pages/admin/StoragePage';
import AdminAuditLogsPage from '@/pages/admin/AuditLogsPage';
import AdminSettingsPage from '@/pages/admin/SettingsPage';
import AdminSeoPage from '@/pages/admin/SeoPage';
import AdminAdsPage from '@/pages/admin/AdsPage';
import AdminLegalPage from '@/pages/admin/LegalPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/payment-success" element={<PaymentSuccessPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/blog/:slug" element={<BlogPostPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/cookies" element={<CookiesPage />} />
      <Route path="/refund-policy" element={<RefundPolicyPage />} />
      <Route path="/acceptable-use" element={<AcceptableUsePage />} />
      <Route path="/security" element={<SecurityPage />} />
      <Route path="/advertising-policy" element={<AdvertisingPolicyPage />} />
      <Route path="/shared/videos/:token" element={<SharedVideoPage />} />
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace /> : <SignupPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><DashboardPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/clients" element={<ProtectedRoute><DashboardLayout><ClientsPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><DashboardLayout><ProjectsPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><DashboardLayout><TasksPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/videos" element={<ProtectedRoute><DashboardLayout><VideosPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/videos/:id" element={<ProtectedRoute><DashboardLayout><VideoDetailPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/invoices" element={<ProtectedRoute><DashboardLayout><InvoicesPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/revisions" element={<ProtectedRoute><DashboardLayout><RevisionsPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><DashboardLayout><SettingsPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="users/:id" element={<AdminUserDetailPage />} />
        <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
        <Route path="payments" element={<AdminPaymentsPage />} />
        <Route path="plans" element={<AdminPlansPage />} />
        <Route path="coupons" element={<AdminCouponsPage />} />
        <Route path="storage" element={<AdminStoragePage />} />
        <Route path="audit-logs" element={<AdminAuditLogsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="seo" element={<AdminSeoPage />} />
        <Route path="ads" element={<AdminAdsPage />} />
        <Route path="legal" element={<AdminLegalPage />} />
      </Route>
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="/500" element={<ServerErrorPage />} />
      <Route path="/401" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PreferencesProvider>
          <UpgradeModalProvider>
            <AppRoutes />
            <CookieConsent />
            <Toaster />
          </UpgradeModalProvider>
        </PreferencesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
