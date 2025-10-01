// API Route for pending workflows by agency
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Workflow } from '@/lib/workflow-model';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agencyId: string }> }
) {
  try {
    await dbConnect();

    const { agencyId } = await params;    // Find workflows where this agency needs to take action
    const pendingWorkflows = await Workflow.find({
      $and: [
        {
          $or: [
            // Nodal agency needs to review
            { nodalAgency: agencyId, currentStage: 'notified_nodal' },
            // Executing agency needs to start execution
            { executingAgencies: { $in: [agencyId] }, currentStage: 'assigned_executing' },
            // Monitoring agency needs to monitor
            { monitoringAgency: agencyId, currentStage: 'monitoring' }
          ]
        },
        { isActive: true }
      ]
    })
    .populate('implementingAgency', 'name type')
    .populate('nodalAgency', 'name type')
    .populate('executingAgencies', 'name type')
    .populate('monitoringAgency', 'name type')
    .populate('projectId', 'name projectId component status')
    .sort({ updatedAt: -1 });

    return NextResponse.json({
      success: true,
      data: pendingWorkflows
    });

  } catch (error) {
    console.error('Error fetching pending workflows:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pending workflows' },
      { status: 500 }
    );
  }
}