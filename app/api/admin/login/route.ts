import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import { AdminUser } from '../../../../lib/models';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { email, password } = body;

    console.log('🔐 Login attempt for:', email);

    if (!email || !password) {
      console.log('❌ Missing email or password');
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if admin user exists, create default if needed
    let admin = await AdminUser.findOne({ email: email.toLowerCase() });
    let isNewUser = false;
    
    // Create default admin user if none exists and login is attempted with default credentials
    if (!admin && email.toLowerCase() === 'admin@pmajay.gov.in' && password === 'admin123') {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      admin = await AdminUser.create({
        name: 'System Administrator',
        email: 'admin@pmajay.gov.in',
        password: hashedPassword,
        role: 'Super Admin',
        permissions: ['read', 'write', 'delete', 'manage_users'],
        isActive: true
      });
      isNewUser = true;
      console.log('✅ Created default admin user');
    }
    
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password (skip bcrypt check for newly created user since we know the password matches)
    const isValidPassword = isNewUser || await bcrypt.compare(password, admin.password);
    console.log('🔑 Password validation:', { isNewUser, isValidPassword });
    
    if (!isValidPassword) {
      console.log('❌ Invalid password for user:', email);
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('✅ Login successful for:', email);

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Return user data (excluding password)
    const { password: _, ...adminData } = admin.toObject();

    return NextResponse.json({
      success: true,
      data: adminData,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Admin Login API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}