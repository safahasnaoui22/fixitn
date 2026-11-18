import Link from "next/link";
import { ArrowLeft, Shield, FileText } from "lucide-react";
import { getT } from "@/lib/i18n/server";

// Each section: number of paragraphs (p) then number of bullet points (li).
// Texts live in the catalog under auth.terms.client.<id>.title / .p1.. / .li1..
const SECTIONS = [
  { id: "s1", p: 1, li: 0 },
  { id: "s2", p: 0, li: 5 },
  { id: "s3", p: 0, li: 4 },
  { id: "s4", p: 0, li: 3 },
  { id: "s5", p: 1, li: 0 },
  { id: "s6", p: 0, li: 4 },
  { id: "s7", p: 1, li: 4 },
  { id: "s8", p: 1, li: 0 },
  { id: "s9", p: 1, li: 0 },
  { id: "s10", p: 1, li: 0 },
  { id: "s11", p: 1, li: 0 },
];

const RICH = /(\*\*[^*]+\*\*|support@fixitn\.tn)/g;

/** **bold** and the support e-mail are highlighted inside a translated sentence. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(RICH).map((part, i) => {
        if (part.startsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part === "support@fixitn.tn")
          return (
            <span key={i} dir="ltr" className="text-brand-orange">
              {part}
            </span>
          );
        return part;
      })}
    </>
  );
}

export default async function ClientTermsPage() {
  const t = await getT();
  return (
    <div className="app-content no-scrollbar">
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <Link
          href="/register"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-alt"
        >
          <ArrowLeft size={18} className="rtl:rotate-180" />
        </Link>
        <div>
          <p className="font-heading text-base font-semibold text-ink">
            {t("auth.terms.client.pageTitle")}
          </p>
          <p className="text-xs text-muted">{t("auth.terms.updated")}</p>
        </div>
      </div>

      <div className="px-5 py-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-3 rounded-2xl bg-brand-navy px-4 py-4 text-white">
          <FileText size={24} className="text-brand-orange shrink-0" />
          <div>
            <p className="font-heading text-base font-bold">
              {t("auth.terms.client.headerTitle")}
            </p>
            <p className="text-xs text-white/60">
              {t("auth.terms.client.headerSub")}
            </p>
          </div>
        </div>

        {SECTIONS.map((s) => (
          <Section key={s.id} title={t(`auth.terms.client.${s.id}.title`)}>
            {Array.from({ length: s.p }, (_, i) => (
              <p key={`p${i}`}>
                <Rich text={t(`auth.terms.client.${s.id}.p${i + 1}`)} />
              </p>
            ))}
            {s.li > 0 && (
              <ul>
                {Array.from({ length: s.li }, (_, i) => (
                  <li key={i}>
                    <Rich text={t(`auth.terms.client.${s.id}.li${i + 1}`)} />
                  </li>
                ))}
              </ul>
            )}
          </Section>
        ))}

        {/* Contact */}
        <div className="rounded-2xl border border-line bg-surface-alt p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={16} className="text-brand-orange" />
            <p className="text-sm font-semibold text-ink">{t("auth.terms.client.contactTitle")}</p>
          </div>
          <p className="text-sm text-muted">
            <Rich text={t("auth.terms.client.contactText")} />
          </p>
        </div>

        {/* Back to register */}
        <Link
          href="/register"
          className="flex w-full items-center justify-center rounded-2xl bg-brand-orange py-4 text-base font-bold text-white"
        >
          {t("auth.terms.backToRegister")}
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
      <div className="text-sm text-muted leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:ps-4 [&_ul]:space-y-1.5 [&_strong]:text-ink [&_strong]:font-semibold">
        {children}
      </div>
    </div>
  );
}
