import type { Metadata, Viewport } from "next";
import { Sora, Inter } from "next/font/google";
import "./globals.css";
import { PushNotificationManager } from "@/components/PushNotificationManager";
import { InstallPrompt } from "@/components/InstallPrompt";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SessionGuard } from "@/components/SessionGuard";
port { I18nProvider } from "@/lib/i18n/I18nProvider";
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
// Add this constant near the top of layout.tsx
const swScript = `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(function(reg) {
        console.log('[SW] Registered:', reg.scope);
      })
      .catch(function(err) {
        console.warn('[SW] Registration failed:', err);
      });
  });
}
`;
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${sora.variable} ${inter.variable} antialiased`}
      suppressHydrationWarning
    >
 

      <head>
  {/* Anti-flash theme script — must be first */}
  <script dangerouslySetInnerHTML={{ __html: themeScript }} />
  {/* Service worker registration — unconditional so PWABuilder detects it */}
  <script dangerouslySetInnerHTML={{ __html: swScript }} />
  <link rel="apple-touch-icon" href="/icons/icon-192.png" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Fixili" />
</head>
      <body className="bg-surface text-ink">
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