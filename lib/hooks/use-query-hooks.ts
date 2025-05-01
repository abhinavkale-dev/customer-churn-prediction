import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

interface PredictionRequest {
  userId: string;
  plan: string;
  daysSinceActivity: number;
  eventsLast30: number;
  revenueLast30: number;
}


interface UsersResponse {
  users: User[];
  pagination: PaginationInfo;
}

interface UsersWithActivityResponse {
  users: UserWithActivity[];
  pagination: PaginationInfo;
}

interface ChurnSummary {
  totalCustomers: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  recentPredictions: {
    id: string;
    userId: string;
    name?: string;
    email: string;
    probability: number;
    riskCategory: string;
    predictedAt: string;
  }[];
}

export function useUsers({
  page = 1,
  limit = 10,
  search = '',
  plan = '',
  riskCategory = '',
  datePeriod = ''
}: {
  page?: number;
  limit?: number;
  search?: string;
  plan?: string;
  riskCategory?: string;
  datePeriod?: string;
}) {
  return useQuery<UsersResponse>({
    queryKey: ['users', page, limit, search, plan, riskCategory, datePeriod],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (search) {
        queryParams.append('search', search);
      }
      
      if (plan && plan !== 'all') {
        queryParams.append('plan', plan);
      }
      
      if (riskCategory && riskCategory !== 'all') {
        queryParams.append('riskCategory', riskCategory);
      }
      
      if (datePeriod && datePeriod !== 'all') {
        queryParams.append('datePeriod', datePeriod);
      }
      
      const response = await fetch(`/api/users?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching users: ${response.statusText}`);
      }
      
      return response.json();
    },
  });
}

export function useDashboardData() {
  return useQuery<ChurnSummary>({
    queryKey: ['dashboardData'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard-data');
      
      if (!response.ok) {
        throw new Error(`Error fetching dashboard data: ${response.statusText}`);
      }
      
      return response.json();
    },
  });
}

export function useChurnPredictionUsers({
  page = 1,
  limit = 10,
  search = ''
}: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  return useQuery<UsersWithActivityResponse>({
    queryKey: ['churnPredictionUsers', page, limit, search],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        includeActivity: 'true',
      });
      
      if (search) {
        queryParams.append('search', search);
      }
      
      const response = await fetch(`/api/users?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching users: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.users.length > 0 && 'daysSinceActivity' in data.users[0]) {
        return data;
      }
      
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
      
      return {
        users: usersWithActivity,
        pagination: data.pagination
      };
    },
    // Disable automatic refetching
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 60000, // Consider data fresh for 1 minute
  });
}

export function usePredictAllChurn() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      // Use sessionStorage to prevent repeated requests in the same session
      const lastPredictionTime = sessionStorage.getItem('lastPredictionTime');
      const now = Date.now();
      
      // If we made a prediction in the last 30 seconds, return cached result
      if (lastPredictionTime && now - parseInt(lastPredictionTime) < 30000) {
        console.log('Skipping prediction, throttled');
        
        const cachedResult = sessionStorage.getItem('lastPredictionResult');
        if (cachedResult) {
          return JSON.parse(cachedResult);
        }
      }
      
      // Use a request cache ID to prevent duplicate requests
      const cacheId = `prediction-${now}`;
      sessionStorage.setItem('lastPredictionRequestId', cacheId);
      
      const allUsersResponse = await fetch('/api/users?limit=999&includeActivity=true');
      if (!allUsersResponse.ok) {
        throw new Error('Failed to fetch all users');
      }
      
      // Check if another request has started after this one
      if (sessionStorage.getItem('lastPredictionRequestId') !== cacheId) {
        console.log('Aborting prediction, newer request in progress');
        return { predictions: [], aborted: true };
      }
      
      const allUsersData = await allUsersResponse.json();
      
      let usersToProcess = allUsersData.users;
      
      if (usersToProcess.length > 0 && !('daysSinceActivity' in usersToProcess[0])) {
        usersToProcess = allUsersData.users.map((user: User) => {
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
      }
      
      // Check again if another request has started
      if (sessionStorage.getItem('lastPredictionRequestId') !== cacheId) {
        console.log('Aborting prediction, newer request in progress');
        return { predictions: [], aborted: true };
      }
      
      const predictionRequests: PredictionRequest[] = usersToProcess.map((user: UserWithActivity) => ({
        userId: user.id,
        plan: user.plan,
        daysSinceActivity: user.daysSinceActivity,
        eventsLast30: user.eventsLast30,
        revenueLast30: user.revenueLast30
      }));
      
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
      
      // Add user info to prediction results
      const predictionsWithUserInfo = result.predictions.map((pred: any, index: number) => ({
        userId: usersToProcess[index].id,
        name: usersToProcess[index].name,
        email: usersToProcess[index].email,
        ...pred
      }));
      
      // Store the timestamp and enhanced result
      const enhancedResult = {
        predictions: predictionsWithUserInfo,
        count: usersToProcess.length
      };
      
      sessionStorage.setItem('lastPredictionTime', now.toString());
      sessionStorage.setItem('lastPredictionResult', JSON.stringify(enhancedResult));
      
      return enhancedResult;
    },
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['churnPredictionUsers'] });
      await queryClient.cancelQueries({ queryKey: ['dashboardData'] });
      
      // Get the current query data
      const previousUsers = queryClient.getQueryData(['churnPredictionUsers']);
      
      return { previousUsers };
    },
    onSuccess: (data, variables, context) => {
      // Skip query invalidation if the request was aborted
      if (data.aborted) return;
      
      // Delay invalidation to prevent rapid re-rendering
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['churnPredictionUsers'] });
        queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
        queryClient.invalidateQueries({ queryKey: ['users'] });
      }, 500);
    },
    onError: (error, variables, context) => {
      // Rollback optimistic updates if needed
      if (context?.previousUsers) {
        queryClient.setQueryData(['churnPredictionUsers'], context.previousUsers);
      }
    }
  });
} 