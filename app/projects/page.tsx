'use client';

import ProjectList from '../components/ProjectList';

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <h1 className="text-5xl font-extrabold text-white mb-12 text-center">Projects Overview</h1>
      <div className="container mx-auto">
        <ProjectList />
      </div>
    </div>
  );
}