import { NextResponse } from 'next/server';
import { SESClient, SendEmailCommand, SendRawEmailCommand } from '@aws-sdk/client-ses';
import { createWorkbook, generateCSVData, generateExcelWorkbook } from '@/lib/report-generators';

const sesClient = new SESClient({
  region: process.env.AWS_REGION || '',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { email, format, data: userData } = data;
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }
    
    if (!format || !['csv', 'excel'].includes(format)) {
      return NextResponse.json(
        { error: 'Valid format (csv or excel) is required' },
        { status: 400 }
      );
    }

    const reportData = userData && userData.length > 0 
      ? userData 
      : [
          { id: '1', name: 'User 1', email: 'user1@example.com', plan: 'premium', riskCategory: 'Low Risk', probability: 0.1 },
          { id: '2', name: 'User 2', email: 'user2@example.com', plan: 'basic', riskCategory: 'Medium Risk', probability: 0.45 },
          { id: '3', name: 'User 3', email: 'user3@example.com', plan: 'free', riskCategory: 'High Risk', probability: 0.85 }
        ];
    
    const formattedReportData = reportData.map((user: Record<string, any>) => {
      const churnPrediction = user.churnPrediction || {};
      
      const createdAt = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';
      const predictedAt = churnPrediction.predictedAt ? new Date(churnPrediction.predictedAt).toLocaleDateString() : 'N/A';
      
      const churnProbability = churnPrediction.probability 
        ? `${(churnPrediction.probability * 100).toFixed(1)}%` 
        : 'N/A';
        
      return {
        'User ID': user.id,
        'Name': user.name,
        'Email': user.email,
        'Plan': user.plan ? user.plan.charAt(0).toUpperCase() + user.plan.slice(1) : 'N/A',
        'Created Date': createdAt,
        'Churn Risk Category': churnPrediction.riskCategory || 'No Prediction',
        'Churn Probability': churnProbability,
        'Prediction Date': predictedAt
      };
    });
    
    let attachmentContent = '';
    let attachmentType = '';
    let filename = '';
    
    if (format === 'csv') {
      attachmentContent = generateCSVData(formattedReportData);
      attachmentType = 'text/csv';
      filename = 'churn-report.csv';
    } else {
      attachmentContent = generateExcelWorkbook(formattedReportData);
      attachmentType = 'application/vnd.ms-excel';
      filename = 'churn-report.xls';
    }
    
    const encodedAttachment = Buffer.from(attachmentContent).toString('base64');
    
    try {
      const fromAddress = 'Churn Analysis Platform <no-reply@abhinavkale.tech>';
      const subject = `Your Churn Analysis Report (${format.toUpperCase()})`;
      
      const boundary = "----MessageBoundary_" + Math.random().toString().substr(2);
      
      const header = 
        `From: ${fromAddress}\r\n` +
        `To: ${email}\r\n` +
        `Subject: ${subject}\r\n` +
        `MIME-Version: 1.0\r\n` +
        `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;
      
      const htmlPart = 
        `--${boundary}\r\n` +
        `Content-Type: text/html; charset=utf-8\r\n\r\n` +
        `<html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              h1 { color: #6d28d9; margin-bottom: 20px; font-size: 24px; }
              p { margin-bottom: 16px; }
              strong { color: #6d28d9; font-weight: bold; }
              .footer { margin-top: 30px; font-style: italic; color: #666; border-top: 1px solid #eee; padding-top: 15px; }
            </style>
          </head>
          <body>
            <h1>Churn Analysis Report</h1>
            <p>Thank you for using our <strong>Churn Analysis platform</strong>.</p>
            <p>Your requested report is attached in <strong>${format.toUpperCase()}</strong> format.</p>
            <p>This report includes customer information, risk categories, and churn probabilities to help you identify at-risk customers.</p>
            <p>For more detailed analysis and personalized retention strategies, please visit the dashboard.</p>
            <div class="footer">
              <p>— The Churn Analysis Team</p>
            </div>
          </body>
        </html>\r\n\r\n`;
      
      const attachmentPart = 
        `--${boundary}\r\n` +
        `Content-Type: ${attachmentType}; name="${filename}"\r\n` +
        `Content-Disposition: attachment; filename="${filename}"\r\n` +
        `Content-Transfer-Encoding: base64\r\n\r\n` +
        `${encodedAttachment}\r\n\r\n` +
        `--${boundary}--`;
      
      const message = header + htmlPart + attachmentPart;
      
      const command = new SendRawEmailCommand({
        RawMessage: { Data: Buffer.from(message) },
      });
      
      await sesClient.send(command);
      
      console.log(`Report sent to ${email} successfully`);
      
      return NextResponse.json({
        success: true,
        message: `Report has been sent to ${email}`,
        details: {
          email,
          format,
          requestedAt: new Date().toISOString(),
        }
      });
    } catch (sesError) {
      console.error('Error sending email with SES:', sesError);
      return NextResponse.json(
        { error: 'Failed to send email. Please try again later.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing email report request:', error);
    return NextResponse.json(
      { error: 'Failed to process report request' },
      { status: 500 }
    );
  }
} 