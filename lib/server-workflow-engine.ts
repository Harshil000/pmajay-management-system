// Enhanced Server-side Workflow Engine
import { Agency, Workflow, Communication } from './models';
import dbConnect from './db';

export class ServerWorkflowEngine {
  
  /**
   * Initialize workflow when project is created (server-side)
   */
  static async initializeProjectWorkflow(projectId: string, implementingAgencyId: string) {
    try {
      await dbConnect();
      
      console.log('🚀 Initializing server-side workflow for project:', projectId);
      
      // Find appropriate Nodal Agency based on implementing agency's state
      const implementingAgency = await Agency.findById(implementingAgencyId);
      if (!implementingAgency) {
        throw new Error('Implementing Agency not found');
      }
      
      const nodalAgency = await Agency.findOne({ 
        type: 'Nodal Agency',
        state: implementingAgency.state 
      });
      
      if (!nodalAgency) {
        console.warn('⚠️ No Nodal Agency found for state:', implementingAgency.state);
        return null;
      }
      
      // Create workflow record
      const workflow = new Workflow({
        projectId,
        currentStage: 'notified_nodal',
        implementingAgency: implementingAgencyId,
        nodalAgency: nodalAgency._id,
        executingAgencies: [],
        history: [
          {
            stage: 'created',
            actor: implementingAgencyId,
            action: 'Project created by Implementing Agency',
            timestamp: new Date()
          },
          {
            stage: 'notified_nodal',
            actor: 'system',
            action: `Nodal Agency (${nodalAgency.name}) automatically notified`,
            timestamp: new Date()
          }
        ]
      });
      
      await workflow.save();
      
      // Create notification communication
      await this.createNotificationCommunication({
        fromAgency: implementingAgencyId,
        toAgency: nodalAgency._id,
        projectId,
        type: 'Approval Request',
        subject: 'New Project Proposal Requires Review',
        message: `A new project proposal has been submitted by ${implementingAgency.name} and requires your review and approval. Please login to the PM-AJAY system to review the project details and take action.`,
        priority: 'High'
      });
      
      console.log('✅ Workflow initialized successfully');
      return workflow;
      
    } catch (error) {
      console.error('❌ Error initializing workflow:', error);
      throw error;
    }
  }
  
  /**
   * Process Nodal Agency approval/rejection
   */
  static async processNodalDecision(projectId: string, agencyId: string, action: 'approve' | 'reject', notes?: string) {
    try {
      await dbConnect();
      
      const workflow = await Workflow.findOne({ projectId }).populate('implementingAgency');
      if (!workflow) {
        throw new Error('Workflow not found');
      }
      
      if (action === 'approve') {
        // Find appropriate executing agencies
        const executingAgencies = await Agency.find({ 
          type: 'Executing Agency',
          state: workflow.implementingAgency.state 
        }).limit(2); // Assign to 2 executing agencies
        
        workflow.currentStage = 'assigned_executing';
        workflow.executingAgencies = executingAgencies.map(ea => ea._id);
        workflow.history.push({
          stage: 'approved',
          actor: agencyId,
          action: 'Project approved by Nodal Agency',
          timestamp: new Date(),
          notes
        });
        workflow.history.push({
          stage: 'assigned_executing',
          actor: 'system',
          action: `Automatically assigned to ${executingAgencies.length} executing agencies`,
          timestamp: new Date()
        });
        
        await workflow.save();
        
        // Notify executing agencies
        for (const ea of executingAgencies) {
          await this.createNotificationCommunication({
            fromAgency: agencyId,
            toAgency: ea._id,
            projectId,
            type: 'Coordination',
            subject: 'New Project Assigned for Execution',
            message: `A project has been approved and assigned to your agency for execution. Please review the project details and begin implementation.`,
            priority: 'High'
          });
        }
        
        console.log('✅ Project approved and assigned to executing agencies');
        
      } else {
        workflow.currentStage = 'rejected';
        workflow.history.push({
          stage: 'rejected',
          actor: agencyId,
          action: 'Project rejected by Nodal Agency',
          timestamp: new Date(),
          notes
        });
        
        await workflow.save();
        
        // Notify implementing agency of rejection
        await this.createNotificationCommunication({
          fromAgency: agencyId,
          toAgency: workflow.implementingAgency._id,
          projectId,
          type: 'Update',
          subject: 'Project Proposal Rejected',
          message: `Your project proposal has been rejected. Reason: ${notes || 'No specific reason provided'}. Please review and resubmit if necessary.`,
          priority: 'High'
        });
        
        console.log('❌ Project rejected');
      }
      
      return workflow;
      
    } catch (error) {
      console.error('Error processing nodal decision:', error);
      throw error;
    }
  }
  
  /**
   * Start project execution
   */
  static async startProjectExecution(projectId: string, executingAgencyId: string) {
    try {
      await dbConnect();
      
      const workflow = await Workflow.findOne({ projectId });
      if (!workflow) {
        throw new Error('Workflow not found');
      }
      
      // Find monitoring agency
      const monitoringAgency = await Agency.findOne({ type: 'Monitoring Agency' });
      
      workflow.currentStage = 'in_execution';
      if (monitoringAgency) {
        workflow.monitoringAgency = monitoringAgency._id;
      }
      
      workflow.history.push({
        stage: 'in_execution',
        actor: executingAgencyId,
        action: 'Project execution started',
        timestamp: new Date()
      });
      
      if (monitoringAgency) {
        workflow.history.push({
          stage: 'monitoring',
          actor: 'system',
          action: `Monitoring assigned to ${monitoringAgency.name}`,
          timestamp: new Date()
        });
        
        workflow.currentStage = 'monitoring';
      }
      
      await workflow.save();
      
      // Notify monitoring agency
      if (monitoringAgency) {
        await this.createNotificationCommunication({
          fromAgency: executingAgencyId,
          toAgency: monitoringAgency._id,
          projectId,
          type: 'Coordination',
          subject: 'Project Execution Started - Monitoring Required',
          message: `A project has started execution and requires monitoring. Please review the project progress and provide oversight.`,
          priority: 'Medium'
        });
      }
      
      console.log('✅ Project execution started and monitoring assigned');
      return workflow;
      
    } catch (error) {
      console.error('Error starting project execution:', error);
      throw error;
    }
  }
  
  /**
   * Update project progress
   */
  static async updateProjectProgress(projectId: string, executingAgencyId: string, progressData: any) {
    try {
      await dbConnect();
      
      const workflow = await Workflow.findOne({ projectId });
      if (!workflow) {
        throw new Error('Workflow not found');
      }
      
      workflow.history.push({
        stage: 'progress_update',
        actor: executingAgencyId,
        action: 'Progress update submitted',
        timestamp: new Date(),
        metadata: progressData
      });
      
      await workflow.save();
      
      // Notify monitoring agency of progress
      if (workflow.monitoringAgency) {
        await this.createNotificationCommunication({
          fromAgency: executingAgencyId,
          toAgency: workflow.monitoringAgency,
          projectId,
          type: 'Update',
          subject: 'Project Progress Update',
          message: `New progress update received for the project under monitoring. Completion: ${progressData.completion || 'N/A'}%. Please review the latest updates.`,
          priority: 'Medium'
        });
      }
      
      console.log('✅ Progress updated and monitoring agency notified');
      return workflow;
      
    } catch (error) {
      console.error('Error updating project progress:', error);
      throw error;
    }
  }
  
  /**
   * Complete project workflow
   */
  static async completeProject(projectId: string, monitoringAgencyId: string, finalReport: any) {
    try {
      await dbConnect();
      
      const workflow = await Workflow.findOne({ projectId });
      if (!workflow) {
        throw new Error('Workflow not found');
      }
      
      workflow.currentStage = 'completed';
      workflow.history.push({
        stage: 'completed',
        actor: monitoringAgencyId,
        action: 'Project completed and final report submitted',
        timestamp: new Date(),
        metadata: finalReport
      });
      
      await workflow.save();
      
      // Notify all stakeholders of completion
      const stakeholders = [
        workflow.implementingAgency,
        workflow.nodalAgency,
        ...workflow.executingAgencies
      ].filter(Boolean);
      
      for (const stakeholderId of stakeholders) {
        await this.createNotificationCommunication({
          fromAgency: monitoringAgencyId,
          toAgency: stakeholderId,
          projectId,
          type: 'Update',
          subject: 'Project Successfully Completed',
          message: `The project has been successfully completed. Final reports and documentation are now available in the system.`,
          priority: 'Low'
        });
      }
      
      console.log('✅ Project completed and all stakeholders notified');
      return workflow;
      
    } catch (error) {
      console.error('Error completing project:', error);
      throw error;
    }
  }
  
  /**
   * Create notification communication
   */
  private static async createNotificationCommunication(params: {
    fromAgency: string;
    toAgency: string;
    projectId: string;
    type: string;
    subject: string;
    message: string;
    priority: string;
  }) {
    try {
      const communication = new Communication({
        subject: params.subject,
        message: params.message,
        fromAgency: params.fromAgency,
        toAgency: params.toAgency,
        type: params.type,
        priority: params.priority,
        projectId: params.projectId,
        status: 'Sent',
        responseRequired: ['Approval Request', 'Query'].includes(params.type)
      });
      
      await communication.save();
      console.log('📧 Notification sent:', params.subject);
      
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }
  
  /**
   * Get workflow statistics
   */
  static async getWorkflowStats() {
    try {
      await dbConnect();
      
      const totalWorkflows = await Workflow.countDocuments();
      const pendingApprovals = await Workflow.countDocuments({ currentStage: 'notified_nodal' });
      const inExecution = await Workflow.countDocuments({ currentStage: { $in: ['in_execution', 'monitoring'] } });
      const completed = await Workflow.countDocuments({ currentStage: 'completed' });
      
      return {
        total: totalWorkflows,
        pendingApprovals,
        inExecution,
        completed,
        successRate: totalWorkflows > 0 ? Math.round((completed / totalWorkflows) * 100) : 0
      };
      
    } catch (error) {
      console.error('Error getting workflow stats:', error);
      return { total: 0, pendingApprovals: 0, inExecution: 0, completed: 0, successRate: 0 };
    }
  }
}