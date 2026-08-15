import Link from "next/link";
import { ArrowLeft, Shield, FileText } from "lucide-react";

export default function ClientTermsPage() {
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
            Client Terms & Conditions
          </p>
          <p className="text-xs text-muted">Last updated: January 2025</p>
        </div>
      </div>

      <div className="px-5 py-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-3 rounded-2xl bg-brand-navy px-4 py-4 text-white">
          <FileText size={24} className="text-brand-orange shrink-0" />
          <div>
            <p className="font-heading text-base font-bold">
              FixiTN Client Agreement
            </p>
            <p className="text-xs text-white/60">
              Please read carefully before creating your account
            </p>
          </div>
        </div>

        <Section title="1. Service Description">
          <p>
            FixiTN is an online marketplace that connects clients with
            qualified technicians across Tunisia. FixiTN acts as an
            intermediary platform and is not directly responsible for
            the quality of work performed by technicians.
          </p>
        </Section>

        <Section title="2. Client Responsibilities">
          <ul>
            <li>
              You must provide accurate information when creating your
              account and when submitting service requests.
            </li>
            <li>
              You are responsible for being present or available at the
              address provided at the agreed time.
            </li>
            <li>
              You must treat all technicians with respect and
              professionalism.
            </li>
            <li>
              You agree not to contact technicians outside of the
              platform to circumvent fees.
            </li>
            <li>
              You are responsible for ensuring a safe working environment
              for the technician.
            </li>
          </ul>
        </Section>

        <Section title="3. Booking & Payment">
          <ul>
            <li>
              A <strong>visit fee</strong> (prix de visite) is charged
              per service category, set by the platform, and visible
              before booking.
            </li>
            <li>
              Transport fees are calculated at <strong>1 DT per km</strong>{" "}
              based on the actual distance traveled by the technician to
              your location.
            </li>
            <li>
              Additional labor costs are agreed directly between you and
              the technician before work begins.
            </li>
            <li>
              Payments are made directly to the technician via D17,
              Flouci, bank transfer, or cash.
            </li>
          </ul>
        </Section>

        <Section title="4. Cancellation Policy">
          <ul>
            <li>
              You may cancel a pending request at any time before the
              technician accepts it at no charge.
            </li>
            <li>
              Cancellations after acceptance may result in a partial
              visit fee being charged.
            </li>
            <li>
              Repeated cancellations may result in account suspension.
            </li>
          </ul>
        </Section>

        <Section title="5. Reviews & Ratings">
          <p>
            After each completed job, you may leave an honest review and
            rating. Reviews must be truthful and based on your actual
            experience. Fake or malicious reviews are prohibited and may
            result in account suspension.
          </p>
        </Section>

        <Section title="6. Privacy & Data">
          <ul>
            <li>
              Your personal data is collected and processed in accordance
              with Tunisian Law No. 2004-63 on Personal Data Protection.
            </li>
            <li>
              Your phone number and address are shared with the assigned
              technician solely for the purpose of completing your service
              request.
            </li>
            <li>
              Face ID data (mathematical descriptor only — no photo) is
              stored securely and never shared with third parties.
            </li>
            <li>
              You may request deletion of your data at any time by
              contacting{" "}
              <span className="text-brand-orange">support@fixitn.tn</span>.
            </li>
          </ul>
        </Section>

        <Section title="7. Prohibited Uses">
          <p>You agree not to use FixiTN to:</p>
          <ul>
            <li>Post false, misleading, or fraudulent requests.</li>
            <li>Harass, threaten, or discriminate against technicians.</li>
            <li>
              Solicit technicians to work outside the platform to avoid
              fees.
            </li>
            <li>
              Create multiple accounts to abuse promotions or ratings.
            </li>
          </ul>
        </Section>

        <Section title="8. Limitation of Liability">
          <p>
            FixiTN is not liable for damages resulting from the work of
            technicians, delays, or failure to complete a job. We
            strongly recommend verifying that technicians are appropriate
            for your specific needs before confirming a booking.
          </p>
        </Section>

        <Section title="9. Dispute Resolution">
          <p>
            In case of a dispute with a technician, please contact our
            support team at{" "}
            <span className="text-brand-orange">support@fixitn.tn</span>.
            We will review the case and mediate where possible. FixiTN
            reserves the right to suspend accounts involved in
            unresolved disputes.
          </p>
        </Section>

        <Section title="10. Changes to These Terms">
          <p>
            FixiTN may update these terms at any time. You will be
            notified of significant changes via in-app notification.
            Continued use of the platform after changes constitutes
            acceptance of the new terms.
          </p>
        </Section>

        <Section title="11. Governing Law">
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
            <p className="text-sm font-semibold text-ink">Contact Us</p>
          </div>
          <p className="text-sm text-muted">
            For questions about these terms, contact us at{" "}
            <span className="text-brand-orange font-medium">
              support@fixitn.tn
            </span>{" "}
            or via the in-app support chat.
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