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

export const metadata: Metadata = {
  title: "DEYOUNG COMMUNICATION | AI employees that answer, understand, and act",
  description:
    "Build AI employees that answer calls, hold natural conversations, use your business knowledge, and hand off to your team. Voice, chat, SMS, and WhatsApp from one platform.",
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
    siteName: "DEYOUNG COMMUNICATION",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#090909",
  width: "device-width",
  initialScale: 1,
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
        {children}
        <Toaster />
      </body>
    </html>
  );
}
