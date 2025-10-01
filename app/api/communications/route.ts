import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import { Communication } from '../../../lib/models';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const toAgency = searchParams.get('toAgency');
    const fromAgency = searchParams.get('fromAgency');
    const agencyId = searchParams.get('agencyId'); // For both sent and received
    const limit = searchParams.get('limit');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const threadOnly = searchParams.get('threadOnly') === 'true'; // Only root messages
    
    let query: any = {};
    
    // If agencyId is provided, get both sent and received messages
    if (agencyId) {
      query.$or = [
        { fromAgency: agencyId },
        { toAgency: agencyId },
        { ccAgencies: { $in: [agencyId] } }
      ];
    } else {
      if (toAgency) {
        query.toAgency = toAgency;
      }
      if (fromAgency) {
        query.fromAgency = fromAgency;
      }
    }
    
    if (status) {
      query.status = status;
    }
    
    if (type) {
      query.type = type;
    }
    
    // Only get root messages if threadOnly is true
    if (threadOnly) {
      query.isReply = { $ne: true };
    }
    
    let communicationsQuery = Communication.find(query)
      .populate('fromAgency', 'name type level state')
      .populate('toAgency', 'name type level state')
      .populate('ccAgencies', 'name type level state')
      .populate('projectId', 'name component')
      .populate('threadId', 'subject')
      .sort({ createdAt: -1 });
    
    if (limit) {
      communicationsQuery = communicationsQuery.limit(parseInt(limit));
    }
    
    const communications = await communicationsQuery;
    
    // For each communication, fetch reply count and latest replies if it's a root message
    const enrichedCommunications = await Promise.all(
      communications.map(async (comm) => {
        const commObj = comm.toObject();
        
        if (!commObj.isReply) {
          // Get reply count and latest replies
          const replies = await Communication.find({ 
            threadId: commObj._id 
          })
          .populate('fromAgency', 'name type')
          .sort({ createdAt: -1 })
          .limit(3);
          
          commObj.replyCount = replies.length;
          commObj.latestReplies = replies;
        }
        
        return commObj;
      })
    );
    
    return NextResponse.json({
      success: true,
      data: enrichedCommunications,
      count: enrichedCommunications.length
    });
  } catch (error) {
    console.error('Communications API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch communications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Validate required fields
    if (!body.subject || !body.message || !body.fromAgency || !body.toAgency || !body.type) {
      return NextResponse.json(
        { success: false, error: 'Subject, message, from agency, to agency, and type are required' },
        { status: 400 }
      );
    }
    
    // Handle replies properly
    let communicationData = {
      ...body,
      status: 'Sent',
      updatedAt: new Date()
    };
    
    // If this is a reply
    if (body.parentMessageId) {
      const parentMessage = await Communication.findById(body.parentMessageId);
      if (!parentMessage) {
        return NextResponse.json(
          { success: false, error: 'Parent message not found' },
          { status: 404 }
        );
      }
      
      communicationData.isReply = true;
      communicationData.threadId = parentMessage.threadId || body.parentMessageId;
      communicationData.parentMessageId = body.parentMessageId;
      
      // Update parent message reply count
      const threadId = parentMessage.threadId || body.parentMessageId;
      await Communication.findByIdAndUpdate(threadId, {
        $inc: { replyCount: 1 },
        updatedAt: new Date()
      });
    } else {
      // This is a new thread
      communicationData.isReply = false;
      communicationData.replyCount = 0;
    }
    
    const communication = new Communication(communicationData);
    await communication.save();
    
    // If this is a new thread, set threadId to itself
    if (!body.parentMessageId) {
      communication.threadId = communication._id;
      await communication.save();
    }
    
    // Populate the saved communication
    await communication.populate([
      { path: 'fromAgency', select: 'name type level state' },
      { path: 'toAgency', select: 'name type level state' },
      { path: 'ccAgencies', select: 'name type level state' },
      { path: 'projectId', select: 'name component' }
    ]);
    
    return NextResponse.json({
      success: true,
      data: communication,
      message: 'Communication sent successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Communications POST API Error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: validationErrors.join(', ') },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to send communication' },
      { status: 500 }
    );
  }
}