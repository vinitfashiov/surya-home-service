import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HomePage from "@/pages/HomePage";
import ServicesPage from "@/pages/ServicesPage";
import BookingPage from "@/pages/BookingPage";
import MyBookingsPage from "@/pages/MyBookingsPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminBookings from "@/pages/admin/AdminBookings";
import AdminCategories from "@/pages/admin/AdminCategories";
import AdminProviders from "@/pages/admin/AdminProviders";
import AdminEmployees from "@/pages/admin/AdminEmployees";
import ProviderDashboard from "@/pages/provider/ProviderDashboard";
import ProviderBookings from "@/pages/provider/ProviderBookings";
import ProviderServicemen from "@/pages/provider/ProviderServicemen";
import ServicemanDashboard from "@/pages/serviceman/ServicemanDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/book/:serviceId" element={<BookingPage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/bookings" element={<AdminBookings />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/providers" element={<AdminProviders />} />
          <Route path="/admin/employees" element={<AdminEmployees />} />
          <Route path="/provider" element={<ProviderDashboard />} />
          <Route path="/provider/bookings" element={<ProviderBookings />} />
          <Route path="/provider/servicemen" element={<ProviderServicemen />} />
          <Route path="/serviceman" element={<ServicemanDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
