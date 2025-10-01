// API Route for Workflow Statistics
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { ServerWorkflowEngine } from '@/lib/server-workflow-engine';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const stats = await ServerWorkflowEngine.getWorkflowStats();
    
    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching workflow statistics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workflow statistics' },
      { status: 500 }
    );
  }
}