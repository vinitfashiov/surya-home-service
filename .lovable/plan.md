

# ServisGo Platform Evolution Plan: From Basic Booking to Multi-Category Marketplace

## Current State Summary

ServisGo is a functional home-services booking platform with:
- 5 user roles (Admin, Employee, Customer, Provider, Serviceman)
- Service categories, services, cart, checkout, booking lifecycle
- Order tracking with real-time Supabase subscriptions
- Provider onboarding, profile management, commission system
- Coupon system, cancellation rules, reviews, address management
- Admin dashboard with settings, CRUD for categories/services/providers/employees

**What's missing** to become a high-level multi-vertical marketplace (weddings, cabs, hotels, DJs, webinars, etc.):

---

## Phase 1: Flexible Category System with Custom Checkout Fields

The biggest architectural gap. Currently, all services follow the same checkout flow (pick date, time, address). Wedding services need guest count + venue. Cab services need pickup/drop + distance. Hotels need check-in/check-out dates + rooms.

### 1A. Category-Level Custom Fields (Database)

Create a `category_checkout_fields` table:
```
id, category_id, field_name, field_label, field_type (text/number/date/select/textarea/location),
options (jsonb for select dropdowns), is_required, display_order, placeholder
```

Examples:
- **Wedding Services**: guest_count (number), venue_address (text), event_date (date), event_type (select: wedding/reception/sangeet)
- **Cab Services**: pickup_location (location), drop_location (location), trip_type (select: one-way/round-trip), vehicle_type (select)
- **Hotel Booking**: check_in_date (date), check_out_date (date), rooms (number), guests_per_room (number)
- **DJ Services**: event_type (select), hours_needed (number), equipment_required (select: basic/premium/full)
- **Bus Rental**: pickup_point (location), destination (location), passenger_count (number), bus_type (select)
- **Webinar/Events**: platform (select: zoom/meet/offline), expected_attendees (number), duration_hours (number)

Store booking answers in a `booking_custom_fields` table:
```
id, booking_id, field_id, field_value (text)
```

### 1B. Dynamic Checkout Form

Modify `CheckoutPage.tsx` to:
1. Fetch `category_checkout_fields` for each service's category
2. Render dynamic form inputs based on field_type
3. Validate required fields before booking
4. Save responses to `booking_custom_fields`

### 1C. Category Display Enhancement

Add `category_type` enum to `service_categories`:
- `standard` (date+time+address, current behavior)
- `event` (date+time+venue+guest count)
- `transport` (pickup+drop+date+time)
- `accommodation` (check-in/check-out+rooms)
- `virtual` (date+time, no address needed)

This controls which base checkout sections appear.

---

## Phase 2: Enhanced Service & Category Architecture

### 2A. Sub-Categories
Create `service_subcategories` table:
```
id, category_id, name, description, icon, is_active
```
Example: Category "Wedding Services" → Sub-categories: Catering, Decoration, Photography, Makeup, Mehendi

### 2B. Service Variants & Packages
Create `service_variants` table:
```
id, service_id, name, description, price, duration
```
Example: "Wedding Photography" → Basic (4hrs, ₹15K), Premium (8hrs, ₹30K), Luxury (full day, ₹50K)

### 2C. Service Media Gallery
Create `service_media` table:
```
id, service_id, media_url, media_type (image/video), display_order
```
Create a Supabase storage bucket `service-images` for uploads.

### 2D. Service FAQ
Create `service_faqs` table:
```
id, service_id, question, answer, display_order
```

---

## Phase 3: Advanced Pricing Engine

### 3A. Dynamic Pricing Rules
Create `pricing_rules` table:
```
id, service_id, rule_type (per_hour/per_km/per_guest/per_day/flat/tiered),
base_price, unit_price, min_units, max_units
```

This enables:
- **Cab**: ₹12/km with ₹50 base fare
- **Hotel**: ₹2000/night/room
- **DJ**: ₹5000/hour
- **Wedding catering**: ₹500/guest

### 3B. Checkout Price Calculator
Build a `useDynamicPrice` hook that reads pricing_rules + custom field values to compute price dynamically. Replace hardcoded `service.price` in checkout.

### 3C. Seasonal/Surge Pricing
Create `pricing_overrides` table:
```
id, service_id, start_date, end_date, multiplier, reason
```
Example: 2x pricing during wedding season (Nov-Feb).

---

## Phase 4: Payment Integration

### 4A. Stripe/Razorpay Integration
- Create an Edge Function `create-payment-intent` for server-side payment processing
- Support payment methods: UPI, cards, net banking, wallets
- Handle payment confirmation and update `payment_status`

### 4B. Partial Payments & Deposits
Add to bookings: `deposit_amount`, `balance_due`, `deposit_paid_at`
For large bookings (weddings, events), collect 20-50% upfront.

### 4C. Refund System
Create `refunds` table:
```
id, booking_id, amount, reason, status, processed_at
```

---

## Phase 5: Provider & Serviceman Upgrades

### 5A. Provider Portfolio
Create `provider_portfolio` table for showcasing past work (images, descriptions).

### 5B. Provider Availability Calendar
Create `provider_availability` table:
```
id, provider_id, date, is_available, start_time, end_time, max_bookings
```
Providers can block dates, set custom hours.

### 5C. Provider Analytics Dashboard
Add revenue charts (using existing Recharts), booking trends, top services, customer demographics.

### 5D. Serviceman App Features
- Real-time location tracking (store lat/lng in bookings)
- Job acceptance/rejection flow
- Earnings dashboard

---

## Phase 6: Customer Experience

### 6A. Search & Discovery Overhaul
- Full-text search across services, categories, providers
- Filters: price range, rating, duration, city, availability
- Sort: price, rating, popularity, newest

### 6B. Wishlist/Favorites
Create `favorites` table:
```
id, user_id, service_id, created_at
```

### 6C. Customer Profile Page
- Edit name, phone, avatar
- View booking stats, total spent
- Loyalty points system

### 6D. Notifications Enhancement
- Push notification support via service workers
- Email notifications via Supabase Edge Functions (booking confirmation, status updates, promotions)
- SMS integration (Twilio)

### 6E. Chat/Messaging System
Create `messages` table for customer-provider communication:
```
id, booking_id, sender_id, receiver_id, message, created_at, is_read
```

---

## Phase 7: Platform Intelligence

### 7A. Recommendation Engine
- "Similar services" based on category
- "Frequently booked together" based on cart history
- "Popular in your city"

### 7B. Admin Analytics
- Revenue charts with date range filters
- Category-wise revenue breakdown
- Provider performance leaderboard
- Customer acquisition funnel
- Geographic heat maps

### 7C. Admin Coupon Management Page
Currently coupons exist in DB but have no admin UI. Build full CRUD page at `/admin/coupons`.

---

## Phase 8: Multi-Language & Multi-Currency

### 8A. i18n Support
- Add react-i18next for translations
- Support Hindi, English, regional languages

### 8B. Dynamic Currency
- Use `platform_settings.currency` to format all prices
- Currency conversion for international services

---

## Phase 9: SEO & Marketing

### 9A. SEO Pages
- Category landing pages with meta tags
- City-specific service pages (`/services/delhi/wedding-photography`)
- Blog/content section for organic traffic

### 9B. Referral System
Create `referrals` table:
```
id, referrer_id, referred_id, referral_code, reward_amount, status
```

### 9C. Promotional Banners
Create `banners` table for homepage carousels managed by admin.

---

## Recommended Implementation Order

| Priority | Phase | Effort | Impact |
|----------|-------|--------|--------|
| 1 | 1A-1C: Custom checkout fields | High | Critical - enables multi-vertical |
| 2 | 2A-2B: Sub-categories & variants | Medium | High - proper service organization |
| 3 | 7C: Admin coupon management | Low | Medium - completes existing feature |
| 4 | 6A: Search & filters | Medium | High - customer discovery |
| 5 | 3A-3B: Dynamic pricing | Medium | High - enables per-km/per-guest pricing |
| 6 | 5B: Provider availability | Medium | High - realistic scheduling |
| 7 | 4A: Payment integration | High | Critical - real transactions |
| 8 | 2C-2D: Media gallery & FAQ | Low | Medium - service detail richness |
| 9 | 6B-6C: Wishlist & profile | Low | Medium - engagement |
| 10 | 5C: Provider analytics | Medium | Medium - provider retention |
| 11 | 6D-6E: Notifications & chat | High | High - communication |
| 12 | 3C: Seasonal pricing | Low | Medium - revenue optimization |
| 13 | 7A-7B: Recommendations & analytics | High | High - intelligence |
| 14 | 4B-4C: Deposits & refunds | Medium | Medium - large bookings |
| 15 | 8-9: i18n, SEO, marketing | High | Long-term growth |

---

## Technical Notes

- All new tables need RLS policies following existing `has_role()` pattern
- Custom checkout fields require a new migration + dynamic form renderer component
- The `category_type` field is the single most important change - it determines how the checkout flow behaves per service vertical
- Storage bucket needed for service images (currently only URL-based)
- Edge Functions needed for payment processing and email notifications
- Current `bookings` table structure is sufficient for most verticals; custom fields handle the rest via the `booking_custom_fields` join table

This plan transforms ServisGo from a home-services platform into a universal service marketplace capable of handling any category from plumbing to weddings to cab rentals.

