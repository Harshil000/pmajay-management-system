// API Route for specific project workflow
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Workflow } from '@/lib/workflow-model';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    await dbConnect();
    
    const workflow = await Workflow.findOne({ projectId: params.projectId })
      .populate('implementingAgency', 'name type')
      .populate('nodalAgency', 'name type')
      .populate('executingAgencies', 'name type')
      .populate('monitoringAgency', 'name type')
      .populate('projectId', 'name projectId component');

    if (!workflow) {
      return NextResponse.json(
        { success: false, error: 'Workflow not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: workflow
    });

  } catch (error) {
    console.error('Error fetching workflow:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workflow' },
      { status: 500 }
    );
  }
}