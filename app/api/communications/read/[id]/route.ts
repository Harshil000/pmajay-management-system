import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/db';
import { Communication } from '../../../../../lib/models';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { agencyId } = await request.json();
    const { id } = await params;
    
    if (!agencyId) {
      return NextResponse.json(
        { success: false, error: 'Agency ID is required' },
        { status: 400 }
      );
    }

    // Mark the communication as read by the agency
    const communication = await Communication.findByIdAndUpdate(
      id,
      {
        $addToSet: {
          readBy: {
            agency: agencyId,
            readAt: new Date()
          }
        },
        status: 'Read',
        updatedAt: new Date()
      },
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
      data: communication,
      message: 'Communication marked as read'
    });

  } catch (error) {
    console.error('Error marking as read:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark as read' },
      { status: 500 }
    );
  }
}