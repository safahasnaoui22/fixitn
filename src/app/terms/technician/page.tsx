import Link from "next/link";
import { ArrowLeft, Shield, FileText, Wrench } from "lucide-react";

export default function TechnicianTermsPage() {
  return (
    <div className="app-content no-scrollbar">
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <Link
          href="/register"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-alt"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <p className="font-heading text-base font-semibold text-ink">
            Technician Terms & Conditions
          </p>
          <p className="text-xs text-muted">Last updated: January 2025</p>
        </div>
      </div>

      <div className="px-5 py-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-3 rounded-2xl bg-brand-navy px-4 py-4 text-white">
          <Wrench size={24} className="text-brand-orange shrink-0" />
          <div>
            <p className="font-heading text-base font-bold">
              FixiTN Technician Agreement
            </p>
            <p className="text-xs text-white/60">
              Please read carefully before creating your technician account
            </p>
          </div>
        </div>

        <Section title="1. Platform Role">
          <p>
            FixiTN provides a platform connecting you with clients who
            need professional services. You operate as an independent
            contractor — not as an employee of FixiTN. You are
            responsible for your own tools, transport, insurance, and
            compliance with Tunisian professional regulations.
          </p>
        </Section>

        <Section title="2. Account Approval">
          <ul>
            <li>
              Your account is subject to review and approval by FixiTN
              administrators before you can receive job requests.
            </li>
            <li>
              You must upload a valid CIN or passport and a relevant
              professional diploma or certification during registration.
            </li>
            <li>
              FixiTN reserves the right to decline or revoke any account
              that does not meet quality and documentation standards.
            </li>
            <li>
              Providing false documents is grounds for permanent account
              termination and may result in legal action.
            </li>
          </ul>
        </Section>

        <Section title="3. Commission & Plans">
          <ul>
            <li>
              All technicians start on the <strong>Beginner</strong> plan
              with a <strong>15% platform commission</strong> deducted
              from each completed job.
            </li>
            <li>
              The <strong>Pro</strong> plan reduces commission to{" "}
              <strong>8%</strong> and increases your visibility radius to
              clients farther away.
            </li>
            <li>
              The <strong>Senior Pro</strong> badge is automatically
              granted when you reach the platform's star rating criteria,
              set by the admin.
            </li>
            <li>
              Commission rates may be updated with 30 days' notice via
              in-app notification.
            </li>
          </ul>
        </Section>

        <Section title="4. Visit Fees & Transport">
          <ul>
            <li>
              Each service category has a fixed{" "}
              <strong>visit fee (prix de visite)</strong> set by FixiTN
              and displayed to both you and the client.
            </li>
            <li>
              Transport fees are charged at{" "}
              <strong>1 DT per kilometer</strong> from your departure
              point to the client's address. The distance is calculated
              automatically when you press the Départ button.
            </li>
            <li>
              Transport fees are collected from the client and transferred
              to you in full — no commission is deducted from transport
              fees.
            </li>
          </ul>
        </Section>

        <Section title="5. Technician Responsibilities">
          <ul>
            <li>
              You must complete accepted jobs professionally and on time.
            </li>
            <li>
              You must only accept jobs within your area of competence.
            </li>
            <li>
              You must keep your profile information accurate and
              up-to-date.
            </li>
            <li>
              You must treat all clients with respect and
              professionalism.
            </li>
            <li>
              You must not solicit clients to pay outside the platform
              to avoid fees.
            </li>
            <li>
              You must not share client personal data with third parties.
            </li>
          </ul>
        </Section>

        <Section title="6. Job Acceptance & Cancellation">
          <ul>
            <li>
              You may accept or decline any job request. Declining
              requests will not affect your account status.
            </li>
            <li>
              Repeated no-shows or cancellations after acceptance may
              result in account suspension or removal from the platform.
            </li>
            <li>
              FixiTN monitors your acceptance and completion rates and
              reserves the right to demote or suspend accounts with
              consistently poor performance.
            </li>
          </ul>
        </Section>

        <Section title="7. Payouts">
          <ul>
            <li>
              Earnings (minus commission) are credited to your FixiTN
              account after job completion and client confirmation.
            </li>
            <li>
              You may request a payout via D17, Flouci, bank transfer
              (virement bancaire), or cash.
            </li>
            <li>
              Payouts are processed within 24–48 hours of your request.
            </li>
            <li>
              FixiTN reserves the right to hold payments in case of
              active disputes or suspected fraud.
            </li>
          </ul>
        </Section>

        <Section title="8. Reviews & Ratings">
          <p>
            Clients may leave public ratings and comments after each job.
            Your average rating affects your visibility in search results
            and your eligibility for the Senior Pro badge. You may report
            reviews you believe are fraudulent or abusive to{" "}
            <span className="text-brand-orange">support@fixitn.tn</span>.
          </p>
        </Section>

        <Section title="9. Identity & Security">
          <ul>
            <li>
              Your account is protected by Face ID. You must register
              your face during onboarding to complete account setup.
            </li>
            <li>
              Logging in from a new device requires face verification to
              protect your account and earnings.
            </li>
            <li>
              You are responsible for keeping your login credentials
              confidential. Sharing your account is prohibited.
            </li>
          </ul>
        </Section>

        <Section title="10. Privacy & Data">
          <ul>
            <li>
              Your professional information (name, title, photo, rating)
              is publicly visible to clients on the platform.
            </li>
            <li>
              Your phone number is shared with clients only for the
              duration of an active service request.
            </li>
            <li>
              Your identity documents (CIN, diploma) are stored securely
              and are visible only to FixiTN administrators for
              verification purposes.
            </li>
            <li>
              Face ID data (mathematical descriptor — no photo) is stored
              securely and never shared with third parties.
            </li>
          </ul>
        </Section>

        <Section title="11. Termination">
          <p>
            FixiTN may suspend or terminate your account for violations
            of these terms, fraudulent activity, consistent poor
            performance, or conduct harmful to clients or the platform.
            You may also delete your account at any time by contacting
            support.
          </p>
        </Section>

        <Section title="12. Independent Contractor Status">
          <p>
            Your relationship with FixiTN is that of an independent
            service provider. You are solely responsible for declaring
            and paying any applicable taxes on your earnings in
            accordance with Tunisian tax law. FixiTN does not provide
            employment benefits, social security, or insurance coverage.
          </p>
        </Section>

        <Section title="13. Governing Law">
          <p>
            These terms are governed by the laws of the Republic of
            Tunisia. Any disputes shall be subject to the jurisdiction
            of Tunisian courts.
          </p>
        </Section>

        {/* Contact */}
        <div className="rounded-2xl border border-line bg-surface-alt p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={16} className="text-brand-orange" />
            <p className="text-sm font-semibold text-ink">Contact & Support</p>
          </div>
          <p className="text-sm text-muted">
            For questions about these terms or your account, contact us
            at{" "}
            <span className="text-brand-orange font-medium">
              support@fixitn.tn
            </span>{" "}
            or use the in-app support chat available from your profile.
          </p>
        </div>

        {/* Back to register */}
        <Link
          href="/register"
          className="flex w-full items-center justify-center rounded-2xl bg-brand-orange py-4 text-base font-bold text-white"
        >
          Back to Registration
        </Link>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="font-heading text-sm font-bold text-ink mb-2">
        {title}
      </p>
      <div className="text-sm text-muted leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:space-y-1.5 [&_strong]:text-ink [&_strong]:font-semibold">
        {children}
      </div>
    </div>
  );
}