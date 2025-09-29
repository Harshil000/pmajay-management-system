'use client';

import { useState } from 'react';
import UserList from '../../../app/components/UserList';
import UserForm from '../../../app/components/UserForm';

interface User {
  _id?: string;
  name: string;
  email: string;
  role: 'Central Admin' | 'State Official' | 'Agency User';
}

export default function AdminUsersPage() {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [refreshList, setRefreshList] = useState(0);

  const handleSave = () => {
    setEditingUser(null);
    setRefreshList((prev) => prev + 1);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-5xl font-extrabold text-gray-800 mb-12 text-center">Admin: Manage Users</h1>
      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
        <UserForm onSave={handleSave} initialData={editingUser} />
        <UserList key={refreshList} onEdit={handleEdit} />
      </div>
    </div>
  );
}