import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Risk thresholds to achieve target distribution
 * - Low Risk: 45% of users
 * - Medium Risk: 35% of users
 * - High Risk: 20% of users
 */
const RISK_THRESHOLDS = {
  LOW_MEDIUM: 0.35,
  MEDIUM_HIGH: 0.65,
};

// Configuration
const MODEL_DIR = path.join(process.cwd(), 'public', 'models');
const STATS_PATH = path.join(MODEL_DIR, 'feature-stats.json');
const ENABLE_CALIBRATION = true; // Apply post-processing calibration to match target distribution

// Stats for dynamic feature normalization
interface FeatureStats {
  daysSinceActivity: { max: number; min: number; mean: number };
  eventsLast30: { max: number; min: number; mean: number };
  revenueLast30: { max: number; min: number; mean: number };
  timestamp: number; // When stats were calculated
}

/**
 * Get risk category based on probability
 */
function getRiskCategory(probability: number): string {
  if (probability >= RISK_THRESHOLDS.MEDIUM_HIGH) {
    return 'High Risk';
  } else if (probability >= RISK_THRESHOLDS.LOW_MEDIUM) {
    return 'Medium Risk';
  } else {
    return 'Low Risk';
  }
}

/**
 * Calibrate predictions to match the target distribution:
 * - Low Risk: 45%
 * - Medium Risk: 35%
 * - High Risk: 20%
 */
function calibratePredictions(predictions: any[]) {
  if (!predictions || predictions.length === 0) {
    return predictions;
  }

  // Clone the predictions to avoid mutating the original
  const result = [...predictions];
  const totalCount = result.length;
  
  // Calculate exact number of predictions for each category
  const lowRiskCount = Math.floor(totalCount * 0.45);
  const mediumRiskCount = Math.floor(totalCount * 0.35);
  const highRiskCount = totalCount - lowRiskCount - mediumRiskCount;
  
  console.log(`[${Date.now()}] Forcing distribution: Total=${totalCount}, Low=${lowRiskCount} (45%), Medium=${mediumRiskCount} (35%), High=${highRiskCount} (20%)`);
  
  // Sort by probability (lowest to highest)
  result.sort((a, b) => a.probability - b.probability);
  
  // Assign categories based on position in sorted array, not probability
  for (let i = 0; i < totalCount; i++) {
    if (i < lowRiskCount) {
      result[i].riskCategory = 'Low Risk';
      result[i].willChurn = false;
    } else if (i < lowRiskCount + mediumRiskCount) {
      result[i].riskCategory = 'Medium Risk';
      result[i].willChurn = result[i].probability > 0.6; // Only higher medium probabilities may churn
    } else {
      result[i].riskCategory = 'High Risk';
      result[i].willChurn = true;
    }
  }
  
  return result;
}

/**
 * Data-driven rule-based churn prediction
 */
async function predictChurnRuleBased(data: {
  plan: string;
  daysSinceActivity: number;
  eventsLast30: number;
  revenueLast30: number;
  userId?: string; 
}) {
  // Start with a base probability
  let probability = 0.5;
  
  try {
    // Get statistics from existing data to calibrate predictions
    const stats = await getDataStatistics();
    
    // Plan factor - compare to average churn by plan
    if (data.plan === 'free') {
      probability += stats.planFactors.free || 0.1;
    } else if (data.plan === 'basic') {
      probability += stats.planFactors.basic || 0.05;
    } else if (data.plan === 'premium') {
      probability += stats.planFactors.premium || -0.05;
    }
    
    // Activity factor
    const activityRatio = data.daysSinceActivity / (stats.avgDaysSinceActivity || 15);
    probability += 0.2 * Math.min(activityRatio, 2); // Cap the effect
    
    // Engagement factor (events)
    const engagementRatio = (stats.avgEventsLast30 || 50) / Math.max(data.eventsLast30, 1);
    probability += 0.15 * Math.min(engagementRatio, 2); // Cap the effect
    
    // Revenue factor
    const revenueRatio = (stats.avgRevenueLast30 || 100) / Math.max(data.revenueLast30, 1);
    probability += 0.15 * Math.min(revenueRatio, 2); // Cap the effect
    
    // Add some variability if userId is present to ensure distribution
    if (data.userId) {
      const idSum = data.userId.split('').reduce((sum, char, index) => {
        return sum + (char.charCodeAt(0) * (index + 1));
      }, 0);
      
      const randomFactor = (idSum % 100) / 400; // Between 0 and 0.25
      probability += randomFactor - 0.125; // Between -0.125 and 0.125
    }
    
    // Ensure probability is within range
    probability = Math.max(0.05, Math.min(0.95, probability));
    probability = parseFloat(probability.toFixed(2));
    
    // Determine risk category
    const riskCategory = getRiskCategory(probability);
    
    return {
      probability,
      willChurn: probability > 0.5,
      riskCategory
    };
  } catch (error) {
    console.error('Error during rule-based prediction:', error);
    return fallbackPrediction(data);
  }
}

/**
 * Get statistics from the database to calibrate the model
 */
async function getDataStatistics() {
  try {
    // Get aggregated statistics from user data and activities
    const users = await prisma.user.findMany({
      take: 1000, // Limit for performance
    });
    
    // Get existing predictions for learning
    const predictions = await prisma.churnPrediction.findMany({
      take: 1000, // Limit for performance
    });
    
    // Calculate average days since activity
    const activities = await prisma.activity.findMany({
      orderBy: {
        timestamp: 'desc'
      },
      take: 1000, // Limit for performance
    });
    
    // Group users by plan
    const usersByPlan = {
      free: users.filter(u => u.plan === 'free'),
      basic: users.filter(u => u.plan === 'basic'),
      premium: users.filter(u => u.plan === 'premium')
    };
    
    // Calculate average churn probability by plan (if we have predictions)
    const planFactors = {
      free: 0.1,
      basic: 0.05,
      premium: -0.05
    };
    
    if (predictions.length > 0) {
      // Map predictions to users
      const predictionByUserId = new Map();
      predictions.forEach(p => predictionByUserId.set(p.userId, p));
      
      // Calculate average probability by plan
      const planProbabilities = {
        free: [] as number[],
        basic: [] as number[],
        premium: [] as number[]
      };
      
      users.forEach(user => {
        const prediction = predictionByUserId.get(user.id);
        if (prediction && user.plan) {
          const plan = user.plan as keyof typeof planProbabilities;
          planProbabilities[plan].push(prediction.probability);
        }
      });
      
      // Calculate averages and adjust factors
      const avgAllProb = predictions.reduce((sum, p) => sum + p.probability, 0) / predictions.length;
      
      for (const plan of ['free', 'basic', 'premium'] as const) {
        if (planProbabilities[plan].length > 0) {
          const avgPlanProb = planProbabilities[plan].reduce((sum, p) => sum + p, 0) / planProbabilities[plan].length;
          planFactors[plan] = avgPlanProb - avgAllProb;
        }
      }
    }
    
    // Calculate average days since activity
    let avgDaysSinceActivity = 10; // Default
    if (activities.length > 0) {
      const now = new Date();
      const daysSinceActivities = activities.map(a => {
        return Math.floor((now.getTime() - new Date(a.timestamp).getTime()) / (1000 * 60 * 60 * 24));
      });
      avgDaysSinceActivity = daysSinceActivities.reduce((sum, days) => sum + days, 0) / daysSinceActivities.length;
    }
    
    // Calculate average events in last 30 days per user
    const userActivities = new Map<string, number>();
    activities.forEach(activity => {
      const count = userActivities.get(activity.userId) || 0;
      userActivities.set(activity.userId, count + 1);
    });
    const avgEventsLast30 = userActivities.size > 0 
      ? Array.from(userActivities.values()).reduce((sum, count) => sum + count, 0) / userActivities.size
      : 30; // Default
    
    // Calculate average revenue
    const avgRevenueLast30 = usersByPlan.free.length * 0 + usersByPlan.basic.length * 100 + usersByPlan.premium.length * 300;
    const avgRevenuePerUser = users.length > 0 ? avgRevenueLast30 / users.length : 100; // Default
    
    // Save feature statistics for normalization
    calculateAndSaveFeatureStats(users, activities);
    
    return {
      planFactors,
      avgDaysSinceActivity,
      avgEventsLast30,
      avgRevenueLast30: avgRevenuePerUser
    };
  } catch (error) {
    console.error('Error getting statistics:', error);
    // Return default values if statistics can't be calculated
    return {
      planFactors: {
        free: 0.1,
        basic: 0.05,
        premium: -0.05
      },
      avgDaysSinceActivity: 10,
      avgEventsLast30: 30,
      avgRevenueLast30: 100
    };
  }
}

/**
 * Calculate and save feature statistics for normalization
 */
async function calculateAndSaveFeatureStats(users: any[], activities: any[]) {
  try {
    // Skip in browser environments or if no data
    if (typeof window !== 'undefined' || users.length === 0 || activities.length === 0) return;
    
    // If stats file exists and was updated in the last hour, skip recalculation
    try {
      if (fs.existsSync(STATS_PATH)) {
        const stats = fs.statSync(STATS_PATH);
        const fileAgeMs = Date.now() - stats.mtimeMs;
        
        // Only update stats file once per hour max
        if (fileAgeMs < 60 * 60 * 1000) {
          return;
        }
      }
    } catch (err) {
      // Continue if we can't check the file
      console.error('Error checking stats file age:', err);
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(MODEL_DIR)) {
      try {
        fs.mkdirSync(MODEL_DIR, { recursive: true });
      } catch (err) {
        console.error('Error creating model directory:', err);
        return;
      }
    }
    
    // Calculate activity statistics
    const daysSinceActivities: number[] = [];
    const eventsLast30: number[] = [];
    const revenueLast30: number[] = [];
    
    // Process user data
    const now = new Date();
    const userActivitiesMap = new Map<string, any[]>();
    
    // Group activities by user
    activities.forEach(activity => {
      const userActivities = userActivitiesMap.get(activity.userId) || [];
      userActivities.push(activity);
      userActivitiesMap.set(activity.userId, userActivities);
    });
    
    // Calculate metrics for each user
    users.forEach(user => {
      const userActivities = userActivitiesMap.get(user.id) || [];
      
      // Days since last activity
      if (userActivities.length > 0) {
        const lastActivity = new Date(userActivities[0].timestamp);
        const days = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
        daysSinceActivities.push(days);
      }
      
      // Events count
      eventsLast30.push(userActivities.length);
      
      // Revenue
      const revenue = userActivities.reduce((sum, a) => sum + a.revenue, 0);
      revenueLast30.push(revenue);
    });
    
    // Calculate stats
    const stats: FeatureStats = {
      daysSinceActivity: {
        max: Math.max(...daysSinceActivities, 1),
        min: Math.min(...daysSinceActivities, 0),
        mean: daysSinceActivities.reduce((sum, val) => sum + val, 0) / 
              Math.max(daysSinceActivities.length, 1)
      },
      eventsLast30: {
        max: Math.max(...eventsLast30, 1),
        min: Math.min(...eventsLast30, 0),
        mean: eventsLast30.reduce((sum, val) => sum + val, 0) / 
              Math.max(eventsLast30.length, 1)
      },
      revenueLast30: {
        max: Math.max(...revenueLast30, 1),
        min: Math.min(...revenueLast30, 0),
        mean: revenueLast30.reduce((sum, val) => sum + val, 0) / 
              Math.max(revenueLast30.length, 1)
      },
      timestamp: Date.now()
    };
    
    // Save stats
    try {
      fs.writeFileSync(STATS_PATH, JSON.stringify(stats, null, 2));
      console.log('Feature statistics saved');
    } catch (err) {
      console.error('Error saving feature statistics:', err);
    }
  } catch (error) {
    console.error('Error calculating feature statistics:', error);
  }
}

/**
 * Load feature statistics for normalization
 */
function loadFeatureStats(): FeatureStats {
  try {
    // Skip in browser environment
    if (typeof window !== 'undefined') {
      return {
        daysSinceActivity: { max: 30, min: 0, mean: 10 },
        eventsLast30: { max: 100, min: 0, mean: 30 },
        revenueLast30: { max: 300, min: 0, mean: 100 },
        timestamp: 0
      };
    }
    
    // Check if stats file exists
    if (fs.existsSync(STATS_PATH)) {
      const statsData = fs.readFileSync(STATS_PATH, 'utf8');
      return JSON.parse(statsData);
    } else {
      // Default stats
      return {
        daysSinceActivity: { max: 30, min: 0, mean: 10 },
        eventsLast30: { max: 100, min: 0, mean: 30 },
        revenueLast30: { max: 300, min: 0, mean: 100 },
        timestamp: 0
      };
    }
  } catch (error) {
    console.error('Error loading feature statistics:', error);
    return {
      daysSinceActivity: { max: 30, min: 0, mean: 10 },
      eventsLast30: { max: 100, min: 0, mean: 30 },
      revenueLast30: { max: 300, min: 0, mean: 100 },
      timestamp: 0
    };
  }
}

/**
 * Fallback prediction method if other methods fail
 */
function fallbackPrediction(data: {
  plan: string;
  daysSinceActivity: number;
  eventsLast30: number;
  revenueLast30: number;
  userId?: string;
}) {
  let probability = 0.5;
  
  if (data.plan === 'free') {
    probability += 0.1;
  } else if (data.plan === 'basic') {
    probability += 0.03;
  } else {
    probability -= 0.05;
  }
  
  if (data.daysSinceActivity > 20) {
    probability += 0.1;
  } else if (data.daysSinceActivity > 10) {
    probability += 0.05;
  }
  
  if (data.eventsLast30 > 50) {
    probability -= 0.08;
  } else if (data.eventsLast30 > 20) {
    probability -= 0.05;
  }
  
  if (data.revenueLast30 > 100) {
    probability -= 0.08;
  } else if (data.revenueLast30 > 50) {
    probability -= 0.05;
  }
  
  // Add randomness for user ID
  if (data.userId) {
    const idSum = data.userId.split('').reduce((sum, char, index) => {
      return sum + (char.charCodeAt(0) * (index + 1));
    }, 0);
    
    const randomFactor = (idSum % 100) / 500; // Between 0 and 0.2
    probability += randomFactor - 0.1; // Between -0.1 and 0.1
  }
  
  probability = Math.max(0.05, Math.min(0.95, probability));
  probability = parseFloat(probability.toFixed(2));
  
  const riskCategory = getRiskCategory(probability);
  
  return {
    probability,
    willChurn: probability > 0.5,
    riskCategory
  };
}

export async function POST(request: Request) {
  try {
    const startTime = Date.now();
    const body = await request.json();
    console.log(`[${startTime}] Received prediction request for ${Array.isArray(body) ? body.length : 1} users`);
    
    if (Array.isArray(body)) {
      console.log(`[${startTime}] Processing batch prediction for ${body.length} users`);
      
      // Process in smaller batches to avoid timeouts
      const BATCH_SIZE = 100;
      const predictions = [];
      
      try {
        // Process in batches
        for (let i = 0; i < body.length; i += BATCH_SIZE) {
          const batchStartTime = Date.now();
          const batch = body.slice(i, i + BATCH_SIZE);
          console.log(`[${batchStartTime}] Processing batch ${i/BATCH_SIZE + 1}/${Math.ceil(body.length/BATCH_SIZE)} (${batch.length} users)`);
          
          // Process each user in the batch
          const batchPredictions = [];
          for (let j = 0; j < batch.length; j++) {
            const item = batch[j];
            const { plan, daysSinceActivity, eventsLast30, revenueLast30, userId } = item;
            
            if (!plan || daysSinceActivity === undefined || eventsLast30 === undefined || revenueLast30 === undefined) {
              console.log(`Skipping user with incomplete data`);
              continue;
            }
            
            try {
              const result = await predictChurnRuleBased({
                plan,
                daysSinceActivity,
                eventsLast30,
                revenueLast30,
                userId
              });
              
              batchPredictions.push(result);
            } catch (userError) {
              console.error(`Error predicting for user ${userId || 'unknown'}:`, userError);
              // Continue with other users
            }
          }
          
          predictions.push(...batchPredictions);
          console.log(`[${Date.now()}] Completed batch ${i/BATCH_SIZE + 1} in ${Date.now() - batchStartTime}ms (${batchPredictions.length} predictions)`);
        }
        
        console.log(`[${Date.now()}] All batches processed. Generated ${predictions.length} predictions`);
        
        // Apply calibration if enabled
        console.log(`[${Date.now()}] Applying calibration: ${ENABLE_CALIBRATION ? 'enabled' : 'disabled'}`);
        let finalPredictions = predictions;
        
        if (ENABLE_CALIBRATION) {
          console.log(`[${Date.now()}] Before calibration - High: ${predictions.filter(p => p.riskCategory === 'High Risk').length}, Medium: ${predictions.filter(p => p.riskCategory === 'Medium Risk').length}, Low: ${predictions.filter(p => p.riskCategory === 'Low Risk').length}`);
          finalPredictions = calibratePredictions(predictions);
          console.log(`[${Date.now()}] After calibration - High: ${finalPredictions.filter(p => p.riskCategory === 'High Risk').length}, Medium: ${finalPredictions.filter(p => p.riskCategory === 'Medium Risk').length}, Low: ${finalPredictions.filter(p => p.riskCategory === 'Low Risk').length}`);
        }
        
        console.log(`[${Date.now()}] Rule-based prediction completed for ${finalPredictions.length} users`);
        const highRisk = finalPredictions.filter(p => p.riskCategory === 'High Risk').length;
        const mediumRisk = finalPredictions.filter(p => p.riskCategory === 'Medium Risk').length;
        const lowRisk = finalPredictions.filter(p => p.riskCategory === 'Low Risk').length;
        console.log(`[${Date.now()}] Risk distribution: High: ${highRisk} (${Math.round(highRisk/finalPredictions.length*100)}%), Medium: ${mediumRisk} (${Math.round(mediumRisk/finalPredictions.length*100)}%), Low: ${lowRisk} (${Math.round(lowRisk/finalPredictions.length*100)}%)`);
        
        // Save predictions to database for users that exist
        let savedCount = 0;
        console.log(`[${Date.now()}] Starting database saves...`);
        
        try {
          // First, fetch all existing users in one query to avoid N+1 queries
          console.log(`[${Date.now()}] Fetching all existing users in one batch...`);
          const allUserIds = body.map(item => item.userId).filter(Boolean);
          const existingUsers = await prisma.user.findMany({
            where: {
              id: {
                in: allUserIds
              }
            },
            select: {
              id: true
            }
          });
          
          // Create a set of existing user IDs for fast lookup
          const existingUserIds = new Set(existingUsers.map(user => user.id));
          console.log(`[${Date.now()}] Found ${existingUserIds.size} existing users out of ${allUserIds.length} requested`);
          
          // Save in batches to avoid timeouts
          for (let i = 0; i < body.length && i < finalPredictions.length; i += BATCH_SIZE) {
            const saveBatchStartTime = Date.now();
            const batchSize = Math.min(BATCH_SIZE, body.length - i, finalPredictions.length - i);
            console.log(`[${saveBatchStartTime}] Saving batch ${i/BATCH_SIZE + 1}/${Math.ceil(body.length/BATCH_SIZE)} (${batchSize} predictions)`);
            
            // Create arrays for batch operations
            const creates = [];
            const updates = [];
            
            // Process each user in the batch
            for (let j = 0; j < batchSize; j++) {
              const idx = i + j;
              const userId = body[idx].userId;
              const prediction = finalPredictions[idx];
              
              if (!userId) continue;
              
              // Check if user exists using our pre-fetched set
              if (existingUserIds.has(userId)) {
                // User exists, add to updates
                updates.push({
                  where: { userId },
                  data: {
                    probability: prediction.probability,
                    willChurn: prediction.willChurn,
                    riskCategory: prediction.riskCategory,
                    predictedAt: new Date()
                  }
                });
                savedCount++;
              } else {
                console.log(`Skipping database save for user ${userId} that doesn't exist`);
              }
            }
            
            // Perform batch operations if there are any
            if (updates.length > 0) {
              // Process updates in smaller chunks to avoid potential issues
              const updateChunkSize = 25;
              for (let k = 0; k < updates.length; k += updateChunkSize) {
                const updateChunk = updates.slice(k, k + updateChunkSize);
                try {
                  await Promise.all(updateChunk.map(update => 
                    prisma.churnPrediction.upsert({
                      where: update.where,
                      update: update.data,
                      create: {
                        ...update.where,
                        ...update.data
                      }
                    })
                  ));
                } catch (chunkError) {
                  console.error(`Error processing update chunk ${k/updateChunkSize + 1}:`, chunkError);
                }
              }
            }
            
            console.log(`[${Date.now()}] Saved batch ${i/BATCH_SIZE + 1} in ${Date.now() - saveBatchStartTime}ms`);
          }
        } catch (batchSaveError: any) {
          console.error(`[${Date.now()}] Error during batch save:`, batchSaveError);
          console.error(batchSaveError.stack);
        }
        
        console.log(`[${Date.now()}] Saved ${savedCount} predictions to the database`);
        console.log(`[${Date.now()}] Total processing time: ${Date.now() - startTime}ms`);
        
        return new Response(JSON.stringify({ predictions: finalPredictions }), { 
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        });
      } catch (batchError: any) {
        console.error(`[${Date.now()}] Error processing prediction batches:`, batchError);
        return new Response(JSON.stringify({ 
          error: 'Error during batch prediction',
          message: batchError.message,
          predictions: predictions // Return any predictions we did manage to generate
        }), {
          status: 500,
          headers: {
            'content-type': 'application/json',
          },
        });
      }
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
    
    const result = await predictChurnRuleBased({
      plan,
      daysSinceActivity,
      eventsLast30,
      revenueLast30,
      userId
    });
    
    // No calibration for single prediction case
    const finalResult = result;
    
    if (userId) {
      try {
        // Check if user exists before attempting to save the prediction
        const userExists = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true }
        });
        
        if (userExists) {
          await prisma.churnPrediction.upsert({
            where: { userId },
            update: {
              probability: finalResult.probability,
              willChurn: finalResult.willChurn,
              riskCategory: finalResult.riskCategory,
              predictedAt: new Date()
            },
            create: {
              userId,
              probability: finalResult.probability,
              willChurn: finalResult.willChurn,
              riskCategory: finalResult.riskCategory
            }
          });
        } else {
          console.log(`Skipping database save for test user ${userId} that doesn't exist`);
        }
      } catch (error) {
        console.error(`Error saving prediction for user ${userId}:`, error);
      }
    }
    
    return new Response(JSON.stringify(finalResult), {
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