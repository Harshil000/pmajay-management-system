import mongoose from 'mongoose';

// State Schema
const StateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  population: { type: Number, default: 0 },
  totalProjects: { type: Number, default: 0 },
  completedProjects: { type: Number, default: 0 },
  fundsAllocated: { type: Number, default: 0 },
  fundsUtilized: { type: Number, default: 0 },
  agencies: [{ type: String }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Agency Schema - Enhanced for PM-AJAY coordination
const AgencySchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  type: { 
    type: String, 
    required: true,
    enum: ['Implementing Agency', 'Executing Agency', 'Nodal Agency', 'Monitoring Agency']
  },
  level: {
    type: String,
    required: true,
    enum: ['Central', 'State', 'District', 'Block', 'Local']
  },
  state: { type: String, required: true },
  stateCode: { type: String, required: true },
  
  // Roles and Responsibilities
  roles: [{
    component: { type: String, enum: ['Adarsh Gram', 'GIA', 'Hostel'] },
    responsibility: { type: String },
    authority: { type: String },
    timeline: { type: String }
  }],
  
  // Coordination Details
  parentAgency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' },
  childAgencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Agency' }],
  coordinatingAgencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Agency' }],
  
  // Contact and Communication
  contactPhone: { type: String, required: true },
  contactEmail: { type: String, required: true },
  headOfficer: { 
    name: { type: String },
    designation: { type: String },
    contact: { type: String },
    email: { type: String }
  },
  
  // Performance Metrics
  projectsCount: { type: Number, default: 0 },
  completedProjects: { type: Number, default: 0 },
  delayedProjects: { type: Number, default: 0 },
  fundAllocated: { type: Number, default: 0 },
  fundUtilized: { type: Number, default: 0 },
  fundPending: { type: Number, default: 0 },
  
  // Status and Activity
  isActive: { type: Boolean, default: true },
  lastActivity: { type: Date, default: Date.now },
  establishedYear: { type: Number },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Project Schema - Enhanced for PM-AJAY coordination
const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  projectId: { type: String, required: true, unique: true },
  description: { type: String },
  
  // PM-AJAY Component Classification
  component: { 
    type: String, 
    required: true,
    enum: ['Adarsh Gram', 'GIA', 'Hostel']
  },
  subComponent: { type: String },
  
  // Geographic Details
  stateCode: { type: String, required: true },
  location: {
    district: { type: String },
    block: { type: String },
    village: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  
  // Agency Mapping - Critical for coordination
  implementingAgency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true },
  executingAgencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Agency' }],
  nodalAgency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' },
  
  // Project Status and Management
  status: { 
    type: String, 
    required: true,
    enum: ['Proposed', 'Approved', 'Sanctioned', 'In Progress', 'Completed', 'Delayed', 'On Hold'],
    default: 'Proposed'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  
  // Financial Management
  fundsAllocated: { type: Number, required: true },
  fundsUtilized: { type: Number, default: 0 },
  fundsPending: { type: Number, default: 0 },
  
  // Timeline Management
  startDate: { type: Date, required: true },
  expectedEndDate: { type: Date, required: true },
  actualEndDate: { type: Date },
  
  // Beneficiary Information
  beneficiaries: { type: Number, default: 0 },
  targetBeneficiaries: { type: Number, default: 0 },
  
  // Stakeholder Coordination
  stakeholders: [{
    agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' },
    role: { type: String },
    responsibility: { type: String },
    contact: { type: String }
  }],
  
  // Communication and Issues Tracking
  communicationLog: [{
    date: { type: Date, default: Date.now },
    from: { type: String },
    to: { type: String },
    message: { type: String },
    type: { type: String, enum: ['Update', 'Issue', 'Approval', 'Query'] }
  }],
  
  issues: [{
    description: { type: String },
    reportedBy: { type: String },
    reportedDate: { type: Date, default: Date.now },
    severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'] },
    status: { type: String, enum: ['Open', 'In Progress', 'Resolved'], default: 'Open' },
    assignedTo: { type: String },
    resolution: { type: String },
    resolvedDate: { type: Date }
  }],
  
  // Progress Tracking
  milestones: [{
    title: { type: String },
    description: { type: String },
    targetDate: { type: Date },
    completedDate: { type: Date },
    status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
    responsibleAgency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' }
  }],
  
  // Approval Chain
  approvals: [{
    level: { type: String }, // State, District, Block, etc.
    agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' },
    approver: { type: String },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    date: { type: Date },
    remarks: { type: String }
  }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Fund Flow Schema - Enhanced for transparency and real-time tracking
const FundFlowSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  
  // Financial Details
  amount: { type: Number, required: true },
  fundType: { 
    type: String, 
    enum: ['Initial Allocation', 'Installment', 'Additional Funding', 'Emergency Fund'],
    default: 'Installment'
  },
  
  // Flow Direction and Agencies
  fromAgency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true },
  toAgency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true },
  
  // Status and Timeline
  releaseDate: { type: Date, required: true },
  expectedReleaseDate: { type: Date },
  actualReleaseDate: { type: Date },
  status: { 
    type: String, 
    required: true,
    enum: ['Proposed', 'Approved', 'Released', 'Pending', 'Under Review', 'Rejected', 'On Hold'],
    default: 'Proposed'
  },
  
  // Approval Chain
  approvals: [{
    level: { type: String },
    approver: { type: String },
    designation: { type: String },
    agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    date: { type: Date },
    remarks: { type: String }
  }],
  
  // Transaction Details
  transactionId: { type: String, unique: true },
  transactionMode: { 
    type: String, 
    enum: ['Bank Transfer', 'Cheque', 'Digital Payment', 'Direct Transfer'],
    default: 'Bank Transfer'
  },
  
  // Purpose and Utilization
  purpose: { type: String, required: true },
  component: { 
    type: String, 
    enum: ['Adarsh Gram', 'GIA', 'Hostel'],
    required: true
  },
  utilizationDeadline: { type: Date },
  utilizationStatus: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed', 'Overdue'],
    default: 'Not Started'
  },
  
  // Communication and Tracking
  remarks: { type: String },
  attachments: [{ type: String }], // File URLs
  communicationLog: [{
    date: { type: Date, default: Date.now },
    from: { type: String },
    to: { type: String },
    message: { type: String }
  }],
  
  // Delays and Issues
  delays: [{
    reason: { type: String },
    duration: { type: Number }, // in days
    reportedBy: { type: String },
    date: { type: Date, default: Date.now }
  }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Communication Schema - For structured inter-agency communication
const CommunicationSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  message: { type: String, required: true },
  
  // Parties involved
  fromAgency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true },
  toAgency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true },
  ccAgencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Agency' }],
  
  // Classification
  type: {
    type: String,
    enum: ['Query', 'Update', 'Approval Request', 'Fund Request', 'Issue Report', 'Coordination', 'Directive'],
    required: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  
  // Context
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  component: { type: String, enum: ['Adarsh Gram', 'GIA', 'Hostel'] },
  
  // Status and Response
  status: {
    type: String,
    enum: ['Sent', 'Delivered', 'Read', 'Responded', 'Closed'],
    default: 'Sent'
  },
  responseRequired: { type: Boolean, default: false },
  responseDeadline: { type: Date },
  
  // Attachments and Thread Management
  attachments: [{ type: String }],
  parentMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Communication' },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Coordination Matrix Schema - For mapping agency relationships
const CoordinationMatrixSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  
  // Scope
  state: { type: String, required: true },
  component: { type: String, enum: ['Adarsh Gram', 'GIA', 'Hostel'], required: true },
  level: { type: String, enum: ['State', 'District', 'Block', 'Local'], required: true },
  
  // Matrix Mapping
  agencies: [{
    agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true },
    role: { 
      type: String, 
      enum: ['Lead', 'Supporting', 'Monitoring', 'Advisory', 'Executing'],
      required: true
    },
    responsibilities: [{ type: String }],
    reportingTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Agency' }],
    coordinatesWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Agency' }]
  }],
  
  // Communication SLAs
  slaMatrix: [{
    process: { type: String },
    fromAgency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' },
    toAgency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' },
    timeline: { type: String },
    escalationLevel: { type: String }
  }],
  
  isActive: { type: Boolean, default: true },
  effectiveFrom: { type: Date, default: Date.now },
  effectiveTill: { type: Date },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Admin User Schema (for dashboard access)
const AdminUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    required: true,
    enum: ['Super Admin', 'State Admin', 'Agency Admin', 'Viewer'],
    default: 'Viewer'
  },
  permissions: [{
    type: String,
    enum: ['read', 'write', 'delete', 'approve_funds', 'manage_users']
  }],
  stateAccess: [{ type: String }], // State codes this user can access
  agencyAccess: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Agency' }],
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Export models
export const State = mongoose.models.State || mongoose.model('State', StateSchema);
export const Agency = mongoose.models.Agency || mongoose.model('Agency', AgencySchema);
export const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
export const FundFlow = mongoose.models.FundFlow || mongoose.model('FundFlow', FundFlowSchema);
export const Communication = mongoose.models.Communication || mongoose.model('Communication', CommunicationSchema);
export const CoordinationMatrix = mongoose.models.CoordinationMatrix || mongoose.model('CoordinationMatrix', CoordinationMatrixSchema);
export const AdminUser = mongoose.models.AdminUser || mongoose.model('AdminUser', AdminUserSchema);