import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "CityMind AI – Smart City Command Center",
  description:
    "AI-powered platform for intelligent urban infrastructure monitoring, complaint management, and emergency response. Make cities more efficient, responsive, and sustainable through data-driven governance.",
  keywords: [
    "smart city",
    "AI",
    "urban infrastructure",
    "city monitoring",
    "command center",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
