import { NextResponse } from 'next/server';
import { predictChurn, batchPredictChurn } from '@/lib/predict';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Check if it's a batch request
    if (Array.isArray(body)) {
      const predictions = await batchPredictChurn(body);
      return NextResponse.json({ predictions }, { status: 200 });
    }
    
    // Single prediction
    const { plan, daysSinceActivity, eventsLast30, revenueLast30, userId } = body;
    
    // Validate required fields
    if (!plan || daysSinceActivity === undefined || eventsLast30 === undefined || revenueLast30 === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Predict churn
    const result = await predictChurn({
      plan,
      daysSinceActivity,
      eventsLast30,
      revenueLast30
    });
    
    // If userId is provided, save the prediction to database
    if (userId) {
      await prisma.churnPrediction.upsert({
        where: { userId },
        update: {
          probability: result.probability,
          willChurn: result.willChurn,
          riskCategory: result.riskCategory,
          predictedAt: new Date()
        },
        create: {
          userId,
          probability: result.probability,
          willChurn: result.willChurn,
          riskCategory: result.riskCategory
        }
      });
    }
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error predicting churn:', error);
    return NextResponse.json(
      { error: 'Failed to predict churn' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET endpoint to retrieve churn prediction for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }
    
    // Get prediction from database
    const prediction = await prisma.churnPrediction.findUnique({
      where: { userId }
    });
    
    if (!prediction) {
      return NextResponse.json(
        { error: 'No churn prediction found for this user' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(prediction, { status: 200 });
  } catch (error) {
    console.error('Error retrieving churn prediction:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve churn prediction' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 