
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import { State, Project, FundFlow } from '../../../lib/models';

export async function GET() {
  try {
    await dbConnect();
    const states = await State.find({}).sort({ name: 1 });
    
    // Enrich states with actual project and fund data
    const enrichedStates = await Promise.all(states.map(async (state) => {
      const stateObj = state.toObject();
      
      // Get projects for this state
      const projects = await Project.find({ stateCode: state.code });
      const totalProjects = projects.length;
      const completedProjects = projects.filter(p => p.status === 'Completed').length;
      
      // Calculate total funding from projects
      const totalProjectFunding = projects.reduce((sum, project) => sum + (project.fundsAllocated || 0), 0);
      
      // Get actual fund flows for projects in this state
      const projectIds = projects.map(p => p._id);
      const funds = await FundFlow.find({ projectId: { $in: projectIds } });
      const totalFundFlows = funds.reduce((sum, fund) => sum + (fund.amount || 0), 0);
      
      return {
        ...stateObj,
        totalProjects: totalProjects,
        completedProjects: completedProjects,
        ongoingProjects: projects.filter(p => p.status === 'In Progress').length,
        totalFunding: totalFundFlows, // Use actual fund flows
        projectFunding: totalProjectFunding // Allocated funding from projects
      };
    }));
    
    return NextResponse.json({
      success: true,
      data: enrichedStates,
      count: enrichedStates.length
    });
  } catch (error) {
    console.error('States API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch states' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }
    
    // If no code provided, generate one from name
    if (!body.code) {
      body.code = body.name.substring(0, 2).toUpperCase();
    }
    
    const state = new State({
      name: body.name,
      code: body.code,
      population: body.population || 0,
      isActive: body.isActive !== false,
      updatedAt: new Date()
    });
    
    await state.save();
    
    return NextResponse.json({
      success: true,
      data: state,
      message: 'State created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('States POST API Error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'State code already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create state' },
      { status: 500 }
    );
  }
}
