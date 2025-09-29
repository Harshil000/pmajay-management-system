
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/Button';
import { Card } from '@/app/components/ui/Card';
import { Project, Agency } from '@/types';
import { normalizeProject, normalizeAgency, getAgencyName, getAgencyId } from '@/lib/dataUtils';

interface ProjectFormProps {
  onSave: () => void;
  initialData?: Project | null;
}

export default function ProjectForm({
  onSave,
  initialData,
}: ProjectFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [component, setComponent] = useState<'Adarsh Gram' | 'GIA' | 'Hostel'>(initialData?.component || 'Adarsh Gram');
  const [implementingAgencyId, setImplementingAgencyId] = useState(
    initialData ? getAgencyId(initialData.implementingAgency) : ''
  );
  const [executingAgencyIds, setExecutingAgencyIds] = useState<string[]>(
    initialData?.executingAgencies?.map(agency => getAgencyId(agency)) || []
  );
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<'Proposed' | 'Approved' | 'Sanctioned' | 'In Progress' | 'Completed' | 'Delayed' | 'On Hold'>(initialData?.status || 'Proposed');
  
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize dates properly
  useEffect(() => {
    if (initialData) {
      const startDateValue = initialData.startDate instanceof Date 
        ? initialData.startDate.toISOString().split('T')[0]
        : initialData.startDate ? initialData.startDate.split('T')[0] : '';
      const endDateValue = initialData.expectedEndDate instanceof Date
        ? initialData.expectedEndDate.toISOString().split('T')[0]
        : initialData.expectedEndDate ? initialData.expectedEndDate.split('T')[0] : '';
      
      setStartDate(startDateValue);
      setEndDate(endDateValue);
    }
  }, [initialData]);

  useEffect(() => {
    async function fetchAgencies() {
      try {
        const response = await fetch('/api/agencies');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        
        // Handle the new API response format: { success: true, data: [...], count: ... }
        let agenciesData = [];
        if (result.success && Array.isArray(result.data)) {
          agenciesData = result.data;
        } else if (Array.isArray(result)) {
          // Fallback for old format
          agenciesData = result;
        } else {
          throw new Error('Invalid response format');
        }
        
        setAgencies(agenciesData);
        if (!initialData && agenciesData.length > 0) {
          setImplementingAgencyId(agenciesData.find((a: Agency) => a.type === 'Implementing Agency')?._id || '');
        }
      } catch (err: any) {
        setError(err.message);
      }
    }
    fetchAgencies();
  }, [initialData]);

  const handleExecutingAgenciesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.selectedOptions).map((option) => option.value);
    setExecutingAgencyIds(options);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const method = initialData?._id ? 'PUT' : 'POST';
    const url = initialData?._id ? `/api/projects/${initialData._id}` : '/api/projects';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          component,
          implementingAgency: implementingAgencyId,
          executingAgencies: executingAgencyIds,
          startDate,
          expectedEndDate: endDate,
          status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      setName('');
      setComponent('Adarsh Gram');
      setImplementingAgencyId(agencies.find((a: Agency) => a.type === 'Implementing Agency')?._id || '');
      setExecutingAgencyIds([]);
      setStartDate('');
      setEndDate('');
      setStatus('Proposed');
      onSave();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const implementingAgencies = agencies.filter(agency => agency.type === 'Implementing Agency');
  const executingAgencies = agencies.filter(agency => agency.type === 'Executing Agency');

  return (
    <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
        {initialData?._id ? 'Edit Project' : 'Add New Project'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-lg font-medium text-gray-700 mb-2">
            Project Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="e.g., Adarsh Gram Phase 1"
          />
        </div>

        <div>
          <label htmlFor="component" className="block text-lg font-medium text-gray-700 mb-2">
            Component
          </label>
          <select
            id="component"
            value={component}
            onChange={(e) => setComponent(e.target.value as 'Adarsh Gram' | 'GIA' | 'Hostel')}
            required
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="Adarsh Gram">Adarsh Gram</option>
            <option value="GIA">GIA</option>
            <option value="Hostel">Hostel</option>
          </select>
        </div>

        <div>
          <label htmlFor="implementingAgency" className="block text-lg font-medium text-gray-700 mb-2">
            Implementing Agency
          </label>
          <select
            id="implementingAgency"
            value={implementingAgencyId}
            onChange={(e) => setImplementingAgencyId(e.target.value)}
            required
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            {implementingAgencies.length === 0 && <option value="">No Implementing Agencies Available</option>}
            {implementingAgencies.map((agency) => (
              <option key={agency._id} value={agency._id}>
                {agency.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="executingAgencies" className="block text-lg font-medium text-gray-700 mb-2">
            Executing Agencies
          </label>
          <select
            id="executingAgencies"
            multiple
            value={executingAgencyIds}
            onChange={handleExecutingAgenciesChange}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-32"
          >
            {executingAgencies.length === 0 && <option value="">No Executing Agencies Available</option>}
            {executingAgencies.map((agency) => (
              <option key={agency._id} value={agency._id}>
                {agency.name}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple agencies.</p>
        </div>

        <div>
          <label htmlFor="startDate" className="block text-lg font-medium text-gray-700 mb-2">
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="endDate" className="block text-lg font-medium text-gray-700 mb-2">
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
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
            onChange={(e) => setStatus(e.target.value as 'Proposed' | 'Approved' | 'Sanctioned' | 'In Progress' | 'Completed' | 'Delayed' | 'On Hold')}
            required
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="Proposed">Proposed</option>
            <option value="Approved">Approved</option>
            <option value="Sanctioned">Sanctioned</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Delayed">Delayed</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>

        {error && <p className="text-red-600 text-sm">Error: {error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-md text-lg font-semibold hover:bg-blue-700 transition duration-300 ease-in-out shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : initialData?._id ? 'Update Project' : 'Add Project'}
        </button>
      </form>
    </div>
  );
}
