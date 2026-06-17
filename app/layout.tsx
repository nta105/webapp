import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from '@/app/components/Navbar';
import { ThemeProvider } from './components/ThemeProvider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Thien An Nguyen | Software Engineer",
  description: "Computer Science student portfolio showcasing projects and skills, graduating December 2025",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body 
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-gray-50 dark:bg-[#0f1729] text-gray-900 dark:text-gray-100 relative`}
      >
        {/* Subtle gradient background */}
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-indigo-50/50 dark:from-blue-950/20 dark:via-transparent dark:to-indigo-950/20"></div>
        </div>

        <ThemeProvider>
          <Navbar />
          <main className="pt-20 relative z-10">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
