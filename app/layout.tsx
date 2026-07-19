import type {
  Metadata,
  Viewport,
} from "next";
import type { ReactNode } from "react";
import {
  Cairo,
  Geist_Mono,
} from "next/font/google";

import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteDescription =
  "Infinity Academy منصة تعليمية تضم كورسات ومسارات احترافية في البرمجة والذكاء الاصطناعي واللغات وصناعة المحتوى والمزيد.";

export const metadata: Metadata = {
  applicationName: "Infinity Academy",

  title: {
    default:
      "Infinity Academy | منصة التعلم الاحترافية",
    template: "%s | Infinity Academy",
  },

  description: siteDescription,

  keywords: [
    "Infinity Academy",
    "كورسات أونلاين",
    "منصة تعليمية",
    "تعلم البرمجة",
    "الذكاء الاصطناعي",
    "تعلم اللغات",
    "صناعة المحتوى",
    "التسويق الإلكتروني",
  ],

  authors: [
    {
      name: "Infinity Academy",
    },
  ],

  creator: "Infinity Academy",
  publisher: "Infinity Academy",

  openGraph: {
    type: "website",
    locale: "ar_EG",
    siteName: "Infinity Academy",
    title:
      "Infinity Academy | منصة التعلم الاحترافية",
    description: siteDescription,
  },

  twitter: {
    card: "summary_large_image",
    title:
      "Infinity Academy | منصة التعلم الاحترافية",
    description: siteDescription,
  },

  robots: {
    index: true,
    follow: true,
  },

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#09090B",
  colorScheme: "dark",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${cairo.variable} ${geistMono.variable} ${cairo.className} min-h-screen bg-[#09090B] text-white antialiased`}
      >
        {children}
      </body>
    </html>
  );
}