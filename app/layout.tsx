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
  title: "Thien An Nguyen | Guitarist & Music Instructor",
  description: "Professional guitarist and music instructor based in the Bay Area, offering live performances and music instruction.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth dark">
      <body 
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased text-gray-900 dark:text-gray-100 relative bg-[#0a0a0a]`}
      >
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
