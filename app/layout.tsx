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
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased text-gray-900 dark:text-gray-100 relative`}
      >
        {/* Fixed background image with dark overlay */}
        <div className="fixed inset-0 z-0">
          <img
            src="/background.avif"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gray-950/70 dark:bg-gray-950/85"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-blue-950/30 via-transparent to-indigo-950/40"></div>
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
