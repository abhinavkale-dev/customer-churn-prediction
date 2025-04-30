import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    
    // Get all users with their churn predictions
    const users = await prisma.user.findMany({
      include: {
        churnPrediction: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Transform data for export
    const exportData = users.map(user => {
      const riskCategory = user.churnPrediction?.riskCategory || 'No prediction';
      const probability = user.churnPrediction?.probability || 0;
      
      return {
        Name: user.name,
        Email: user.email,
        Plan: user.plan,
        CreatedAt: new Date(user.createdAt).toLocaleDateString(),
        ChurnRisk: riskCategory,
        ChurnProbability: probability ? `${(probability * 100).toFixed(1)}%` : 'N/A'
      };
    });
    
    // Convert to CSV
    let csvContent = '';
    
    // Add headers
    if (exportData.length > 0) {
      const headers = Object.keys(exportData[0]);
      csvContent += headers.join(',') + '\n';
      
      // Add data rows
      exportData.forEach(item => {
        const row = headers.map(header => {
          const value = item[header as keyof typeof item];
          // Handle values with commas by wrapping in quotes
          return typeof value === 'string' && value.includes(',') 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        });
        csvContent += row.join(',') + '\n';
      });
    }
    
    // Set appropriate headers based on format
    const mimeType = format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv';
    const filename = format === 'excel' ? 'churn-dashboard-data.xls' : 'churn-dashboard-data.csv';
    
    return new Response(csvContent, {
      headers: {
        'Content-Type': `${mimeType};charset=utf-8`,
        'Content-Disposition': `attachment; filename=${filename}`
      }
    });
    
  } catch (error) {
    console.error('Error downloading data:', error);
    return NextResponse.json(
      { error: 'Failed to download data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 