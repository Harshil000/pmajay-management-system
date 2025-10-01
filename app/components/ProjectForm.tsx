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

export default function ProjectForm({ onSave, initialData }: ProjectFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [projectId, setProjectId] = useState('');
  const [component, setComponent] = useState<'Adarsh Gram' | 'GIA' | 'Hostel'>(initialData?.component || 'Adarsh Gram');
  const [stateCode, setStateCode] = useState('MH');
  const [fundsAllocated, setFundsAllocated] = useState('10000000');
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

  // Generate project ID automatically
  useEffect(() => {
    if (!initialData && name && component) {
      const prefix = component === 'Adarsh Gram' ? 'AG' : component === 'GIA' ? 'GIA' : 'HST';
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      setProjectId(`${prefix}-${year}-${random}`);
    }
  }, [name, component, initialData]);

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
        
        let agenciesData = [];
        if (result.success && Array.isArray(result.data)) {
          agenciesData = result.data;
        } else if (Array.isArray(result)) {
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
          projectId,
          component,
          stateCode,
          fundsAllocated: parseInt(fundsAllocated),
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

      const result = await response.json();
      
      // If this is a new project (not an edit), workflow is automatically initialized on server
      if (!initialData?._id && result.success && result.data) {
        console.log('✅ Project created with automated workflow - Nodal Agency will be notified automatically');
      }

      // Reset form
      setName('');
      setProjectId('');
      setComponent('Adarsh Gram');
      setStateCode('MH');
      setFundsAllocated('10000000');
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
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">Error: {error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-lg font-medium text-gray-700 mb-2">
              Project Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Enter project name"
            />
          </div>

          <div>
            <label htmlFor="projectId" className="block text-lg font-medium text-gray-700 mb-2">
              Project ID *
            </label>
            <input
              type="text"
              id="projectId"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-100"
              placeholder="Auto-generated"
              readOnly
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="component" className="block text-lg font-medium text-gray-700 mb-2">
              PM-AJAY Component *
            </label>
            <select
              id="component"
              value={component}
              onChange={(e) => setComponent(e.target.value as 'Adarsh Gram' | 'GIA' | 'Hostel')}
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="Adarsh Gram">Adarsh Gram</option>
              <option value="GIA">GIA (Grant-in-Aid)</option>
              <option value="Hostel">Hostel Infrastructure</option>
            </select>
          </div>

          <div>
            <label htmlFor="stateCode" className="block text-lg font-medium text-gray-700 mb-2">
              State *
            </label>
            <select
              id="stateCode"
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="MH">Maharashtra</option>
              <option value="KA">Karnataka</option>
              <option value="TN">Tamil Nadu</option>
              <option value="AP">Andhra Pradesh</option>
              <option value="TG">Telangana</option>
            </select>
          </div>

          <div>
            <label htmlFor="fundsAllocated" className="block text-lg font-medium text-gray-700 mb-2">
              Funds Allocated (₹) *
            </label>
            <input
              type="number"
              id="fundsAllocated"
              value={fundsAllocated}
              onChange={(e) => setFundsAllocated(e.target.value)}
              required
              min="1000000"
              step="1000000"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Enter funds in rupees"
            />
          </div>
        </div>

        <div>
          <label htmlFor="implementingAgency" className="block text-lg font-medium text-gray-700 mb-2">
            Implementing Agency *
          </label>
          <select
            id="implementingAgency"
            value={implementingAgencyId}
            onChange={(e) => setImplementingAgencyId(e.target.value)}
            required
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Select Implementing Agency</option>
            {implementingAgencies.map((agency) => (
              <option key={agency._id} value={agency._id}>
                {agency.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="executingAgencies" className="block text-lg font-medium text-gray-700 mb-2">
            Executing Agencies (Optional)
          </label>
          <select
            id="executingAgencies"
            multiple
            value={executingAgencyIds}
            onChange={handleExecutingAgenciesChange}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-32"
          >
            {executingAgencies.map((agency) => (
              <option key={agency._id} value={agency._id}>
                {agency.name}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple agencies. Will be auto-assigned via workflow.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-lg font-medium text-gray-700 mb-2">
              Start Date *
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
              Expected End Date *
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

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-800 mb-2">🔄 Automated Workflow</h3>
          <p className="text-sm text-blue-700">
            Upon creating this project, the automated agency coordination workflow will be initialized:
            <br />• Nodal Agency will be automatically notified for review
            <br />• Executing agencies will be auto-assigned upon approval
            <br />• Real-time progress tracking will be enabled
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-md text-lg font-semibold hover:bg-blue-700 transition duration-300 ease-in-out shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Creating Project & Initializing Workflow...
            </div>
          ) : (
            initialData?._id ? 'Update Project' : 'Create Project & Start Workflow'
          )}
        </button>
      </form>
    </div>
  );
}