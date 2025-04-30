import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch users with their churn predictions
    const users = await prisma.user.findMany({
      include: {
        churnPrediction: true
      }
    });

    // Calculate totals and risk categories
    const totalCustomers = users.length;
    
    // Users with churn predictions
    const usersWithPredictions = users.filter(user => user.churnPrediction);
    
    // Count users by risk category
    const highRiskCount = usersWithPredictions.filter(
      user => user.churnPrediction?.riskCategory === 'High Risk'
    ).length;
    
    const mediumRiskCount = usersWithPredictions.filter(
      user => user.churnPrediction?.riskCategory === 'Medium Risk'
    ).length;
    
    const lowRiskCount = usersWithPredictions.filter(
      user => user.churnPrediction?.riskCategory === 'Low Risk'
    ).length;
    
    // Get the 5 most recent predictions
    const recentPredictions = await prisma.churnPrediction.findMany({
      orderBy: {
        predictedAt: 'desc'
      },
      take: 5,
      include: {
        user: true
      }
    });
    
    // Format the data for the response
    const formattedPredictions = recentPredictions.map(prediction => ({
      id: prediction.id,
      userId: prediction.userId,
      name: prediction.user.name || 'Unknown User',
      email: prediction.user.email,
      probability: prediction.probability,
      riskCategory: prediction.riskCategory,
      predictedAt: prediction.predictedAt.toISOString()
    }));
    
    return NextResponse.json({
      totalCustomers,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
      recentPredictions: formattedPredictions
    });
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 