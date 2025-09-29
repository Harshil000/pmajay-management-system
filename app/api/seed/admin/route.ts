import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import { AdminUser } from '../../../../lib/models';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    await dbConnect();
    console.log('Connected to MongoDB for admin seeding');

    // Check if admin user already exists
    const existingAdmin = await AdminUser.findOne({ email: 'admin@pmajay.gov.in' });
    
    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: 'Admin user already exists',
        data: { email: existingAdmin.email, role: existingAdmin.role }
      });
    }

    // Create Super Admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = await AdminUser.create({
      name: 'Super Administrator',
      email: 'admin@pmajay.gov.in',
      password: hashedPassword,
      role: 'Super Admin',
      isActive: true,
      permissions: {
        read: true,
        write: true,
        delete: true,
        approve_funds: true,
        manage_users: true
      }
    });

    console.log('Super Admin user created successfully');

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        permissions: adminUser.permissions
      }
    });

  } catch (error) {
    console.error('Error creating admin user:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create admin user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}