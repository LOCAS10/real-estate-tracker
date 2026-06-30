import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth-context";
import { QueryProvider } from "@/lib/query-provider";

export const metadata: Metadata = {
  title: "نظام تتبع المشروع",
  description: "نظام متكامل لإدارة الزوار والزبناء والبقع والمبيعات والدفعات",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground font-sans">
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster />
            <SonnerToaster position="top-center" />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
