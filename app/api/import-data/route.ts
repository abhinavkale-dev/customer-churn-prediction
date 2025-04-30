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
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }
    
    // Read the file content as buffer
    const buffer = await file.arrayBuffer();
    
    // Process file based on type
    let records: any[] = [];
    
    if (fileType === 'csv') {
      // Parse CSV file
      const content = new TextDecoder().decode(buffer);
      records = await parseCSV(content);
    } else if (fileType === 'excel') {
      // Parse Excel file
      records = parseExcel(buffer);
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type' },
        { status: 400 }
      );
    }
    
    // Validate and transform records
    const validRecords = await validateAndTransformRecords(records);
    
    // Insert valid records into the database
    const importedCount = await importRecordsToDatabase(validRecords);
    
    return NextResponse.json({
      success: true,
      importedCount
    });
    
  } catch (error) {
    console.error('Error importing data:', error);
    return NextResponse.json(
      { error: 'Failed to import data', details: (error as Error).message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Parse CSV content into an array of records
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

// Parse Excel file into an array of records
function parseExcel(buffer: ArrayBuffer): any[] {
  const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json(worksheet);
}

// Validate and transform records for database insertion
async function validateAndTransformRecords(records: any[]): Promise<any[]> {
  const validRecords = [];
  
  for (const record of records) {
    // Create a valid user record
    const userRecord: any = {
      // Generate UUID for new users
      id: crypto.randomUUID(),
      name: record.name || record.Name || record.fullName || record.full_name || '',
      email: record.email || record.Email || '',
      // Normalize plan values
      plan: normalizePlan(record.plan || record.Plan || 'free'),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Skip if no email provided
    if (!userRecord.email) continue;
    
    // Check if user with this email already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: userRecord.email }
    });
    
    // Skip if user already exists
    if (existingUser) continue;
    
    // Add to valid records
    validRecords.push(userRecord);
  }
  
  return validRecords;
}

// Normalize plan value to match our enum
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

// Import records to database
async function importRecordsToDatabase(records: any[]): Promise<number> {
  if (records.length === 0) return 0;
  
  // Insert users in batches
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

// Add a GET endpoint to download a template in Excel format
export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const format = searchParams.get('format') || 'csv';
  
  // If user is requesting a CSV template, redirect to the static file
  if (format === 'csv') {
    return NextResponse.redirect(new URL('/templates/import-template.csv', request.url).toString());
  }
  
  // For Excel template, generate it dynamically
  try {
    // Sample data for the template
    const templateData = [
      { name: 'John Doe', email: 'john.doe@example.com', plan: 'basic' },
      { name: 'Jane Smith', email: 'jane.smith@company.com', plan: 'premium' },
      { name: 'Alex Johnson', email: 'alex@startup.io', plan: 'free' }
    ];
    
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Convert JSON data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
    
    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Return the Excel file with correct headers
    return new Response(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="import-template.xlsx"'
      }
    });
    
  } catch (error) {
    console.error('Error generating Excel template:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
} 