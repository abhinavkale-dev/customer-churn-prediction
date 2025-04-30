import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY!);
const ownerEmail = process.env.OWNER_EMAIL!;

cron.schedule('0 8 * * *', async () => {
  const total = await prisma.churnFeature.count();
  const churned = await prisma.churnFeature.count({ where: { churned: true } });
  const planTypes = await prisma.churnFeature.groupBy({ by: ['plan'] });
  const avgDays = await prisma.churnFeature.aggregate({ _avg: { daysSinceActivity: true } });
  
  // Get counts for each plan separately
  const byPlanData = await Promise.all(
    planTypes.map(async ({ plan }) => {
      const total = await prisma.churnFeature.count({ where: { plan } });
      const lost = await prisma.churnFeature.count({ where: { plan, churned: true } });
      return { plan, total, lost };
    })
  );

  const report = await prisma.dailyReport.upsert({
    where: { reportDate: new Date(new Date().toDateString()) },
    update: {},
    create: {
      reportDate: new Date(new Date().toDateString()),
      total, 
      churned,
      churnRate: churned/total,
      avgDaysActivity: avgDays._avg.daysSinceActivity || 0,
      byPlan: JSON.stringify(byPlanData)
    }
  });

  // Generate HTML for plan list
  let planHtml = '';
  const planData = JSON.parse(report.byPlan as string) as Array<{ plan: string; total: number; lost: number }>;
  for (const p of planData) {
    const lostRate = ((p.lost / p.total) * 100).toFixed(1);
    planHtml += `<li>${p.plan}: ${p.lost}/${p.total} (${lostRate}%)</li>`;
  }

  const html = `
    <h1>Daily Churn Report — ${report.reportDate.toDateString()}</h1>
    <p>Total customers: ${report.total}</p>
    <p>Churned: ${report.churned}</p>
    <p>Churn Rate: ${(report.churnRate*100).toFixed(2)}%</p>
    <p>Avg Days Since Activity: ${report.avgDaysActivity.toFixed(1)}</p>
    <h2>By Plan</h2>
    <ul>${planHtml}</ul>
  `;

  await resend.emails.send({
    from: 'Churn Bot <noreply@yourdomain.com>',
    to: [ownerEmail],
    subject: `Daily Churn Report — ${report.reportDate.toDateString()}`,
    html,
    text: `Daily Churn Report — ${report.reportDate.toDateString()}\nTotal: ${report.total}\nChurned: ${report.churned}\nRate: ${(report.churnRate*100).toFixed(2)}%`  
  });

  console.log('Daily report sent:', report.reportDate.toDateString());
}); 