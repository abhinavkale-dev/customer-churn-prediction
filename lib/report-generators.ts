
type DataRow = Record<string, any>;


export function generateCSVData(data: DataRow[]): string {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0]);
  
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      return typeof val === 'string' && val.includes(',') 
        ? `"${val}"` 
        : val !== undefined && val !== null ? String(val) : '';
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}


export function createWorkbook(data: DataRow[]): string {
  return generateCSVData(data);
}


export function generateExcelWorkbook(data: DataRow[]): string {
  return createWorkbook(data);
} 