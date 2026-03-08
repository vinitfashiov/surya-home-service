import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
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
import AdminLayout from "@/components/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminBookings from "@/pages/admin/AdminBookings";
import AdminCategories from "@/pages/admin/AdminCategories";
import AdminProviders from "@/pages/admin/AdminProviders";
import AdminEmployees from "@/pages/admin/AdminEmployees";
import AdminServices from "@/pages/admin/AdminServices";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminCities from "@/pages/admin/AdminCities";
import AdminCheckoutFields from "@/pages/admin/AdminCheckoutFields";
import AdminCoupons from "@/pages/admin/AdminCoupons";
import AdminBanners from "@/pages/admin/AdminBanners";
import AdminPricingRules from "@/pages/admin/AdminPricingRules";
import ProviderDashboard from "@/pages/provider/ProviderDashboard";
import ProviderAnalytics from "@/pages/provider/ProviderAnalytics";
import ProfilePage from "@/pages/ProfilePage";
import ProviderBookings from "@/pages/provider/ProviderBookings";
import ProviderServicemen from "@/pages/provider/ProviderServicemen";
import ProviderProfile from "@/pages/provider/ProviderProfile";
import ProviderAvailability from "@/pages/provider/ProviderAvailability";
import ServicemanDashboard from "@/pages/serviceman/ServicemanDashboard";
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import ProviderSignupPage from "@/pages/auth/ProviderSignupPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Admin routes */}
            <Route
              path="/admin"
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
              <Route path="checkout-fields" element={<AdminCheckoutFields />} />
              <Route path="coupons" element={<AdminCoupons />} />
              <Route path="banners" element={<AdminBanners />} />
              <Route path="pricing-rules" element={<AdminPricingRules />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* Public / customer routes */}
            <Route
              path="*"
              element={
                <>
                  <Navbar />
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/services" element={<ServicesPage />} />
                    <Route path="/service/:serviceId" element={<ServiceDetailsPage />} />
                    <Route path="/book/:serviceId" element={<BookingPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/order/:bookingId" element={<OrderTrackingPage />} />
                    <Route path="/my-bookings" element={<MyBookingsPage />} />
                    <Route path="/my-addresses" element={<MyAddressesPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/provider-signup" element={<ProviderSignupPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/provider" element={<ProviderDashboard />} />
                    <Route path="/provider/analytics" element={<ProviderAnalytics />} />
                    <Route path="/provider/bookings" element={<ProviderBookings />} />
                    <Route path="/provider/servicemen" element={<ProviderServicemen />} />
                    <Route path="/provider/profile" element={<ProviderProfile />} />
                    <Route path="/provider/availability" element={<ProviderAvailability />} />
                    <Route path="/serviceman" element={<ServicemanDashboard />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
