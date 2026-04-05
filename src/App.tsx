import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
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
import ProviderLayout from "@/components/provider/ProviderLayout";
import ProviderDashboard from "@/pages/provider/ProviderDashboard";
import ProviderAnalytics from "@/pages/provider/ProviderAnalytics";
import ProviderBookings from "@/pages/provider/ProviderBookings";
import ProviderServicemen from "@/pages/provider/ProviderServicemen";
import ProviderEmployees from "@/pages/provider/ProviderEmployees";
import ProviderProfile from "@/pages/provider/ProviderProfile";
import ProviderAvailability from "@/pages/provider/ProviderAvailability";
import ProviderAdsPage from "@/pages/provider/ProviderAdsPage";
import ProfilePage from "@/pages/ProfilePage";
import ServicemanDashboard from "@/pages/serviceman/ServicemanDashboard";
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import ProviderSignupPage from "@/pages/auth/ProviderSignupPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import NotFound from "./pages/NotFound";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";

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
  const { selectedCityId } = useCityStore();
  const showCityGate = !selectedCityId;
  const location = useLocation();

  // Hide navbars on checkout related pages and service details
  const isCheckoutPath = ['/cart', '/checkout'].includes(location.pathname);
  const isServiceDetailPath = location.pathname.startsWith('/service/');
  const hideNavs = isCheckoutPath || isServiceDetailPath;

  // New Design v2 pages (no top Navbar, uses AppHeader instead)
  const isV2Page = ['/', '/services', '/profile'].includes(location.pathname);

  return (
    <>
      {showCityGate && <CityGate />}
      
      {/* Show main Navbar only on desktop and legacy pages */}
      {!hideNavs && !isV2Page && <Navbar />}

      <div className={hideNavs ? "" : "min-h-screen pb-16 md:pb-0"}>
        <Routes>
          {/* Admin routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute requiredRole="admin">
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
            <Route path="pricing-rules" element={<AdminPricingRules />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Provider routes */}
          <Route path="/provider/*" element={<ProviderLayout />}>
            <Route index element={<ProviderDashboard />} />
            <Route path="analytics" element={<ProviderAnalytics />} />
            <Route path="bookings" element={<ProviderBookings />} />
            <Route path="servicemen" element={<ProviderServicemen />} />
            <Route path="team" element={<ProviderEmployees />} />
            <Route path="profile" element={<ProviderProfile />} />
            <Route path="availability" element={<ProviderAvailability />} />
            <Route path="campaigns" element={<ProviderAdsPage />} />
          </Route>

          {/* Employee/Serviceman routes */}
          <Route path="/serviceman" element={<ServicemanDashboard />} />

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
    </>
  );
};

export default App;
