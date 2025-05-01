'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { useChurnPredictionUsers, usePredictAllChurn } from '@/lib/hooks/use-query-hooks';

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
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInputValue, setSearchInputValue] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);

  const {
    data,
    isLoading,
    error
  } = useChurnPredictionUsers({
    page,
    limit,
    search
  });

  const {
    mutate: predictAll,
    isPending: predictLoading,
    error: predictError,
    data: predictData
  } = usePredictAllChurn();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isPredicting) {
      timer = setTimeout(() => {
        setIsPredicting(false);
      }, 3000);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isPredicting]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInputValue);
    setPage(1);
  };

  const handlePredictAll = () => {
    setSuccessMessage(null);
    setIsPredicting(true);
    
    predictAll(undefined, {
      onSuccess: (data) => {
        setSuccessMessage(`Churn predicted for all ${data.count} users in the database!`);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-medium">Loading users...</p>
          <p className="text-sm text-gray-500">Please wait</p>
        </div>
      </div>
    );
  }

  const users = data?.users || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 };
  const predictions = predictData?.predictions || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Customer Churn Prediction</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Predict Churn Probability</CardTitle>
          <CardDescription>
            Analyze your customer base to predict which customers are at risk of churning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <Button 
              onClick={handlePredictAll}
              disabled={isPredicting || predictLoading}
              className="bg-brand-purple hover:bg-brand-light-purple"
            >
              {isPredicting || predictLoading ? 'Predicting...' : 'Predict Churn for All Users'}
            </Button>
            
            <form onSubmit={handleSearch} className="flex flex-1 space-x-2">
              <Input
                type="text"
                placeholder="Search users..."
                value={searchInputValue}
                onChange={(e) => setSearchInputValue(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" variant="outline">Search</Button>
            </form>
          </div>
          
          {(predictError || error) && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
              <p className="font-medium">Error</p>
              <p className="text-sm">{(predictError || error) instanceof Error ? (predictError || error)?.message : 'An error occurred'}</p>
            </div>
          )}
          
          {successMessage && (
            <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-md">
              <p className="font-medium">Success</p>
              <p className="text-sm">{successMessage}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {users.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Database Users</CardTitle>
            <CardDescription>
              Select users to predict their churn risk based on activity data
            </CardDescription>
          </CardHeader>
          <CardContent>
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
              <div className="mt-6 flex justify-center">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {predictions.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Prediction Results</CardTitle>
            <CardDescription>
              Most recent churn prediction results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px]">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Probability</th>
                    <th className="px-4 py-2 text-left">Risk Category</th>
                    <th className="px-4 py-2 text-left">Prediction</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((prediction: PredictionResult) => (
                    <tr key={prediction.userId} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{prediction.name}</td>
                      <td className="px-4 py-3">{prediction.email}</td>
                      <td className="px-4 py-3">{(prediction.probability * 100).toFixed(2)}%</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap inline-block ${
                            prediction.riskCategory === 'high'
                              ? 'bg-red-100 text-red-800'
                              : prediction.riskCategory === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {prediction.riskCategory.charAt(0).toUpperCase() + prediction.riskCategory.slice(1)} Risk
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {prediction.willChurn ? (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium whitespace-nowrap inline-block">
                            Will Churn
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium whitespace-nowrap inline-block">
                            Will Stay
                          </span>
                        )}
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