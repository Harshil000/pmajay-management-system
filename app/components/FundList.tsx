
'use client';

import { useState, useEffect } from 'react';

interface Project {
  _id: string;
  name: string;
}

interface Agency {
  _id: string;
  name: string;
}

interface Fund {
  _id: string;
  projectId: Project;
  amount: number;
  releaseDate: string;
  status: string;
  fundType: string;
  fromAgency: Agency;
  toAgency: Agency;
  purpose: string;
  referenceNumber: string;
}

export default function FundList({
  onEdit,
  isAdmin = false,
}: { onEdit?: (fund: Fund) => void; isAdmin?: boolean }) {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFunds() {
      try {
        const response = await fetch('/api/funds');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        
        // Handle the new API response format: { success: true, data: [...], count: ... }
        if (result.success && Array.isArray(result.data)) {
          setFunds(result.data);
        } else if (Array.isArray(result)) {
          // Fallback for old format
          setFunds(result);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchFunds();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this fund entry?')) {
      try {
        const response = await fetch(`/api/funds/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        setFunds(funds.filter((fund) => fund._id !== id));
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  if (loading) return <p className="text-center text-gray-300">Loading funds...</p>;
  if (error) return <p className="text-center text-red-400">Error: {error}</p>;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-8">
      <h2 className="text-3xl font-bold text-white mb-6">Funds List</h2>
      {funds.length === 0 ? (
        <p className="text-gray-400">No fund entries found. Add a new fund entry to get started.</p>
      ) : (
        <ul className="space-y-4">
          {funds.map((fund) => (
            <li
              key={fund._id}
              className="bg-gray-700 border border-gray-600 p-4 rounded-lg shadow-sm hover:shadow-md transition duration-300 ease-in-out"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-medium text-gray-200">
                  {fund.projectId?.name || 'Unknown Project'} - ₹{Math.abs(fund.amount || 0).toLocaleString()}
                </span>
                {isAdmin && (
                  <div className="space-x-2">
                    <button
                      onClick={() => onEdit && onEdit(fund)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300 ease-in-out"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(fund._id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition duration-300 ease-in-out"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-400">
                <div>
                  <span className="font-medium">Status:</span> {fund.status || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Type:</span> {fund.fundType || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">From:</span> {fund.fromAgency?.name || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">To:</span> {fund.toAgency?.name || 'N/A'}
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-400">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Date:</span> {
                      fund.releaseDate 
                        ? new Date(fund.releaseDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: '2-digit', 
                            year: 'numeric'
                          })
                        : 'N/A'
                    }
                  </div>
                  <div>
                    <span className="font-medium">Reference:</span> {fund.referenceNumber || 'N/A'}
                  </div>
                </div>
                {fund.purpose && (
                  <div className="mt-1">
                    <span className="font-medium">Purpose:</span> {fund.purpose}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
