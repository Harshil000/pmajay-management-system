// API Route for specific communication update
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Communication } from '@/lib/models';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const communication = await Communication.findById(id)
      .populate('fromAgency', 'name type')
      .populate('toAgency', 'name type')
      .populate('projectId', 'name projectId');

    if (!communication) {
      return NextResponse.json(
        { success: false, error: 'Communication not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: communication
    });

  } catch (error) {
    console.error('Error fetching communication:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch communication' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const updateData = await request.json();
    
    const communication = await Communication.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );

    if (!communication) {
      return NextResponse.json(
        { success: false, error: 'Communication not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: communication
    });

  } catch (error) {
    console.error('Error updating communication:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update communication' },
      { status: 500 }
    );
  }
}