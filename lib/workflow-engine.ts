// Workflow Engine for PM-AJAY Agency Coordination
// Implements the automated workflow shown in SIH flowchart

import { ObjectId } from 'mongodb';

export interface WorkflowState {
  projectId: string;
  currentStage: 'created' | 'notified_nodal' | 'under_review' | 'approved' | 'assigned_executing' | 'in_execution' | 'monitoring' | 'completed' | 'rejected';
  implementingAgency: string;
  nodalAgency?: string;
  executingAgencies: string[];
  monitoringAgency?: string;
  history: WorkflowEvent[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowEvent {
  stage: string;
  actor: string; // Agency ID
  action: string;
  timestamp: Date;
  notes?: string;
  metadata?: any;
}

export interface NotificationPayload {
  type: 'project_created' | 'review_required' | 'project_approved' | 'project_assigned' | 'progress_update' | 'monitoring_required';
  fromAgency: string;
  toAgency: string;
  projectId: string;
  subject: string;
  message: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  metadata?: any;
}

export class WorkflowEngine {
  
  /**
   * Initialize workflow when IA creates a project
   */
  static async initializeWorkflow(projectId: string, implementingAgencyId: string): Promise<WorkflowState> {
    const workflow: WorkflowState = {
      projectId,
      currentStage: 'created',
      implementingAgency: implementingAgencyId,
      executingAgencies: [],
      history: [{
        stage: 'created',
        actor: implementingAgencyId,
        action: 'Project created by Implementing Agency',
        timestamp: new Date()
      }],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Find appropriate Nodal Agency for the project
    const nodalAgency = await this.findNodalAgency(implementingAgencyId);
    if (nodalAgency) {
      workflow.nodalAgency = nodalAgency;
      await this.transitionToNodalNotification(workflow);
    }

    return workflow;
  }

  /**
   * Step 1: IA creates project → Notify Nodal Agency
   */
  static async transitionToNodalNotification(workflow: WorkflowState): Promise<void> {
    workflow.currentStage = 'notified_nodal';
    workflow.history.push({
      stage: 'notified_nodal',
      actor: 'system',
      action: 'Nodal Agency notified for review',
      timestamp: new Date()
    });

    // Send notification to Nodal Agency
    const notification: NotificationPayload = {
      type: 'review_required',
      fromAgency: workflow.implementingAgency,
      toAgency: workflow.nodalAgency!,
      projectId: workflow.projectId,
      subject: 'New Project Proposal Requires Review',
      message: `A new project proposal has been submitted by the Implementing Agency and requires your review and approval. Please login to the PM-AJAY system to review the project details.`,
      priority: 'High'
    };

    await this.sendNotification(notification);
    await this.updateWorkflowInDB(workflow);
  }

  /**
   * Step 2: Nodal Agency reviews and approves
   */
  static async processNodalApproval(workflow: WorkflowState, nodalAgencyId: string, approved: boolean, notes?: string): Promise<void> {
    if (approved) {
      workflow.currentStage = 'approved';
      workflow.history.push({
        stage: 'approved',
        actor: nodalAgencyId,
        action: 'Project approved by Nodal Agency',
        timestamp: new Date(),
        notes
      });

      // Find and assign Executing Agencies
      const executingAgencies = await this.findExecutingAgencies(workflow.projectId);
      workflow.executingAgencies = executingAgencies;
      
      await this.transitionToExecutingAssignment(workflow);
    } else {
      workflow.currentStage = 'rejected';
      workflow.history.push({
        stage: 'rejected',
        actor: nodalAgencyId,
        action: 'Project rejected by Nodal Agency',
        timestamp: new Date(),
        notes
      });

      // Notify IA of rejection
      const notification: NotificationPayload = {
        type: 'project_approved',
        fromAgency: nodalAgencyId,
        toAgency: workflow.implementingAgency,
        projectId: workflow.projectId,
        subject: 'Project Proposal Rejected',
        message: `Your project proposal has been rejected. Reason: ${notes || 'No specific reason provided'}`,
        priority: 'High'
      };

      await this.sendNotification(notification);
    }

    await this.updateWorkflowInDB(workflow);
  }

  /**
   * Step 3: Assign to Executing Agencies
   */
  static async transitionToExecutingAssignment(workflow: WorkflowState): Promise<void> {
    workflow.currentStage = 'assigned_executing';
    workflow.history.push({
      stage: 'assigned_executing',
      actor: 'system',
      action: 'Project assigned to Executing Agencies',
      timestamp: new Date()
    });

    // Notify all Executing Agencies
    for (const executingAgencyId of workflow.executingAgencies) {
      const notification: NotificationPayload = {
        type: 'project_assigned',
        fromAgency: workflow.nodalAgency!,
        toAgency: executingAgencyId,
        projectId: workflow.projectId,
        subject: 'New Project Assigned for Execution',
        message: `A project has been assigned to your agency for execution. Please review the project details and begin implementation.`,
        priority: 'High'
      };

      await this.sendNotification(notification);
    }

    await this.updateWorkflowInDB(workflow);
  }

  /**
   * Step 4: Executing Agency starts execution
   */
  static async transitionToExecution(workflow: WorkflowState, executingAgencyId: string): Promise<void> {
    workflow.currentStage = 'in_execution';
    workflow.history.push({
      stage: 'in_execution',
      actor: executingAgencyId,
      action: 'Project execution started',
      timestamp: new Date()
    });

    // Find and assign Monitoring Agency
    const monitoringAgency = await this.findMonitoringAgency(workflow.projectId);
    if (monitoringAgency) {
      workflow.monitoringAgency = monitoringAgency;
      await this.transitionToMonitoring(workflow);
    }

    await this.updateWorkflowInDB(workflow);
  }

  /**
   * Step 5: Send to Monitoring Agency
   */
  static async transitionToMonitoring(workflow: WorkflowState): Promise<void> {
    workflow.currentStage = 'monitoring';
    workflow.history.push({
      stage: 'monitoring',
      actor: 'system',
      action: 'Project sent for monitoring',
      timestamp: new Date()
    });

    // Notify Monitoring Agency
    const notification: NotificationPayload = {
      type: 'monitoring_required',
      fromAgency: workflow.executingAgencies[0], // Primary executing agency
      toAgency: workflow.monitoringAgency!,
      projectId: workflow.projectId,
      subject: 'Project Ready for Monitoring',
      message: `A project is now in execution phase and requires monitoring. Please review the progress and provide oversight.`,
      priority: 'Medium'
    };

    await this.sendNotification(notification);
    await this.updateWorkflowInDB(workflow);
  }

  /**
   * Progress Update Handler
   */
  static async handleProgressUpdate(workflow: WorkflowState, executingAgencyId: string, progressData: any): Promise<void> {
    workflow.history.push({
      stage: 'progress_update',
      actor: executingAgencyId,
      action: 'Progress update submitted',
      timestamp: new Date(),
      metadata: progressData
    });

    // Notify Monitoring Agency of progress
    if (workflow.monitoringAgency) {
      const notification: NotificationPayload = {
        type: 'progress_update',
        fromAgency: executingAgencyId,
        toAgency: workflow.monitoringAgency,
        projectId: workflow.projectId,
        subject: 'Project Progress Update',
        message: `New progress update received for the project under monitoring. Please review the latest updates.`,
        priority: 'Medium',
        metadata: progressData
      };

      await this.sendNotification(notification);
    }

    await this.updateWorkflowInDB(workflow);
  }

  /**
   * Complete Workflow
   */
  static async completeWorkflow(workflow: WorkflowState, monitoringAgencyId: string, finalReport: any): Promise<void> {
    workflow.currentStage = 'completed';
    workflow.history.push({
      stage: 'completed',
      actor: monitoringAgencyId,
      action: 'Project completed and final report submitted',
      timestamp: new Date(),
      metadata: finalReport
    });

    // Notify all stakeholders of completion
    const stakeholders = [
      workflow.implementingAgency,
      workflow.nodalAgency,
      ...workflow.executingAgencies
    ].filter(Boolean);

    for (const stakeholderId of stakeholders) {
      const notification: NotificationPayload = {
        type: 'project_approved',
        fromAgency: monitoringAgencyId,
        toAgency: stakeholderId!,
        projectId: workflow.projectId,
        subject: 'Project Completed',
        message: `The project has been successfully completed. Final reports are now available in the system.`,
        priority: 'Low'
      };

      await this.sendNotification(notification);
    }

    await this.updateWorkflowInDB(workflow);
  }

  // Helper Methods

  private static async findNodalAgency(implementingAgencyId: string): Promise<string | null> {
    // Logic to find appropriate Nodal Agency based on state/region
    // For now, return the first Nodal Agency found
    try {
      if (typeof window === 'undefined') {
        // Server-side: use direct database query
        return null; // Will be handled in API route
      }
      
      const response = await fetch('/api/agencies?type=Nodal Agency');
      const data = await response.json();
      return data.success && data.data.length > 0 ? data.data[0]._id : null;
    } catch (error) {
      console.error('Error finding Nodal Agency:', error);
      return null;
    }
  }

  private static async findExecutingAgencies(projectId: string): Promise<string[]> {
    // Logic to find appropriate Executing Agencies based on project location/type
    try {
      if (typeof window === 'undefined') {
        // Server-side: use direct database query
        return []; // Will be handled in API route
      }
      
      const response = await fetch('/api/agencies?type=Executing Agency');
      const data = await response.json();
      return data.success ? data.data.slice(0, 2).map((agency: any) => agency._id) : [];
    } catch (error) {
      console.error('Error finding Executing Agencies:', error);
      return [];
    }
  }

  private static async findMonitoringAgency(projectId: string): Promise<string | null> {
    // Logic to find appropriate Monitoring Agency
    try {
      if (typeof window === 'undefined') {
        // Server-side: use direct database query
        return null; // Will be handled in API route
      }
      
      const response = await fetch('/api/agencies?type=Monitoring Agency');
      const data = await response.json();
      return data.success && data.data.length > 0 ? data.data[0]._id : null;
    } catch (error) {
      console.error('Error finding Monitoring Agency:', error);
      return null;
    }
  }

  private static async sendNotification(notification: NotificationPayload): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        // Server-side: handle differently or skip
        console.log('Server-side notification:', notification.subject);
        return;
      }
      
      await fetch('/api/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: notification.subject,
          message: notification.message,
          type: 'Coordination',
          priority: notification.priority,
          fromAgency: notification.fromAgency,
          toAgency: notification.toAgency,
          relatedProject: notification.projectId,
          metadata: notification.metadata
        })
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  private static async updateWorkflowInDB(workflow: WorkflowState): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        // Server-side: handle differently
        console.log('Server-side workflow update for project:', workflow.projectId);
        return;
      }
      
      await fetch('/api/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow)
      });
    } catch (error) {
      console.error('Error updating workflow in DB:', error);
    }
  }

  /**
   * Get workflow status for a project
   */
  static async getWorkflowStatus(projectId: string): Promise<WorkflowState | null> {
    try {
      const response = await fetch(`/api/workflow/${projectId}`);
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error getting workflow status:', error);
      return null;
    }
  }

  /**
   * Get all pending workflows for an agency
   */
  static async getPendingWorkflows(agencyId: string): Promise<WorkflowState[]> {
    try {
      const response = await fetch(`/api/workflow/pending/${agencyId}`);
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error getting pending workflows:', error);
      return [];
    }
  }
}