'use client';

import { useState } from 'react';
import AgencyList from '../../../app/components/AgencyList';
import AgencyForm from '../../../app/components/AgencyForm';

interface State {
  _id: string;
  name: string;
}

interface Agency {
  _id?: string;
  name: string;
  type: 'Implementing' | 'Executing';
  state: string; // Only ID for form submission
}

export default function AdminAgenciesPage() {
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [refreshList, setRefreshList] = useState(0);

  const handleSave = () => {
    setEditingAgency(null);
    setRefreshList((prev) => prev + 1);
  };

  const handleEdit = (agency: Agency) => {
    setEditingAgency(agency);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-5xl font-extrabold text-gray-800 mb-12 text-center">Admin: Manage Agencies</h1>
      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
        <AgencyForm onSave={handleSave} initialData={editingAgency} />
        <AgencyList key={refreshList} onEdit={handleEdit} isAdmin={true} />
      </div>
    </div>
  );
}