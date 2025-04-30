'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface UserData {
  id: string;
  name: string;
  email: string;
  plan: string;
}

interface ChurnPrediction {
  id: string;
  probability: number;
  willChurn: boolean;
  riskCategory: string;
  predictedAt: string;
}

interface ActivityData {
  daysSinceActivity: number;
  eventsLast30: number;
  revenueLast30: number;
}

interface InsightData {
  explanation: string;
  strategies: string;
}

interface UserInsights {
  user: UserData;
  prediction: ChurnPrediction;
  activity: ActivityData;
  insights: InsightData;
}

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.id as string;
  
  const [insights, setInsights] = useState<UserInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserInsights() {
      try {
        setLoading(true);
        const response = await fetch('/api/churn-insights', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Error fetching insights: ${response.statusText}`);
        }
        
        const data = await response.json();
        setInsights(data);
        setError(null);
      } catch (err) {
        console.error('Error loading user insights:', err);
        setError(err instanceof Error ? err.message : 'Failed to load user insights');
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchUserInsights();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-medium">Loading user insights...</p>
          <p className="text-sm text-gray-500">This may take a moment to generate AI-powered insights</p>
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
          <Link href="/dashboard">
            <Button
              className="mt-4 bg-brand-purple hover:bg-brand-light-purple text-white"
            >
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-medium">No user insights available</p>
          <Link href="/dashboard">
            <Button
              className="mt-4 bg-brand-purple hover:bg-brand-light-purple text-white"
            >
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">User Details</h1>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center mb-4">
              <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-200 border-2 border-brand-purple mb-2">
                <svg className="h-full w-full text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium">{insights.user.name}</h3>
              <p className="text-sm text-gray-500">{insights.user.email}</p>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Plan</p>
                <p className="font-medium capitalize">{insights.user.plan}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Activity Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Days Since Last Activity</p>
                <p className="font-medium text-xl">{insights.activity.daysSinceActivity} days</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Events in Last 30 Days</p>
                <p className="font-medium text-xl">{insights.activity.eventsLast30}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Revenue in Last 30 Days</p>
                <p className="font-medium text-xl">${insights.activity.revenueLast30.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Churn Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Risk Category</p>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    insights.prediction.riskCategory === 'High Risk'
                      ? 'bg-red-100 text-red-800'
                      : insights.prediction.riskCategory === 'Medium Risk'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {insights.prediction.riskCategory}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Churn Probability</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div 
                    className={`h-2.5 rounded-full ${
                      insights.prediction.probability > 0.8
                        ? 'bg-red-600'
                        : insights.prediction.probability > 0.3
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${insights.prediction.probability * 100}%` }}
                  ></div>
                </div>
                <p className="text-right text-sm mt-1">
                  {(insights.prediction.probability * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Predicted At</p>
                <p className="font-medium">{new Date(insights.prediction.predictedAt).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>AI-Powered Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Why This User Might Churn</h3>
                <p className="text-gray-700">{insights.insights.explanation}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Recommended Retention Strategies</h3>
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: insights.insights.strategies.replace(/•/g, '&bull;').replace(/\n/g, '<br/>') }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 