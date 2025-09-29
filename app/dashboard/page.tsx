'use client';

import React from 'react';
import PMJAYDashboard from '../components/PMJAYDashboard';
import AdminPrivileges from '../components/AdminPrivileges';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-900">
      <PMJAYDashboard />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <AdminPrivileges />
      </div>
    </div>
  );
}