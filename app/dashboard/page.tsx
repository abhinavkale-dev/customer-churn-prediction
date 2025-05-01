'use client';

import { useState } from 'react';
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
import { useDashboardData, useUsers } from '@/lib/hooks/use-query-hooks';
import { toast } from 'sonner';


export default function DashboardPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInputValue, setSearchInputValue] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [isFilterApplied, setIsFilterApplied] = useState(false);

  const { 
    data: dashboardData, 
    isLoading: isDashboardLoading, 
    error: dashboardError 
  } = useDashboardData();

  const { 
    data: usersData, 
    isLoading: isUsersLoading,
    error: usersError
  } = useUsers({
    page,
    limit,
    search,
    plan: planFilter,
    riskCategory: riskFilter,
    datePeriod: dateFilter
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInputValue);
    setPage(1);
  };

  const handleDownload = (format: 'csv' | 'excel') => {
    const downloadUrl = `/api/download-data?format=${format}`;
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', format === 'csv' ? 'churn-dashboard-data.csv' : 'churn-dashboard-data.xls');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFilterApply = () => {
    setPage(1);
    setIsFilterApplied(true);
  };

  const handleFilterReset = () => {
    setPlanFilter('all');
    setRiskFilter('all');
    setDateFilter('all');
    setPage(1);
    setIsFilterApplied(false);
  };

  const sendReportToEmail = async (format: 'csv' | 'excel') => {
    try {
      const email = 'abhinavkale19026166@gmail.com';
      
      const toastId = toast.loading(`Generating ${format.toUpperCase()} report...`, {
        description: <span className="font-medium text-black">This may take a moment if you have a large number of users.</span>
      });
      
      let allUsers = [];
      
      try {
        const queryParams = new URLSearchParams();
        if (search) queryParams.append('search', search);
        if (planFilter !== 'all') queryParams.append('plan', planFilter);
        if (riskFilter !== 'all') queryParams.append('riskCategory', riskFilter);
        if (dateFilter !== 'all') queryParams.append('datePeriod', dateFilter);
        queryParams.append('limit', '1000');
        
        const response = await fetch(`/api/users?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch all users for report');
        }
        
        const data = await response.json();
        allUsers = data.users;
      } catch (error) {
        console.error('Error fetching all users for report:', error);
        allUsers = usersData?.users || [];
      }
      const response = await fetch('/api/email-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          format,
          data: allUsers,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send report');
      }
      
      const result = await response.json();
      
      toast.dismiss(toastId);
      toast.success(result.message || 'Your report has been sent successfully', {
        description: <span className="font-medium text-black">The {format.toUpperCase()} report was sent to {email}</span>
      });
    } catch (error) {
      console.error('Error sending report:', error);
      
      toast.dismiss();
      toast.error(`Error sending report`, {
        description: <span className="font-medium text-black">{error instanceof Error ? error.message : 'Unknown error'}</span>
      });
    }
  };

  const isLoading = isDashboardLoading || isUsersLoading;
  const error = dashboardError || usersError;

  if (isLoading) {
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
          <p className="text-sm text-gray-500">{error instanceof Error ? error.message : 'An error occurred'}</p>
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

  const summary = dashboardData || {
    totalCustomers: 0,
    highRiskCount: 0,
    mediumRiskCount: 0,
    lowRiskCount: 0,
    recentPredictions: [],
  };
  
  const users = usersData?.users || [];
  const pagination = usersData?.pagination || {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Dashboard</h1>
        
        <div className="flex gap-2">
          {/* Reports Dropdown Button */}
          <div className="relative inline-block text-left">
            <div>
              <Button 
                variant="outline" 
                id="reports-menu-button"
                aria-expanded="true"
                aria-haspopup="true"
                onClick={() => document.getElementById('reports-menu')?.classList.toggle('hidden')}
              >
                Get Report
                <svg className="ml-2 -mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Button>
            </div>
            
            <div 
              id="reports-menu" 
              className="hidden origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-10" 
              role="menu" 
              aria-orientation="vertical" 
              aria-labelledby="reports-menu-button" 
              tabIndex={-1}
            >
              <div className="py-1" role="none">
                <button
                  className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                  role="menuitem"
                  tabIndex={-1}
                  onClick={() => sendReportToEmail('csv')}
                >
                  Get CSV Report
                </button>
                <button
                  className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                  role="menuitem"
                  tabIndex={-1}
                  onClick={() => sendReportToEmail('excel')}
                >
                  Get Excel Report
                </button>
              </div>
            </div>
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
                        className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap inline-block ${
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
                  <th className="px-4 py-2 text-left">Actions</th>
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
                          className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap inline-block ${
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
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/users/${user.id}`}>
                        <Button variant="outline" size="sm" className="text-xs h-8">
                          View Details
                        </Button>
                      </Link>
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
    </div>
  );
}
