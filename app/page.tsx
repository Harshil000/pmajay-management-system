'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gray-900">
      <section className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              PM-AJAY Digital Management System
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 max-w-3xl mx-auto mb-4">
              Research-driven governance through intelligent monitoring and coordination.
            </p>
            <p className="text-sm text-blue-200 max-w-2xl mx-auto mb-8">
              Solving NHA-identified coordination gaps • Addressing CAG transparency issues • 
              Following NITI Aayog digital governance framework
            </p>
            {session ? (
              <Link 
                href="/dashboard" 
                className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all duration-200"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link 
                href="/login" 
                className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all duration-200"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
