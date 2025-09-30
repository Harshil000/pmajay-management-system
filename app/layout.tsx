
import "./globals.css";
import "./research-styles.css";
import type { Metadata } from "next";
import Navbar from './components/Navbar';
import SessionProviderWrapper from './components/SessionProviderWrapper';

export const metadata: Metadata = {
  title: "PM-AJAY Management System | Research-Driven Government Coordination",
  description: "Evidence-based digital management system for PM-AJAY scheme coordination. Built following NHA guidelines, NITI Aayog framework, and government research standards.",
  keywords: "PM-AJAY, government coordination, digital governance, research-based, NHA, NITI Aayog, SIH 2024",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="bg-gray-900 text-gray-100 antialiased h-full">
        <SessionProviderWrapper>
          <Navbar />
          <main>
            {children}
          </main>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
