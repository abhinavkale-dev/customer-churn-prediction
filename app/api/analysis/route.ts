import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const total = await prisma.churnFeature.count();
  const churned = await prisma.churnFeature.count({ where: { churned: true } });
  
  // Get plan types first
  const planTypes = await prisma.churnFeature.groupBy({ by: ['plan'] });
  const avgDays = await prisma.churnFeature.aggregate({ _avg: { daysSinceActivity: true } });
  
  // Get counts for each plan separately
  const byPlan = await Promise.all(
    planTypes.map(async ({ plan }) => {
      const total = await prisma.churnFeature.count({ where: { plan } });
      const lost = await prisma.churnFeature.count({ where: { plan, churned: true } });
      return { plan, total, lost };
    })
  );

  return NextResponse.json({
    total,
    churned,
    churnRate: churned/total,
    byPlan,
    avgDaysSinceActivity: avgDays._avg.daysSinceActivity
  });
} 