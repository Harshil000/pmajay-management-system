'use client';

import { useSession } from 'next-auth/react';

export default function AdminPrivileges() {
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  // Mock admin data - in a real app this would come from the session
  const adminData = {
    role: 'Super Admin',
    permissions: ['read', 'write', 'delete', 'approve_funds', 'manage_users'],
    stateAccess: 'All States',
    agencyAccess: 'All Agencies'
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
      <div className="flex items-center mb-4">
        <div className="h-10 w-10 bg-green-600 rounded-full flex items-center justify-center mr-3">
          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Admin Privileges Active</h3>
          <p className="text-sm text-gray-400">Role: {adminData.role}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">Permissions</h4>
          <div className="flex flex-wrap gap-2">
            {adminData.permissions.map((permission, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-900/50 text-blue-300 border border-blue-700 rounded-full text-xs font-medium"
              >
                {permission.replace('_', ' ').toUpperCase()}
              </span>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">Access Scope</h4>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              <span className="text-sm text-gray-300">{adminData.stateAccess}</span>
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              <span className="text-sm text-gray-300">{adminData.agencyAccess}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}