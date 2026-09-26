import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LibraryOS",
  description: "Library management suite — students, seats, payments and analytics in one place.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "LibraryOS",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#3B4FD8",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-app-bg text-text-primary">
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
