import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>

      <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>

      <div className="prose prose-sm max-w-none text-foreground space-y-6">
        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground">1. Information We Collect</h2>
          <p className="text-muted-foreground leading-relaxed">
            We collect information you provide directly: name, email, phone number, address, and payment details. We also collect usage data including device info, IP address, and browsing patterns.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground">2. How We Use Your Information</h2>
          <p className="text-muted-foreground leading-relaxed">
            Your information is used to facilitate bookings, process payments, communicate updates, improve our services, and ensure platform security. We never sell your personal data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground">3. Information Sharing</h2>
          <p className="text-muted-foreground leading-relaxed">
            We share your information with service providers to fulfill bookings, payment processors for transactions, and analytics services for platform improvement. All partners are bound by data protection agreements.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground">4. Data Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            We implement industry-standard encryption, secure data storage, and access controls. Payment processing is handled by PCI-DSS compliant processors (Razorpay).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground">5. Your Rights</h2>
          <p className="text-muted-foreground leading-relaxed">
            You may access, update, or delete your personal data at any time through your account settings. You may also request data export or account deletion by contacting support.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground">6. Cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use cookies and local storage to maintain sessions, remember preferences, and analyze usage patterns. You can control cookies through your browser settings.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground">7. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            For privacy concerns, contact our Data Protection Officer at <a href="mailto:privacy@servisgo.com" className="text-primary hover:underline">privacy@servisgo.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
