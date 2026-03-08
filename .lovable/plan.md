

# Enterprise-Level Upgrade Plan for ServisGo

This plan addresses **critical security vulnerabilities**, **missing enterprise features**, and **UI/UX professionalism gaps** to bring ServisGo to production-ready, enterprise-grade quality.

---

## Phase 1: Critical Security Fixes (Highest Priority)

### 1.1 Fix Broken RLS Policies (CRITICAL)
The security scan found that **all 69 RLS policies are RESTRICTIVE** instead of PERMISSIVE. In PostgreSQL, RESTRICTIVE policies without any PERMISSIVE policies means RLS effectively **denies all access**. The app only works because it's bypassing RLS via the service_role key.

- Convert all access-granting policies (e.g., "Users read own profile", "Customers read own bookings") from RESTRICTIVE to PERMISSIVE
- Keep truly restrictive policies (narrowing ones) as RESTRICTIVE
- This is a single SQL migration touching all 26 tables

### 1.2 Fix Exposed Sensitive Data
- **Providers table**: Add `status = 'active'` filter to the public SELECT policy; create a Postgres view or column-level security to hide email/phone/address from unauthenticated users
- **Servicemen table**: Same treatment — restrict email/phone to authenticated users with a booking relationship
- **Platform settings**: Replace blanket `true` SELECT with an allowlist of public keys

### 1.3 Enable Leaked Password Protection
- Enable HaveIBeenPwned integration via Supabase Dashboard (Authentication > Settings > Security)

---

## Phase 2: Missing Enterprise Features

### 2.1 Payment Integration
- Integrate Razorpay or Stripe for real payment processing
- Add payment status tracking, refund flow for cancellations
- Create an Edge Function to handle payment webhooks securely

### 2.2 Email/SMS Notifications
- Create Edge Functions for transactional emails (booking confirmation, status updates, password reset)
- Integrate with an email service (Resend, SendGrid) via Edge Functions
- Add SMS notifications for booking updates (Twilio/MSG91)

### 2.3 Image Upload & Storage
- Create Supabase storage buckets for service images, provider logos, user avatars
- Add image upload components to admin service/category forms and provider/user profiles
- Implement image optimization and CDN delivery

### 2.4 Cross-User Notification Edge Function
- Create an Edge Function for server-side notifications (provider notified when customer books, customer notified when status changes)
- Use service_role key inside the function to bypass the new restricted INSERT policy

### 2.5 Invoice & Receipt Generation
- Auto-generate PDF invoices after booking completion
- Add download/email invoice functionality to booking details

### 2.6 Advanced Analytics
- Add date range filters, charts (Recharts is already installed), and export to CSV on both admin and provider dashboards
- Track conversion rates, repeat customers, revenue trends

---

## Phase 3: UI/UX Professionalism

### 3.1 Dark Mode Support
- The CSS already has `.dark` variables defined but no toggle exists
- Add a theme toggle to Navbar and Admin header using `next-themes` (already installed)

### 3.2 Responsive Mobile Polish
- Audit all pages at 375px viewport
- Fix mobile navigation (hamburger menu), checkout form layout, admin tables (horizontal scroll)
- Add bottom navigation bar for mobile customers

### 3.3 Loading & Error States
- Add consistent error boundaries with retry buttons
- Replace raw `confirm()` dialogs with proper AlertDialog components
- Add empty state illustrations for zero-data screens

### 3.4 Footer & Legal Pages
- Build a proper footer with links to Terms, Privacy Policy, About, Contact
- Add static pages for legal content

### 3.5 Accessibility
- Add proper aria-labels, keyboard navigation, focus indicators
- Ensure color contrast meets WCAG AA standards

### 3.6 Admin UI Enhancements
- Add bulk actions (select multiple bookings/providers for status change)
- Add data export (CSV) for bookings, providers, revenue
- Add audit log for admin actions

---

## Phase 4: Business Logic Hardening

### 4.1 Provider Onboarding Improvements
- Document verification upload during registration
- Multi-step onboarding with progress indicator
- Auto-assign `provider` role on admin approval (currently only `customer` role exists)

### 4.2 Service Discovery
- Add subcategory filtering, price range filter, sort options
- Location-based search with area/pincode filtering
- "Recently viewed" and "Recommended for you" sections

### 4.3 Booking Workflow
- Implement OTP verification before booking confirmation
- Add rescheduling (change date/time) without cancelling
- Real-time status push notifications via Supabase Realtime (partially done)

### 4.4 Review System
- Add photo reviews
- Provider response to reviews
- Verified purchase badge on reviews

---

## Recommended Implementation Order

| Priority | Phase | Estimated Steps |
|----------|-------|----------------|
| 1 | Fix RLS policies (1.1) | 1 migration |
| 2 | Fix data exposure (1.2) | 1 migration |
| 3 | Dark mode toggle (3.1) | 1-2 files |
| 4 | Payment integration (2.1) | Edge function + UI |
| 5 | Email notifications (2.2) | Edge function |
| 6 | Image uploads (2.3) | Storage + components |
| 7 | Mobile polish (3.2) | Multiple pages |
| 8 | Cross-user notifications (2.4) | Edge function |
| 9 | Provider role assignment (4.1) | Migration + logic |
| 10 | Analytics charts (2.6) | Dashboard pages |

The **RLS fix is urgent** — without it, the database access controls are effectively non-functional. I recommend starting there immediately, then working through payments and notifications as the next high-impact features.

