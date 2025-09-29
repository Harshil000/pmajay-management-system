
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/Button';
import { Card } from '@/app/components/ui/Card';
import { Badge } from '@/app/components/ui/Badge';
import { Project, Agency } from '@/types';
import { normalizeProject, getAgencyName } from '@/lib/dataUtils';

interface ProjectListProps {
  onEdit?: (project: Project) => void;
  isAdmin?: boolean;
}

export default function ProjectList({
  onEdit,
  isAdmin = false,
}: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
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
        if (result.success && Array.isArray(result.data)) {
          const normalizedProjects = result.data.map((project: any) => normalizeProject(project));
          setProjects(normalizedProjects);
        } else if (Array.isArray(result)) {
          // Fallback for old format
          const normalizedProjects = result.map((project: any) => normalizeProject(project));
          setProjects(normalizedProjects);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        const response = await fetch(`/api/projects/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        setProjects(projects.filter((project) => project._id !== id));
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  if (loading) return <p className="text-center text-gray-300">Loading projects...</p>;
  if (error) return <p className="text-center text-red-400">Error: {error}</p>;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-8">
      <h2 className="text-3xl font-bold text-white mb-6">Projects List</h2>
      {projects.length === 0 ? (
        <p className="text-gray-400">No projects found. Add a new project to get started.</p>
      ) : (
        <ul className="space-y-4">
          {projects.map((project) => (
            <li
              key={project._id}
              className="bg-gray-700 border border-gray-600 p-4 rounded-lg shadow-sm hover:shadow-md transition duration-300 ease-in-out"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-medium text-gray-200">{project.name}</span>
                {isAdmin && (
                  <div className="space-x-2">
                    <button
                      onClick={() => onEdit && onEdit(project)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300 ease-in-out"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(project._id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition duration-300 ease-in-out"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-400">Component: {project.component}</p>
              <p className="text-sm text-gray-400">Status: {project.status}</p>
              <p className="text-sm text-gray-400">Implementing Agency: {getAgencyName(project.implementingAgency)}</p>
              <p className="text-sm text-gray-400">Executing Agencies: {
                project.executingAgencies && project.executingAgencies.length > 0 
                  ? project.executingAgencies.map(agency => getAgencyName(agency)).join(', ')
                  : 'Not assigned'
              }</p>
              <p className="text-sm text-gray-400">Timeline: {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'} - {project.expectedEndDate ? new Date(project.expectedEndDate).toLocaleDateString() : 'N/A'}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
