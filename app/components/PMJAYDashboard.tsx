'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import AdminPrivileges from './AdminPrivileges';
import WorkflowDashboard from './WorkflowDashboard';
import NotificationCenter from './NotificationCenter';
import { 
  ChatBubbleLeftRightIcon,
  UsersIcon,
  DocumentDuplicateIcon,
  BanknotesIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  MapIcon,
  BriefcaseIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalProjects: number;
  activeAgencies: number;
  totalFunding: number;
  pendingApprovals: number;
  delayedProjects: number;
  completedProjects: number;
  communicationsToday: number;
  criticalIssues: number;
}

interface ComponentStats {
  name: string;
  projects: number;
  completed: number;
  inProgress: number;
  delayed: number;
  funding: number;
  agencies: number;
}

const PMJAYDashboard = () => {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeAgencies: 0,
    totalFunding: 0,
    pendingApprovals: 0,
    delayedProjects: 0,
    completedProjects: 0,
    communicationsToday: 0,
    criticalIssues: 0
  });

  const [componentStats, setComponentStats] = useState<ComponentStats[]>([
    { name: 'Adarsh Gram', projects: 0, completed: 0, inProgress: 0, delayed: 0, funding: 0, agencies: 0 },
    { name: 'GIA', projects: 0, completed: 0, inProgress: 0, delayed: 0, funding: 0, agencies: 0 },
    { name: 'Hostel', projects: 0, completed: 0, inProgress: 0, delayed: 0, funding: 0, agencies: 0 }
  ]);

  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch all required data
      const [projectsRes, agenciesRes, fundsRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/agencies'),
        fetch('/api/funds')
      ]);

      const [projectsData, agenciesData, fundsData] = await Promise.all([
        projectsRes.json(),
        agenciesRes.json(),
        fundsRes.json()
      ]);

      if (projectsData.success && agenciesData.success && fundsData.success) {
        calculateStats(projectsData.data, agenciesData.data, fundsData.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (projects: any[], agencies: any[], funds: any[]) => {
    // Calculate overall stats
    const totalFunding = funds.reduce((sum, fund) => sum + (fund.amount || 0), 0);
    const completedProjects = projects.filter(p => p.status === 'Completed').length;
    const inProgressProjects = projects.filter(p => 
      p.status === 'In Progress' || p.status === 'Sanctioned' || p.status === 'Approved'
    ).length;
    const delayedProjects = projects.filter(p => 
      p.status === 'Delayed' || p.status === 'On Hold'
    ).length;
    const pendingApprovals = funds.filter(f => 
      f.status === 'Pending' || f.status === 'Proposed'
    ).length;

    // If most projects are 'Proposed', treat them as in progress for better UX
    const proposedProjects = projects.filter(p => p.status === 'Proposed').length;
    const adjustedInProgress = inProgressProjects + (completedProjects === 0 && delayedProjects === 0 ? proposedProjects : 0);

    console.log('Overall project statuses:', {
      total: projects.length,
      completed: completedProjects,
      inProgress: adjustedInProgress,
      delayed: delayedProjects,
      proposed: proposedProjects,
      allStatuses: [...new Set(projects.map(p => p.status))]
    });

    setStats({
      totalProjects: projects.length,
      activeAgencies: agencies.filter(a => a.isActive !== false).length, // Default to active if undefined
      totalFunding,
      pendingApprovals,
      delayedProjects,
      completedProjects,
      communicationsToday: Math.floor(Math.random() * 15), // Mock data for now
      criticalIssues: delayedProjects + pendingApprovals
    });

    // Calculate component-wise stats
    const components = ['Adarsh Gram', 'GIA', 'Hostel'];
    const newComponentStats = components.map(component => {
      const componentProjects = projects.filter(p => p.component === component);
      
      // Find agencies working on this component (simplified approach)
      const componentAgencies = agencies.filter(a => {
        // If agency has roles, check roles
        if (a.roles && Array.isArray(a.roles)) {
          return a.roles.some((role: any) => role.component === component);
        }
        // Otherwise, count all agencies (they can work on any component)
        return true;
      });
      
      // Calculate funding for this component by matching project IDs
      const componentFunding = funds.filter(fund => {
        return componentProjects.some(project => {
          // Handle both string and ObjectId comparisons
          return fund.projectId === project._id || 
                 fund.projectId?.toString() === project._id?.toString() ||
                 fund.projectId?._id === project._id ||
                 (fund.projectId?.name && componentProjects.some(p => p.name === fund.projectId.name));
        });
      }).reduce((sum, fund) => sum + (fund.amount || 0), 0);

      // Count projects by status with more flexible matching
      const completed = componentProjects.filter(p => 
        p.status === 'Completed'
      ).length;
      
      const inProgress = componentProjects.filter(p => 
        p.status === 'In Progress' || 
        p.status === 'Sanctioned' || 
        p.status === 'Approved'
      ).length;
      
      const delayed = componentProjects.filter(p => 
        p.status === 'Delayed' || 
        p.status === 'On Hold'
      ).length;
      
      // If all projects are 'Proposed', treat them as 'In Progress'
      const proposed = componentProjects.filter(p => p.status === 'Proposed').length;
      const adjustedInProgress = inProgress + (completed === 0 && delayed === 0 ? proposed : 0);

      console.log(`Component ${component} stats:`, {
        total: componentProjects.length,
        statuses: componentProjects.map(p => p.status),
        completed,
        inProgress: adjustedInProgress,
        delayed,
        proposed
      });

      return {
        name: component,
        projects: componentProjects.length,
        completed: completed,
        inProgress: adjustedInProgress,
        delayed: delayed,
        funding: componentFunding,
        agencies: Math.ceil(componentAgencies.length / components.length) // Distribute agencies across components
      };
    });

    setComponentStats(newComponentStats);
    
    console.log('Dashboard Stats Calculated:', {
      totalProjects: projects.length,
      totalFunding,
      componentStats: newComponentStats
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-400 bg-green-900/20';
      case 'In Progress': return 'text-blue-400 bg-blue-900/20';
      case 'Delayed': return 'text-red-400 bg-red-900/20';
      case 'Pending': return 'text-yellow-400 bg-yellow-900/20';
      default: return 'text-gray-400 bg-gray-800/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-300">
          <ArrowPathIcon className="w-6 h-6 animate-spin" />
          <span>Loading PM-AJAY Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-white">PM-AJAY Digital Dashboard</h1>
              <p className="text-sm text-gray-300">Research-Driven Coordination & Real-time Monitoring</p>
              <p className="text-xs text-blue-300">Based on NHA Reports & NITI Aayog Framework</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchDashboardData}
                disabled={loading}
                className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700/50"
              >
                <ArrowPathIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <span className="text-sm text-gray-400">Auto-refresh: 30s</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:border-blue-500/50 transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="w-8 h-8 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Projects</p>
                <p className="text-2xl font-bold text-white">{stats.totalProjects}</p>
                <p className="text-xs text-green-400">
                  {stats.completedProjects} completed
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:border-green-500/50 transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="w-8 h-8 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Active Agencies</p>
                <p className="text-2xl font-bold text-white">{stats.activeAgencies}</p>
                <p className="text-xs text-blue-400">
                  Coordinating nationwide
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:border-purple-500/50 transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BanknotesIcon className="w-8 h-8 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Funding</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalFunding)}</p>
                <p className="text-xs text-purple-400">
                  {stats.pendingApprovals} pending approval
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:border-red-500/50 transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Action Required</p>
                <p className="text-2xl font-bold text-white">{stats.criticalIssues}</p>
                <p className="text-xs text-red-400">
                  {stats.delayedProjects} delayed projects
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Component-wise Overview */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">PM-AJAY Components Overview</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {componentStats.map((component) => (
              <Card key={component.name} className="p-6 bg-gray-800 border-gray-700">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-white">{component.name}</h3>
                  <p className="text-sm text-gray-400">{component.projects} Total Projects</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Completed</span>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-green-500 rounded-full"
                          style={{ width: `${component.projects > 0 ? (component.completed / component.projects) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-green-600">{component.completed}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">In Progress</span>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-blue-500 rounded-full"
                          style={{ width: `${component.projects > 0 ? (component.inProgress / component.projects) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-blue-600">{component.inProgress}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Delayed</span>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-red-500 rounded-full"
                          style={{ width: `${component.projects > 0 ? (component.delayed / component.projects) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-red-600">{component.delayed}</span>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Funding</span>
                      <span className="text-sm font-medium">{formatCurrency(component.funding)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Agencies</span>
                      <span className="text-sm font-medium">{component.agencies}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions & Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Real-time Status */}
          <Card className="p-6 bg-gray-800 border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Real-time Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <ClockIcon className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-200">Pending Approvals</span>
                </div>
                <span className="text-lg font-bold text-yellow-400">{stats.pendingApprovals}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-900/20 border border-green-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-medium text-green-200">Completed Today</span>
                </div>
                <span className="text-lg font-bold text-green-400">0</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-red-900/20 border border-red-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
                  <span className="text-sm font-medium text-red-200">Delayed Projects</span>
                </div>
                <span className="text-lg font-bold text-red-400">{stats.delayedProjects}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-medium text-blue-200">Communications Today</span>
                </div>
                <span className="text-lg font-bold text-blue-400">{stats.communicationsToday}</span>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6 bg-gray-800 border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Navigation</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={() => router.push('/states')}
                className="bg-blue-600 hover:bg-blue-700 h-20 flex flex-col items-center justify-center"
              >
                <MapIcon className="w-6 h-6 mb-2" />
                <span className="text-sm">States</span>
              </Button>
              
              <Button 
                onClick={() => router.push('/agencies')}
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <UsersIcon className="w-6 h-6 mb-2" />
                <span className="text-sm">Agencies</span>
              </Button>
              
              <Button 
                onClick={() => router.push('/projects')}
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <BriefcaseIcon className="w-6 h-6 mb-2" />
                <span className="text-sm">Projects</span>
              </Button>
              
              <Button 
                onClick={() => router.push('/communications')}
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <ChatBubbleLeftRightIcon className="w-6 h-6 mb-2" />
                <span className="text-sm">Communications</span>
              </Button>
            </div>
          </Card>
        </div>

        {/* Workflow Management Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <ArrowPathIcon className="w-6 h-6 mr-2" />
            Automated Workflow Management
          </h2>
          <WorkflowDashboard />
        </div>

        {/* Notification Center */}
        <div className="mb-8">
          <NotificationCenter agencyId="60f3e9a9b8e6d4c0a8b4f8e7" />
        </div>
      </div>
    </div>
  );
};

export default PMJAYDashboard;