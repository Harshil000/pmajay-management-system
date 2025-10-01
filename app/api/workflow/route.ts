// API Routes for Workflow Management
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Workflow } from '@/lib/workflow-model';
import { ServerWorkflowEngine } from '@/lib/server-workflow-engine';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const agencyId = searchParams.get('agencyId');
    const stage = searchParams.get('stage');

    let query: any = {};

    if (projectId) {
      const workflow = await Workflow.findOne({ projectId })
        .populate('implementingAgency', 'name type')
        .populate('nodalAgency', 'name type')
        .populate('executingAgencies', 'name type')
        .populate('monitoringAgency', 'name type')
        .populate('projectId', 'name projectId component');

      return NextResponse.json({
        success: true,
        data: workflow
      });
    }

    if (agencyId) {
      // Find workflows where agency is involved
      query = {
        $or: [
          { implementingAgency: agencyId },
          { nodalAgency: agencyId },
          { executingAgencies: { $in: [agencyId] } },
          { monitoringAgency: agencyId }
        ]
      };
    }

    if (stage) {
      query.currentStage = stage;
    }

    const workflows = await Workflow.find(query)
      .populate('implementingAgency', 'name type')
      .populate('nodalAgency', 'name type')
      .populate('executingAgencies', 'name type')
      .populate('monitoringAgency', 'name type')
      .populate('projectId', 'name projectId component')
      .sort({ updatedAt: -1 });

    return NextResponse.json({
      success: true,
      data: workflows
    });

  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const workflowData = await request.json();
    
    // Check if workflow already exists for this project
    const existingWorkflow = await Workflow.findOne({ projectId: workflowData.projectId });
    
    if (existingWorkflow) {
      // Update existing workflow
      Object.assign(existingWorkflow, workflowData);
      existingWorkflow.updatedAt = new Date();
      await existingWorkflow.save();
      
      return NextResponse.json({
        success: true,
        data: existingWorkflow
      });
    } else {
      // Create new workflow
      const workflow = new Workflow(workflowData);
      await workflow.save();
      
      return NextResponse.json({
        success: true,
        data: workflow
      });
    }

  } catch (error) {
    console.error('Error saving workflow:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save workflow' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    
    const { projectId, action, agencyId, ...updateData } = await request.json();
    
    const workflow = await Workflow.findOne({ projectId });
    if (!workflow) {
      return NextResponse.json(
        { success: false, error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Handle different workflow actions
    switch (action) {
      case 'approve':
        await ServerWorkflowEngine.processNodalDecision(projectId, agencyId, 'approve', updateData.notes);
        break;

      case 'reject':
        await ServerWorkflowEngine.processNodalDecision(projectId, agencyId, 'reject', updateData.notes);
        break;

      case 'start_execution':
        await ServerWorkflowEngine.startProjectExecution(projectId, agencyId);
        break;

      case 'update_progress':
        await ServerWorkflowEngine.updateProjectProgress(projectId, agencyId, updateData.progressData);
        break;

      case 'complete':
        await ServerWorkflowEngine.completeProject(projectId, agencyId, updateData.finalReport);
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Get updated workflow
    const updatedWorkflow = await Workflow.findOne({ projectId })
      .populate('implementingAgency', 'name type')
      .populate('nodalAgency', 'name type')
      .populate('executingAgencies', 'name type')
      .populate('monitoringAgency', 'name type')
      .populate('projectId', 'name projectId component');

    return NextResponse.json({
      success: true,
      data: updatedWorkflow
    });

  } catch (error) {
    console.error('Error updating workflow:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update workflow' },
      { status: 500 }
    );
  }
}