import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/app/_shared/components/providers/ThemeProvider";
import { StoreProvider } from "@/app/_shared/components/providers/StoreProvider";
import { ToastProvider } from "@/app/_shared/components/ui/toast/toast";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Power Genix",
    default: "Power Genix - Inventory Management System",
  },
  description: "Power Genix inventory, production, and sales management system for inverter manufacturing.",
  keywords: ["power genix", "inventory", "production", "sales", "inverter"],
  authors: [{ name: "Power Genix" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Power Genix",
    description: "Power Genix inventory, production, and sales management system for inverter manufacturing.",
    siteName: "Power Genix",
  },
  twitter: {
    card: "summary_large_image",
    title: "Power Genix",
    description: "Power Genix inventory, production, and sales management system for inverter manufacturing.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} ${jetbrainsMono.variable} antialiased min-h-screen`}
      >
        <StoreProvider>
          <ThemeProvider>
            <ToastProvider position="top-right">
              {children}
            </ToastProvider>
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
