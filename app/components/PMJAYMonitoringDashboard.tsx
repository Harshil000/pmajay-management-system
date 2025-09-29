'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  ClockIcon, 
  UserGroupIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlayIcon,
  PauseIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  BuildingOffice2Icon,
  MapIcon,
  CalendarDaysIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { Card } from './ui/Card';

interface DashboardStats {
  totalProjects: number;
  completedProjects: number;
  ongoingProjects: number;
  delayedProjects: number;
  totalBudget: number;
  utilizedBudget: number;
  pendingApprovals: number;
  activeAgencies: number;
}

interface ProjectProgress {
  _id: string;
  name: string;
  component: 'Adarsh Gram' | 'GIA' | 'Hostel';
  progress: number;
  status: string;
  implementingAgency: { name: string };
  stateCode: string;
  fundsAllocated: number;
  fundsUtilized: number;
  startDate: string;
  expectedEndDate: string;
  daysLeft: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface FundFlow {
  _id: string;
  amount: number;
  status: string;
  releaseDate: string;
  component: string;
  purpose: string;
  fromAgency: { name: string };
  toAgency: { name: string };
}

interface ComponentProgress {
  component: string;
  totalProjects: number;
  completedProjects: number;
  totalBudget: number;
  utilizedBudget: number;
  averageProgress: number;
}

export default function PMJAYMonitoringDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    completedProjects: 0,
    ongoingProjects: 0,
    delayedProjects: 0,
    totalBudget: 0,
    utilizedBudget: 0,
    pendingApprovals: 0,
    activeAgencies: 0
  });
  
  const [projects, setProjects] = useState<ProjectProgress[]>([]);
  const [recentFundFlows, setRecentFundFlows] = useState<FundFlow[]>([]);
  const [componentProgress, setComponentProgress] = useState<ComponentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30'); // days

  useEffect(() => {
    fetchDashboardData();
  }, [selectedTimeframe]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch projects, funds, and agencies in parallel
      const [projectsRes, fundsRes, agenciesRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/funds'),
        fetch('/api/agencies')
      ]);

      if (projectsRes.ok && fundsRes.ok && agenciesRes.ok) {
        const projectsData = await projectsRes.json();
        const fundsData = await fundsRes.json();
        const agenciesData = await agenciesRes.json();

        // Process projects data
        const projects = projectsData.success ? projectsData.data : [];
        const funds = fundsData.success ? fundsData.data : [];
        const agencies = agenciesData.success ? agenciesData.data : [];

        // Calculate statistics
        const totalProjects = projects.length;
        const completedProjects = projects.filter((p: any) => p.status === 'Completed').length;
        const ongoingProjects = projects.filter((p: any) => p.status === 'In Progress').length;
        const delayedProjects = projects.filter((p: any) => p.status === 'Delayed').length;
        
        const totalBudget = projects.reduce((sum: number, p: any) => sum + (p.fundsAllocated || 0), 0);
        const utilizedBudget = projects.reduce((sum: number, p: any) => sum + (p.fundsUtilized || 0), 0);
        
        const pendingApprovals = funds.filter((f: any) => f.status === 'Pending').length;
        
        setStats({
          totalProjects,
          completedProjects,
          ongoingProjects,
          delayedProjects,
          totalBudget,
          utilizedBudget,
          pendingApprovals,
          activeAgencies: agencies.length
        });

        // Process project progress data
        const projectProgress = projects.map((project: any) => {
          const progress = project.fundsAllocated > 0 
            ? (project.fundsUtilized / project.fundsAllocated) * 100 
            : 0;
          
          const startDate = new Date(project.startDate);
          const endDate = new Date(project.expectedEndDate);
          const today = new Date();
          const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          // Determine risk level based on progress and timeline
          let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
          if (daysLeft < 0) riskLevel = 'critical';
          else if (daysLeft < 30 && progress < 70) riskLevel = 'high';
          else if (daysLeft < 60 && progress < 50) riskLevel = 'medium';

          return {
            _id: project._id,
            name: project.name,
            component: project.component,
            progress: Math.round(progress),
            status: project.status,
            implementingAgency: project.implementingAgency || { name: 'N/A' },
            stateCode: project.stateCode,
            fundsAllocated: project.fundsAllocated || 0,
            fundsUtilized: project.fundsUtilized || 0,
            startDate: project.startDate,
            expectedEndDate: project.expectedEndDate,
            daysLeft,
            riskLevel
          };
        });

        setProjects(projectProgress);

        // Calculate component progress
        const components = ['Adarsh Gram', 'GIA', 'Hostel'];
        const componentStats = components.map(component => {
          const componentProjects = projects.filter((p: any) => p.component === component);
          const totalBudget = componentProjects.reduce((sum: number, p: any) => sum + (p.fundsAllocated || 0), 0);
          const utilizedBudget = componentProjects.reduce((sum: number, p: any) => sum + (p.fundsUtilized || 0), 0);
          const averageProgress = componentProjects.length > 0
            ? componentProjects.reduce((sum: number, p: any) => {
                const progress = p.fundsAllocated > 0 ? (p.fundsUtilized / p.fundsAllocated) * 100 : 0;
                return sum + progress;
              }, 0) / componentProjects.length
            : 0;

          return {
            component,
            totalProjects: componentProjects.length,
            completedProjects: componentProjects.filter((p: any) => p.status === 'Completed').length,
            totalBudget,
            utilizedBudget,
            averageProgress: Math.round(averageProgress)
          };
        });

        setComponentProgress(componentStats);

        // Process recent fund flows (last 10)
        const recentFunds = funds
          .sort((a: any, b: any) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
          .slice(0, 10);
        
        setRecentFundFlows(recentFunds);
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
    } finally {
      setLoading(false);
    }
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

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'in progress': return <PlayIcon className="w-5 h-5 text-blue-500" />;
      case 'delayed': return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'on hold': return <PauseIcon className="w-5 h-5 text-yellow-500" />;
      default: return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading PM-AJAY Monitoring Dashboard...</p>
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
              <h1 className="text-2xl font-bold text-white">PM-AJAY Monitoring Dashboard</h1>
              <p className="text-blue-200">Real-time coordination and fund flow tracking</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
              <div className="relative">
                <BellIcon className="w-6 h-6 text-white cursor-pointer hover:text-blue-300" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {stats.pendingApprovals}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 bg-white/10 backdrop-blur-md border-white/20">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-500/20">
                <ChartBarIcon className="w-6 h-6 text-blue-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-200">Total Projects</p>
                <p className="text-2xl font-semibold text-white">{stats.totalProjects}</p>
                <p className="text-xs text-green-300">
                  {stats.completedProjects} completed ({Math.round((stats.completedProjects/stats.totalProjects)*100)}%)
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/10 backdrop-blur-md border-white/20">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-500/20">
                <CurrencyDollarIcon className="w-6 h-6 text-green-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-200">Budget Utilization</p>
                <p className="text-2xl font-semibold text-white">{formatCurrency(stats.utilizedBudget)}</p>
                <p className="text-xs text-green-300">
                  of {formatCurrency(stats.totalBudget)} ({Math.round((stats.utilizedBudget/stats.totalBudget)*100)}%)
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/10 backdrop-blur-md border-white/20">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <ExclamationTriangleIcon className="w-6 h-6 text-yellow-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-yellow-200">At Risk Projects</p>
                <p className="text-2xl font-semibold text-white">{stats.delayedProjects}</p>
                <p className="text-xs text-yellow-300">
                  {stats.pendingApprovals} pending approvals
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/10 backdrop-blur-md border-white/20">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-500/20">
                <BuildingOffice2Icon className="w-6 h-6 text-purple-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-200">Active Agencies</p>
                <p className="text-2xl font-semibold text-white">{stats.activeAgencies}</p>
                <p className="text-xs text-purple-300">
                  Across {componentProgress.length} components
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Component Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {componentProgress.map((comp) => (
            <Card key={comp.component} className="p-6 bg-white/10 backdrop-blur-md border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">{comp.component}</h3>
                <span className="text-2xl font-bold text-blue-300">{comp.averageProgress}%</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Projects:</span>
                  <span className="text-white">{comp.totalProjects} ({comp.completedProjects} completed)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Budget:</span>
                  <span className="text-white">{formatCurrency(comp.totalBudget)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Utilized:</span>
                  <span className="text-green-300">{formatCurrency(comp.utilizedBudget)}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${comp.averageProgress}%` }}
                  ></div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Project Progress Table */}
        <Card className="p-6 bg-white/10 backdrop-blur-md border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Project Progress Overview</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300">Sort by risk:</span>
              <select className="bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded px-2 py-1 text-sm">
                <option value="all">All Projects</option>
                <option value="critical">Critical Risk</option>
                <option value="high">High Risk</option>
                <option value="delayed">Delayed</option>
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Project</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Component</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Progress</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Agency</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Timeline</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {projects.slice(0, 10).map((project) => (
                  <tr key={project._id} className="hover:bg-white/5">
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-white font-medium">{project.name}</p>
                        <p className="text-xs text-gray-400">{project.stateCode}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {project.component}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-700 rounded-full h-2 mr-3">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-white">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        {getStatusIcon(project.status)}
                        <span className="ml-2 text-sm text-white">{project.status}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-300">
                      {project.implementingAgency.name}
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm">
                        <p className="text-white">{formatDate(project.expectedEndDate)}</p>
                        <p className="text-xs text-gray-400">
                          {project.daysLeft > 0 ? `${project.daysLeft} days left` : `${Math.abs(project.daysLeft)} days overdue`}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(project.riskLevel)}`}>
                        {project.riskLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Fund Flows */}
        <Card className="p-6 bg-white/10 backdrop-blur-md border-white/20">
          <h3 className="text-xl font-semibold text-white mb-6">Recent Fund Flows</h3>
          <div className="space-y-4">
            {recentFundFlows.map((fund) => (
              <div key={fund._id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-green-500/20 rounded-full">
                    <CurrencyDollarIcon className="w-5 h-5 text-green-300" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{formatCurrency(fund.amount)}</p>
                    <p className="text-sm text-gray-400">{fund.purpose}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white">{fund.fromAgency?.name} → {fund.toAgency?.name}</p>
                  <p className="text-xs text-gray-400">{formatDate(fund.releaseDate)}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  fund.status === 'Released' ? 'bg-green-100 text-green-800' :
                  fund.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {fund.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}