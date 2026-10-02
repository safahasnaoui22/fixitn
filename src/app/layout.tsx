import type { Metadata, Viewport } from "next";
import { Sora, Inter } from "next/font/google";
import "./globals.css";
import { PushNotificationManager } from "@/components/PushNotificationManager";
import { InstallPrompt } from "@/components/InstallPrompt";
import { ThemeProvider } from "@/components/ThemeProvider";

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
        {/* Anti-flash — must be first in head */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="bg-surface text-ink">
        <ThemeProvider>
          <div className="app-shell">{children}</div>
          <PushNotificationManager />
          <InstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}