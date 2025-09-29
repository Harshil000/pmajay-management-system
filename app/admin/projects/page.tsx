'use client';

import { useState } from 'react';
import { Project, Agency } from '../../../types';
import ProjectList from '../../../app/components/ProjectList';
import ProjectForm from '../../../app/components/ProjectForm';

export default function AdminProjectsPage() {
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [refreshList, setRefreshList] = useState(0);

  const handleSave = () => {
    setEditingProject(null);
    setRefreshList((prev) => prev + 1);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-5xl font-extrabold text-gray-800 mb-12 text-center">Admin: Manage Projects</h1>
      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
        <ProjectForm onSave={handleSave} initialData={editingProject} />
        <ProjectList key={refreshList} onEdit={handleEdit} isAdmin={true} />
      </div>
    </div>
  );
}