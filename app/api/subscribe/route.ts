import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { emailService } from '@/lib/email';

const prisma = new PrismaClient();
const FROM_ADDRESS = process.env.SES_FROM_ADDRESS!;

export async function POST(req: Request) {
  try {
    const { email, plan } = await req.json();
    // 1. Persist subscription
    const subscription = await prisma.subscription.create({ data: { email, plan } });

    // 2. Prepare email content
    const subject = `You've subscribed to the ${plan} plan!`;
    const html = `
      <h1>Subscription Confirmed</h1>
      <p>Hi ${email},</p>
      <p>Thank you for subscribing to our <strong>${plan}</strong> plan!</p>
      <p>— The Churn Analysis Team</p>
    `;
    const text = `Subscription Confirmed\n\nHi ${email},\nThank you for subscribing to our ${plan} plan!\n— The Churn Analysis Team`;

    // 3. Send confirmation email via SES SDK
    const emailResult = await emailService.send({
      from: FROM_ADDRESS,
      to: [email],
      subject,
      html,
      text,
    });

    // 4. Return subscription and email result
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