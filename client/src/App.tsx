import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';
import { PageLoader } from '@/components/ui/page-loader';
import { PageProgress } from '@/components/ui/page-progress';
import { PageTransition } from '@/components/ui/page-transition';

import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import DashboardLayout from '@/layouts/DashboardLayout';
import DashboardPage from '@/pages/DashboardPage';
import ClientsPage from '@/pages/ClientsPage';
import ClientDetailPage from '@/pages/ClientDetailPage';
import ProjectsPage from '@/pages/ProjectsPage';
import ProjectDetailPage from '@/pages/ProjectDetailPage';
import TasksPage from '@/pages/TasksPage';
import VideosPage from '@/pages/VideosPage';
import VideoDetailPage from '@/pages/VideoDetailPage';
import InvoicesPage from '@/pages/InvoicesPage';
import SettingsPage from '@/pages/SettingsPage';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { UpgradeModalProvider } from '@/contexts/UpgradeModalContext';
import { CookieConsent } from '@/components/marketing/CookieConsent';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const PricingPage = lazy(() => import('@/pages/PricingPage'));
const PaymentSuccessPage = lazy(() => import('@/pages/PaymentSuccessPage'));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'));
const SharedVideoPage = lazy(() => import('@/pages/SharedVideoPage'));
const RevisionsPage = lazy(() => import('@/pages/RevisionsPage'));
const BlogPage = lazy(() => import('@/pages/BlogPage'));
const BlogPostPage = lazy(() => import('@/pages/BlogPostPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const ForbiddenPage = lazy(() => import('@/pages/ForbiddenPage'));
const ServerErrorPage = lazy(() => import('@/pages/ServerErrorPage'));
const UnauthorizedPage = lazy(() => import('@/pages/UnauthorizedPage'));
const AboutPage = lazy(() => import('@/pages/MarketingContentPage').then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('@/pages/MarketingContentPage').then((m) => ({ default: m.ContactPage })));
const PrivacyPage = lazy(() => import('@/pages/MarketingContentPage').then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('@/pages/MarketingContentPage').then((m) => ({ default: m.TermsPage })));
const CookiesPage = lazy(() => import('@/pages/MarketingContentPage').then((m) => ({ default: m.CookiesPage })));
const RefundPolicyPage = lazy(() => import('@/pages/MarketingContentPage').then((m) => ({ default: m.RefundPolicyPage })));
const AcceptableUsePage = lazy(() => import('@/pages/MarketingContentPage').then((m) => ({ default: m.AcceptableUsePage })));
const SecurityPage = lazy(() => import('@/pages/MarketingContentPage').then((m) => ({ default: m.SecurityPage })));
const AdvertisingPolicyPage = lazy(() => import('@/pages/MarketingContentPage').then((m) => ({ default: m.AdvertisingPolicyPage })));
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'));
const AdminDashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const AdminUsersPage = lazy(() => import('@/pages/admin/UsersPage'));
const AdminUserDetailPage = lazy(() => import('@/pages/admin/UserDetailPage'));
const AdminSubscriptionsPage = lazy(() => import('@/pages/admin/SubscriptionsPage'));
const AdminPaymentsPage = lazy(() => import('@/pages/admin/PaymentsPage'));
const AdminPlansPage = lazy(() => import('@/pages/admin/PlansPage'));
const AdminCouponsPage = lazy(() => import('@/pages/admin/CouponsPage'));
const AdminStoragePage = lazy(() => import('@/pages/admin/StoragePage'));
const AdminAuditLogsPage = lazy(() => import('@/pages/admin/AuditLogsPage'));
const AdminSettingsPage = lazy(() => import('@/pages/admin/SettingsPage'));
const AdminSeoPage = lazy(() => import('@/pages/admin/SeoPage'));
const AdminAdsPage = lazy(() => import('@/pages/admin/AdsPage'));
const AdminLegalPage = lazy(() => import('@/pages/admin/LegalPage'));

function pageFallback() {
  return <PageLoader />
}

function PublicPage({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  return (
    <div key={location.pathname} className="animate-route-in">
      {children}
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;

  return (
    <Suspense fallback={pageFallback()}>
      <Routes>
        <Route path="/" element={<PublicPage><LandingPage /></PublicPage>} />
      <Route path="/pricing" element={<PublicPage><PricingPage /></PublicPage>} />
      <Route path="/checkout" element={<PublicPage><CheckoutPage /></PublicPage>} />
      <Route path="/payment-success" element={<PublicPage><PaymentSuccessPage /></PublicPage>} />
      <Route path="/blog" element={<PublicPage><BlogPage /></PublicPage>} />
      <Route path="/blog/:slug" element={<PublicPage><BlogPostPage /></PublicPage>} />
      <Route path="/about" element={<PublicPage><AboutPage /></PublicPage>} />
      <Route path="/contact" element={<PublicPage><ContactPage /></PublicPage>} />
      <Route path="/privacy" element={<PublicPage><PrivacyPage /></PublicPage>} />
      <Route path="/terms" element={<PublicPage><TermsPage /></PublicPage>} />
      <Route path="/cookies" element={<PublicPage><CookiesPage /></PublicPage>} />
      <Route path="/refund-policy" element={<PublicPage><RefundPolicyPage /></PublicPage>} />
      <Route path="/acceptable-use" element={<PublicPage><AcceptableUsePage /></PublicPage>} />
      <Route path="/security" element={<PublicPage><SecurityPage /></PublicPage>} />
      <Route path="/advertising-policy" element={<PublicPage><AdvertisingPolicyPage /></PublicPage>} />
      <Route path="/shared/videos/:token" element={<PublicPage><SharedVideoPage /></PublicPage>} />
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace /> : <PublicPage><LoginPage /></PublicPage>} />
      <Route path="/signup" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace /> : <PublicPage><SignupPage /></PublicPage>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><DashboardPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/clients" element={<ProtectedRoute><DashboardLayout><ClientsPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/clients/:id" element={<ProtectedRoute><DashboardLayout><ClientDetailPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><DashboardLayout><ProjectsPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/projects/:id" element={<ProtectedRoute><DashboardLayout><ProjectDetailPage /></DashboardLayout></ProtectedRoute>} />
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
      <Route path="/404" element={<PublicPage><NotFoundPage /></PublicPage>} />
      <Route path="/403" element={<PublicPage><ForbiddenPage /></PublicPage>} />
      <Route path="/500" element={<PublicPage><ServerErrorPage /></PublicPage>} />
      <Route path="/401" element={<PublicPage><UnauthorizedPage /></PublicPage>} />
      <Route path="*" element={<PublicPage><NotFoundPage /></PublicPage>} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PreferencesProvider>
          <UpgradeModalProvider>
            <PageProgress />
            <AppRoutes />
            <CookieConsent />
            <Toaster />
          </UpgradeModalProvider>
        </PreferencesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
