import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seed() {
  try {
    // Clear existing data
    await prisma.churnFeature.deleteMany();
    
    const data = [];
    
    // Generate 600 customers with randomized data
    for (let i = 1; i <= 600; i++) {
      const plan = ['basic', 'premium', 'enterprise'][Math.floor(Math.random() * 3)];
      
      // Calculate metrics based on plan
      let daysSinceActivity = Math.floor(Math.random() * 90);
      let eventsLast30 = 0;
      let revenueLast30 = 0;
      
      // Premium and enterprise users tend to be more active
      if (plan === 'premium') {
        daysSinceActivity = Math.floor(Math.random() * 60);
        eventsLast30 = Math.floor(Math.random() * 50) + 10;
        revenueLast30 = Math.floor(Math.random() * 500) + 100;
      } else if (plan === 'enterprise') {
        daysSinceActivity = Math.floor(Math.random() * 30);
        eventsLast30 = Math.floor(Math.random() * 200) + 50;
        revenueLast30 = Math.floor(Math.random() * 2000) + 500;
      } else {
        eventsLast30 = Math.floor(Math.random() * 20);
        revenueLast30 = Math.floor(Math.random() * 100);
      }
      
      // Determine if churned based on activity and plan
      // Higher chance of churn with higher daysSinceActivity
      let churned = false;
      if (plan === 'basic' && daysSinceActivity > 30) {
        churned = Math.random() < 0.7;
      } else if (plan === 'premium' && daysSinceActivity > 45) {
        churned = Math.random() < 0.5;
      } else if (plan === 'enterprise' && daysSinceActivity > 60) {
        churned = Math.random() < 0.3;
      } else if (daysSinceActivity > 15) {
        churned = Math.random() < 0.2;
      }
      
      data.push({
        customerId: i,
        plan,
        daysSinceActivity,
        eventsLast30,
        revenueLast30,
        churned
      });
    }
    
    // Create records in batches
    await prisma.churnFeature.createMany({
      data
    });
    
    console.log(`Seeded ${data.length} churn feature records`);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed(); 