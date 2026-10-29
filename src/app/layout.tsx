import type { Metadata, Viewport } from "next";
import { Sora, Inter, Noto_Sans_Arabic } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { PushNotificationManager } from "@/components/PushNotificationManager";
import { InstallPrompt } from "@/components/InstallPrompt";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SessionGuard } from "@/components/SessionGuard";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { getLocale } from "@/lib/i18n/server";
import { dirOf } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/translate";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const arabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fixili — Votre maison entre de bonnes mains",
  description:
    "Trouvez un technicien vérifié près de chez vous en Tunisie.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0D0F1A",
};

// Anti-flash inline script — runs before React hydrates.
// Reads localStorage and applies the dark class immediately so
// there's no white flash when the user has dark mode saved.
const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('fixili-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (stored === 'dark' || (!stored && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
  } catch(e) {}
})();
`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      dir={dirOf(locale)}
      className={`${sora.variable} ${inter.variable} ${arabic.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="bg-surface text-ink">
        {/* Anti-flash: next/script runs it before the page is interactive
            (a plain <script> inside a React component gives a React 19 warning) */}
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <ThemeProvider>
          <I18nProvider locale={locale} messages={getMessages(locale)}>
          <div className="app-shell">{children}</div>
          <PushNotificationManager />
          <InstallPrompt />
          <SessionGuard />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}