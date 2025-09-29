'use client';

import AgencyList from '../components/AgencyList';

export default function AgenciesPage() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <h1 className="text-5xl font-extrabold text-white mb-12 text-center">Agencies Overview</h1>
      <div className="container mx-auto">
        <AgencyList />
      </div>
    </div>
  );
}