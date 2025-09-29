
'use client';

import { useState, useEffect } from 'react';

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

export default function FundForm({
  onSave,
  initialData,
}: { onSave: () => void; initialData?: Fund | null }) {
  const [projectId, setProjectId] = useState(initialData?.project || '');
  const [amount, setAmount] = useState(initialData?.amount || 0);
  const [date, setDate] = useState(initialData?.date || '');
  const [status, setStatus] = useState<'Allocated' | 'Disbursed' | 'Utilized'>(initialData?.status || 'Allocated');

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch('/api/projects');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        
        // Handle the new API response format: { success: true, data: [...], count: ... }
        let projectsData = [];
        if (result.success && Array.isArray(result.data)) {
          projectsData = result.data;
        } else if (Array.isArray(result)) {
          // Fallback for old format
          projectsData = result;
        } else {
          throw new Error('Invalid response format');
        }
        
        setProjects(projectsData);
        if (!initialData && projectsData.length > 0) {
          setProjectId(projectsData[0]._id); // Set default project if adding new fund
        }
      } catch (err: any) {
        setError(err.message);
      }
    }
    fetchProjects();
  }, [initialData]);

  useEffect(() => {
    if (initialData) {
      setProjectId(initialData.project);
      setAmount(initialData.amount);
      setDate(initialData.date.split('T')[0]); // Format for input type="date"
      setStatus(initialData.status);
    } else {
      setProjectId(projects.length > 0 ? projects[0]._id : '');
      setAmount(0);
      setDate('');
      setStatus('Allocated');
    }
  }, [initialData, projects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const method = initialData?._id ? 'PUT' : 'POST';
    const url = initialData?._id ? `/api/funds/${initialData._id}` : '/api/funds';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ project: projectId, amount, date, status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      setProjectId(projects.length > 0 ? projects[0]._id : '');
      setAmount(0);
      setDate('');
      setStatus('Allocated');
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
        {initialData?._id ? 'Edit Fund Entry' : 'Add New Fund Entry'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="project" className="block text-lg font-medium text-gray-700 mb-2">
            Project
          </label>
          <select
            id="project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            required
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            {projects.length === 0 && <option value="">No Projects Available</option>}
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="amount" className="block text-lg font-medium text-gray-700 mb-2">
            Amount
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value))}
            required
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="e.g., 1000000"
          />
        </div>

        <div>
          <label htmlFor="date" className="block text-lg font-medium text-gray-700 mb-2">
            Date
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="status" className="block text-lg font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'Allocated' | 'Disbursed' | 'Utilized')}
            required
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="Allocated">Allocated</option>
            <option value="Disbursed">Disbursed</option>
            <option value="Utilized">Utilized</option>
          </select>
        </div>

        {error && <p className="text-red-600 text-sm">Error: {error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-md text-lg font-semibold hover:bg-blue-700 transition duration-300 ease-in-out shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : initialData?._id ? 'Update Fund Entry' : 'Add Fund Entry'}
        </button>
      </form>
    </div>
  );
}
