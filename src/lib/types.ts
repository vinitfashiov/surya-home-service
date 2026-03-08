export type UserRole = 'admin' | 'employee' | 'customer' | 'provider' | 'serviceman';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  serviceCount: number;
  image?: string;
}

export interface Service {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  duration: number; // minutes
  rating: number;
  reviewCount: number;
  image?: string;
  providerId: string;
  providerName: string;
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  serviceId: string;
  serviceName: string;
  providerId: string;
  providerName: string;
  servicemanId?: string;
  servicemanName?: string;
  date: string;
  time: string;
  address: string;
  status: BookingStatus;
  amount: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: string;
  notes?: string;
}

export type BookingStatus = 'pending' | 'accepted' | 'assigned' | 'on_the_way' | 'started' | 'completed' | 'cancelled';

export interface Provider {
  id: string;
  companyName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  serviceCount: number;
  servicemanCount: number;
  rating: number;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
}

export interface Serviceman {
  id: string;
  name: string;
  email: string;
  phone: string;
  providerId: string;
  providerName: string;
  skills: string[];
  rating: number;
  status: 'available' | 'busy' | 'offline';
  completedJobs: number;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  permissions: string[];
  status: 'active' | 'inactive';
  createdAt: string;
}
