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

interface PredictionResult {
  userId: string;
  name: string;
  email: string;
  probability: number;
  willChurn: boolean;
  riskCategory: string;
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
      
      return {
        users: usersWithActivity,
        pagination: data.pagination
      };
    },
  });
}

export function usePredictAllChurn() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      // Fetch all users first
      const allUsersResponse = await fetch('/api/users?limit=999');
      if (!allUsersResponse.ok) {
        throw new Error('Failed to fetch all users');
      }
      
      const allUsersData = await allUsersResponse.json();
      
      // Add activity data to users
      const allUsersWithActivity = allUsersData.users.map((user: User) => {
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
      
      return {
        predictions: predictionsWithUserInfo,
        count: allUsersWithActivity.length
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['churnPredictionUsers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    }
  });
} 