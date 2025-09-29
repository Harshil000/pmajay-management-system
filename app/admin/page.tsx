
'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminPanel from '../components/AdminPanel';
import { LockClosedIcon } from '@heroicons/react/24/outline';

const AdminPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (!session) {
      // Not logged in, redirect to login
      router.push('/login');
      return;
    }

    if ((session.user as any)?.role !== 'Super Admin') {
      // Not an admin, redirect to dashboard
      router.push('/dashboard');
      return;
    }

    // Valid admin session
    setIsLoading(false);
  }, [session, status, router]);

  const handleLogout = () => {
    router.push('/login');
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LockClosedIcon className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
          <h2 className="mt-6 text-2xl font-bold text-white">Verifying Admin Access...</h2>
          <p className="mt-2 text-sm text-gray-300">Please wait while we verify your permissions.</p>
        </div>
      </div>
    );
  }

  if (!session || (session.user as any)?.role !== 'Super Admin') {
    return null; // Will be redirected by useEffect
  }

  return <AdminPanel isAuthenticated={true} onLogout={handleLogout} />;
};

export default AdminPage;
