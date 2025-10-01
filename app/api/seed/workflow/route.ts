// Demo Data Seeder for Workflow Testing
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Project, Agency, Workflow, Communication } from '@/lib/models';
import { ServerWorkflowEngine } from '@/lib/server-workflow-engine';

export async function POST() {
  try {
    await dbConnect();
    
    console.log('🌱 Seeding demo workflow data...');
    
    // Get existing agencies
    const agencies = await Agency.find({});
    const implementingAgency = agencies.find(a => a.type === 'Implementing Agency');
    const nodalAgency = agencies.find(a => a.type === 'Nodal Agency');
    const executingAgency = agencies.find(a => a.type === 'Executing Agency');
    const monitoringAgency = agencies.find(a => a.type === 'Monitoring Agency');
    
    if (!implementingAgency || !nodalAgency || !executingAgency || !monitoringAgency) {
      return NextResponse.json({
        success: false,
        error: 'Required agency types not found. Please seed agencies first.'
      }, { status: 400 });
    }
    
    // Create demo projects with different workflow stages
    const demoProjects = [
      {
        name: 'Smart Village Digital Infrastructure',
        projectId: 'SVDI-2024-001',
        component: 'Adarsh Gram',
        stateCode: 'MH',
        implementingAgency: implementingAgency._id,
        fundsAllocated: 50000000,
        startDate: new Date(),
        expectedEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'Proposed'
      },
      {
        name: 'Rural Connectivity Enhancement',
        projectId: 'RCE-2024-002',
        component: 'GIA',
        stateCode: 'KA',
        implementingAgency: implementingAgency._id,
        fundsAllocated: 75000000,
        startDate: new Date(),
        expectedEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'Proposed'
      },
      {
        name: 'Youth Hostel Modernization',
        projectId: 'YHM-2024-003',
        component: 'Hostel',
        stateCode: 'TN',
        implementingAgency: implementingAgency._id,
        fundsAllocated: 30000000,
        startDate: new Date(),
        expectedEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'Proposed'
      }
    ];
    
    const createdProjects = [];
    
    for (const projectData of demoProjects) {
      const project = new Project(projectData);
      await project.save();
      createdProjects.push(project);
      
      // Initialize workflow for each project
      await ServerWorkflowEngine.initializeProjectWorkflow(
        project._id.toString(),
        implementingAgency._id.toString()
      );
    }
    
    // Create some demo workflows in different stages
    const workflows = await Workflow.find({ projectId: { $in: createdProjects.map(p => p._id) } });
    
    if (workflows.length >= 2) {
      // Approve first project (will auto-assign to executing agency)
      await ServerWorkflowEngine.processNodalDecision(
        workflows[0].projectId.toString(),
        nodalAgency._id.toString(),
        'approve',
        'Project meets all requirements and is approved for execution'
      );
      
      // Start execution for the approved project
      setTimeout(async () => {
        await ServerWorkflowEngine.startProjectExecution(
          workflows[0].projectId.toString(),
          executingAgency._id.toString()
        );
      }, 1000);
      
      // Reject second project
      await ServerWorkflowEngine.processNodalDecision(
        workflows[1].projectId.toString(),
        nodalAgency._id.toString(),
        'reject',
        'Project scope needs to be refined before approval'
      );
    }
    
    console.log('✅ Demo workflow data seeded successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Demo workflow data seeded successfully',
      data: {
        projectsCreated: createdProjects.length,
        workflowsInitialized: workflows.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed demo data' },
      { status: 500 }
    );
  }
}