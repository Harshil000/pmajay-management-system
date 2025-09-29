
import "./globals.css";
import type { Metadata } from "next";
import Navbar from './components/Navbar';
import SessionProviderWrapper from './components/SessionProviderWrapper';

export const metadata: Metadata = {
  title: "PM-AJAY Dashboard",
  description: "A digital dashboard for PM-AJAY scheme management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-gray-100 antialiased">
        <SessionProviderWrapper>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
