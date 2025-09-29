
'use client';

import { useState, useEffect } from 'react';

interface User {
  _id?: string;
  name: string;
  email: string;
  role: 'Central Admin' | 'State Official' | 'Agency User';
}

export default function UserForm({
  onSave,
  initialData,
}: { onSave: () => void; initialData?: User | null }) {
  const [name, setName] = useState(initialData?.name || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [role, setRole] = useState<'Central Admin' | 'State Official' | 'Agency User'>(initialData?.role || 'Agency User');
  const [password, setPassword] = useState(''); // Only for new users or password reset
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setEmail(initialData.email);
      setRole(initialData.role);
      setPassword(''); // Clear password field when editing
    } else {
      setName('');
      setEmail('');
      setRole('Agency User');
      setPassword('');
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const method = initialData?._id ? 'PUT' : 'POST';
    const url = initialData?._id ? `/api/users/${initialData._id}` : '/api/users';

    const body: any = { name, email, role };
    if (!initialData?._id || password) { // Only send password if new user or password is being reset
      body.password = password;
    }

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      setName('');
      setEmail('');
      setRole('Agency User');
      setPassword('');
      onSave();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
        {initialData?._id ? 'Edit User' : 'Add New User'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-lg font-medium text-gray-700 mb-2">
            Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="e.g., John Doe"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-lg font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="e.g., john.doe@example.com"
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-lg font-medium text-gray-700 mb-2">
            Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as 'Central Admin' | 'State Official' | 'Agency User')}
            required
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="Central Admin">Central Admin</option>
            <option value="State Official">State Official</option>
            <option value="Agency User">Agency User</option>
          </select>
        </div>

        {(!initialData?._id || password) && ( // Show password field only for new users or if password is being reset
          <div>
            <label htmlFor="password" className="block text-lg font-medium text-gray-700 mb-2">
              Password {initialData?._id && '(Leave blank to keep current)'}
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              {...(!initialData?._id && { required: true })} // Required for new users
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        )}

        {error && <p className="text-red-600 text-sm">Error: {error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-md text-lg font-semibold hover:bg-blue-700 transition duration-300 ease-in-out shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : initialData?._id ? 'Update User' : 'Add User'}
        </button>
      </form>
    </div>
  );
}
