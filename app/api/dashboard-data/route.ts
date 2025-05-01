import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        churnPrediction: true
      }
    });

    
    const totalCustomers = users.length;
    
    const usersWithPredictions = users.filter(user => user.churnPrediction);
    
    const highRiskCount = usersWithPredictions.filter(
      user => user.churnPrediction?.riskCategory === 'High Risk'
    ).length;
    
    const mediumRiskCount = usersWithPredictions.filter(
      user => user.churnPrediction?.riskCategory === 'Medium Risk'
    ).length;
    
    const lowRiskCount = usersWithPredictions.filter(
      user => user.churnPrediction?.riskCategory === 'Low Risk'
    ).length;
    
    const recentPredictions = await prisma.churnPrediction.findMany({
      orderBy: {
        predictedAt: 'desc'
      },
      take: 5,
      include: {
        user: true
      }
    });
    
    const formattedPredictions = recentPredictions.map(prediction => ({
      id: prediction.id,
      userId: prediction.userId,
      name: prediction.user.name || 'Unknown User',
      email: prediction.user.email,
      probability: prediction.probability,
      riskCategory: prediction.riskCategory,
      predictedAt: prediction.predictedAt.toISOString()
    }));
    
    return new Response(JSON.stringify({
      totalCustomers,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
      recentPredictions: formattedPredictions
    }), {
      headers: {
        'content-type': 'application/json',
      },
    });
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch dashboard data' }), {
      status: 500,
      headers: {
        'content-type': 'application/json',
      },
    });
  } finally {
    await prisma.$disconnect();
  }
} 