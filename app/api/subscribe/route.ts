import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { emailService } from '@/lib/email';

const prisma = new PrismaClient();
const FROM_ADDRESS = process.env.SES_FROM_ADDRESS!;

export async function POST(req: Request) {
  try {
    const { email, plan } = await req.json();
    const subscription = await prisma.subscription.create({ data: { email, plan } });

    const subject = `You've subscribed to the ${plan} plan!`;
    const html = `
      <h1>Subscription Confirmed</h1>
      <p>Hi ${email},</p>
      <p>Thank you for subscribing to our <strong>${plan}</strong> plan!</p>
      <p>— The Churn Analysis Team</p>
    `;
    const text = `Subscription Confirmed\n\nHi ${email},\nThank you for subscribing to our ${plan} plan!\n— The Churn Analysis Team`;

    const emailResult = await emailService.send({
      from: FROM_ADDRESS,
      to: [email],
      subject,
      html,
      text,
    });

    return NextResponse.json({
      subscription,
      email: {
        success: emailResult.success,
        messageId: emailResult.id,
      },
    });
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to process subscription' },
      { status: 500 }
    );
  }
} 