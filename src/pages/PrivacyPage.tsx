import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>

      <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
        Privacy Policy – Surya Home Service's
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Last Updated: September 2026
      </p>

      <div className="prose prose-sm max-w-none text-foreground space-y-6">
        <p className="text-muted-foreground leading-relaxed">
          This Privacy Policy applies to the Surya Home Service's mobile application (“App”), developed and published by AEC Technology.
        </p>

        <div className="bg-muted/40 p-4 rounded-lg space-y-1 text-sm border">
          <p><strong>Package Name:</strong> surya.storek.com</p>
          <p><strong>Contact Email:</strong> <a href="mailto:operations.storekriti@gmail.com" className="text-primary hover:underline">operations.storekriti@gmail.com</a></p>
        </div>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground">1. Information We Collect</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may collect information you provide, such as your name, phone number, email address, service address, booking details, and other information required to provide home services.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-2">
            We may also collect limited device and technical information required for app security, authentication, performance, and service delivery.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground">2. How We Use Your Information</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use your information to create and manage your account, authenticate your phone number, process service bookings, communicate booking updates, provide customer support, improve our services, and maintain app security.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground">3. Information Sharing</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may share information with service professionals or service providers only when necessary to fulfill your requested service. We may also use third-party service providers for authentication, payment processing, hosting, analytics, or notifications where applicable.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-2">
            We do not sell users' personal information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground">4. Payments</h2>
          <p className="text-muted-foreground leading-relaxed">
            If payments are available in the App, payment processing may be handled by our payment service provider. We do not store complete card or banking credentials on our servers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground">5. Data Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use reasonable technical and organizational safeguards to protect users' personal information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground">6. Data Retention and Deletion</h2>
          <p className="text-muted-foreground leading-relaxed">
            We retain personal information only for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and maintain security.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-2">
            Users may request deletion of their account and associated personal data from within the App or through our account-deletion web page/contact method.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground">7. Account Deletion</h2>
          <p className="text-muted-foreground leading-relaxed">
            Users can request permanent deletion of their Surya Home Service's account and associated data through this link-{' '}
            <a
              href="https://suryahomeservice.in/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium break-all"
            >
              https://suryahomeservice.in/contact
            </a>{' '}
            (user can contact us for account or data deletion).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground">8. Children's Privacy</h2>
          <p className="text-muted-foreground leading-relaxed">
            Surya Home Service's is not intended for children under 13, and we do not knowingly collect personal information from children under 13.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground">9. Changes to This Privacy Policy</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update this Privacy Policy periodically. Any changes will be posted on this page with an updated effective date.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground">10. Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            For privacy-related questions or account-deletion requests, contact:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
            <li><strong>App:</strong> Surya Home Service's</li>
            <li><strong>Developer:</strong> AEC Technology</li>
            <li><strong>Email:</strong> <a href="mailto:operations.storekriti@gmail.com" className="text-primary hover:underline">operations.storekriti@gmail.com</a></li>
          </ul>
        </section>
      </div>
    </div>
  );
}
