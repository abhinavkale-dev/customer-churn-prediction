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
      plan: item.plan.charAt(0).toUpperCase() + item.plan.slice(1), // Capitalize
      count: item._count.id
    }));
    
    const churnFeatures = await prisma.churnFeature.findMany();
    
    const churnByPlanData = churnFeatures.reduce((acc, feature) => {
      const plan = feature.plan.charAt(0).toUpperCase() + feature.plan.slice(1);
      const existingPlan = acc.find(item => item.plan === plan);
      
      if (existingPlan) {
        if (feature.churned) {
          existingPlan.churned++;
        } else {
          existingPlan.retained++;
        }
      } else {
        acc.push({
          plan,
          churned: feature.churned ? 1 : 0,
          retained: feature.churned ? 0 : 1
        });
      }
      
      return acc;
    }, [] as Array<{plan: string, churned: number, retained: number}>);
    
    const activityRanges = [
      { min: 0, max: 10, label: '0-10 days' },
      { min: 11, max: 20, label: '11-20 days' },
      { min: 21, max: 30, label: '21-30 days' },
      { min: 31, max: Infinity, label: '31+ days' }
    ];
    
    const activityVsChurn = activityRanges.map(range => {
      const inRange = churnFeatures.filter(f => 
        f.daysSinceActivity >= range.min && 
        f.daysSinceActivity <= range.max
      );
      
      return {
        activityRange: range.label,
        churned: inRange.filter(f => f.churned).length,
        retained: inRange.filter(f => !f.churned).length
      };
    });
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const churnTrend = months.map(month => {
      const totalChurned = churnFeatures.filter(f => f.churned).length;
      const total = churnFeatures.length;
      const baseChurnRate = total > 0 ? (totalChurned / total) * 100 : 0;
      
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
    
    return NextResponse.json({
      planDistribution,
      churnByPlan: churnByPlanData,
      activityVsChurn,
      churnTrend,
      riskDistribution
    });
    
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 