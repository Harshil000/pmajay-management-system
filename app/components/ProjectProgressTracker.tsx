'use client';

import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  MapPinIcon,
  UserGroupIcon,
  DocumentChartBarIcon,
  ArrowTrendingUpIcon,
  EyeIcon,
  PencilIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

interface Project {
  _id: string;
  name: string;
  component: 'Adarsh Gram' | 'GIA' | 'Hostel';
  status: string;
  implementingAgency: { _id: string; name: string; type: string };
  executingAgencies: { _id: string; name: string; type: string }[];
  nodalAgency?: { _id: string; name: string; type: string };
  stateCode: string;
  fundsAllocated: number;
  fundsUtilized: number;
  startDate: string;
  expectedEndDate: string;
  actualEndDate?: string;
  createdAt: string;
  updatedAt: string;
  milestones: {
    _id: string;
    title: string;
    description: string;
    targetDate: string;
    completedDate?: string;
    status: 'Pending' | 'In Progress' | 'Completed';
    responsibleAgency?: { name: string };
  }[];
  issues: {
    _id: string;
    description: string;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    status: 'Open' | 'In Progress' | 'Resolved';
    reportedDate: string;
    reportedBy: string;
  }[];
  approvals: {
    _id: string;
    level: string;
    agency: { name: string };
    status: 'Pending' | 'Approved' | 'Rejected';
    date?: string;
  }[];
}

interface ProgressData {
  project: Project;
  progressPercentage: number;
  timelineStatus: 'on-track' | 'at-risk' | 'delayed';
  daysRemaining: number;
  budgetUtilization: number;
  milestonesCompleted: number;
  issuesCount: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  predictedCompletion: string;
}

export default function ProjectProgressTracker() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProgressData | null>(null);
  const [filterComponent, setFilterComponent] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('progress');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectsData();
  }, []);

  const fetchProjectsData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        const projectsArray = data.success ? data.data : [];
        setProjects(projectsArray);
        
        // Calculate progress data
        const progressCalculations = projectsArray.map((project: Project) => calculateProgressMetrics(project));
        setProgressData(progressCalculations);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgressMetrics = (project: Project): ProgressData => {
    // Calculate progress percentage based on funds utilization and milestones
    const budgetProgress = project.fundsAllocated > 0 ? (project.fundsUtilized / project.fundsAllocated) * 100 : 0;
    const milestonesProgress = project.milestones?.length > 0 
      ? (project.milestones.filter(m => m.status === 'Completed').length / project.milestones.length) * 100 
      : 0;
    const progressPercentage = Math.round((budgetProgress + milestonesProgress) / 2);

    // Calculate timeline status
    const startDate = new Date(project.startDate);
    const endDate = new Date(project.expectedEndDate);
    const currentDate = new Date();
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsedDuration = currentDate.getTime() - startDate.getTime();
    const expectedProgress = (elapsedDuration / totalDuration) * 100;
    
    const daysRemaining = Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let timelineStatus: 'on-track' | 'at-risk' | 'delayed' = 'on-track';
    if (daysRemaining < 0) timelineStatus = 'delayed';
    else if (progressPercentage < expectedProgress - 20) timelineStatus = 'at-risk';

    // Calculate risk level
    const issuesCount = project.issues?.filter(i => i.status !== 'Resolved').length || 0;
    const criticalIssues = project.issues?.filter(i => i.severity === 'Critical' && i.status !== 'Resolved').length || 0;
    
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (criticalIssues > 0 || timelineStatus === 'delayed') riskLevel = 'critical';
    else if (issuesCount > 3 || timelineStatus === 'at-risk') riskLevel = 'high';
    else if (issuesCount > 1 || progressPercentage < expectedProgress - 10) riskLevel = 'medium';

    // Predict completion date
    const progressRate = progressPercentage / (elapsedDuration / (1000 * 60 * 60 * 24));
    const remainingProgress = 100 - progressPercentage;
    const predictedDaysToComplete = remainingProgress / (progressRate || 1);
    const predictedCompletion = new Date(currentDate.getTime() + (predictedDaysToComplete * 24 * 60 * 60 * 1000));

    return {
      project,
      progressPercentage: Math.max(0, Math.min(100, progressPercentage)),
      timelineStatus,
      daysRemaining,
      budgetUtilization: Math.round(budgetProgress),
      milestonesCompleted: project.milestones?.filter(m => m.status === 'Completed').length || 0,
      issuesCount,
      riskLevel,
      predictedCompletion: predictedCompletion.toISOString().split('T')[0]
    };
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toFixed(0)}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in progress': return 'bg-blue-100 text-blue-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      case 'on hold': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'sanctioned': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getTimelineColor = (status: string) => {
    switch (status) {
      case 'delayed': return 'text-red-600';
      case 'at-risk': return 'text-orange-600';
      default: return 'text-green-600';
    }
  };

  const filteredAndSortedData = progressData
    .filter(data => {
      const matchesComponent = filterComponent === 'all' || data.project.component === filterComponent;
      const matchesStatus = filterStatus === 'all' || data.project.status === filterStatus;
      const matchesRisk = filterRisk === 'all' || data.riskLevel === filterRisk;
      return matchesComponent && matchesStatus && matchesRisk;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'progress':
          return b.progressPercentage - a.progressPercentage;
        case 'timeline':
          return a.daysRemaining - b.daysRemaining;
        case 'budget':
          return b.project.fundsAllocated - a.project.fundsAllocated;
        case 'risk':
          const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
        default:
          return 0;
      }
    });

  const summaryStats = {
    totalProjects: progressData.length,
    onTrack: progressData.filter(p => p.timelineStatus === 'on-track').length,
    atRisk: progressData.filter(p => p.timelineStatus === 'at-risk').length,
    delayed: progressData.filter(p => p.timelineStatus === 'delayed').length,
    avgProgress: Math.round(progressData.reduce((sum, p) => sum + p.progressPercentage, 0) / progressData.length) || 0,
    totalBudget: progressData.reduce((sum, p) => sum + p.project.fundsAllocated, 0),
    utilizedBudget: progressData.reduce((sum, p) => sum + p.project.fundsUtilized, 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Project Progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center">
                <DocumentChartBarIcon className="w-8 h-8 mr-3 text-blue-300" />
                Project Progress Tracker
              </h1>
              <p className="text-blue-200">Real-time monitoring of PM-AJAY project implementation</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="progress">Sort by Progress</option>
                <option value="timeline">Sort by Timeline</option>
                <option value="budget">Sort by Budget</option>
                <option value="risk">Sort by Risk</option>
              </select>
              <Button
                onClick={fetchProjectsData}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <ArrowTrendingUpIcon className="w-5 h-5 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4 bg-white/10 backdrop-blur-md border-white/20">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-500/20">
                <ChartBarIcon className="w-6 h-6 text-blue-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-blue-200">Total Projects</p>
                <p className="text-2xl font-bold text-white">{summaryStats.totalProjects}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white/10 backdrop-blur-md border-white/20">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircleIcon className="w-6 h-6 text-green-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-green-200">On Track</p>
                <p className="text-2xl font-bold text-white">{summaryStats.onTrack}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white/10 backdrop-blur-md border-white/20">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <ExclamationTriangleIcon className="w-6 h-6 text-yellow-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-yellow-200">At Risk</p>
                <p className="text-2xl font-bold text-white">{summaryStats.atRisk}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white/10 backdrop-blur-md border-white/20">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-500/20">
                <ClockIcon className="w-6 h-6 text-red-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-red-200">Delayed</p>
                <p className="text-2xl font-bold text-white">{summaryStats.delayed}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white/10 backdrop-blur-md border-white/20">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-500/20">
                <ArrowTrendingUpIcon className="w-6 h-6 text-purple-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-purple-200">Avg Progress</p>
                <p className="text-2xl font-bold text-white">{summaryStats.avgProgress}%</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 bg-white/10 backdrop-blur-md border-white/20">
          <div className="flex flex-wrap gap-4">
            <select
              value={filterComponent}
              onChange={(e) => setFilterComponent(e.target.value)}
              className="bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="all">All Components</option>
              <option value="Adarsh Gram">Adarsh Gram</option>
              <option value="GIA">GIA</option>
              <option value="Hostel">Hostel</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="all">All Statuses</option>
              <option value="Proposed">Proposed</option>
              <option value="Approved">Approved</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Delayed">Delayed</option>
            </select>

            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
              <option value="critical">Critical Risk</option>
            </select>
          </div>
        </Card>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAndSortedData.map((data) => (
            <Card key={data.project._id} className="p-6 bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all cursor-pointer">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white truncate">{data.project.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                        {data.project.component}
                      </Badge>
                      <Badge className={`text-xs ${getStatusColor(data.project.status)}`}>
                        {data.project.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedProject(data)}
                      className="border-white/30 text-white hover:bg-white/10"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Progress</span>
                    <span className="text-white font-medium">{data.progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${data.progressPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Budget</p>
                    <p className="text-white font-medium">{formatCurrency(data.project.fundsAllocated)}</p>
                    <p className="text-green-400 text-xs">{data.budgetUtilization}% utilized</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Timeline</p>
                    <p className={`font-medium ${getTimelineColor(data.timelineStatus)}`}>
                      {data.daysRemaining >= 0 ? `${data.daysRemaining} days left` : `${Math.abs(data.daysRemaining)} days overdue`}
                    </p>
                    <p className="text-gray-400 text-xs">{formatDate(data.project.expectedEndDate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Agency</p>
                    <p className="text-white text-xs truncate">{data.project.implementingAgency.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Risk Level</p>
                    <Badge className={`text-xs ${getRiskColor(data.riskLevel)}`}>
                      {data.riskLevel}
                    </Badge>
                  </div>
                </div>

                {/* Issues and Milestones */}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{data.milestonesCompleted}/{data.project.milestones?.length || 0} milestones</span>
                  {data.issuesCount > 0 && (
                    <span className="flex items-center text-red-400">
                      <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                      {data.issuesCount} issues
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Project Detail Modal */}
        {selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{selectedProject.project.name}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge className="bg-blue-100 text-blue-800">
                      {selectedProject.project.component}
                    </Badge>
                    <Badge className={getStatusColor(selectedProject.project.status)}>
                      {selectedProject.project.status}
                    </Badge>
                    <Badge className={`${getRiskColor(selectedProject.riskLevel)} border`}>
                      {selectedProject.riskLevel} risk
                    </Badge>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Progress Overview */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Progress Overview</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Overall Progress</span>
                        <span className="text-gray-800 font-medium">{selectedProject.progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full"
                          style={{ width: `${selectedProject.progressPercentage}%` }}
                        ></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-600">Budget Utilization</p>
                          <p className="text-lg font-semibold text-gray-800">{selectedProject.budgetUtilization}%</p>
                          <p className="text-xs text-gray-500">
                            {formatCurrency(selectedProject.project.fundsUtilized)} of {formatCurrency(selectedProject.project.fundsAllocated)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Timeline Status</p>
                          <p className={`text-lg font-semibold capitalize ${getTimelineColor(selectedProject.timelineStatus)}`}>
                            {selectedProject.timelineStatus.replace('-', ' ')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {selectedProject.daysRemaining >= 0 
                              ? `${selectedProject.daysRemaining} days remaining`
                              : `${Math.abs(selectedProject.daysRemaining)} days overdue`
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Milestones */}
                  {selectedProject.project.milestones && selectedProject.project.milestones.length > 0 && (
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Milestones</h3>
                      <div className="space-y-3">
                        {selectedProject.project.milestones.map((milestone) => (
                          <div key={milestone._id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                            <div className="flex items-center space-x-3">
                              {milestone.status === 'Completed' ? (
                                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                              ) : milestone.status === 'In Progress' ? (
                                <PlayIcon className="w-5 h-5 text-blue-500" />
                              ) : (
                                <ClockIcon className="w-5 h-5 text-gray-400" />
                              )}
                              <div>
                                <p className="font-medium text-gray-800">{milestone.title}</p>
                                <p className="text-sm text-gray-600">{milestone.description}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={getStatusColor(milestone.status)}>
                                {milestone.status}
                              </Badge>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(milestone.targetDate)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Issues */}
                  {selectedProject.project.issues && selectedProject.project.issues.length > 0 && (
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Active Issues</h3>
                      <div className="space-y-3">
                        {selectedProject.project.issues.filter(issue => issue.status !== 'Resolved').map((issue) => (
                          <div key={issue._id} className="p-3 bg-white rounded-lg border border-red-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                                  <Badge className={`text-xs ${
                                    issue.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                                    issue.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                                    issue.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {issue.severity}
                                  </Badge>
                                </div>
                                <p className="text-gray-800 font-medium">{issue.description}</p>
                                <p className="text-xs text-gray-500">Reported by {issue.reportedBy} on {formatDate(issue.reportedDate)}</p>
                              </div>
                              <Badge className={getStatusColor(issue.status)}>
                                {issue.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Project Details Sidebar */}
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Details</h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-gray-600">State:</span>
                        <p className="text-gray-800 font-medium">{selectedProject.project.stateCode}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Start Date:</span>
                        <p className="text-gray-800 font-medium">{formatDate(selectedProject.project.startDate)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Expected End:</span>
                        <p className="text-gray-800 font-medium">{formatDate(selectedProject.project.expectedEndDate)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Predicted Completion:</span>
                        <p className="text-gray-800 font-medium">{formatDate(selectedProject.predictedCompletion)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Agencies</h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-gray-600">Implementing:</span>
                        <p className="text-gray-800 font-medium">{selectedProject.project.implementingAgency.name}</p>
                      </div>
                      {selectedProject.project.executingAgencies && selectedProject.project.executingAgencies.length > 0 && (
                        <div>
                          <span className="text-gray-600">Executing:</span>
                          {selectedProject.project.executingAgencies.map((agency, index) => (
                            <p key={agency._id} className="text-gray-800 font-medium">
                              {agency.name}
                            </p>
                          ))}
                        </div>
                      )}
                      {selectedProject.project.nodalAgency && (
                        <div>
                          <span className="text-gray-600">Nodal:</span>
                          <p className="text-gray-800 font-medium">{selectedProject.project.nodalAgency.name}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Summary</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Allocated:</span>
                        <span className="text-gray-800 font-medium">{formatCurrency(selectedProject.project.fundsAllocated)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Utilized:</span>
                        <span className="text-green-600 font-medium">{formatCurrency(selectedProject.project.fundsUtilized)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Remaining:</span>
                        <span className="text-blue-600 font-medium">
                          {formatCurrency(selectedProject.project.fundsAllocated - selectedProject.project.fundsUtilized)}
                        </span>
                      </div>
                      <div className="pt-3 border-t">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Utilization:</span>
                          <span className="text-gray-800 font-medium">{selectedProject.budgetUtilization}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <PencilIcon className="w-4 h-4 mr-2" />
                  Edit Project
                </Button>
                <Button variant="outline">
                  <DocumentChartBarIcon className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
                <Button variant="outline" onClick={() => setSelectedProject(null)}>
                  Close
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}