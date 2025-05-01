import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma, Activity } from '@prisma/client';
import { parse, isValid, endOfDay, startOfDay, subDays, subMonths, subYears } from 'date-fns';

// Define a type for the user with activities
interface UserWithActivities {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  createdAt: Date;
  updatedAt: Date;
  churnPrediction?: {
    id: string;
    probability: number;
    willChurn: boolean;
    riskCategory: string;
    predictedAt: Date;
  } | null;
  activities?: Activity[];
}

// Define a type for processed user with activity metrics
interface UserWithActivityMetrics {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  createdAt: Date;
  updatedAt: Date;
  churnPrediction?: {
    id: string;
    probability: number;
    willChurn: boolean;
    riskCategory: string;
    predictedAt: Date;
  } | null;
  daysSinceActivity: number;
  eventsLast30: number;
  revenueLast30: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const plan = searchParams.get('plan') || '';
    const riskCategory = searchParams.get('riskCategory') || '';
    const datePeriod = searchParams.get('datePeriod') || '';
    const includeActivity = searchParams.get('includeActivity') === 'true';
    
    const isReportRequest = limit > 100;
    const skip = isReportRequest ? 0 : (page - 1) * limit;
    
    const where: Prisma.UserWhereInput = search 
      ? {
          OR: [
            { 
              name: { 
                contains: search, 
                mode: Prisma.QueryMode.insensitive 
              } 
            },
            { 
              email: { 
                contains: search, 
                mode: Prisma.QueryMode.insensitive 
              } 
            },
          ],
        } 
      : {};
    
    if (plan && plan !== 'all') {
      where.plan = plan;
    }
    
    if (datePeriod && datePeriod !== 'all') {
      const now = new Date();
      let fromDate: Date;
      
      switch (datePeriod) {
        case '7days':
          fromDate = subDays(now, 7);
          break;
        case '30days':
          fromDate = subDays(now, 30);
          break;
        case '3months':
          fromDate = subMonths(now, 3);
          break;
        default:
          fromDate = new Date(0); 
      }
      
      where.createdAt = {
        gte: startOfDay(fromDate),
        lte: endOfDay(now)
      };
    }
    
    if (riskCategory && riskCategory !== 'all') {
      if (riskCategory === 'no_prediction') {
        where.churnPrediction = null;
      } else {
        where.churnPrediction = {
          riskCategory
        };
      }
    }
    
    // Use proper Prisma types for the include
    const include: Prisma.UserInclude = {
      churnPrediction: true,
      ...(includeActivity ? { 
        activities: {
          orderBy: {
            timestamp: 'desc'
          },
          take: 30
        } 
      } : {})
    };

    const users = await prisma.user.findMany({
      where,
      include,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    }) as UserWithActivities[];
    
    let processedUsers: UserWithActivities[] | UserWithActivityMetrics[] = users;
    
    if (includeActivity) {
      // Process users to add activity metrics
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);
      
      processedUsers = users.map(user => {
        // Calculate days since last activity
        const activities = user.activities || [];
        const lastActivity = activities[0]?.timestamp;
        const daysSinceActivity = lastActivity 
          ? Math.floor((now.getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
          : 30; // Default to 30 days if no activity
        
        // Count events in last 30 days
        const eventsLast30 = activities.filter(activity => 
          new Date(activity.timestamp) >= thirtyDaysAgo
        ).length;
        
        // Calculate revenue in last 30 days
        let revenueLast30 = 0;
        
        // For consistency, override with the plan-based revenue values
        if (user.plan === 'premium') {
          revenueLast30 = 300; // Fixed revenue for premium
        } else if (user.plan === 'basic') {
          revenueLast30 = 100; // Fixed revenue for basic
        }
        // Free plan remains at $0
        
        // Remove the activities array to avoid sending too much data
        const { activities: _, ...userWithoutActivities } = user;
        
        return {
          ...userWithoutActivities,
          daysSinceActivity,
          eventsLast30,
          revenueLast30
        } as UserWithActivityMetrics;
      });
    }
    
    const total = await prisma.user.count({ where });
    
    return new Response(JSON.stringify({
      users: processedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }), {
      headers: {
        'content-type': 'application/json',
      },
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch users' }), {
      status: 500,
      headers: {
        'content-type': 'application/json',
      },
    });
  } finally {
    await prisma.$disconnect();
  }
} 