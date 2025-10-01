
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import { Project, Agency, Workflow } from '../../../lib/models';
import { ServerWorkflowEngine } from '../../../lib/server-workflow-engine';

export async function GET() {
  try {
    await dbConnect();
    const projects = await Project.find({})
      .populate('implementingAgency', 'name')
      .populate('executingAgencies', 'name')
      .populate('nodalAgency', 'name')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: projects,
      count: projects.length
    });
  } catch (error) {
    console.error('Projects API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    console.log('Received project data:', body);
    
    // Validate required fields
    if (!body.name || !body.component || !body.stateCode || !body.implementingAgency || !body.fundsAllocated || !body.projectId) {
      const missing = [];
      if (!body.name) missing.push('name');
      if (!body.projectId) missing.push('projectId');
      if (!body.component) missing.push('component');
      if (!body.stateCode) missing.push('stateCode');
      if (!body.implementingAgency) missing.push('implementingAgency');
      if (!body.fundsAllocated) missing.push('fundsAllocated');
      
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    // Handle date fields
    const projectData = {
      ...body,
      startDate: body.startDate ? new Date(body.startDate) : new Date(),
      expectedEndDate: body.expectedEndDate ? new Date(body.expectedEndDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    };
    
    const project = new Project(projectData);
    await project.save();
    
    // 🚀 Initialize Automated Workflow using Enhanced Server Engine
    try {
      console.log('🔄 Initializing automated workflow for project:', project._id);
      
      await ServerWorkflowEngine.initializeProjectWorkflow(
        project._id.toString(), 
        project.implementingAgency.toString()
      );
      
      console.log('✅ Automated workflow initialized successfully');
      
    } catch (workflowError) {
      console.error('❌ Error initializing workflow:', workflowError);
      // Don't fail project creation if workflow fails
    }
    
    return NextResponse.json({
      success: true,
      data: project,
      message: 'Project created successfully with automated workflow initialized'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Projects POST API Error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: validationErrors.join(', ') },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
