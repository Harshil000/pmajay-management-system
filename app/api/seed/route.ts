import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import { State, Agency, Project, FundFlow, AdminUser } from '../../../lib/models';
import bcrypt from 'bcryptjs';

export async function GET() {
  return POST(); // Allow GET requests to trigger the same seeding logic
}

export async function POST() {
  try {
    await dbConnect();
    console.log('Connected to MongoDB');

    // Clear existing data
    await State.deleteMany({});
    await Agency.deleteMany({});
    await Project.deleteMany({});
    await FundFlow.deleteMany({});
    await AdminUser.deleteMany({});

    // Create States
    const states = await State.insertMany([
      {
        name: 'Maharashtra',
        code: 'MH',
        population: 112372972,
        totalProjects: 145,
        totalFunding: 15000000000,
        completedProjects: 89,
        ongoingProjects: 45,
        plannedProjects: 11,
        isActive: true
      },
      {
        name: 'Karnataka',
        code: 'KA',
        population: 61130704,
        totalProjects: 98,
        totalFunding: 8500000000,
        completedProjects: 62,
        ongoingProjects: 28,
        plannedProjects: 8,
        isActive: true
      },
      {
        name: 'Tamil Nadu',
        code: 'TN',
        population: 72138958,
        totalProjects: 112,
        totalFunding: 12000000000,
        completedProjects: 75,
        ongoingProjects: 32,
        plannedProjects: 5,
        isActive: true
      }
    ]);

    // Create Agencies
    const agencies = await Agency.insertMany([
      {
        name: 'Ministry of Electronics & Information Technology',
        code: 'MEITY',
        type: 'Central Ministry',
        stateId: states[0]._id,
        contactEmail: 'info@meity.gov.in',
        contactPhone: '+91-11-24301234',
        address: 'Electronics Niketan, 6 CGO Complex, Lodhi Road, New Delhi - 110003',
        isActive: true
      },
      {
        name: 'Department of Rural Development',
        code: 'DRD',
        type: 'State Department',
        stateId: states[0]._id,
        contactEmail: 'drd@maharashtra.gov.in',
        contactPhone: '+91-22-22027575',
        address: 'Mantralaya, Mumbai, Maharashtra - 400032',
        isActive: true
      },
      {
        name: 'Karnataka IT Department',
        code: 'KITD',
        type: 'State Department',
        stateId: states[1]._id,
        contactEmail: 'it@karnataka.gov.in',
        contactPhone: '+91-80-22250000',
        address: 'Vidhana Soudha, Bangalore, Karnataka - 560001',
        isActive: true
      }
    ]);

    // Create Projects
    const projects = await Project.insertMany([
      {
        name: 'Digital India Initiative - Phase II',
        description: 'Comprehensive digital transformation program for rural areas',
        projectId: 'DII-2024-001',
        stateId: states[0]._id,
        agencyId: agencies[0]._id,
        status: 'Ongoing',
        priority: 'High',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2026-12-31'),
        totalBudget: 5000000000,
        allocatedBudget: 5000000000,
        utilizedBudget: 1250000000,
        remainingBudget: 3750000000,
        progressPercentage: 25,
        category: 'Digital Infrastructure',
        tags: ['Digital', 'Rural', 'Infrastructure'],
        milestones: [
          {
            name: 'Phase 1 Planning',
            description: 'Initial planning and assessment',
            status: 'Completed',
            dueDate: new Date('2024-03-31'),
            completedDate: new Date('2024-03-15')
          },
          {
            name: 'Infrastructure Setup',
            description: 'Setting up digital infrastructure',
            status: 'In Progress',
            dueDate: new Date('2024-12-31')
          }
        ],
        isActive: true
      },
      {
        name: 'Smart City Development - Pune',
        description: 'Smart city infrastructure development in Pune',
        projectId: 'SCD-2024-002',
        stateId: states[0]._id,
        agencyId: agencies[1]._id,
        status: 'Ongoing',
        priority: 'Medium',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2025-12-31'),
        totalBudget: 3000000000,
        allocatedBudget: 3000000000,
        utilizedBudget: 900000000,
        remainingBudget: 2100000000,
        progressPercentage: 30,
        category: 'Urban Development',
        tags: ['Smart City', 'Urban', 'Technology'],
        milestones: [
          {
            name: 'Planning Phase',
            description: 'City planning and design',
            status: 'Completed',
            dueDate: new Date('2024-05-31'),
            completedDate: new Date('2024-05-20')
          }
        ],
        isActive: true
      },
      {
        name: 'Karnataka Digital Governance',
        description: 'Digital governance platform for Karnataka state',
        projectId: 'KDG-2024-003',
        stateId: states[1]._id,
        agencyId: agencies[2]._id,
        status: 'Planning',
        priority: 'High',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2026-05-31'),
        totalBudget: 2500000000,
        allocatedBudget: 2500000000,
        utilizedBudget: 0,
        remainingBudget: 2500000000,
        progressPercentage: 5,
        category: 'E-Governance',
        tags: ['Governance', 'Digital', 'Platform'],
        milestones: [
          {
            name: 'Requirements Analysis',
            description: 'System requirements and analysis',
            status: 'In Progress',
            dueDate: new Date('2024-08-31')
          }
        ],
        isActive: true
      }
    ]);

    // Create Fund Flows
    const fundFlows = await FundFlow.insertMany([
      {
        projectId: projects[0]._id,
        fromAgencyId: agencies[0]._id,
        toAgencyId: agencies[1]._id,
        amount: 1250000000,
        date: new Date('2024-01-15'),
        status: 'Completed',
        type: 'Initial Allocation',
        description: 'Initial budget allocation for Digital India Phase II',
        referenceNumber: 'TXN-2024-001',
        approvedBy: 'Finance Secretary',
        remarks: 'First tranche release for project initiation'
      },
      {
        projectId: projects[1]._id,
        fromAgencyId: agencies[1]._id,
        toAgencyId: agencies[0]._id,
        amount: 900000000,
        date: new Date('2024-02-01'),
        status: 'Completed',
        type: 'Project Funding',
        description: 'Smart City development funding',
        referenceNumber: 'TXN-2024-002',
        approvedBy: 'State Finance Minister',
        remarks: 'Funding for smart city infrastructure'
      },
      {
        projectId: projects[2]._id,
        fromAgencyId: agencies[2]._id,
        toAgencyId: agencies[0]._id,
        amount: 500000000,
        date: new Date('2024-06-01'),
        status: 'Pending',
        type: 'Advance',
        description: 'Advance funding for Karnataka Digital Governance',
        referenceNumber: 'TXN-2024-003',
        approvedBy: 'IT Secretary',
        remarks: 'Advance for initial setup and planning'
      }
    ]);

    // Create Admin User
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const admin = await AdminUser.create({
      username: 'admin',
      email: 'admin@pmajay.gov.in',
      password: hashedPassword,
      fullName: 'System Administrator',
      role: 'Super Admin',
      permissions: ['read', 'write', 'delete', 'manage_users'],
      isActive: true
    });

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully!',
      data: {
        states: states.length,
        agencies: agencies.length,
        projects: projects.length,
        fundFlows: fundFlows.length,
        adminUsers: 1
      }
    });

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed database' },
      { status: 500 }
    );
  }
}