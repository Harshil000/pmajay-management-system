
'use client';

import { useState, useEffect } from 'react';

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

export default function AgencyForm({
  onSave,
  initialData,
}: { onSave: () => void; initialData?: Agency | null }) {
  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState<'Implementing' | 'Executing'>(initialData?.type || 'Implementing');
  const [stateId, setStateId] = useState(initialData?.state || '');
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStates() {
      try {
        const response = await fetch('/api/states');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        
        // Handle the new API response format: { success: true, data: [...], count: ... }
        let statesData = [];
        if (result.success && Array.isArray(result.data)) {
          statesData = result.data;
        } else if (Array.isArray(result)) {
          // Fallback for old format
          statesData = result;
        } else {
          throw new Error('Invalid response format');
        }
        
        setStates(statesData);
        if (!initialData && statesData.length > 0) {
          setStateId(statesData[0]._id); // Set default state if adding new agency
        }
      } catch (err: any) {
        setError(err.message);
      }
    }
    fetchStates();
  }, [initialData]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setStateId(initialData.state);
    } else {
      setName('');
      setType('Implementing');
      setStateId(states.length > 0 ? states[0]._id : '');
    }
  }, [initialData, states]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const method = initialData?._id ? 'PUT' : 'POST';
    const url = initialData?._id ? `/api/agencies/${initialData._id}` : '/api/agencies';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, type, state: stateId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      setName('');
      setType('Implementing');
      setStateId(states.length > 0 ? states[0]._id : '');
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
        {initialData?._id ? 'Edit Agency' : 'Add New Agency'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-lg font-medium text-gray-700 mb-2">
            Agency Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="e.g., National Rural Development Agency"
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-lg font-medium text-gray-700 mb-2">
            Agency Type
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as 'Implementing' | 'Executing')}
            required
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="Implementing">Implementing</option>
            <option value="Executing">Executing</option>
          </select>
        </div>

        <div>
          <label htmlFor="state" className="block text-lg font-medium text-gray-700 mb-2">
            Associated State
          </label>
          <select
            id="state"
            value={stateId}
            onChange={(e) => setStateId(e.target.value)}
            required
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            {states.length === 0 && <option value="">No States Available</option>}
            {states.map((state) => (
              <option key={state._id} value={state._id}>
                {state.name}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-red-600 text-sm">Error: {error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-md text-lg font-semibold hover:bg-blue-700 transition duration-300 ease-in-out shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : initialData?._id ? 'Update Agency' : 'Add Agency'}
        </button>
      </form>
    </div>
  );
}
