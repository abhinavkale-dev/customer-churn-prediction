import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const usersByPlan = await prisma.user.groupBy({
      by: ['plan'],
      _count: {
        id: true
      }
    });
    
    const planDistribution = usersByPlan.map(item => ({
      plan: item.plan.charAt(0).toUpperCase() + item.plan.slice(1),
      count: item._count.id
    }));
    
    const simulatedChurnData = [
      { plan: 'Free', churned: 45, retained: 155 },
      { plan: 'Basic', churned: 15, retained: 85 },
      { plan: 'Premium', churned: 5, retained: 95 }
    ];
    
    const activityRanges = [
      { min: 0, max: 10, label: '0-10 days' },
      { min: 11, max: 20, label: '11-20 days' },
      { min: 21, max: 30, label: '21-30 days' },
      { min: 31, max: Infinity, label: '31+ days' }
    ];
    
    const activityVsChurn = [
      { activityRange: '0-10 days', churned: 5, retained: 195 },
      { activityRange: '11-20 days', churned: 15, retained: 85 },
      { activityRange: '21-30 days', churned: 25, retained: 75 },
      { activityRange: '31+ days', churned: 40, retained: 60 }
    ];
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const churnTrend = months.map(month => {
      const baseChurnRate = 12.5; 
      const churnRate = baseChurnRate + (Math.random() * 4 - 2); 
      
      return {
        month,
        churnRate: parseFloat(churnRate.toFixed(1))
      };
    });
    
    const predictions = await prisma.churnPrediction.findMany();
    
    const riskCountMap = {
      'High Risk': 0,
      'Medium Risk': 0,
      'Low Risk': 0
    };
    
    predictions.forEach(prediction => {
      if (riskCountMap.hasOwnProperty(prediction.riskCategory)) {
        riskCountMap[prediction.riskCategory as keyof typeof riskCountMap]++;
      }
    });
    
    const riskDistribution = Object.entries(riskCountMap).map(([risk, count]) => ({
      risk,
      count
    }));
    
    const responseData = {
      planDistribution,
      churnByPlan: simulatedChurnData,
      activityVsChurn,
      churnTrend,
      riskDistribution
    };
    
    return new Response(JSON.stringify(responseData), {
      headers: {
        'content-type': 'application/json',
      },
    });
    
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch analytics data' }), {
      status: 500,
      headers: {
        'content-type': 'application/json',
      },
    });
  } finally {
    await prisma.$disconnect();
  }
} 