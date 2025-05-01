'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { useChurnPredictionUsers, usePredictAllChurn } from '@/lib/hooks/use-query-hooks';
import { toast } from 'sonner';


interface PredictionResult {
  userId: string;
  name: string;
  email: string;
  probability: number;
  willChurn: boolean;
  riskCategory: string;
}


export default function ChurnPredictionPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInputValue, setSearchInputValue] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [hasPredicted, setHasPredicted] = useState(false);
  
  // Track optimistic predictions for visual indicators
  const [optimisticPredictions, setOptimisticPredictions] = useState<Record<string, boolean>>({});
  
  const {
    data,
    isLoading,
    error,
    refetch
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

  // Memoize users and pagination to prevent unnecessary rerenders
  const users = useMemo(() => data?.users || [], [data?.users]);
  const pagination = useMemo(() => data?.pagination || { 
    total: 0, page: 1, limit: 10, totalPages: 1 
  }, [data?.pagination]);
  const predictions = useMemo(() => predictData?.predictions || [], 
    [predictData?.predictions]);

  // Handle success message with stable cleanup function
  useEffect(() => {
    if (!successMessage) return;
    
    const timer = setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [successMessage]);
  
  // Handle prediction status with stable cleanup function
  useEffect(() => {
    if (!isPredicting) return;
    
    const timer = setTimeout(() => {
      setIsPredicting(false);
      
      // Only refetch once after prediction completes
      if (!hasPredicted) {
        // Use a small delay to avoid race conditions
        setTimeout(() => {
          refetch();
          setHasPredicted(true);
        }, 500);
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [isPredicting, hasPredicted, refetch]);

  // Create an optimistic update for prediction
  const createOptimisticPredictions = useCallback(() => {
    if (!data?.users?.length) return [];
    
    // Create optimistic predictions based on current users
    const predictions = data.users.map(user => {
      // Generate a prediction based on simple heuristics
      let probability = 0.5;
      
      // Plan-based adjustment
      if (user.plan === 'free') probability += 0.1;
      if (user.plan === 'premium') probability -= 0.1;
      
      // Activity-based adjustment
      if (user.daysSinceActivity > 20) probability += 0.15;
      if (user.daysSinceActivity < 5) probability -= 0.15;
      
      // Engagement-based adjustment
      if (user.eventsLast30 > 50) probability -= 0.1;
      if (user.eventsLast30 < 10) probability += 0.1;
      
      // Clamp probability
      probability = Math.max(0.1, Math.min(0.9, probability));
      
      // Determine risk category
      let riskCategory = 'Medium Risk';
      if (probability > 0.7) riskCategory = 'High Risk';
      if (probability < 0.4) riskCategory = 'Low Risk';
      
      return {
        userId: user.id,
        name: user.name,
        email: user.email,
        probability,
        willChurn: probability > 0.5,
        riskCategory
      };
    });
    
    // Update optimistic predictions tracking
    const optimistic: Record<string, boolean> = {};
    predictions.forEach(p => {
      optimistic[p.userId] = true;
    });
    setOptimisticPredictions(optimistic);
    
    return predictions;
  }, [data?.users]);

  // Stable callback functions
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInputValue);
    setPage(1);
  }, [searchInputValue]);

  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInputValue(e.target.value);
  }, []);

  const handlePredictAll = useCallback(() => {
    // Prevent multiple predictions
    if (isPredicting || predictLoading) return;
    
    setSuccessMessage(null);
    setIsPredicting(true);
    setHasPredicted(false);
    
    // Generate optimistic predictions that will be shown in the UI
    createOptimisticPredictions();
    
    // Log that we're starting the prediction
    console.log('Starting prediction for all users...');
    
    // Show initial toast
    const toastId = toast.loading('Predicting churn for all users...', {
      duration: Infinity,
    });
    
    // Schedule a follow-up toast after 5 seconds
    setTimeout(() => {
      toast.loading('Prediction in progress, this may take up to a minute...', {
        id: toastId,
        duration: Infinity,
      });
    }, 5000);
    
    // Create a timeout to ensure we update the UI even if the request hangs
    const timeoutId = setTimeout(() => {
      console.log('Prediction request is taking longer than expected...');
      toast.loading('Prediction is taking longer than expected. Processing in the background...', {
        id: toastId,
        duration: Infinity,
      });
      
      setSuccessMessage('Prediction request initiated and processing in the background. The results will be available shortly.');
      setIsPredicting(false);
      setHasPredicted(true);
      
      // Force a refetch after a longer delay
      setTimeout(() => {
        console.log('Forcing refetch to check prediction results...');
        refetch().then(() => {
          toast.success('Predictions have been updated!', {
            id: toastId,
            duration: 3000,
          });
        });
      }, 10000); // Try refetching after 10 seconds
    }, 30000); // Set timeout for 30 seconds
    
    predictAll(undefined, {
      onSuccess: (data) => {
        // Clear the timeout since we got a response
        clearTimeout(timeoutId);
        
        const count = data?.predictions?.length || 0;
        console.log(`Prediction completed for ${count} users`);
        
        // Get risk distribution
        if (data?.predictions?.length) {
          const highRisk = data.predictions.filter((p: any) => p.riskCategory === 'High Risk').length;
          const mediumRisk = data.predictions.filter((p: any) => p.riskCategory === 'Medium Risk').length;
          const lowRisk = data.predictions.filter((p: any) => p.riskCategory === 'Low Risk').length;
          
          const successMsg = `Churn predicted for ${count} users with distribution: 
            ${lowRisk} Low Risk (${Math.round(lowRisk/count*100)}%), 
            ${mediumRisk} Medium Risk (${Math.round(mediumRisk/count*100)}%), 
            ${highRisk} High Risk (${Math.round(highRisk/count*100)}%)`;
          
          setSuccessMessage(successMsg);
          
          // Update toast
          toast.success(successMsg, {
            id: toastId,
            duration: 5000,
          });
        } else {
          const msg = `Churn predicted for ${count} users in the database!`;
          setSuccessMessage(msg);
          toast.success(msg, {
            id: toastId,
            duration: 5000,
          });
        }
      },
      onError: (error) => {
        // Clear the timeout since we got a response
        clearTimeout(timeoutId);
        
        console.error('Prediction failed:', error);
        const errorMsg = `Prediction encountered an error: ${error.message || 'Unknown error'}. A partial prediction may have been completed.`;
        setSuccessMessage(errorMsg);
        
        // Update toast
        toast.error(errorMsg, {
          id: toastId,
          duration: 5000,
        });
      },
      onSettled: () => {
        // This runs on both success and error
        setIsPredicting(false);
        setHasPredicted(true);
        
        // Refetch data to show latest predictions
        setTimeout(() => {
          refetch();
        }, 500);
      }
    });
  }, [isPredicting, predictLoading, predictAll, refetch, createOptimisticPredictions]);

  // Clear optimistic predictions when predictions are complete
  useEffect(() => {
    if (!isPredicting && hasPredicted) {
      // Clear optimistic predictions after a delay
      const timer = setTimeout(() => {
        setOptimisticPredictions({});
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isPredicting, hasPredicted]);

  // Add a function to check if a prediction is optimistic
  const isOptimistic = useCallback((userId: string) => {
    return optimisticPredictions[userId] === true;
  }, [optimisticPredictions]);

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
                onChange={handleSearchInputChange}
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
                    <tr key={user.id} className={`border-b hover:bg-gray-50 ${isOptimistic(user.id) ? 'bg-blue-50' : ''}`}>
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
                            } ${isOptimistic(user.id) ? 'animate-pulse' : ''}`}
                          >
                            {user.churnPrediction.riskCategory}
                            {isOptimistic(user.id) && ' (Estimating...)'}
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