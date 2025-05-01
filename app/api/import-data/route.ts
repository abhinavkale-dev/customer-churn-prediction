import { NextResponse } from 'next/server';
import { parse } from 'csv-parse';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('fileType') as string;
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), {
        status: 400,
        headers: {
          'content-type': 'application/json',
        },
      });
    }
    
    const buffer = await file.arrayBuffer();
    
    let records: any[] = [];
    
    if (fileType === 'csv') {
      const content = new TextDecoder().decode(buffer);
      records = await parseCSV(content);
    } else if (fileType === 'excel') {
      records = parseExcel(buffer);
    } else {
      return new Response(JSON.stringify({ error: 'Unsupported file type' }), {
        status: 400,
        headers: {
          'content-type': 'application/json',
        },
      });
    }
    
    const validRecords = await validateAndTransformRecords(records);
    
    const importedCount = await importRecordsToDatabase(validRecords);
    
    return new Response(JSON.stringify({
      success: true,
      importedCount
    }), {
      headers: {
        'content-type': 'application/json',
      },
    });
    
  } catch (error) {
    console.error('Error importing data:', error);
    return new Response(JSON.stringify({ error: 'Failed to import data', details: (error as Error).message }), {
      status: 500,
      headers: {
        'content-type': 'application/json',
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function parseCSV(content: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }, (err, records) => {
      if (err) return reject(err);
      resolve(records);
    });
  });
}

function parseExcel(buffer: ArrayBuffer): any[] {
  const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json(worksheet);
}

async function validateAndTransformRecords(records: any[]): Promise<any[]> {
  const validRecords = [];
  
  for (const record of records) {
    const userRecord: any = {
      id: crypto.randomUUID(),
      name: record.name || record.Name || record.fullName || record.full_name || '',
      email: record.email || record.Email || '',
      plan: normalizePlan(record.plan || record.Plan || 'free'),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    if (!userRecord.email) continue;
    
    const existingUser = await prisma.user.findFirst({
      where: { email: userRecord.email }
    });
    
    if (existingUser) continue;
    
    validRecords.push(userRecord);
  }
  
  return validRecords;
}

function normalizePlan(plan: string): 'free' | 'basic' | 'premium' {
  const planLower = plan.toLowerCase();
  
  if (planLower.includes('premium') || planLower.includes('pro')) {
    return 'premium';
  } else if (planLower.includes('basic') || planLower.includes('standard')) {
    return 'basic';
  } else {
    return 'free';
  }
}

async function importRecordsToDatabase(records: any[]): Promise<number> {
  if (records.length === 0) return 0;
  
  const BATCH_SIZE = 100;
  let importedCount = 0;
  
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    await prisma.user.createMany({
      data: batch,
      skipDuplicates: true
    });
    importedCount += batch.length;
  }
  
  return importedCount;
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const format = searchParams.get('format') || 'csv';
  
  if (format === 'csv') {
    return Response.redirect(new URL('/templates/import-template.csv', request.url).toString());
  }
  
  try {
    const templateData = [
      { name: 'John Doe', email: 'john.doe@example.com', plan: 'basic' },
      { name: 'Jane Smith', email: 'jane.smith@company.com', plan: 'premium' },
      { name: 'Alex Johnson', email: 'alex@startup.io', plan: 'free' }
    ];
    
    const workbook = XLSX.utils.book_new();
    
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
    
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    return new Response(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="import-template.xlsx"'
      }
    });
    
  } catch (error) {
    console.error('Error generating Excel template:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate template' }), {
      status: 500,
      headers: {
        'content-type': 'application/json',
      },
    });
  }
} 