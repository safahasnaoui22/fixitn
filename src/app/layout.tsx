import type { Metadata, Viewport } from "next";
import { Sora, Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/app-shell";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FixiTN — Find a trusted technician, fast",
  description:
    "Book verified electricians, plumbers, AC technicians and more across Tunisia — track your job from request to repair.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F1B33",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable} antialiased`}>
     <body className="bg-surface-alt">
  <AppShell>{children}</AppShell>
</body>
    </html>
  );
}