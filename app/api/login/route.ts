import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { emailService } from '@/lib/email';

const prisma = new PrismaClient();
const FROM_ADDRESS = process.env.SES_FROM_ADDRESS || '';
const TO_ADDRESS = process.env.TEST_EMAIL || '';

export async function POST(req: Request) {
  try {

    const subject = 'Welcome to Customer Churn Prediction!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6c5ce7; text-align: center; padding-top: 20px;">Welcome to Customer Churn Prediction</h1>
        <p>Hello there,</p>
        <p>Thank you for logging in to our Customer Churn Prediction platform. We're excited to help you identify at-risk customers and improve your retention rates.</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #6c5ce7; margin-top: 0;">Here's what you can do:</h3>
          <ul>
            <li>View churn predictions for your customers</li>
            <li>Analyze customer behavior patterns</li>
            <li>Get AI-powered retention strategies</li>
            <li>Track improvements over time</li>
          </ul>
        </div>
        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br>The Customer Churn Prediction Team</p>
      </div>
    `;
    
    const text = `
      Welcome to Customer Churn Prediction!
      
      Hello there,
      
      Thank you for logging in to our Customer Churn Prediction platform. We're excited to help you identify at-risk customers and improve your retention rates.
      
      Here's what you can do:
      - View churn predictions for your customers
      - Analyze customer behavior patterns
      - Get AI-powered retention strategies
      - Track improvements over time
      
      If you have any questions or need assistance, please don't hesitate to contact our support team.
      
      Best regards,
      The Customer Churn Prediction Team
    `;

    const emailResult = await emailService.send({
      from: FROM_ADDRESS,
      to: [TO_ADDRESS],
      subject,
      html,
      text,
    });

    return NextResponse.json({
      success: true,
      email: {
        success: emailResult.success,
        messageId: emailResult.id,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to process login' },
      { status: 500 }
    );
  }
} 