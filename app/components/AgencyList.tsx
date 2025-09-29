
'use client';

import { useState, useEffect } from 'react';

interface State {
  _id: string;
  name: string;
}

interface Agency {
  _id: string;
  name: string;
  type: string;
  state: string;
  level?: string;
  code?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export default function AgencyList({
  onEdit,
  isAdmin = false,
}: { onEdit?: (agency: Agency) => void; isAdmin?: boolean }) {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'All' | 'Implementing Agency' | 'Executing Agency' | 'Nodal Agency' | 'Monitoring Agency'>('All');
  const [filterState, setFilterState] = useState<'All' | string>('All');

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch agencies
        const agenciesResponse = await fetch('/api/agencies');
        if (!agenciesResponse.ok) {
          throw new Error(`HTTP error! status: ${agenciesResponse.status}`);
        }
        const agenciesResult = await agenciesResponse.json();
        
        // Handle the new API response format: { success: true, data: [...], count: ... }
        if (agenciesResult.success && Array.isArray(agenciesResult.data)) {
          setAgencies(agenciesResult.data);
        } else if (Array.isArray(agenciesResult)) {
          // Fallback for old format
          setAgencies(agenciesResult);
        } else {
          throw new Error('Invalid agencies response format');
        }

        // Fetch states for filtering
        const statesResponse = await fetch('/api/states');
        if (!statesResponse.ok) {
          throw new Error(`HTTP error! status: ${statesResponse.status}`);
        }
        const statesResult = await statesResponse.json();
        
        // Handle the new API response format for states too
        if (statesResult.success && Array.isArray(statesResult.data)) {
          setStates(statesResult.data);
        } else if (Array.isArray(statesResult)) {
          // Fallback for old format
          setStates(statesResult);
        } else {
          throw new Error('Invalid states response format');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this agency?')) {
      try {
        const response = await fetch(`/api/agencies/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        setAgencies(agencies.filter((agency) => agency._id !== id));
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const filteredAgencies = agencies.filter((agency) => {
    const typeMatch = filterType === 'All' || agency.type === filterType;
    const stateMatch = filterState === 'All' || agency.state === filterState;
    return typeMatch && stateMatch;
  });

  if (loading) return <p className="text-center text-gray-300">Loading agencies...</p>;
  if (error) return <p className="text-center text-red-400">Error: {error}</p>;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-8">
      <h2 className="text-3xl font-bold text-white mb-6">Agencies List</h2>

      <div className="flex flex-wrap gap-4 mb-6">
        {/* Type Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as 'All' | 'Implementing Agency' | 'Executing Agency' | 'Nodal Agency' | 'Monitoring Agency')}
          className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="All">All Types</option>
          <option value="Implementing Agency">Implementing Agency</option>
          <option value="Executing Agency">Executing Agency</option>
          <option value="Nodal Agency">Nodal Agency</option>
          <option value="Monitoring Agency">Monitoring Agency</option>
        </select>

        {/* State Filter */}
        <select
          value={filterState}
          onChange={(e) => setFilterState(e.target.value)}
          className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="All">All States</option>
          {states.map((state) => (
            <option key={state._id} value={state.name}>
              {state.name}
            </option>
          ))}
        </select>
      </div>

      {filteredAgencies.length === 0 ? (
        <p className="text-gray-400">No agencies found matching the criteria.</p>
      ) : (
        <ul className="space-y-4">
          {filteredAgencies.map((agency) => (
            <li
              key={agency._id}
              className="flex justify-between items-center bg-gray-700 border border-gray-600 p-4 rounded-lg shadow-sm hover:shadow-md transition duration-300 ease-in-out"
            >
              <div>
                <span className="text-lg font-medium text-gray-200">{agency.name}</span>
                <p className="text-sm text-gray-400">{agency.type} - {agency.state}</p>
              </div>
              {isAdmin && (
                <div className="space-x-2">
                  <button
                    onClick={() => onEdit && onEdit(agency)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300 ease-in-out"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(agency._id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition duration-300 ease-in-out"
                  >
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
