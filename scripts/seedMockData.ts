import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seed() {
  await prisma.churnFeature.deleteMany({});
  await prisma.churnFeature.createMany({
    data: [
      { customerId: 1, plan: 'free',  daysSinceActivity: 40, eventsLast30: 0,  revenueLast30: 0,   churned: true  },
      { customerId: 2, plan: 'basic', daysSinceActivity: 5,  eventsLast30: 10, revenueLast30: 100, churned: false },
      { customerId: 3, plan: 'pro',   daysSinceActivity: 2,  eventsLast30: 20, revenueLast30: 300, churned: false }
    ]
  });
  console.log('✅ Seeded mock ChurnFeature data');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); }); 