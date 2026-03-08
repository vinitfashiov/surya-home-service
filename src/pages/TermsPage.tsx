import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>

      <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>

      <div className="prose prose-sm max-w-none text-foreground space-y-6">
        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            By accessing or using ServisGo ("Platform"), you agree to be bound by these Terms of Service. If you do not agree, please do not use our Platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground">2. Services</h2>
          <p className="text-muted-foreground leading-relaxed">
            ServisGo is a marketplace that connects customers with independent service providers. We facilitate booking, payment, and communication but are not responsible for the quality of services rendered by providers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground">3. User Accounts</h2>
          <p className="text-muted-foreground leading-relaxed">
            You must provide accurate information during registration. You are responsible for maintaining the confidentiality of your credentials and for all activities under your account.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground">4. Bookings & Payments</h2>
          <p className="text-muted-foreground leading-relaxed">
            All bookings are subject to provider availability. Payments are processed securely through Razorpay. Cancellation and refund policies apply as specified at the time of booking.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground">5. Provider Responsibilities</h2>
          <p className="text-muted-foreground leading-relaxed">
            Service providers are independent contractors. They are solely responsible for the quality, safety, and legality of their services. ServisGo does not employ or supervise providers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground">6. Limitation of Liability</h2>
          <p className="text-muted-foreground leading-relaxed">
            ServisGo shall not be liable for any indirect, incidental, or consequential damages arising from the use of our Platform or services booked through it.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground">7. Changes to Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            We reserve the right to modify these terms at any time. Continued use of the Platform after changes constitutes acceptance of the revised terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground">8. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            For questions regarding these Terms, contact us at <a href="mailto:legal@servisgo.com" className="text-primary hover:underline">legal@servisgo.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
