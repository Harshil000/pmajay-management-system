'use client';

import { useState } from 'react';
import FundList from '../../../app/components/FundList';
import FundForm from '../../../app/components/FundForm';

interface Project {
  _id: string;
  name: string;
}

interface Fund {
  _id?: string;
  project: string;
  amount: number;
  date: string;
  status: 'Allocated' | 'Disbursed' | 'Utilized';
}

export default function AdminFundsPage() {
  const [editingFund, setEditingFund] = useState<Fund | null>(null);
  const [refreshList, setRefreshList] = useState(0);

  const handleSave = () => {
    setEditingFund(null);
    setRefreshList((prev) => prev + 1);
  };

  const handleEdit = (fund: Fund) => {
    setEditingFund(fund);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-5xl font-extrabold text-gray-800 mb-12 text-center">Admin: Manage Funds</h1>
      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
        <FundForm onSave={handleSave} initialData={editingFund} />
        <FundList key={refreshList} onEdit={handleEdit} isAdmin={true} />
      </div>
    </div>
  );
}