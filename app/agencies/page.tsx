'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AgencyList from '../components/AgencyList';

export default function AgenciesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    const role = (session.user as any)?.role || 'Viewer';
    setUserRole(role);
    setIsLoading(false);
  }, [session, status, router]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="mb-6">
        <h1 className="text-5xl font-extrabold text-white mb-4 text-center">Agencies Overview</h1>
        <div className="text-center">
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${
            userRole === 'Super Admin' ? 'bg-purple-900/50 text-purple-300' :
            userRole === 'State Admin' ? 'bg-blue-900/50 text-blue-300' :
            userRole === 'Agency Admin' ? 'bg-green-900/50 text-green-300' :
            'bg-gray-900/50 text-gray-300'
          }`}>
            {userRole} Access • {userRole === 'Viewer' ? 'Read-Only' : 'Edit Permissions'}
          </span>
        </div>
      </div>
      <div className="container mx-auto">
        <AgencyList />
      </div>
    </div>
  );
}