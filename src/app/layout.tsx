import type { Metadata, Viewport } from "next";
import { Inter, Sora, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const SITE_URL = "https://www.deyoungcommunication.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "DEYOUNG COMMUNICATION | AI employees that answer, understand, and act",
    template: "%s · DEYOUNG COMMUNICATION",
  },
  description:
    "Hire AI employees that answer calls, hold natural conversations, use your business knowledge, and hand off to your team. Voice and chat from one platform, on every channel.",
  keywords: [
    "AI employees",
    "AI receptionist",
    "voice AI",
    "AI phone calls",
    "customer communication",
    "DEYOUNG",
  ],
  authors: [{ name: "DEYOUNG COMMUNICATION" }],
  openGraph: {
    title: "DEYOUNG COMMUNICATION",
    description: "Your AI employee is ready to talk.",
    url: SITE_URL,
    siteName: "DEYOUNG COMMUNICATION",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DEYOUNG COMMUNICATION · AI employees that answer, understand, and act",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DEYOUNG COMMUNICATION",
    description: "Your AI employee is ready to talk.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#070E1A",
  width: "device-width",
  initialScale: 1,
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "DEYOUNG COMMUNICATION",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.svg`,
  description:
    "AI employees for your business: receptionists, sales assistants, support agents, and schedulers that answer calls and act.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${sora.variable} ${inter.variable} ${jetbrains.variable} antialiased bg-background text-foreground`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
