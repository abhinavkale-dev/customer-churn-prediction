import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateChurnExplanation, generateRetentionStrategies } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, userData } = body;
    
    // Handle direct user data mode (for AI prediction page)
    if (userData) {
      try {
        // Validate required fields
        const { plan, daysSinceActivity, eventsLast30, revenueLast30, probability } = userData;
        
        if (!plan || daysSinceActivity === undefined || eventsLast30 === undefined || 
            revenueLast30 === undefined || probability === undefined) {
          return NextResponse.json(
            { error: 'Missing required userData fields' },
            { status: 400 }
          );
        }
        
        // Generate AI insights directly from provided data
        const [explanationResult, strategiesResult] = await Promise.all([
          generateChurnExplanation(userData),
          generateRetentionStrategies(userData)
        ]);
        
        return NextResponse.json({
          insights: {
            explanation: explanationResult.explanation,
            strategies: strategiesResult.strategies
          }
        });
      } catch (error) {
        console.error('Error processing userData:', error);
        return NextResponse.json(
          { error: 'Invalid userData format' },
          { status: 400 }
        );
      }
    }
    
    // Regular mode requiring a userId
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID or userData is required' },
        { status: 400 }
      );
    }
    
    // Get user and their prediction
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        churnPrediction: true,
        activities: {
          orderBy: { timestamp: 'desc' },
          take: 30
        }
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    if (!user.churnPrediction) {
      return NextResponse.json(
        { error: 'No churn prediction found for this user' },
        { status: 404 }
      );
    }
    
    // Calculate days since activity
    const lastActivity = user.activities[0]?.timestamp;
    const daysSinceActivity = lastActivity 
      ? Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
      : 30; // Default to 30 if no activity
    
    // Calculate revenue in last 30 days
    const revenueLast30 = user.activities.reduce((sum, activity) => sum + activity.revenue, 0);
    
    // Calculate events in last 30 days
    const eventsLast30 = user.activities.length;
    
    // Get AI-powered insights
    const userDataForAI = {
      plan: user.plan,
      daysSinceActivity,
      eventsLast30,
      revenueLast30,
      probability: user.churnPrediction.probability
    };
    
    const [explanationResult, strategiesResult] = await Promise.all([
      generateChurnExplanation(userDataForAI),
      generateRetentionStrategies(userDataForAI)
    ]);
    
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan
      },
      prediction: user.churnPrediction,
      activity: {
        daysSinceActivity,
        eventsLast30,
        revenueLast30
      },
      insights: {
        explanation: explanationResult.explanation,
        strategies: strategiesResult.strategies
      }
    });
    
  } catch (error) {
    console.error('Error generating churn insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate churn insights' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 