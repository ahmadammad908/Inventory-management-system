import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppLayoutClient } from "@/components/common/AppLayoutClient";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Retail Pro - Pakistani Inventory Management & POS System",
  description: "Responsive Next.js Inventory Management, Barcode POS Billing, Khata Ledger, and Thermal Receipt System for Pakistani Retail.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppLayoutClient>{children}</AppLayoutClient>
      </body>
    </html>
  );
}
