/**
 * Utility functions for generating CSV and Excel reports
 */

type DataRow = Record<string, any>;

/**
 * Generate CSV data from an array of objects
 */
export function generateCSVData(data: DataRow[]): string {
  if (!data.length) return '';
  
  // Get headers from the first row
  const headers = Object.keys(data[0]);
  
  // Create header row
  const csvRows = [headers.join(',')];
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      // Handle values with commas by wrapping in quotes
      return typeof val === 'string' && val.includes(',') 
        ? `"${val}"` 
        : val !== undefined && val !== null ? String(val) : '';
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

/**
 * Create a simple Excel-compatible workbook
 * 
 * Note: For a full Excel file, you would typically use a library like exceljs,
 * but for this example we're keeping it simple.
 */
export function createWorkbook(data: DataRow[]): string {
  // For this simplified version, we'll just return CSV data
  // with Excel-compatible formatting
  return generateCSVData(data);
}

/**
 * Generate Excel workbook
 * This is a simplified version that returns CSV data with Excel mime type
 */
export function generateExcelWorkbook(data: DataRow[]): string {
  return createWorkbook(data);
} 