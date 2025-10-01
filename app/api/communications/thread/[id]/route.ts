import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/db';
import { Communication } from '../../../../../lib/models';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    // Get the root message
    const rootMessage = await Communication.findById(id)
      .populate('fromAgency', 'name type level state')
      .populate('toAgency', 'name type level state')
      .populate('ccAgencies', 'name type level state')
      .populate('projectId', 'name component');

    if (!rootMessage) {
      return NextResponse.json(
        { success: false, error: 'Communication not found' },
        { status: 404 }
      );
    }

    // Get all replies in the thread
    const replies = await Communication.find({
      threadId: id,
      isReply: true
    })
      .populate('fromAgency', 'name type level state')
      .populate('toAgency', 'name type level state')
      .populate('ccAgencies', 'name type level state')
      .populate('projectId', 'name component')
      .sort({ createdAt: 1 }); // Chronological order for replies

    return NextResponse.json({
      success: true,
      data: {
        rootMessage,
        replies,
        totalReplies: replies.length
      }
    });

  } catch (error) {
    console.error('Error fetching thread:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch thread' },
      { status: 500 }
    );
  }
}