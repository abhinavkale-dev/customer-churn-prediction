import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { emailService } from '@/lib/email';

const prisma = new PrismaClient();
const FROM_ADDRESS = process.env.SES_FROM_ADDRESS!;

export async function POST(req: Request) {
  try {
    const { email, plan } = await req.json();
    
    // 1. Find and mark subscription as canceled
    const subscription = await prisma.subscription.findFirst({
      where: { email, plan, canceledAt: null }
    });

    if (!subscription) {
      return NextResponse.json(
        { success: false, message: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Update the subscription with cancellation date
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { canceledAt: new Date() }
    });

    // 2. Prepare email content
    const subject = `You've canceled your ${plan} plan`;
    const html = `
      <h1>Subscription Canceled</h1>
      <p>Hi ${email},</p>
      <p>Your <strong>${plan}</strong> plan has been canceled.</p>
      <p>We're sorry to see you go. If you change your mind, you can always subscribe again.</p>
      <p>— The Churn Analysis Team</p>
    `;
    const text = `Subscription Canceled\n\nHi ${email},\nYour ${plan} plan has been canceled.\nWe're sorry to see you go. If you change your mind, you can always subscribe again.\n— The Churn Analysis Team`;

    // 3. Send cancellation email via SES SDK
    const emailResult = await emailService.send({
      from: FROM_ADDRESS,
      to: [email],
      subject,
      html,
      text,
    });

    // 4. Return subscription and email result
    return NextResponse.json({
      success: true,
      subscription: updatedSubscription,
      email: {
        success: emailResult.success,
        messageId: emailResult.id,
      }
    });
  } catch (error) {
    console.error("Cancellation error:", error);
    return NextResponse.json(
      { error: "Failed to process cancellation" },
      { status: 500 }
    );
  }
} 