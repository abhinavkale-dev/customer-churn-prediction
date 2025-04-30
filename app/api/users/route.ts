import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { parse, isValid, endOfDay, startOfDay, subDays, subMonths, subYears } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const plan = searchParams.get('plan') || '';
    const riskCategory = searchParams.get('riskCategory') || '';
    const datePeriod = searchParams.get('datePeriod') || '';
    
    // Calculate pagination values
    const skip = (page - 1) * limit;
    
    // Create filter condition for search
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
    
    // Add plan filter if specified
    if (plan && plan !== 'all') {
      where.plan = plan;
    }
    
    // Add date period filter
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
        case '1year':
          fromDate = subYears(now, 1);
          break;
        default:
          fromDate = new Date(0); // Beginning of time
      }
      
      where.createdAt = {
        gte: startOfDay(fromDate),
        lte: endOfDay(now)
      };
    }
    
    // Prepare churn risk filter
    if (riskCategory && riskCategory !== 'all') {
      if (riskCategory === 'no_prediction') {
        // Filter for users with no prediction
        where.churnPrediction = null;
      } else {
        // Filter by specific risk category
        where.churnPrediction = {
          riskCategory
        };
      }
    }
    
    // Get users with pagination
    const users = await prisma.user.findMany({
      where,
      include: {
        churnPrediction: true,
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Get total count for pagination info
    const total = await prisma.user.count({ where });
    
    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 