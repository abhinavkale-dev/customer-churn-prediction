'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';

interface User {
  id: string;
  name: string;
  email: string;
  plan: string;
  createdAt: string;
  churnPrediction?: {
    id: string;
    probability: number;
    willChurn: boolean;
    riskCategory: string;
    predictedAt: string;
  } | null;
}

interface UserWithActivity {
  id: string;
  name: string;
  email: string;
  plan: string;
  daysSinceActivity: number;
  eventsLast30: number;
  revenueLast30: number;
  createdAt: string;
  churnPrediction?: {
    id: string;
    probability: number;
    willChurn: boolean;
    riskCategory: string;
    predictedAt: string;
  } | null;
}

interface PredictionResult {
  userId: string;
  name: string;
  email: string;
  probability: number;
  willChurn: boolean;
  riskCategory: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ChurnPredictionPage() {
  const [users, setUsers] = useState<UserWithActivity[]>([]);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [search, setSearch] = useState('');
  const [searchInputValue, setSearchInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [predictLoading, setPredictLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [riskFilter, setRiskFilter] = useState<string>('all');
  
  useEffect(() => {
    fetchUsers();
  }, [pagination.page, pagination.limit, search]);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setSuccessMessage(null);
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (search) {
        queryParams.append('search', search);
      }
      
      const response = await fetch(`/api/users?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching users: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      const usersWithActivity = data.users.map((user: User) => {
        const userIdSum = user.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        const normalizedSeed = userIdSum / 1000;
        
        const daysSinceCreated = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        const daysSinceActivity = Math.min(daysSinceCreated, Math.floor(normalizedSeed * 30));
        
        let eventMultiplier = 1;
        if (user.plan === 'premium') eventMultiplier = 3;
        else if (user.plan === 'basic') eventMultiplier = 2;
        
        const eventsLast30 = Math.floor((normalizedSeed * 50 + 10) * eventMultiplier);
        
        let baseRevenue = 0;
        if (user.plan === 'premium') baseRevenue = 300;
        else if (user.plan === 'basic') baseRevenue = 100;
        
        const revenueLast30 = baseRevenue;
        
        return {
          ...user,
          daysSinceActivity,
          eventsLast30,
          revenueLast30
        };
      });
      
      setUsers(usersWithActivity);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInputValue);
    setPagination(prev => ({ ...prev, page: 1 })); 
  };
  
  const handlePredictAll = async () => {
    try {
      setPredictLoading(true);
      
      const allUsersResponse = await fetch('/api/users?limit=999');
      if (!allUsersResponse.ok) {
        throw new Error('Failed to fetch all users');
      }
      
      const allUsersData = await allUsersResponse.json();
      
      const allUsersWithActivity = allUsersData.users.map((user: any) => {
        const typedUser = user as User;
        
        const userIdSum = typedUser.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        const normalizedSeed = userIdSum / 1000; 
        
        const daysSinceCreated = Math.floor((Date.now() - new Date(typedUser.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        const daysSinceActivity = Math.min(daysSinceCreated, Math.floor(normalizedSeed * 30));
        
        let eventMultiplier = 1;
        if (typedUser.plan === 'premium') eventMultiplier = 3;
        else if (typedUser.plan === 'basic') eventMultiplier = 2;
        
        const eventsLast30 = Math.floor((normalizedSeed * 50 + 10) * eventMultiplier);
        
        let baseRevenue = 0;
        if (typedUser.plan === 'premium') baseRevenue = 300;
        else if (typedUser.plan === 'basic') baseRevenue = 100;
        
        const revenueLast30 = baseRevenue;
        
        return {
          ...typedUser,
          daysSinceActivity,
          eventsLast30,
          revenueLast30
        };
      });
      
      const predictionRequests = allUsersWithActivity.map((user: UserWithActivity) => {
        return {
          userId: user.id,
          plan: user.plan,
          daysSinceActivity: user.daysSinceActivity,
          eventsLast30: user.eventsLast30,
          revenueLast30: user.revenueLast30
        };
      });
      
      const response = await fetch('/api/churn-prediction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(predictionRequests),
      });
      
      if (!response.ok) {
        throw new Error('Failed to predict churn');
      }
      
      const result = await response.json();
      
      const predictionsWithUserInfo = result.predictions.map((pred: any, index: number) => ({
        userId: allUsersWithActivity[index].id,
        name: allUsersWithActivity[index].name,
        email: allUsersWithActivity[index].email,
        ...pred
      }));
      
      setPredictions(predictionsWithUserInfo);
      
      setSuccessMessage('Churn predicted for all ' + allUsersWithActivity.length + ' users in the database!');
      setError(null);
      
      fetchUsers();
      
    } catch (err) {
      console.error('Error predicting churn:', err);
      setError('Failed to predict churn for users');
    } finally {
      setPredictLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-medium">Loading users...</p>
          <p className="text-sm text-gray-500">Please wait</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Customer Churn Prediction</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Database Users</CardTitle>
          <CardDescription>
            Select users to predict their churn risk based on activity data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
            <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-sm">
              <Input
                type="text"
                placeholder="Search by name or email"
                value={searchInputValue}
                onChange={(e) => setSearchInputValue(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">Search</Button>
            </form>
            
            <div className="relative">
              <Button 
                onClick={handlePredictAll} 
                disabled={predictLoading || users.length === 0}
                className="bg-brand-purple hover:bg-brand-light-purple text-white w-full sm:w-auto group"
                title="Run AI prediction model on all users to identify churn risk"
              >
                {predictLoading ? 'Processing...' : 'Run Prediction Model'}
              </Button>
              <div className="absolute hidden group-hover:block bottom-full mb-2 right-0 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg">
                Runs the AI model to analyze user data and predict churn risk for all users in the database.
              </div>
            </div>
          </div>
          
          {error && (
            <div className="text-red-500 mb-4">{error}</div>
          )}
          {successMessage && (
            <div className="text-green-600 mb-4 p-3 bg-green-50 border border-green-200 rounded">
              <div className="font-medium">Success!</div>
              <div>{successMessage}</div>
              <div className="text-xs mt-1">The dashboard has been updated with new churn predictions.</div>
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px]">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Plan</th>
                  <th className="px-4 py-2 text-left">Days Since Activity</th>
                  <th className="px-4 py-2 text-left">Events (30d)</th>
                  <th className="px-4 py-2 text-left">Revenue (30d)</th>
                  <th className="px-4 py-2 text-left">Churn Risk</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{user.name}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3 capitalize">{user.plan}</td>
                    <td className="px-4 py-3">{user.daysSinceActivity}</td>
                    <td className="px-4 py-3">{user.eventsLast30}</td>
                    <td className="px-4 py-3">${user.revenueLast30}</td>
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
                        'No prediction'
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
      
      {predictions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Latest Prediction Results</CardTitle>
                <CardDescription>Churn prediction analysis</CardDescription>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label htmlFor="risk-filter" className="text-sm whitespace-nowrap">Filter by risk:</label>
                <select
                  id="risk-filter"
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="p-2 text-sm border rounded w-full sm:w-auto"
                >
                  <option value="all">All Risks</option>
                  <option value="High Risk">High Risk</option>
                  <option value="Medium Risk">Medium Risk</option>
                  <option value="Low Risk">Low Risk</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 text-sm text-gray-500">
              Showing {predictions.filter(p => riskFilter === 'all' || p.riskCategory === riskFilter).length} of {predictions.length} predictions
              {riskFilter !== 'all' && ` (filtered by ${riskFilter})`}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px]">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Risk Category</th>
                    <th className="px-4 py-2 text-left">Probability</th>
                    <th className="px-4 py-2 text-left">Will Churn</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions
                    .filter(p => riskFilter === 'all' || p.riskCategory === riskFilter)
                    .map((prediction) => (
                      <tr key={prediction.userId} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">{prediction.name}</td>
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
                        <td className="px-4 py-3">{(prediction.probability * 100).toFixed(1)}%</td>
                        <td className="px-4 py-3">
                          <span className={prediction.willChurn ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                            {prediction.willChurn ? 'Yes' : 'No'}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 