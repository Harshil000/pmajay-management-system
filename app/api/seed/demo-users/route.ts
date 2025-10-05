import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/db';
import { AdminUser } from '../../../../lib/models';
import bcrypt from 'bcryptjs';

export async function GET() {
  return NextResponse.json({ 
    message: 'Demo users seeding endpoint ready. Use POST method to seed users.',
    availableCredentials: [
      'super.admin@pmjay.gov.in / Super@123',
      'central.admin@pmjay.gov.in / Central@123',
      'state.admin@pmjay.gov.in / State@123',
      'local.admin@pmjay.gov.in / Local@123',
      'viewer@pmjay.gov.in / Viewer@123',
      'admin@pmjay.gov.in / Admin@2024 (existing)'
    ]
  });
}

export async function POST() {
  try {
    await connectDB();

    const users = [
      {
        name: 'Super Admin',
        email: 'super.admin@pmjay.gov.in',
        password: await bcrypt.hash('Super@123', 10),
        role: 'Super Admin',
        permissions: ['read', 'write', 'delete', 'approve_funds', 'manage_users'],
        stateAccess: [],
        agencyAccess: [],
      },
      {
        name: 'Central Admin',
        email: 'central.admin@pmjay.gov.in',
        password: await bcrypt.hash('Central@123', 10),
        role: 'Agency Admin',
        permissions: ['read', 'write', 'approve_funds'],
        stateAccess: [],
        agencyAccess: [],
      },
      {
        name: 'State Admin',
        email: 'state.admin@pmjay.gov.in',
        password: await bcrypt.hash('State@123', 10),
        role: 'State Admin',
        permissions: ['read', 'write', 'approve_funds'],
        stateAccess: ['MH'], // Example: Maharashtra
        agencyAccess: [],
      },
      {
        name: 'Local Admin',
        email: 'local.admin@pmjay.gov.in',
        password: await bcrypt.hash('Local@123', 10),
        role: 'Agency Admin',
        permissions: ['read', 'write'],
        stateAccess: ['MH'],
        agencyAccess: [],
      },
      {
        name: 'Viewer',
        email: 'viewer@pmjay.gov.in',
        password: await bcrypt.hash('Viewer@123', 10),
        role: 'Viewer',
        permissions: ['read'],
        stateAccess: [],
        agencyAccess: [],
      },
    ];

    const results = [];
    
    for (const user of users) {
      const exists = await AdminUser.findOne({ email: user.email });
      if (!exists) {
        await AdminUser.create(user);
        results.push(`✅ Seeded user: ${user.email}`);
      } else {
        results.push(`⚠️ User already exists: ${user.email}`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Demo users seeding completed',
      results: results,
      credentials: [
        'super.admin@pmjay.gov.in / Super@123',
        'central.admin@pmjay.gov.in / Central@123',
        'state.admin@pmjay.gov.in / State@123',
        'local.admin@pmjay.gov.in / Local@123',
        'viewer@pmjay.gov.in / Viewer@123',
        'admin@pmjay.gov.in / Admin@2024 (existing)'
      ]
    });

  } catch (error: any) {
    console.error('Error seeding demo users:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}