'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface ChurnPrediction {
  id: string;
  userId: string;
  name?: string;
  email: string;
  probability: number;
  riskCategory: string;
  predictedAt: string;
}

interface ChurnSummary {
  totalCustomers: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  recentPredictions: ChurnPrediction[];
}

interface User {
  id: string;
  name: string;
  email: string;
  plan: string;
  createdAt: string;
  updatedAt: string;
  churnPrediction?: {
    id: string;
    probability: number;
    willChurn: boolean;
    riskCategory: string;
    predictedAt: string;
  } | null;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<ChurnSummary>({
    totalCustomers: 0,
    highRiskCount: 0,
    mediumRiskCount: 0,
    lowRiskCount: 0,
    recentPredictions: [],
  });
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [search, setSearch] = useState('');
  const [searchInputValue, setSearchInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [isFilterApplied, setIsFilterApplied] = useState(false);

  const [importLoading, setImportLoading] = useState(false);

  useEffect(() => {
    async function fetchChurnData() {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard-data');
        
        if (!response.ok) {
          throw new Error(`Error fetching churn data: ${response.statusText}`);
        }
        
        const data = await response.json();
        setSummary(data);
        setError(null);
      } catch (err) {
        console.error('Error loading churn data:', err);
        setError('Failed to load churn data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchChurnData();
  }, []);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const queryParams = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
        });
        
        if (search) {
          queryParams.append('search', search);
        }
        
        // Add filters to query params
        if (planFilter && planFilter !== 'all') {
          queryParams.append('plan', planFilter);
        }
        
        if (riskFilter && riskFilter !== 'all') {
          queryParams.append('riskCategory', riskFilter);
        }
        
        if (dateFilter && dateFilter !== 'all') {
          queryParams.append('datePeriod', dateFilter);
        }
        
        const response = await fetch(`/api/users?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching users: ${response.statusText}`);
        }
        
        const data = await response.json();
        setUsers(data.users);
        setPagination(data.pagination);
      } catch (err) {
        console.error('Error loading users:', err);
      }
    }

    fetchUsers();
  }, [pagination.page, pagination.limit, search, planFilter, riskFilter, dateFilter]);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInputValue);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on new search
  };

  // Function to handle download 
  const handleDownload = (format: 'csv' | 'excel') => {
    // Use the API endpoint instead of client-side generation
    const downloadUrl = `/api/download-data?format=${format}`;
    
    // Create a download link and trigger click
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', format === 'csv' ? 'churn-dashboard-data.csv' : 'churn-dashboard-data.xls');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFilterApply = () => {
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on new filter
    setIsFilterApplied(true);
  };

  const handleFilterReset = () => {
    setPlanFilter('all');
    setRiskFilter('all');
    setDateFilter('all');
    setPagination(prev => ({ ...prev, page: 1 }));
    setIsFilterApplied(false);
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const fileType = e.target.id === 'csv-file-input' ? 'csv' : 'excel';
    
    try {
      setImportLoading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', fileType);
      
      const response = await fetch('/api/import-data', {
      method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to import file');
      }
      
      const result = await response.json();
      alert(`Successfully imported ${result.importedCount} records from ${file.name}`);
      
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error('Error importing file:', error);
      alert(`Error importing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setImportLoading(false);
      // Reset the file input
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-medium">Loading churn data...</p>
          <p className="text-sm text-gray-500">This may take a moment for large datasets</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-medium text-red-600">Error</p>
          <p className="text-sm text-gray-500">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-brand-purple text-white rounded hover:bg-brand-light-purple"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
        <div className="flex gap-2">
          {/* Import Button & Dropdown */}
          <div className="relative inline-block text-left">
            <div>
              <Button 
                variant="outline" 
                id="import-menu-button"
                aria-expanded="true"
                aria-haspopup="true"
                onClick={() => document.getElementById('import-menu')?.classList.toggle('hidden')}
              >
                Import
                <svg className="ml-2 -mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Button>
            </div>
            
            <div 
              id="import-menu" 
              className="hidden origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-10" 
              role="menu" 
              aria-orientation="vertical" 
              aria-labelledby="import-menu-button" 
              tabIndex={-1}
            >
              <div className="py-1" role="none">
                <button
                  className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                  role="menuitem"
                  tabIndex={-1}
                  onClick={() => document.getElementById('csv-file-input')?.click()}
                >
                  Import CSV
              </button>
              <button 
                  className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                  role="menuitem"
                  tabIndex={-1}
                  onClick={() => document.getElementById('excel-file-input')?.click()}
                >
                  Import Excel
                </button>
                <div className="border-t border-gray-100 pt-1 mt-1">
                  <a
                    href="/templates/import-template.csv"
                    download
                    className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                    role="menuitem"
                    tabIndex={-1}
                  >
                    Download CSV Template
                  </a>
                  <a
                    href="/api/import-data?format=excel"
                    download
                    className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                    role="menuitem"
                    tabIndex={-1}
                  >
                    Download Excel Template
                  </a>
                </div>
              </div>
            </div>
            
            {/* Hidden file inputs */}
            <input 
              type="file" 
              id="csv-file-input"
              accept=".csv" 
              className="hidden"
              onChange={handleFileImport}
            />
            <input 
              type="file" 
              id="excel-file-input" 
              accept=".xlsx,.xls" 
              className="hidden"
              onChange={handleFileImport}
            />
          </div>
          
          {/* Download Button & Dropdown */}
          <div className="relative inline-block text-left">
            <div>
              <Button 
                variant="outline" 
                id="download-menu-button"
                aria-expanded="true"
                aria-haspopup="true"
                onClick={() => document.getElementById('download-menu')?.classList.toggle('hidden')}
              >
                Download
                <svg className="ml-2 -mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Button>
            </div>
            
            <div 
              id="download-menu" 
              className="hidden origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-10" 
              role="menu" 
              aria-orientation="vertical" 
              aria-labelledby="download-menu-button" 
              tabIndex={-1}
            >
              <div className="py-1" role="none">
                <button
                  className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                  role="menuitem"
                  tabIndex={-1}
                  onClick={() => handleDownload('csv')}
                >
                  Download as CSV
                </button>
                <button
                  className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                  role="menuitem"
                  tabIndex={-1}
                  onClick={() => handleDownload('excel')}
                >
                  Download as Excel
              </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-red-700">High Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-red-700">{summary.highRiskCount}</span>
              <span className="ml-2 text-sm text-red-600">customers</span>
            </div>
            <div className="mt-1 text-sm text-red-600">
              {summary.totalCustomers > 0 ? Math.round((summary.highRiskCount / summary.totalCustomers) * 100) : 0}% of customer base
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-yellow-700">Medium Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-yellow-700">{summary.mediumRiskCount}</span>
              <span className="ml-2 text-sm text-yellow-600">customers</span>
            </div>
            <div className="mt-1 text-sm text-yellow-600">
              {summary.totalCustomers > 0 ? Math.round((summary.mediumRiskCount / summary.totalCustomers) * 100) : 0}% of customer base
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-green-700">Low Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-green-700">{summary.lowRiskCount}</span>
              <span className="ml-2 text-sm text-green-600">customers</span>
            </div>
            <div className="mt-1 text-sm text-green-600">
              {summary.totalCustomers > 0 ? Math.round((summary.lowRiskCount / summary.totalCustomers) * 100) : 0}% of customer base
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Recent Predictions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Risk Category</th>
                  <th className="px-4 py-2 text-left">Probability</th>
                  <th className="px-4 py-2 text-left">Predicted At</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentPredictions.map((prediction) => (
                  <tr key={prediction.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{prediction.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          prediction.riskCategory === 'High Risk'
                            ? 'bg-red-100 text-red-800'
                            : prediction.riskCategory === 'Medium Risk'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {prediction.riskCategory}
                      </span>
                    </td>
                    <td className="px-4 py-3">{((prediction.probability || 0) * 100).toFixed(1)}%</td>
                    <td className="px-4 py-3">{prediction.predictedAt ? new Date(prediction.predictedAt).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 text-center">
            <Link href="/dashboard/churn-prediction">
              <Button className="bg-brand-purple hover:bg-brand-light-purple text-white">
                Make New Prediction
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 mb-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                type="text"
                placeholder="Search by name or email"
                value={searchInputValue}
                onChange={(e) => setSearchInputValue(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">Search</Button>
            </form>
            
            <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-md">
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-medium">Plan</label>
                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Plans" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-medium">Churn Risk</label>
                <Select value={riskFilter} onValueChange={setRiskFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Risks" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risks</SelectItem>
                    <SelectItem value="High Risk">High Risk</SelectItem>
                    <SelectItem value="Medium Risk">Medium Risk</SelectItem>
                    <SelectItem value="Low Risk">Low Risk</SelectItem>
                    <SelectItem value="no_prediction">No Prediction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-medium">Created At</label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                    <SelectItem value="3months">Last 3 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end gap-2 ml-auto">
                <Button 
                  variant="outline" 
                  onClick={handleFilterReset}
                  disabled={!isFilterApplied}
                >
                  Reset
                </Button>
                <Button 
                  onClick={handleFilterApply}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Plan</th>
                  <th className="px-4 py-2 text-left">Created At</th>
                  <th className="px-4 py-2 text-left">Churn Risk</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className={`border-b hover:bg-gray-50 ${!user.churnPrediction ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">{user.name}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3 capitalize">{user.plan}</td>
                    <td className="px-4 py-3">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {user.churnPrediction ? (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.churnPrediction.riskCategory === 'High Risk'
                              ? 'bg-red-100 text-red-800'
                              : user.churnPrediction.riskCategory === 'Medium Risk'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {user.churnPrediction.riskCategory}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">No prediction</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </CardContent>
      </Card>

      {importLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-purple mx-auto mb-4"></div>
            <p className="text-lg font-medium">Importing data...</p>
            <p className="text-sm text-gray-500">This may take a moment for large files</p>
          </div>
        </div>
      )}
    </div>
  );
}
