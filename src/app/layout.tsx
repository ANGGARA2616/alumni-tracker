import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Alumni Tracker - Pusat Data",
  description: "Sistem pendataan alumni, karir, dan sosial media untuk kepentingan pembelajaran.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.className} antialiased bg-gray-50`}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
