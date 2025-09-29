
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import { AdminUser } from '../../../lib/models';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  await dbConnect();
  try {
    const users = await AdminUser.find({});
    return NextResponse.json(users, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const body = await req.json();
    const { name, email, password, role } = body;

    if (!password) {
      return NextResponse.json({ message: 'Password is required' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password

    const user = await AdminUser.create({ name, email, password: hashedPassword, role });
    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
