
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import { Agency } from '../../../../lib/models';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const agency = await Agency.findById(id);
    if (!agency) {
      return NextResponse.json(
        { success: false, error: 'Agency not found' }, 
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      data: agency
    });
  } catch (error: any) {
    console.error('Agency GET API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agency' }, 
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const agency = await Agency.findByIdAndUpdate(
      id, 
      { ...body, updatedAt: new Date() }, 
      { new: true, runValidators: true }
    );
    
    if (!agency) {
      return NextResponse.json(
        { success: false, error: 'Agency not found' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: agency,
      message: 'Agency updated successfully'
    });
  } catch (error: any) {
    console.error('Agency PUT API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update agency' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const agency = await Agency.findByIdAndDelete(id);
    
    if (!agency) {
      return NextResponse.json(
        { success: false, error: 'Agency not found' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Agency deleted successfully'
    });
  } catch (error: any) {
    console.error('Agency DELETE API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete agency' }, 
      { status: 500 }
    );
  }
}
