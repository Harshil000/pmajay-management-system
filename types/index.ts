// Core PM-AJAY System Types

export interface State {
  _id: string;
  name: string;
  code: string;
  population?: number;
  totalProjects: number;
  completedProjects: number;
  fundsAllocated: number;
  fundsUtilized: number;
  agencies: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Agency {
  _id: string;
  name: string;
  code?: string;
  type: 'Implementing Agency' | 'Executing Agency' | 'Nodal Agency' | 'Monitoring Agency' | 'Implementing' | 'Executing';
  level?: 'Central' | 'State' | 'District' | 'Block' | 'Local';
  state?: string;
  stateCode?: string;
  contactPhone?: string;
  contactEmail?: string;
  roles?: AgencyRole[];
  parentAgency?: string;
  childAgencies?: string[];
  coordinatingAgencies?: string[];
  isActive?: boolean;
  projectsCount?: number;
  completedProjects?: number;
  fundAllocated?: number;
  fundUtilized?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface AgencyRole {
  component: 'Adarsh Gram' | 'GIA' | 'Hostel';
  responsibility: string;
  authority: string;
  timeline: string;
}

export interface Project {
  _id: string;
  name: string;
  projectId?: string;
  description?: string;
  component: 'Adarsh Gram' | 'GIA' | 'Hostel';
  stateCode: string;
  implementingAgency: Agency | string;
  executingAgencies: (Agency | string)[];
  nodalAgency?: Agency | string;
  status: 'Proposed' | 'Approved' | 'Sanctioned' | 'In Progress' | 'Completed' | 'Delayed' | 'On Hold';
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  fundsAllocated: number;
  fundsUtilized: number;
  startDate: Date | string;
  expectedEndDate: Date | string;
  actualEndDate?: Date | string;
  beneficiaries?: number;
  targetBeneficiaries?: number;
  milestones?: ProjectMilestone[];
  issues?: ProjectIssue[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ProjectMilestone {
  title: string;
  description: string;
  targetDate: Date;
  completedDate?: Date;
  status: 'Pending' | 'In Progress' | 'Completed';
  responsibleAgency: string;
}

export interface ProjectIssue {
  description: string;
  reportedBy: string;
  reportedDate: Date;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Resolved';
  assignedTo?: string;
  resolution?: string;
  resolvedDate?: Date;
}

export interface FundFlow {
  _id: string;
  projectId: string;
  amount: number;
  fundType: 'Initial Allocation' | 'Installment' | 'Additional Funding' | 'Emergency Fund';
  fromAgency: string;
  toAgency: string;
  releaseDate: Date;
  status: 'Proposed' | 'Approved' | 'Released' | 'Pending' | 'Under Review' | 'Rejected' | 'On Hold';
  transactionId: string;
  purpose: string;
  component: 'Adarsh Gram' | 'GIA' | 'Hostel';
  utilizationDeadline: Date;
  utilizationStatus: 'Not Started' | 'In Progress' | 'Completed' | 'Overdue';
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Communication {
  _id: string;
  subject: string;
  message: string;
  fromAgency: string;
  toAgency: string;
  ccAgencies: string[];
  type: 'Query' | 'Update' | 'Approval Request' | 'Fund Request' | 'Issue Report' | 'Coordination' | 'Directive';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  projectId?: string;
  component?: 'Adarsh Gram' | 'GIA' | 'Hostel';
  status: 'Sent' | 'Delivered' | 'Read' | 'Responded' | 'Closed';
  responseRequired: boolean;
  responseDeadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CoordinationMatrix {
  _id: string;
  name: string;
  description: string;
  state: string;
  component: 'Adarsh Gram' | 'GIA' | 'Hostel';
  level: 'State' | 'District' | 'Block' | 'Local';
  agencies: CoordinationAgency[];
  slaMatrix: SLAEntry[];
  isActive: boolean;
  effectiveFrom: Date;
  effectiveTill?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CoordinationAgency {
  agency: string;
  role: 'Lead' | 'Supporting' | 'Monitoring' | 'Advisory' | 'Executing';
  responsibilities: string[];
  reportingTo: string[];
  coordinatesWith: string[];
}

export interface SLAEntry {
  process: string;
  fromAgency: string;
  toAgency: string;
  timeline: string;
  escalationLevel: string;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'State Admin' | 'Agency Admin' | 'Viewer';
  permissions: ('read' | 'write' | 'delete' | 'approve_funds' | 'manage_users')[];
  stateAccess: string[];
  agencyAccess: string[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Dashboard Statistics Types
export interface DashboardStats {
  totalProjects: number;
  activeAgencies: number;
  totalFunding: number;
  pendingApprovals: number;
  delayedProjects: number;
  completedProjects: number;
  communicationsToday: number;
  criticalIssues: number;
}

export interface ComponentStats {
  name: 'Adarsh Gram' | 'GIA' | 'Hostel';
  projects: number;
  completed: number;
  inProgress: number;
  delayed: number;
  funding: number;
  agencies: number;
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form State Types
export interface FormField {
  name: string;
  value: string;
  isValid: boolean;
  error?: string;
}

export interface FormState {
  [key: string]: FormField;
}

// Filter and Search Types
export interface FilterOptions {
  component?: 'all' | 'Adarsh Gram' | 'GIA' | 'Hostel';
  status?: string;
  state?: string;
  agency?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface SearchParams {
  query?: string;
  filters?: FilterOptions;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}