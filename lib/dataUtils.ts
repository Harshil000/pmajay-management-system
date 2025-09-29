// Data consistency utilities for PM-AJAY system

import { Project, Agency, State, FundFlow } from '../types';

// Helper function to normalize agency data
export const normalizeAgency = (agency: any): Agency => {
  if (typeof agency === 'string') {
    return {
      _id: agency,
      name: 'Unknown Agency',
      type: 'Implementing Agency'
    };
  }
  
  return {
    _id: agency._id || agency.id || '',
    name: agency.name || 'Unknown Agency',
    type: agency.type || 'Implementing Agency',
    code: agency.code,
    level: agency.level,
    state: agency.state,
    stateCode: agency.stateCode,
    contactPhone: agency.contactPhone,
    contactEmail: agency.contactEmail,
    roles: agency.roles,
    parentAgency: agency.parentAgency,
    childAgencies: agency.childAgencies || [],
    coordinatingAgencies: agency.coordinatingAgencies || [],
    isActive: agency.isActive !== false,
    projectsCount: agency.projectsCount || 0,
    completedProjects: agency.completedProjects || 0,
    fundAllocated: agency.fundAllocated || 0,
    fundUtilized: agency.fundUtilized || 0,
    createdAt: agency.createdAt,
    updatedAt: agency.updatedAt
  };
};

// Helper function to normalize project data
export const normalizeProject = (project: any): Project => {
  return {
    _id: project._id || project.id || '',
    name: project.name || '',
    projectId: project.projectId,
    description: project.description,
    component: project.component || 'Adarsh Gram',
    stateCode: project.stateCode || '',
    implementingAgency: project.implementingAgency ? normalizeAgency(project.implementingAgency) : project.implementingAgencyId || '',
    executingAgencies: Array.isArray(project.executingAgencies) 
      ? project.executingAgencies.map(normalizeAgency)
      : project.executingAgencyIds || [],
    nodalAgency: project.nodalAgency ? normalizeAgency(project.nodalAgency) : project.nodalAgencyId,
    status: project.status || 'Proposed',
    priority: project.priority,
    fundsAllocated: Number(project.fundsAllocated) || 0,
    fundsUtilized: Number(project.fundsUtilized) || 0,
    startDate: project.startDate,
    expectedEndDate: project.expectedEndDate,
    actualEndDate: project.actualEndDate,
    beneficiaries: project.beneficiaries,
    targetBeneficiaries: project.targetBeneficiaries,
    milestones: project.milestones || [],
    issues: project.issues || [],
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  };
};

// Helper function to normalize state data
export const normalizeState = (state: any): State => {
  return {
    _id: state._id || state.id || '',
    name: state.name || '',
    code: state.code || '',
    totalProjects: Number(state.totalProjects) || 0,
    completedProjects: Number(state.completedProjects) || 0,
    fundsAllocated: Number(state.fundsAllocated) || 0,
    fundsUtilized: Number(state.fundsUtilized) || 0,
    agencies: Array.isArray(state.agencies) ? state.agencies : [],
    isActive: state.isActive !== false,
    createdAt: state.createdAt,
    updatedAt: state.updatedAt
  };
};

// Helper function to normalize fund flow data
export const normalizeFundFlow = (fundFlow: any): FundFlow => {
  return {
    _id: fundFlow._id || fundFlow.id || '',
    projectId: fundFlow.projectId || '',
    amount: Number(fundFlow.amount) || 0,
    fundType: fundFlow.fundType || 'Initial Allocation',
    fromAgency: fundFlow.fromAgency || '',
    toAgency: fundFlow.toAgency || '',
    releaseDate: new Date(fundFlow.releaseDate),
    status: fundFlow.status || 'Proposed',
    transactionId: fundFlow.transactionId || '',
    purpose: fundFlow.purpose || '',
    component: fundFlow.component || 'Adarsh Gram',
    utilizationDeadline: new Date(fundFlow.utilizationDeadline),
    utilizationStatus: fundFlow.utilizationStatus || 'Not Started',
    remarks: fundFlow.remarks,
    createdAt: new Date(fundFlow.createdAt),
    updatedAt: new Date(fundFlow.updatedAt)
  };
};

// Helper function to get agency name from agency data
export const getAgencyName = (agency: Agency | string): string => {
  if (typeof agency === 'string') {
    return 'Unknown Agency';
  }
  return agency.name || 'Unknown Agency';
};

// Helper function to get agency ID from agency data
export const getAgencyId = (agency: Agency | string): string => {
  if (typeof agency === 'string') {
    return agency;
  }
  return agency._id || '';
};

// Format currency consistently
export const formatCurrency = (amount: number): string => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toFixed(0)}`;
};

// Format date consistently
export const formatDate = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

// Calculate progress percentage
export const calculateProgress = (allocated: number, utilized: number): number => {
  if (allocated <= 0) return 0;
  return Math.round((utilized / allocated) * 100);
};

// Get status color consistently
export const getStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'completed': return 'bg-green-100 text-green-800';
    case 'in progress': return 'bg-blue-100 text-blue-800';
    case 'delayed': return 'bg-red-100 text-red-800';
    case 'on hold': return 'bg-yellow-100 text-yellow-800';
    case 'approved': return 'bg-green-100 text-green-800';
    case 'sanctioned': return 'bg-blue-100 text-blue-800';
    case 'proposed': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// Get priority color consistently
export const getPriorityColor = (priority: string): string => {
  switch (priority?.toLowerCase()) {
    case 'critical': return 'bg-red-100 text-red-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};