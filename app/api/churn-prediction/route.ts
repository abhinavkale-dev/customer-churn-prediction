import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


function predictChurn(data: {
  plan: string;
  daysSinceActivity: number;
  eventsLast30: number;
  revenueLast30: number;
  userId?: string; 
}) {

  if (data.userId) {

    
    const idSum = data.userId.split('').reduce((sum, char, index) => {
      return sum + (char.charCodeAt(0) * (index + 1));
    }, 0);
    
    let baseValue = idSum % 100;
    
    let baseProbability = 0;
    
    if (baseValue < 20) {
      baseProbability = 0.75 + (baseValue / 100);
    } else if (baseValue < 50) {
      baseProbability = 0.45 + ((baseValue - 20) / 120);
    } else {
      baseProbability = 0.05 + ((baseValue - 50) / 200);
    }
    
    
    if (data.plan === 'free') {
      baseProbability += 0.1;
    } else if (data.plan === 'basic') {
      baseProbability += 0.03;
    } else {
      baseProbability -= 0.05;
    }
    
    if (data.daysSinceActivity > 20) {
      baseProbability += 0.1;
    } else if (data.daysSinceActivity > 10) {
      baseProbability += 0.05;
    }
    
    if (data.eventsLast30 > 50) {
      baseProbability -= 0.08;
    } else if (data.eventsLast30 > 20) {
      baseProbability -= 0.05;
    }
    
    if (data.revenueLast30 > 100) {
      baseProbability -= 0.08;
    } else if (data.revenueLast30 > 50) {
      baseProbability -= 0.05;
    }
    
    baseProbability = Math.max(0.05, Math.min(0.95, baseProbability));
    
    const probability = parseFloat(baseProbability.toFixed(2));
    
    const riskCategory = probability < 0.35 ? 'Low Risk' : 
                        probability < 0.75 ? 'Medium Risk' : 'High Risk';
    
    return {
      probability,
      willChurn: probability > 0.5,
      riskCategory
    };
  }
  
  let probability = 0;
  
  if (data.plan === 'free') {
    probability += 0.25; 
  } else if (data.plan === 'basic') {
    probability += 0.12; 
  } else {
    probability += 0.04; 
  }
  
  let activityFactor = 0;
  if (data.daysSinceActivity > 30) {
    activityFactor = 0.4;
  } else if (data.daysSinceActivity > 14) {
    activityFactor = 0.25;
  } else if (data.daysSinceActivity > 7) {
    activityFactor = 0.08;
  }
  probability += activityFactor;
  
  if (data.eventsLast30 > 100) {
    probability -= 0.3;
  } else if (data.eventsLast30 > 50) {
    probability -= 0.2;
  } else if (data.eventsLast30 > 10) {
    probability -= 0.1;
  }
  
  if (data.revenueLast30 > 200) {
    probability -= 0.25;
  } else if (data.revenueLast30 > 50) {
    probability -= 0.15;
  } else if (data.revenueLast30 > 0) {
    probability -= 0.05;
  }
  
  probability = Math.max(0, Math.min(1, probability));
  
  probability = parseFloat(probability.toFixed(2));
  
  const riskCategory = probability < 0.3 ? 'Low Risk' : 
                      probability < 0.8 ? 'Medium Risk' : 'High Risk';
  
  return {
    probability,
    willChurn: probability > 0.5,
    riskCategory
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (Array.isArray(body)) {
      const predictions = [];
      
      for (const item of body) {
        const { plan, daysSinceActivity, eventsLast30, revenueLast30, userId } = item;
        
        if (!plan || daysSinceActivity === undefined || eventsLast30 === undefined || revenueLast30 === undefined) {
          continue; 
        }
        
        const result = predictChurn({
          plan,
          daysSinceActivity,
          eventsLast30,
          revenueLast30,
          userId
        });
        
        if (userId) {
          try {
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
          } catch (error) {
            console.error(`Error saving prediction for user ${userId}:`, error);
          }
        }
        
        predictions.push(result);
      }
      
      return new Response(JSON.stringify({ predictions }), { 
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      });
    }
    
    const { plan, daysSinceActivity, eventsLast30, revenueLast30, userId } = body;
    
    if (!plan || daysSinceActivity === undefined || eventsLast30 === undefined || revenueLast30 === undefined) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: {
          'content-type': 'application/json',
        },
      });
    }
    
    const result = predictChurn({
      plan,
      daysSinceActivity,
      eventsLast30,
      revenueLast30,
      userId
    });
    
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
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error predicting churn:', error);
    return new Response(JSON.stringify({ error: 'Failed to predict churn' }), {
      status: 500,
      headers: {
        'content-type': 'application/json',
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing userId parameter' }), {
        status: 400,
        headers: {
          'content-type': 'application/json',
        },
      });
    }
    
    const prediction = await prisma.churnPrediction.findUnique({
      where: { userId }
    });
    
    if (!prediction) {
      return new Response(JSON.stringify({ error: 'No churn prediction found for this user' }), {
        status: 404,
        headers: {
          'content-type': 'application/json',
        },
      });
    }
    
    return new Response(JSON.stringify(prediction), {
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching churn prediction:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch churn prediction' }), {
      status: 500,
      headers: {
        'content-type': 'application/json',
      },
    });
  } finally {
    await prisma.$disconnect();
  }
} 