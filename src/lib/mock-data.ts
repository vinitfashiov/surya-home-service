import { ServiceCategory, Service, Booking, Provider, Serviceman, Employee } from './types';

export const categories: ServiceCategory[] = [
  { id: '1', name: 'Salon & Spa', icon: 'Scissors', description: 'Haircuts, facials, massages & more', serviceCount: 24, image: '' },
  { id: '2', name: 'Electrician', icon: 'Zap', description: 'Wiring, repairs, installations', serviceCount: 18, image: '' },
  { id: '3', name: 'Plumbing', icon: 'Droplets', description: 'Pipe repairs, fixtures, drainage', serviceCount: 15, image: '' },
  { id: '4', name: 'Cleaning', icon: 'SprayCan', description: 'Home & office deep cleaning', serviceCount: 20, image: '' },
  { id: '5', name: 'Appliance Repair', icon: 'Wrench', description: 'AC, fridge, washing machine', serviceCount: 12, image: '' },
  { id: '6', name: 'Painting', icon: 'Paintbrush', description: 'Interior & exterior painting', serviceCount: 8, image: '' },
  { id: '7', name: 'Pest Control', icon: 'Bug', description: 'Termite, cockroach, mosquito', serviceCount: 10, image: '' },
  { id: '8', name: 'Carpentry', icon: 'Hammer', description: 'Furniture repair, assembly', serviceCount: 14, image: '' },
];

export const services: Service[] = [
  { id: '1', categoryId: '1', name: "Women's Haircut & Styling", description: 'Professional haircut with wash and blow-dry styling', price: 45, duration: 60, rating: 4.8, reviewCount: 234, providerId: '1', providerName: 'Glamour Studio' },
  { id: '2', categoryId: '1', name: "Men's Grooming Package", description: 'Haircut, beard trim, and facial combo', price: 35, duration: 45, rating: 4.7, reviewCount: 189, providerId: '1', providerName: 'Glamour Studio' },
  { id: '3', categoryId: '1', name: 'Full Body Massage', description: 'Relaxing 60-minute full body massage at home', price: 65, duration: 60, rating: 4.9, reviewCount: 312, providerId: '2', providerName: 'Relax & Rejuvenate' },
  { id: '4', categoryId: '2', name: 'Fan Installation', description: 'Ceiling fan installation with wiring', price: 30, duration: 45, rating: 4.6, reviewCount: 98, providerId: '3', providerName: 'PowerFix Electricals' },
  { id: '5', categoryId: '2', name: 'Switchboard Repair', description: 'Repair or replace faulty switchboards', price: 25, duration: 30, rating: 4.5, reviewCount: 67, providerId: '3', providerName: 'PowerFix Electricals' },
  { id: '6', categoryId: '3', name: 'Tap & Faucet Repair', description: 'Fix leaking taps and faucets', price: 20, duration: 30, rating: 4.4, reviewCount: 145, providerId: '4', providerName: 'AquaFix Plumbing' },
  { id: '7', categoryId: '3', name: 'Drain Cleaning', description: 'Complete drain unclogging and cleaning', price: 40, duration: 60, rating: 4.3, reviewCount: 89, providerId: '4', providerName: 'AquaFix Plumbing' },
  { id: '8', categoryId: '4', name: 'Full Home Deep Clean', description: '3BHK full home deep cleaning service', price: 120, duration: 240, rating: 4.8, reviewCount: 456, providerId: '5', providerName: 'SparkleClean Co.' },
  { id: '9', categoryId: '4', name: 'Kitchen Deep Clean', description: 'Thorough kitchen cleaning with chimney', price: 50, duration: 120, rating: 4.7, reviewCount: 234, providerId: '5', providerName: 'SparkleClean Co.' },
  { id: '10', categoryId: '5', name: 'AC Service & Repair', description: 'Complete AC service with gas refill', price: 55, duration: 90, rating: 4.6, reviewCount: 178, providerId: '6', providerName: 'CoolTech Services' },
  { id: '11', categoryId: '6', name: 'Room Painting (1 Room)', description: 'Complete single room painting with primer', price: 150, duration: 480, rating: 4.5, reviewCount: 56, providerId: '7', providerName: 'ColorCraft Painters' },
  { id: '12', categoryId: '7', name: 'General Pest Control', description: 'Full home pest control treatment', price: 60, duration: 120, rating: 4.7, reviewCount: 201, providerId: '8', providerName: 'BugFree Solutions' },
];

export const bookings: Booking[] = [
  { id: 'BK001', customerId: '1', customerName: 'Sarah Johnson', serviceId: '1', serviceName: "Women's Haircut & Styling", providerId: '1', providerName: 'Glamour Studio', servicemanId: 'SM1', servicemanName: 'Emily Rose', date: '2026-03-10', time: '10:00 AM', address: '123 Oak Street, Apt 4B', status: 'accepted', amount: 45, paymentStatus: 'paid', createdAt: '2026-03-07' },
  { id: 'BK002', customerId: '2', customerName: 'Mike Chen', serviceId: '4', serviceName: 'Fan Installation', providerId: '3', providerName: 'PowerFix Electricals', servicemanId: 'SM3', servicemanName: 'David Kumar', date: '2026-03-09', time: '2:00 PM', address: '456 Elm Ave', status: 'on_the_way', amount: 30, paymentStatus: 'paid', createdAt: '2026-03-07' },
  { id: 'BK003', customerId: '3', customerName: 'Lisa Park', serviceId: '8', serviceName: 'Full Home Deep Clean', providerId: '5', providerName: 'SparkleClean Co.', date: '2026-03-11', time: '9:00 AM', address: '789 Pine Road, Unit 12', status: 'pending', amount: 120, paymentStatus: 'pending', createdAt: '2026-03-08' },
  { id: 'BK004', customerId: '4', customerName: 'James Wilson', serviceId: '10', serviceName: 'AC Service & Repair', providerId: '6', providerName: 'CoolTech Services', servicemanId: 'SM5', servicemanName: 'Raj Patel', date: '2026-03-08', time: '11:00 AM', address: '321 Maple Drive', status: 'started', amount: 55, paymentStatus: 'paid', createdAt: '2026-03-06' },
  { id: 'BK005', customerId: '1', customerName: 'Sarah Johnson', serviceId: '3', serviceName: 'Full Body Massage', providerId: '2', providerName: 'Relax & Rejuvenate', servicemanId: 'SM2', servicemanName: 'Priya Sharma', date: '2026-03-05', time: '3:00 PM', address: '123 Oak Street, Apt 4B', status: 'completed', amount: 65, paymentStatus: 'paid', createdAt: '2026-03-03' },
];

export const providers: Provider[] = [
  { id: '1', companyName: 'Glamour Studio', ownerName: 'Anna Williams', email: 'anna@glamour.com', phone: '+1-555-0101', address: '100 Beauty Lane', serviceCount: 6, servicemanCount: 4, rating: 4.8, status: 'active', createdAt: '2025-06-15' },
  { id: '2', companyName: 'Relax & Rejuvenate', ownerName: 'Tom Brown', email: 'tom@relax.com', phone: '+1-555-0102', address: '200 Spa Street', serviceCount: 4, servicemanCount: 3, rating: 4.9, status: 'active', createdAt: '2025-07-20' },
  { id: '3', companyName: 'PowerFix Electricals', ownerName: 'David Kumar', email: 'david@powerfix.com', phone: '+1-555-0103', address: '300 Volt Road', serviceCount: 5, servicemanCount: 6, rating: 4.6, status: 'active', createdAt: '2025-08-10' },
  { id: '4', companyName: 'AquaFix Plumbing', ownerName: 'Robert Singh', email: 'robert@aquafix.com', phone: '+1-555-0104', address: '400 Water Way', serviceCount: 4, servicemanCount: 3, rating: 4.4, status: 'active', createdAt: '2025-09-05' },
  { id: '5', companyName: 'SparkleClean Co.', ownerName: 'Maria Garcia', email: 'maria@sparkle.com', phone: '+1-555-0105', address: '500 Clean Ave', serviceCount: 5, servicemanCount: 8, rating: 4.8, status: 'active', createdAt: '2025-10-12' },
  { id: '6', companyName: 'CoolTech Services', ownerName: 'Kevin Lee', email: 'kevin@cooltech.com', phone: '+1-555-0106', address: '600 AC Blvd', serviceCount: 3, servicemanCount: 4, rating: 4.6, status: 'pending', createdAt: '2026-01-20' },
];

export const servicemen: Serviceman[] = [
  { id: 'SM1', name: 'Emily Rose', email: 'emily@glamour.com', phone: '+1-555-1001', providerId: '1', providerName: 'Glamour Studio', skills: ['Haircut', 'Styling', 'Coloring'], rating: 4.9, status: 'busy', completedJobs: 156 },
  { id: 'SM2', name: 'Priya Sharma', email: 'priya@relax.com', phone: '+1-555-1002', providerId: '2', providerName: 'Relax & Rejuvenate', skills: ['Massage', 'Spa', 'Facial'], rating: 4.8, status: 'available', completedJobs: 203 },
  { id: 'SM3', name: 'David Kumar', email: 'david.k@powerfix.com', phone: '+1-555-1003', providerId: '3', providerName: 'PowerFix Electricals', skills: ['Wiring', 'Fan Install', 'Switchboard'], rating: 4.7, status: 'busy', completedJobs: 89 },
  { id: 'SM4', name: 'Ali Hassan', email: 'ali@aquafix.com', phone: '+1-555-1004', providerId: '4', providerName: 'AquaFix Plumbing', skills: ['Pipe Repair', 'Drain', 'Fixture'], rating: 4.5, status: 'available', completedJobs: 67 },
  { id: 'SM5', name: 'Raj Patel', email: 'raj@cooltech.com', phone: '+1-555-1005', providerId: '6', providerName: 'CoolTech Services', skills: ['AC Repair', 'AC Install', 'Gas Refill'], rating: 4.6, status: 'busy', completedJobs: 124 },
];

export const employees: Employee[] = [
  { id: 'E1', name: 'John Admin', email: 'john@servisgo.com', phone: '+1-555-2001', role: 'Booking Manager', permissions: ['bookings', 'customers'], status: 'active', createdAt: '2025-05-01' },
  { id: 'E2', name: 'Kate Support', email: 'kate@servisgo.com', phone: '+1-555-2002', role: 'Customer Support', permissions: ['bookings', 'customers', 'providers'], status: 'active', createdAt: '2025-06-15' },
  { id: 'E3', name: 'Sam Operations', email: 'sam@servisgo.com', phone: '+1-555-2003', role: 'Operations Lead', permissions: ['bookings', 'customers', 'providers', 'categories', 'services'], status: 'active', createdAt: '2025-07-20' },
];

export const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  accepted: 'bg-info/10 text-info',
  assigned: 'bg-info/10 text-info',
  on_the_way: 'bg-primary/10 text-primary',
  started: 'bg-accent/10 text-accent',
  completed: 'bg-success/10 text-success',
  cancelled: 'bg-destructive/10 text-destructive',
};
