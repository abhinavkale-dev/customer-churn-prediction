import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();


type PlanType = 'free' | 'basic' | 'premium';


const NUM_USERS = 1000;
const PLANS: PlanType[] = ['free', 'basic', 'premium'];

const PLAN_DISTRIBUTION: Record<PlanType, number> = {
  free: 0.7,        
  basic: 0.2,   
  premium: 0.1  
};


const EVENT_TYPES = [
  'login', 
  'create_document', 
  'edit_document', 
  'share_document', 
  'export_pdf', 
  'add_comment', 
  'invite_team_member', 
  'payment', 
  'upgrade_plan',
  'downgrade_plan',
  'view_dashboard',
  'search'
];


const EVENT_FREQUENCY: Record<PlanType, { min: number; max: number }> = {
  free: { min: 1, max: 15 },
  basic: { min: 10, max: 50 },
  premium: { min: 30, max: 150 }
};


const REVENUE_VALUES: Record<PlanType, number> = {
  free: 0,
  basic: 100,
  premium: 300
};


const RETENTION_RATES: Record<PlanType, number> = {
  free: 0.4,    
  basic: 0.7,   
  premium: 0.85 
};


const COMPANY_DOMAINS = [
  'acme.com', 'techwave.io', 'innovate.co', 'zenithdata.com', 'apollotech.net',
  'quantum-ai.com', 'fusion-labs.co', 'dataforge.io', 'stellarcloud.net', 'nexusanalytics.com',
  'globex.org', 'velocityapps.io', 'catalyst-tech.com', 'omegasystems.co', 'coretechsolutions.com',
  'brightpath.io', 'visionware.net', 'integritysoftware.co', 'peakconsulting.com', 'oasisdigital.io'
];


const INDUSTRIES = [
  { name: 'Technology', churnRate: 0.12 },
  { name: 'Finance', churnRate: 0.08 },
  { name: 'Healthcare', churnRate: 0.10 },
  { name: 'Education', churnRate: 0.15 },
  { name: 'Retail', churnRate: 0.18 },
  { name: 'Manufacturing', churnRate: 0.14 },
  { name: 'Consulting', churnRate: 0.11 },
  { name: 'Marketing', churnRate: 0.20 },
  { name: 'Logistics', churnRate: 0.13 },
  { name: 'Non-profit', churnRate: 0.16 }
];

async function seed() {
  try {
    console.log('🌱 Starting seed process...');
    
    console.log('Clearing existing data...');
    await prisma.activity.deleteMany({});
    await prisma.churnPrediction.deleteMany({});
    await prisma.user.deleteMany({});
    
    console.log(`Creating ${NUM_USERS} users...`);
    
   
    const usedEmails = new Set<string>();
    

    const users = [];
    for (let i = 0; i < NUM_USERS; i++) {

      const randValue = Math.random();
      let plan: PlanType;
      if (randValue < PLAN_DISTRIBUTION.free) {
        plan = 'free';
      } else if (randValue < PLAN_DISTRIBUTION.free + PLAN_DISTRIBUTION.basic) {
        plan = 'basic';
      } else {
        plan = 'premium';
      }
      

      const createdAt = faker.date.past({ years: Math.random() < 0.7 ? 0.5 : 1 });
      
      // Generate more realistic business email
      let email;
      let attempts = 0;
      do {
        const firstName = faker.person.firstName().toLowerCase();
        const lastName = faker.person.lastName().toLowerCase();
        const companyDomain = COMPANY_DOMAINS[Math.floor(Math.random() * COMPANY_DOMAINS.length)];
        
        // Different email formats
        const emailFormat = Math.floor(Math.random() * 4);
        switch (emailFormat) {
          case 0:
            email = `${firstName}.${lastName}@${companyDomain}`; // john.doe@acme.com
            break;
          case 1:
            email = `${firstName[0]}${lastName}@${companyDomain}`; // jdoe@acme.com
            break;
          case 2:
            email = `${firstName}@${companyDomain}`; // john@acme.com
            break;
          default:
            email = `${lastName}.${firstName}@${companyDomain}`; // doe.john@acme.com
        }
        
        // If duplicate, add a random number
        if (usedEmails.has(email)) {
          email = `${email.split('@')[0]}${Math.floor(Math.random() * 1000)}@${email.split('@')[1]}`;
        }
        
        attempts++;
        // If still a duplicate after 3 attempts, generate a completely random email
        if (attempts > 3 && usedEmails.has(email)) {
          email = faker.internet.email();
        }
      } while (usedEmails.has(email) && attempts < 5);
      
      // Add the email to the used set
      usedEmails.add(email);
      
      users.push({
        id: faker.string.uuid(),
        email,
        name: `${faker.person.firstName()} ${faker.person.lastName()}`,
        plan,
        createdAt,
        updatedAt: faker.date.between({ from: createdAt, to: new Date() })
      });
    }
    
    await prisma.user.createMany({
      data: users
    });
    
    console.log('Creating realistic user activities...');
    
    // Create activities for each user
    const allActivities = [];
    
    for (const user of users) {
      // Number of activities depends on the plan and how long they've been a customer
      const daysSinceSignup = Math.floor((Date.now() - user.createdAt.getTime()) / (24 * 60 * 60 * 1000));
      const monthsSinceSignup = daysSinceSignup / 30;
      
      // Calculate a realistic number of activities based on their plan and tenure
      let monthlyEvents = faker.number.int(EVENT_FREQUENCY[user.plan]);
      // Engaged users have more events
      if (Math.random() < 0.2) {
        // Super users have 2x more activity
        monthlyEvents *= 2;
      } else if (Math.random() < 0.3) {
        // Low users have fewer activity
        monthlyEvents = Math.floor(monthlyEvents * 0.5);
      }
      
      const totalActivities = Math.ceil(monthlyEvents * monthsSinceSignup);
      
      // Days since last activity more realistic by plan and likelihood to churn
      const willChurn = Math.random() > RETENTION_RATES[user.plan];
      
      // Determine days since last activity
      let daysSinceActivity;
      if (willChurn) {
        // Users likely to churn have been inactive for longer
        daysSinceActivity = user.plan === 'free' 
          ? faker.number.int({ min: 15, max: 60 })
          : user.plan === 'basic' 
            ? faker.number.int({ min: 10, max: 45 })
            : faker.number.int({ min: 7, max: 30 });
      } else {
        // Active users have recent activity
        daysSinceActivity = user.plan === 'free' 
          ? faker.number.int({ min: 0, max: 20 })
          : user.plan === 'basic' 
            ? faker.number.int({ min: 0, max: 10 })
            : faker.number.int({ min: 0, max: 5 });
      }
      
      // Calculate the date of their last activity
      const lastActivityDate = new Date(Date.now() - daysSinceActivity * 24 * 60 * 60 * 1000);
      
      // Track the last 30 days of activities
      const last30DaysActivities = [];
      
      // Generate activity spread over time
      const activitiesPerDay = totalActivities / daysSinceSignup;
      
      // Temporal patterns - more active during weekdays, less on weekends
      // More active during working hours
      let lastActivityTimestamp = new Date(user.createdAt);
      
      for (let i = 0; i < totalActivities; i++) {
        // Move forward in time for each activity
        const hoursToAdd = 24 / activitiesPerDay * (0.5 + Math.random());
        lastActivityTimestamp = new Date(lastActivityTimestamp.getTime() + hoursToAdd * 60 * 60 * 1000);
        
        // Don't go beyond the calculated last activity date for churned users
        if (lastActivityTimestamp > lastActivityDate && willChurn) {
          break;
        }
        
        // Don't go beyond current time
        if (lastActivityTimestamp > new Date()) {
          break;
        }
        
        // Realistic event selection - certain events are more common
        let eventType;
        const rand = Math.random();
        if (rand < 0.3) {
          // Most common events
          eventType = 'login';
        } else if (rand < 0.6) {
          // Common events
          eventType = ['create_document', 'edit_document', 'view_dashboard'][Math.floor(Math.random() * 3)];
        } else if (rand < 0.9) {
          // Less common events
          eventType = ['share_document', 'export_pdf', 'add_comment', 'search'][Math.floor(Math.random() * 4)];
        } else {
          // Rare events
          eventType = ['invite_team_member', 'payment', 'upgrade_plan', 'downgrade_plan'][Math.floor(Math.random() * 4)];
        }
        
        // Calculate revenue only for payment events realistically
        let revenue = 0;
        if (eventType === 'payment') {
          // Payment once per month for paid plans
          revenue = user.plan === 'free' ? 0 : REVENUE_VALUES[user.plan];
        } else if (eventType === 'upgrade_plan' && user.plan !== 'free') {
          // One-time upgrade fee
          revenue = user.plan === 'basic' 
            ? faker.number.float({ min: 5, max: 10, fractionDigits: 2 })
            : faker.number.float({ min: 10, max: 20, fractionDigits: 2 });
        }
        
        const activity = {
          id: faker.string.uuid(),
          userId: user.id,
          eventType,
          timestamp: new Date(lastActivityTimestamp),
          revenue
        };
        
        allActivities.push(activity);
        
        // Track last 30 days activities for churn feature calculation
        const daysSinceTimestamp = Math.floor((Date.now() - lastActivityTimestamp.getTime()) / (24 * 60 * 60 * 1000));
        if (daysSinceTimestamp <= 30) {
          last30DaysActivities.push(activity);
        }
      }
      
      // Calculate churn features
      const eventsLast30 = last30DaysActivities.length;
      const revenueLast30 = parseFloat(last30DaysActivities.reduce((sum, activity) => sum + activity.revenue, 0).toFixed(2));
      
      // Determine churn status based on realistic retention rates and activity levels
      let churned = false;
      
      // Realistic churn indicators:
      // 1. Long periods of inactivity
      // 2. Low engagement relative to their plan
      // 3. Declining activity over time
      
      if (daysSinceActivity > 30 && user.plan === 'free') {
        // Free users who haven't been active for a month are likely to churn
        churned = Math.random() < 0.8;
      } else if (daysSinceActivity > 21 && user.plan === 'basic') {
        // Paying customers who haven't been active for 3 weeks are concerning
        churned = Math.random() < 0.6;
      } else if (daysSinceActivity > 14 && user.plan === 'premium') {
        // Premium customers inactive for 2 weeks are at risk
        churned = Math.random() < 0.4;
      } else if (eventsLast30 === 0) {
        // No recent activity is a strong churn indicator
        churned = Math.random() < 0.7;
      } else if (eventsLast30 < EVENT_FREQUENCY[user.plan].min / 2) {
        // Users with activity far below their plan's average
        churned = Math.random() < 0.5;
      }
      
      // Create churn prediction for most users
      // In real-world, we would predict for all users
      if (Math.random() < 0.98) {
        // Calculate probability using a more realistic algorithm
        // Start with baseline from churn model
        let probability;
        
        // Assign an industry to influence churn (some industries churn more than others)
        const industry = INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)];
        const industryFactor = (industry.churnRate - 0.13) * 0.5; // Normalize around average
        
        // Higher days since activity = higher churn probability
        const activityFactor = Math.min(daysSinceActivity / 70, 1) * 0.4;
        
        // Lower events relative to plan expectations = higher churn probability
        const expectedMinEvents = EVENT_FREQUENCY[user.plan].min / 2;
        const activityRatio = expectedMinEvents > 0 ? 
          Math.min(eventsLast30 / expectedMinEvents, 2) : 1;
        const engagementFactor = Math.max(0, 0.25 - (activityRatio * 0.15));
        
        // Plan factor - free users churn more easily
        const planFactor = user.plan === 'free' ? 0.12 : 
                           user.plan === 'basic' ? 0.04 : 0;
        
        // Revenue factor - users who pay are less likely to churn
        const revenueFactor = revenueLast30 > 0 ? -0.15 : 0;
        
        // Tenure factor - newer users churn more easily
        const tenureFactor = Math.max(0, 0.12 - (monthsSinceSignup * 0.012));
        
        // Calculate final probability - adjust factors to get desired distribution
        probability = Math.min(
          Math.max(0.05, activityFactor + engagementFactor + planFactor + revenueFactor + industryFactor + tenureFactor + 0.08),
          0.95
        );
        
        // Round to 2 decimal places
        probability = parseFloat(probability.toFixed(2));
        
        // Adjust thresholds for risk categories to create the desired distribution:
        // High Risk: ~8-10% (80-100 customers out of 1000)
        // Medium Risk: ~38% (380 customers)
        // Low Risk: ~52-54% (520-540 customers)
        const riskCategory = probability < 0.4 ? 'Low Risk' : 
                              probability < 0.8 ? 'Medium Risk' : 'High Risk';
        
        // Add probability noise for more realistic distribution
        const finalProbability = Math.max(0.01, Math.min(0.99, probability + (Math.random() * 0.1 - 0.05)));
        
        await prisma.churnPrediction.create({
          data: {
            userId: user.id,
            probability: finalProbability,
            willChurn: finalProbability > 0.5,
            riskCategory,
            predictedAt: faker.date.recent({ days: 7 })
          }
        });
      }
    }
    
    // Create activities in bulk
    if (allActivities.length > 0) {
      // Process in batches to avoid potential DB issues
      const BATCH_SIZE = 1000;
      for (let i = 0; i < allActivities.length; i += BATCH_SIZE) {
        const batch = allActivities.slice(i, i + BATCH_SIZE);
        console.log(`Inserting activities batch ${i/BATCH_SIZE + 1} of ${Math.ceil(allActivities.length/BATCH_SIZE)}`);
        await prisma.activity.createMany({
          data: batch
        });
      }
    }
    
    console.log('✅ Seed completed successfully');
    
  } catch (error) {
    console.error('❌ Seed error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seed()
  .then(() => {
    console.log('Seed script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error running seed script:', error);
    process.exit(1);
  }); 