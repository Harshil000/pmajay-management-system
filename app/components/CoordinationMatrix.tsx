'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  PlusIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface CoordinationMatrix {
  _id: string;
  fromAgency: {
    _id: string;
    name: string;
    type: string;
  };
  toAgency: {
    _id: string;
    name: string;
    type: string;
  };
  relationshipType: 'reporting' | 'coordination' | 'approval' | 'information';
  component: 'Adarsh Gram' | 'GIA' | 'Hostel';
  responsibilities: string[];
  slaMetrics: {
    responseTime: number;
    unit: string;
    escalationTime: number;
  };
  currentStatus: 'active' | 'inactive' | 'under_review';
  lastInteraction: string;
  performanceScore: number;
  createdAt: string;
}

const CoordinationMatrix = () => {
  const [matrices, setMatrices] = useState<CoordinationMatrix[]>([]);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewMatrix, setShowNewMatrix] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<string>('all');

  const [newMatrix, setNewMatrix] = useState({
    fromAgency: '',
    toAgency: '',
    relationshipType: 'coordination',
    component: 'Adarsh Gram',
    responsibilities: [''],
    slaMetrics: {
      responseTime: 24,
      unit: 'hours',
      escalationTime: 72
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [matrixRes, agenciesRes] = await Promise.all([
        fetch('/api/coordination'),
        fetch('/api/agencies')
      ]);

      const [matrixData, agenciesData] = await Promise.all([
        matrixRes.json(),
        agenciesRes.json()
      ]);

      if (matrixData.success) setMatrices(matrixData.data);
      if (agenciesData.success) setAgencies(agenciesData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMatrix = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/coordination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newMatrix,
          responsibilities: newMatrix.responsibilities.filter(r => r.trim() !== '')
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMatrices([data.data, ...matrices]);
        setNewMatrix({
          fromAgency: '',
          toAgency: '',
          relationshipType: 'coordination',
          component: 'Adarsh Gram',
          responsibilities: [''],
          slaMetrics: {
            responseTime: 24,
            unit: 'hours',
            escalationTime: 72
          }
        });
        setShowNewMatrix(false);
      }
    } catch (error) {
      console.error('Error creating matrix:', error);
    }
  };

  const addResponsibility = () => {
    setNewMatrix({
      ...newMatrix,
      responsibilities: [...newMatrix.responsibilities, '']
    });
  };

  const updateResponsibility = (index: number, value: string) => {
    const updated = [...newMatrix.responsibilities];
    updated[index] = value;
    setNewMatrix({ ...newMatrix, responsibilities: updated });
  };

  const removeResponsibility = (index: number) => {
    const updated = newMatrix.responsibilities.filter((_, i) => i !== index);
    setNewMatrix({ ...newMatrix, responsibilities: updated });
  };

  const getRelationshipColor = (type: string) => {
    switch (type) {
      case 'reporting': return 'text-blue-600 bg-blue-100';
      case 'coordination': return 'text-green-600 bg-green-100';
      case 'approval': return 'text-purple-600 bg-purple-100';
      case 'information': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-red-600 bg-red-100';
      case 'under_review': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredMatrices = matrices.filter(matrix => {
    if (selectedComponent === 'all') return true;
    return matrix.component === selectedComponent;
  });

  const componentStats = {
    'Adarsh Gram': matrices.filter(m => m.component === 'Adarsh Gram'),
    'GIA': matrices.filter(m => m.component === 'GIA'),
    'Hostel': matrices.filter(m => m.component === 'Hostel')
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading Coordination Matrix...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Coordination Matrix</h1>
              <p className="text-sm text-gray-600">Inter-agency Relationships & SLA Management</p>
            </div>
            <Button 
              onClick={() => setShowNewMatrix(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              New Relationship
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Component Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Object.entries(componentStats).map(([component, componentMatrices]) => (
            <Card key={component} className="p-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{component}</h3>
                <p className="text-sm text-gray-600">{componentMatrices.length} Relationships</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active</span>
                  <span className="text-sm font-medium text-green-600">
                    {componentMatrices.filter(m => m.currentStatus === 'active').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Under Review</span>
                  <span className="text-sm font-medium text-yellow-600">
                    {componentMatrices.filter(m => m.currentStatus === 'under_review').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Performance</span>
                  <span className={`text-sm font-medium ${getPerformanceColor(
                    componentMatrices.length > 0 
                      ? componentMatrices.reduce((sum, m) => sum + (m.performanceScore || 0), 0) / componentMatrices.length
                      : 0
                  )}`}>
                    {componentMatrices.length > 0 
                      ? Math.round(componentMatrices.reduce((sum, m) => sum + (m.performanceScore || 0), 0) / componentMatrices.length)
                      : 0
                    }%
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Component Filter */}
        <div className="flex gap-2 mb-6">
          {['all', 'Adarsh Gram', 'GIA', 'Hostel'].map((component) => (
            <button
              key={component}
              onClick={() => setSelectedComponent(component)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedComponent === component
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              {component === 'all' ? 'All Components' : component}
            </button>
          ))}
        </div>

        {/* Coordination Matrix List */}
        <div className="space-y-4">
          {filteredMatrices.length === 0 ? (
            <Card className="p-8 text-center">
              <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Coordination Relationships Found</h3>
              <p className="text-gray-600 mb-4">
                {selectedComponent === 'all' 
                  ? 'Start mapping inter-agency relationships and coordination structures.'
                  : `No coordination relationships found for ${selectedComponent}.`
                }
              </p>
              <Button onClick={() => setShowNewMatrix(true)}>
                Create First Relationship
              </Button>
            </Card>
          ) : (
            filteredMatrices.map((matrix) => (
              <Card key={matrix._id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <UsersIcon className="w-5 h-5 text-gray-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {matrix.fromAgency?.name} → {matrix.toAgency?.name}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRelationshipColor(matrix.relationshipType)}`}>
                        {matrix.relationshipType.charAt(0).toUpperCase() + matrix.relationshipType.slice(1)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span>Component: <strong>{matrix.component}</strong></span>
                      <span>•</span>
                      <span>SLA: {matrix.slaMetrics?.responseTime || 0} {matrix.slaMetrics?.unit || 'hours'}</span>
                      <span>•</span>
                      <span className={`font-medium ${getPerformanceColor(matrix.performanceScore || 0)}`}>
                        Performance: {matrix.performanceScore || 0}%
                      </span>
                    </div>

                    {matrix.responsibilities && matrix.responsibilities.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Key Responsibilities:</h4>
                        <ul className="text-sm text-gray-600">
                          {matrix.responsibilities.slice(0, 3).map((resp, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                              {resp}
                            </li>
                          ))}
                          {matrix.responsibilities.length > 3 && (
                            <li className="text-gray-500 italic">
                              +{matrix.responsibilities.length - 3} more responsibilities...
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(matrix.currentStatus)}`}>
                      {matrix.currentStatus === 'under_review' ? 'Under Review' : 
                       matrix.currentStatus.charAt(0).toUpperCase() + matrix.currentStatus.slice(1)}
                    </span>
                    {matrix.lastInteraction && (
                      <span className="text-xs text-gray-500">
                        Last: {new Date(matrix.lastInteraction).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* SLA Metrics */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <ClockIcon className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">Response Time</p>
                    <p className="text-sm font-medium">{matrix.slaMetrics?.responseTime || 0} {matrix.slaMetrics?.unit || 'hrs'}</p>
                  </div>
                  <div className="text-center">
                    <ExclamationTriangleIcon className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">Escalation</p>
                    <p className="text-sm font-medium">{matrix.slaMetrics?.escalationTime || 0} hrs</p>
                  </div>
                  <div className="text-center">
                    <ChartBarIcon className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">Performance</p>
                    <p className={`text-sm font-medium ${getPerformanceColor(matrix.performanceScore || 0)}`}>
                      {matrix.performanceScore || 0}%
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* New Matrix Modal */}
      {showNewMatrix && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreateMatrix} className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">New Coordination Relationship</h2>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowNewMatrix(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Agency</label>
                    <select
                      value={newMatrix.fromAgency}
                      onChange={(e) => setNewMatrix({ ...newMatrix, fromAgency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select agency...</option>
                      {agencies.map((agency: any) => (
                        <option key={agency._id} value={agency._id}>
                          {agency.name} ({agency.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To Agency</label>
                    <select
                      value={newMatrix.toAgency}
                      onChange={(e) => setNewMatrix({ ...newMatrix, toAgency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select agency...</option>
                      {agencies.map((agency: any) => (
                        <option key={agency._id} value={agency._id}>
                          {agency.name} ({agency.type})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Relationship Type</label>
                    <select
                      value={newMatrix.relationshipType}
                      onChange={(e) => setNewMatrix({ ...newMatrix, relationshipType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="coordination">Coordination</option>
                      <option value="reporting">Reporting</option>
                      <option value="approval">Approval</option>
                      <option value="information">Information Sharing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Component</label>
                    <select
                      value={newMatrix.component}
                      onChange={(e) => setNewMatrix({ ...newMatrix, component: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Adarsh Gram">Adarsh Gram</option>
                      <option value="GIA">GIA</option>
                      <option value="Hostel">Hostel</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Responsibilities</label>
                  {newMatrix.responsibilities.map((resp, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={resp}
                        onChange={(e) => updateResponsibility(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={`Responsibility ${index + 1}...`}
                      />
                      {newMatrix.responsibilities.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => removeResponsibility(index)}
                          className="px-3 py-2"
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addResponsibility}
                    className="text-sm"
                  >
                    <PlusIcon className="w-4 h-4 mr-1" />
                    Add Responsibility
                  </Button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SLA Metrics</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <input
                        type="number"
                        value={newMatrix.slaMetrics.responseTime}
                        onChange={(e) => setNewMatrix({
                          ...newMatrix,
                          slaMetrics: { ...newMatrix.slaMetrics, responseTime: Number(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Response time"
                      />
                    </div>
                    <div>
                      <select
                        value={newMatrix.slaMetrics.unit}
                        onChange={(e) => setNewMatrix({
                          ...newMatrix,
                          slaMetrics: { ...newMatrix.slaMetrics, unit: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                        <option value="weeks">Weeks</option>
                      </select>
                    </div>
                    <div>
                      <input
                        type="number"
                        value={newMatrix.slaMetrics.escalationTime}
                        onChange={(e) => setNewMatrix({
                          ...newMatrix,
                          slaMetrics: { ...newMatrix.slaMetrics, escalationTime: Number(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Escalation (hrs)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewMatrix(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <DocumentTextIcon className="w-4 h-4 mr-2" />
                  Create Relationship
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinationMatrix;