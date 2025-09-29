
'use client';

import { useState, useEffect } from 'react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'Central Admin' | 'State Official' | 'Agency User';
}

export default function UserList({
  onEdit,
}: { onEdit?: (user: User) => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch('/api/users'); // We will create this API route next
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        
        // Handle the new API response format: { success: true, data: [...], count: ... }
        if (result.success && Array.isArray(result.data)) {
          setUsers(result.data);
        } else if (Array.isArray(result)) {
          // Fallback for old format
          setUsers(result);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await fetch(`/api/users/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        setUsers(users.filter((user) => user._id !== id));
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  if (loading) return <p className="text-center text-gray-600">Loading users...</p>;
  if (error) return <p className="text-center text-red-600">Error: {error}</p>;

  return (
    <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Users List</h2>
      {users.length === 0 ? (
        <p className="text-gray-600">No users found. Add a new user to get started.</p>
      ) : (
        <ul className="space-y-4">
          {users.map((user) => (
            <li
              key={user._id}
              className="flex justify-between items-center bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition duration-300 ease-in-out"
            >
              <div>
                <span className="text-lg font-medium text-gray-700">{user.name}</span>
                <p className="text-sm text-gray-500">{user.email} - {user.role}</p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => onEdit && onEdit(user)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300 ease-in-out"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(user._id)}
                  className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-300 ease-in-out"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
