import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { emailService } from '@/lib/email';

const prisma = new PrismaClient();
const FROM_ADDRESS = process.env.SES_FROM_ADDRESS || '';
const TO_ADDRESS = process.env.TEST_EMAIL || '';

export async function POST(req: Request) {
  try {
    const { oldPlan, newPlan } = await req.json();

    let subject, html, text;

    if (newPlan === 'free' && (oldPlan === 'basic' || oldPlan === 'premium')) {

      subject = `Subscription Canceled: ${oldPlan} Plan`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6c5ce7; text-align: center; padding-top: 20px;">Subscription Canceled</h1>
          <p>Hello there,</p>
          <p>Your <strong>${oldPlan}</strong> plan has been canceled, and you've been downgraded to the free plan.</p>
          <p>We're sorry to see you go. If you change your mind, you can always upgrade again anytime.</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #6c5ce7; margin-top: 0;">Account Summary:</h3>
            <ul>
              <li>Previous Plan: ${oldPlan}</li>
              <li>Current Plan: Free</li>
              <li>Downgrade Date: ${new Date().toLocaleDateString()}</li>
            </ul>
          </div>
          <p>Thank you for using Customer Churn Prediction. If you have any feedback on how we could improve, we'd love to hear it.</p>
          <p>Best regards,<br>The Customer Churn Prediction Team</p>
        </div>
      `;
      
      text = `
        Subscription Canceled: ${oldPlan} Plan
        
        Hello there,
        
        Your ${oldPlan} plan has been canceled, and you've been downgraded to the free plan.
        
        We're sorry to see you go. If you change your mind, you can always upgrade again anytime.
        
        Account Summary:
        - Previous Plan: ${oldPlan}
        - Current Plan: Free
        - Downgrade Date: ${new Date().toLocaleDateString()}
        
        Thank you for using Customer Churn Prediction. If you have any feedback on how we could improve, we'd love to hear it.
        
        Best regards,
        The Customer Churn Prediction Team
      `;
    } else {
      subject = `Plan Updated: Welcome to ${newPlan.charAt(0).toUpperCase() + newPlan.slice(1)}!`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6c5ce7; text-align: center; padding-top: 20px;">Plan Updated</h1>
          <p>Hello there,</p>
          <p>Your subscription has been successfully updated to the <strong>${newPlan}</strong> plan!</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #6c5ce7; margin-top: 0;">Account Summary:</h3>
            <ul>
              <li>Previous Plan: ${oldPlan}</li>
              <li>New Plan: ${newPlan}</li>
              <li>Upgrade Date: ${new Date().toLocaleDateString()}</li>
            </ul>
          </div>
          
          ${newPlan === 'basic' ? `
            <p>With the Basic plan, you now have access to:</p>
            <ul>
              <li>Full access to all features</li>
              <li>Priority customer support</li>
              <li>Basic analytics tools</li>
            </ul>
          ` : newPlan === 'premium' ? `
            <p>With the Premium plan, you now have access to:</p>
            <ul>
              <li>All features and capabilities</li>
              <li>Premium 24/7 support</li>
              <li>Advanced analytics</li>
              <li>Custom solutions tailored to your needs</li>
            </ul>
          ` : ''}
          
          <p>Thank you for your continued support. If you have any questions about your new plan, please contact our customer service team.</p>
          <p>Best regards,<br>The Customer Churn Prediction Team</p>
        </div>
      `;
      
      text = `
        Plan Updated: Welcome to ${newPlan.charAt(0).toUpperCase() + newPlan.slice(1)}!
        
        Hello there,
        
        Your subscription has been successfully updated to the ${newPlan} plan!
        
        Account Summary:
        - Previous Plan: ${oldPlan}
        - New Plan: ${newPlan}
        - Upgrade Date: ${new Date().toLocaleDateString()}
        
        ${newPlan === 'basic' ? `
        With the Basic plan, you now have access to:
        - Full access to all features
        - Priority customer support
        - Basic analytics tools
        ` : newPlan === 'premium' ? `
        With the Premium plan, you now have access to:
        - All features and capabilities
        - Premium 24/7 support
        - Advanced analytics
        - Custom solutions tailored to your needs
        ` : ''}
        
        Thank you for your continued support. If you have any questions about your new plan, please contact our customer service team.
        
        Best regards,
        The Customer Churn Prediction Team
      `;
    }

    const emailResult = await emailService.send({
      from: FROM_ADDRESS,
      to: [TO_ADDRESS],
      subject,
      html,
      text,
    });

    return NextResponse.json({
      success: true,
      planUpdated: true,
      email: {
        success: emailResult.success,
        messageId: emailResult.id,
      },
    });
  } catch (error) {
    console.error('Plan update error:', error);
    return NextResponse.json(
      { error: 'Failed to update plan' },
      { status: 500 }
    );
  }
} 