import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateChurnExplanation, generateRetentionStrategies } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, userData } = body;
    
    if (userData) {
      try {
        const { plan, daysSinceActivity, eventsLast30, revenueLast30, probability } = userData;
        
        if (!plan || daysSinceActivity === undefined || eventsLast30 === undefined || 
            revenueLast30 === undefined || probability === undefined) {
          return new Response(JSON.stringify({ error: 'Missing required userData fields' }), {
            status: 400,
            headers: {
              'content-type': 'application/json',
            },
          });
        }
        
        const [explanationResult, strategiesResult] = await Promise.all([
          generateChurnExplanation(userData),
          generateRetentionStrategies(userData)
        ]);
        
        return new Response(JSON.stringify({
          insights: {
            explanation: explanationResult.explanation,
            strategies: strategiesResult.strategies
          }
        }), {
          headers: {
            'content-type': 'application/json',
          },
        });
      } catch (error) {
        console.error('Error processing userData:', error);
        return new Response(JSON.stringify({ error: 'Invalid userData format' }), {
          status: 400,
          headers: {
            'content-type': 'application/json',
          },
        });
      }
    }
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID or userData is required' }), {
        status: 400,
        headers: {
          'content-type': 'application/json',
        },
      });
    }
    
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
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: {
          'content-type': 'application/json',
        },
      });
    }
    
    if (!user.churnPrediction) {
      return new Response(JSON.stringify({ error: 'No churn prediction found for this user' }), {
        status: 404,
        headers: {
          'content-type': 'application/json',
        },
      });
    }
    
    const lastActivity = user.activities[0]?.timestamp;
    const daysSinceActivity = lastActivity 
      ? Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
      : 30; 
    
    const revenueLast30 = user.activities.reduce((sum, activity) => sum + activity.revenue, 0);
    
    const eventsLast30 = user.activities.length;
    
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
    
    return new Response(JSON.stringify({
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
    }), {
      headers: {
        'content-type': 'application/json',
      },
    });
    
  } catch (error) {
    console.error('Error generating churn insights:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate churn insights' }), {
      status: 500,
      headers: {
        'content-type': 'application/json',
      },
    });
  } finally {
    await prisma.$disconnect();
  }
} 