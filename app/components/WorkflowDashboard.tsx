'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  EyeIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface WorkflowState {
  _id: string;
  projectId: {
    _id: string;
    name: string;
    projectId: string;
    component: string;
  };
  currentStage: string;
  implementingAgency: {
    _id: string;
    name: string;
    type: string;
  };
  nodalAgency?: {
    _id: string;
    name: string;
    type: string;
  };
  executingAgencies: Array<{
    _id: string;
    name: string;
    type: string;
  }>;
  monitoringAgency?: {
    _id: string;
    name: string;
    type: string;
  };
  history: Array<{
    stage: string;
    actor: string;
    action: string;
    timestamp: string;
    notes?: string;
    metadata?: any;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface WorkflowDashboardProps {
  agencyId?: string;
}

const STAGE_LABELS = {
  'created': 'Project Created',
  'notified_nodal': 'Nodal Agency Notified',
  'under_review': 'Under Review',
  'approved': 'Approved',
  'assigned_executing': 'Assigned to Executing Agency',
  'in_execution': 'In Execution',
  'monitoring': 'Under Monitoring',
  'completed': 'Completed',
  'rejected': 'Rejected'
};

const STAGE_COLORS = {
  'created': 'bg-blue-100 text-blue-800',
  'notified_nodal': 'bg-yellow-100 text-yellow-800',
  'under_review': 'bg-orange-100 text-orange-800',
  'approved': 'bg-green-100 text-green-800',
  'assigned_executing': 'bg-purple-100 text-purple-800',
  'in_execution': 'bg-indigo-100 text-indigo-800',
  'monitoring': 'bg-pink-100 text-pink-800',
  'completed': 'bg-green-100 text-green-800',
  'rejected': 'bg-red-100 text-red-800'
};

export default function WorkflowDashboard({ agencyId }: WorkflowDashboardProps) {
  const [workflows, setWorkflows] = useState<WorkflowState[]>([]);
  const [pendingWorkflows, setPendingWorkflows] = useState<WorkflowState[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowState | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [agencyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchWorkflows(),
        fetchWorkflowStats(),
        agencyId ? fetchPendingWorkflows() : Promise.resolve()
      ]);
    } catch (error) {
      console.error('Error fetching workflow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkflows = async () => {
    try {
      const url = agencyId ? `/api/workflow?agencyId=${agencyId}` : '/api/workflow';
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText);
        return;
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('API returned non-JSON response:', contentType);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setWorkflows(data.data);
      }
    } catch (error) {
      console.error('Error fetching workflows:', error);
    }
  };

  const fetchPendingWorkflows = async () => {
    if (!agencyId) return;
    
    try {
      const response = await fetch(`/api/workflow/pending/${agencyId}`);
      
      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText);
        return;
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('API returned non-JSON response:', contentType);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setPendingWorkflows(data.data);
      }
    } catch (error) {
      console.error('Error fetching pending workflows:', error);
    }
  };

  const fetchWorkflowStats = async () => {
    try {
      const response = await fetch('/api/workflow/stats');
      
      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText);
        return;
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('API returned non-JSON response:', contentType);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching workflow stats:', error);
    }
  };

  const handleApproveProject = async (workflow: WorkflowState, notes?: string) => {
    if (!agencyId) return;
    
    setActionLoading(workflow._id);
    try {
      const response = await fetch('/api/workflow', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: workflow.projectId._id,
          action: 'approve',
          agencyId,
          notes: notes || 'Approved by Nodal Agency'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      const result = await response.json();
      if (result.success) {
        await fetchData(); // Refresh all data
        setSelectedWorkflow(null);
        
        // Show success message
        alert('✅ Project approved successfully! Executing agencies have been notified.');
      } else {
        throw new Error(result.error || 'Failed to approve project');
      }
    } catch (error) {
      console.error('Error approving project:', error);
      alert('❌ Error approving project. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectProject = async (workflow: WorkflowState, notes: string) => {
    if (!agencyId || !notes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    setActionLoading(workflow._id);
    try {
      const response = await fetch('/api/workflow', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: workflow.projectId._id,
          action: 'reject',
          agencyId,
          notes
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      const result = await response.json();
      if (result.success) {
        await fetchData(); // Refresh all data
        setSelectedWorkflow(null);
        
        // Show success message
        alert('❌ Project rejected. Implementing agency has been notified.');
      } else {
        throw new Error(result.error || 'Failed to reject project');
      }
    } catch (error) {
      console.error('Error rejecting project:', error);
      alert('❌ Error rejecting project. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartExecution = async (workflow: WorkflowState) => {
    if (!agencyId) return;
    
    setActionLoading(workflow._id);
    try {
      const response = await fetch('/api/workflow', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: workflow.projectId._id,
          action: 'start_execution',
          agencyId
        })
      });

      const result = await response.json();
      if (result.success) {
        await fetchData(); // Refresh all data
        
        // Show success message
        alert('🚀 Project execution started! Monitoring agency has been notified.');
      } else {
        throw new Error(result.error || 'Failed to start execution');
      }
    } catch (error) {
      console.error('Error starting execution:', error);
      alert('❌ Error starting execution. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredWorkflows = workflows.filter(workflow => {
    if (filter === 'pending') {
      return pendingWorkflows.some(pw => pw._id === workflow._id);
    } else if (filter === 'completed') {
      return workflow.currentStage === 'completed';
    }
    return true;
  });

  const getActionButton = (workflow: WorkflowState) => {
    const isPending = pendingWorkflows.some(pw => pw._id === workflow._id);
    const isLoading = actionLoading === workflow._id;
    
    if (!isPending) return null;

    switch (workflow.currentStage) {
      case 'notified_nodal':
        return (
          <div className="space-x-2">
            <Button
              onClick={() => handleApproveProject(workflow)}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <CheckCircleIcon className="w-4 h-4 mr-2" />
              )}
              {isLoading ? 'Processing...' : 'Approve'}
            </Button>
            <Button
              onClick={() => {
                const reason = prompt('Please provide a reason for rejection:');
                if (reason) handleRejectProject(workflow, reason);
              }}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm disabled:opacity-50"
            >
              <XCircleIcon className="w-4 h-4 mr-2" />
              Reject
            </Button>
          </div>
        );
      
      case 'assigned_executing':
        return (
          <Button
            onClick={() => handleStartExecution(workflow)}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <ArrowRightIcon className="w-4 h-4 mr-2" />
            )}
            {isLoading ? 'Starting...' : 'Start Execution'}
          </Button>
        );
      
      default:
        return (
          <Button
            onClick={() => setSelectedWorkflow(workflow)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 text-sm"
          >
            <EyeIcon className="w-4 h-4 mr-2" />
            View Details
          </Button>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <h2 className="text-3xl font-bold mb-2">Agency Coordination Workflow</h2>
        <p className="text-blue-100">Automated workflow management as per SIH 2024 flowchart</p>
        
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold">{stats.total || workflows.length}</div>
            <div className="text-sm text-blue-100">Total Workflows</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold">{stats.pendingApprovals || pendingWorkflows.length}</div>
            <div className="text-sm text-blue-100">Pending Actions</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold">
              {stats.completed || workflows.filter(w => w.currentStage === 'completed').length}
            </div>
            <div className="text-sm text-blue-100">Completed</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold">
              {stats.inExecution || workflows.filter(w => ['in_execution', 'monitoring'].includes(w.currentStage)).length}
            </div>
            <div className="text-sm text-blue-100">In Execution</div>
          </div>
        </div>
      </div>

      {/* Pending Actions Alert */}
      {pendingWorkflows.length > 0 && (
        <Card className="border-l-4 border-l-orange-500 bg-orange-50">
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-orange-500" />
            <div>
              <h3 className="font-semibold text-orange-800">Action Required</h3>
              <p className="text-orange-700">
                You have {pendingWorkflows.length} workflow(s) requiring your attention
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Filter Buttons */}
      <div className="flex space-x-4">
        <Button
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}
        >
          All Workflows
        </Button>
        <Button
          onClick={() => setFilter('pending')}
          className={filter === 'pending' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700'}
        >
          Pending ({pendingWorkflows.length})
        </Button>
        <Button
          onClick={() => setFilter('completed')}
          className={filter === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}
        >
          Completed
        </Button>
      </div>

      {/* Workflows List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading workflows...</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredWorkflows.map((workflow) => (
            <Card key={workflow._id} className="border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-xl font-semibold text-gray-800">
                      {workflow.projectId.name}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${STAGE_COLORS[workflow.currentStage as keyof typeof STAGE_COLORS]}`}>
                      {STAGE_LABELS[workflow.currentStage as keyof typeof STAGE_LABELS]}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><span className="font-medium">Project ID:</span> {workflow.projectId.projectId}</p>
                    <p><span className="font-medium">Component:</span> {workflow.projectId.component}</p>
                    <p><span className="font-medium">Implementing Agency:</span> {workflow.implementingAgency.name}</p>
                    {workflow.nodalAgency && (
                      <p><span className="font-medium">Nodal Agency:</span> {workflow.nodalAgency.name}</p>
                    )}
                    {workflow.executingAgencies.length > 0 && (
                      <p><span className="font-medium">Executing Agencies:</span> {workflow.executingAgencies.map(a => a.name).join(', ')}</p>
                    )}
                  </div>

                  {/* Workflow Timeline */}
                  <div className="mt-4 flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <ClockIcon className="w-4 h-4" />
                      <span>Created: {new Date(workflow.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DocumentTextIcon className="w-4 h-4" />
                      <span>{workflow.history.length} events</span>
                    </div>
                  </div>
                </div>

                <div className="ml-4 flex flex-col items-end space-y-2">
                  {getActionButton(workflow)}
                  
                  <Button
                    onClick={() => setSelectedWorkflow(workflow)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 text-sm"
                  >
                    <InformationCircleIcon className="w-4 h-4 mr-1" />
                    Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Workflow Details Modal */}
      {selectedWorkflow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-3xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold">Workflow Details</h3>
              <Button
                onClick={() => setSelectedWorkflow(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-lg mb-2">Project Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p><span className="font-medium">Name:</span> {selectedWorkflow.projectId.name}</p>
                  <p><span className="font-medium">Component:</span> {selectedWorkflow.projectId.component}</p>
                  <p><span className="font-medium">Current Stage:</span> 
                    <span className={`ml-2 px-2 py-1 rounded ${STAGE_COLORS[selectedWorkflow.currentStage as keyof typeof STAGE_COLORS]}`}>
                      {STAGE_LABELS[selectedWorkflow.currentStage as keyof typeof STAGE_LABELS]}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-2">Workflow History</h4>
                <div className="space-y-3">
                  {selectedWorkflow.history.map((event, index) => (
                    <div key={index} className="border-l-2 border-blue-200 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{event.action}</p>
                          <p className="text-sm text-gray-600">Stage: {event.stage}</p>
                          {event.notes && (
                            <p className="text-sm text-gray-700 mt-1">Notes: {event.notes}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}