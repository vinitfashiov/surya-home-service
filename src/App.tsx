import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuthContext } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import CityGate from "@/components/CityGate";
import { useCityStore } from "@/lib/cityStore";
import ProtectedRoute from "@/components/ProtectedRoute";
import HomePage from "@/pages/HomePage";
import ServicesPage from "@/pages/ServicesPage";
import ServiceDetailsPage from "@/pages/ServiceDetailsPage";
import BookingPage from "@/pages/BookingPage";
import CartPage from "@/pages/CartPage";
import CheckoutPage from "@/pages/CheckoutPage";
import OrderTrackingPage from "@/pages/OrderTrackingPage";
import MyBookingsPage from "@/pages/MyBookingsPage";
import MyAddressesPage from "@/pages/MyAddressesPage";
import WishlistPage from "@/pages/WishlistPage";
import AdminLayout from "@/components/admin/AdminLayout";
import RootErrorBoundary from "./components/RootErrorBoundary";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminBookings from "@/pages/admin/AdminBookings";
import AdminCategories from "@/pages/admin/AdminCategories";
import AdminProviders from "@/pages/admin/AdminProviders";
import AdminEmployees from "@/pages/admin/AdminEmployees";
import AdminServices from "@/pages/admin/AdminServices";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminCities from "@/pages/admin/AdminCities";
import AdminZones from "@/pages/admin/AdminZones";
import AdminCheckoutFields from "@/pages/admin/AdminCheckoutFields";
import AdminCoupons from "@/pages/admin/AdminCoupons";
import AdminBanners from "@/pages/admin/AdminBanners";
import AdminPricingRules from "@/pages/admin/AdminPricingRules";
import AdminAdsPage from "@/pages/admin/AdminAdsPage";
import AdminLoginPage from "@/pages/admin/AdminLoginPage";
import AdminPayouts from "@/pages/admin/AdminPayouts";
import ProviderLayout from "@/components/provider/ProviderLayout";
import ProviderDashboard from "@/pages/provider/ProviderDashboard";
import ProviderAnalytics from "@/pages/provider/ProviderAnalytics";
import ProviderBookings from "@/pages/provider/ProviderBookings";
import ProviderEmployees from "@/pages/provider/ProviderEmployees";
import ProviderProfile from "@/pages/provider/ProviderProfile";
import ProviderAvailability from "@/pages/provider/ProviderAvailability";
import ProviderAdsPage from "@/pages/provider/ProviderAdsPage";
import ProviderBookingDetail from "@/pages/provider/ProviderBookingDetail";
import ProviderPastBookings from "@/pages/provider/ProviderPastBookings";
import ProviderHub from "@/pages/provider/ProviderHub";
import ProviderLoans from "@/pages/provider/ProviderLoans";
import ProviderOnboardingPage from "@/pages/provider/ProviderOnboardingPage";
import ProviderTraining from "@/pages/provider/ProviderTraining";
import ProviderHelp from "@/pages/provider/ProviderHelp";
import ProviderShop from "@/pages/provider/ProviderShop";
import ProviderSkillCertificate from "@/pages/provider/ProviderSkillCertificate";
import ProviderFinancialDetails from "@/pages/provider/ProviderFinancialDetails";
import ProviderAadhaarVerify from "@/pages/provider/ProviderAadhaarVerify";
import ProviderPayouts from "@/pages/provider/ProviderPayouts";
import ProfilePage from "@/pages/ProfilePage";
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import ProviderSignupPage from "@/pages/auth/ProviderSignupPage";
import ProviderLoginPage from "@/pages/auth/ProviderLoginPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import NotFound from "./pages/NotFound";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import ProviderBottomNav from "@/components/provider/ProviderBottomNav";
import { usePWA } from "@/hooks/usePWA";

const queryClient = new QueryClient();

const App = () => {
  return (
    <RootErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthProvider>
                <AppLayout />
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </RootErrorBoundary>
  );
};

const AppLayout = () => {
  usePWA();
  const { selectedCityId } = useCityStore();
  const { user } = useAuthContext();
  const location = useLocation();

  const isAdminPath = location.pathname.startsWith('/admin');
  const isProviderPath = location.pathname.startsWith('/provider');
  const isPrimaryProviderPath = ['/provider', '/provider/', '/provider/bookings', '/provider/team', '/provider/profile'].includes(location.pathname);
  const isProviderSignupPath = location.pathname === '/provider-signup';
  const isDashboardPath = isAdminPath || isProviderPath || isProviderSignupPath;

  const showCityGate = !selectedCityId && !isDashboardPath;

  // Hide navbars on checkout related pages, service details, and dashboards
  const isCheckoutPath = ['/cart', '/checkout'].includes(location.pathname);
  const isServiceDetailPath = location.pathname.startsWith('/service/');
  const hideNavs = isCheckoutPath || isServiceDetailPath || isDashboardPath;

  // New Design v2 pages (no top Navbar on mobile, uses AppHeader instead)
  // But always show Navbar on desktop so admin/provider links are accessible
  const isV2Page = ['/', '/services', '/profile'].includes(location.pathname);

  return (
    <>
      {showCityGate && <CityGate />}

      {/* Show Navbar: always on non-v2 pages; on v2 pages only on desktop (md+) */}
      {!hideNavs && !isV2Page && <Navbar />}
      {!hideNavs && isV2Page && (
        <div className="hidden md:block">
          <Navbar />
        </div>
      )}

      <div className={hideNavs ? (isDashboardPath ? "min-h-screen pb-16 md:pb-0 bg-background" : "") : "min-h-screen pb-16 md:pb-0"}>
        <Routes>
          {/* Admin Login — separate, isolated */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Admin routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute requiredRole="admin" redirectTo="/admin/login">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="providers" element={<AdminProviders />} />
            <Route path="employees" element={<AdminEmployees />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="cities" element={<AdminCities />} />
            <Route path="zones" element={<AdminZones />} />
            <Route path="checkout-fields" element={<AdminCheckoutFields />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="campaigns" element={<AdminAdsPage />} />
            <Route path="payouts" element={<AdminPayouts />} />
            <Route path="pricing-rules" element={<AdminPricingRules />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Public Provider Login */}
          <Route path="/provider/login" element={<ProviderLoginPage />} />

          {/* Provider routes */}
          <Route
            path="/provider/*"
            element={
              <ProtectedRoute requiredRole="provider" redirectTo="/provider/login">
                <ProviderLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ProviderDashboard />} />
            <Route path="onboarding" element={<ProviderOnboardingPage />} />
            <Route path="analytics" element={<ProviderAnalytics />} />
            <Route path="bookings" element={<ProviderBookings />} />
            <Route path="team" element={<ProviderEmployees />} />
            <Route path="profile" element={<ProviderProfile />} />
            <Route path="availability" element={<ProviderAvailability />} />
            <Route path="campaigns" element={<ProviderAdsPage />} />
            <Route path="booking/:bookingId" element={<ProviderBookingDetail />} />
            <Route path="past-bookings" element={<ProviderPastBookings />} />
            <Route path="hub" element={<ProviderHub />} />
            <Route path="payouts" element={<ProviderPayouts />} />
            <Route path="loans" element={<ProviderLoans />} />
            <Route path="training" element={<ProviderTraining />} />
            <Route path="help" element={<ProviderHelp />} />
            <Route path="shop" element={<ProviderShop />} />
            <Route path="skill-certificate" element={<ProviderSkillCertificate />} />
            <Route path="financial-details" element={<ProviderFinancialDetails />} />
            <Route path="verify-aadhaar" element={<ProviderAadhaarVerify />} />
          </Route>


          {/* Public / Customer routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/service/:serviceId" element={<ServiceDetailsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/booking/:serviceId" element={<BookingPage />} />
          <Route path="/order/:bookingId" element={<OrderTrackingPage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          
          {/* Static pages */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />

          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/provider-signup" element={<ProviderSignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>

      {!hideNavs && <Footer />}
      {!hideNavs && <BottomNav />}
      {isProviderPath && isPrimaryProviderPath && user && <ProviderBottomNav />}
    </>
  );
};

export default App;
