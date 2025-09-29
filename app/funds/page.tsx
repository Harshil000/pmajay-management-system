'use client';

import FundList from '../components/FundList';

export default function FundsPage() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <h1 className="text-5xl font-extrabold text-white mb-12 text-center">Fund Flow Overview</h1>
      <div className="container mx-auto">
        <FundList />
      </div>
    </div>
  );
}