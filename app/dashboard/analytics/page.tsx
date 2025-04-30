'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  BarChart, 
  Bar, 
  LineChart, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell
} from 'recharts';

interface ChurnData {
  planDistribution: {
    plan: string;
    count: number;
  }[];
  churnByPlan: {
    plan: string;
    churned: number;
    retained: number;
  }[];
  activityVsChurn: {
    activityRange: string;
    churned: number;
    retained: number;
  }[];
  churnTrend: {
    month: string;
    churnRate: number;
  }[];
  riskDistribution: {
    risk: string;
    count: number;
  }[];
}

// Colors for charts
const COLORS = {
  free: 'rgba(75, 192, 192, 0.7)',
  basic: 'rgba(54, 162, 235, 0.7)',
  premium: 'rgba(153, 102, 255, 0.7)',
  churned: 'rgba(255, 99, 132, 0.7)',
  retained: 'rgba(75, 192, 192, 0.7)',
  highRisk: 'rgba(255, 99, 132, 0.7)',
  mediumRisk: 'rgba(255, 206, 86, 0.7)',
  lowRisk: 'rgba(75, 192, 192, 0.7)',
};

export default function AnalyticsPage() {
  const [churnData, setChurnData] = useState<ChurnData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/analytics-data');
        
        if (!response.ok) {
          throw new Error(`Error fetching analytics data: ${response.statusText}`);
        }
        
        const data = await response.json();
        setChurnData(data);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        setError('Failed to load analytics data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-medium">Loading analytics data...</p>
          <p className="text-sm text-gray-500">Analyzing your Neon DB data</p>
        </div>
      </div>
    );
  }

  if (error || !churnData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-medium text-red-600">Error</p>
          <p className="text-sm text-gray-500">{error || 'Failed to load analytics data'}</p>
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

  // Check if data is empty
  const hasData = churnData.planDistribution.length > 0 || 
                  churnData.churnByPlan.length > 0 || 
                  churnData.riskDistribution.length > 0;

  if (!hasData) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8">Churn Analytics</h1>
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
          <p className="text-lg font-medium text-yellow-800">No analytics data available</p>
          <p className="text-yellow-700 mt-1">Add users and predictions to see analytics data here.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Churn Analytics</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Plan Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] overflow-x-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={churnData.planDistribution}
                  cx="50%"
                  cy="45%"
                  outerRadius={100}
                  dataKey="count"
                  nameKey="plan"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={true}
                >
                  {churnData.planDistribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        entry.plan.toLowerCase() === 'free' ? COLORS.free : 
                        entry.plan.toLowerCase() === 'basic' ? COLORS.basic : 
                        COLORS.premium
                      } 
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} customers`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Churn By Plan Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Churn by Plan</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] overflow-x-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={churnData.churnByPlan}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="plan" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="churned" name="Churned" fill={COLORS.churned} />
                <Bar dataKey="retained" name="Retained" fill={COLORS.retained} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity vs Churn Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Activity vs Churn Rate</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] overflow-x-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={churnData.activityVsChurn}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="activityRange" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="churned" name="Churned" fill={COLORS.churned} />
                <Bar dataKey="retained" name="Retained" fill={COLORS.retained} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Churn Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Churn Rate Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] overflow-x-auto">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={churnData.churnTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}%`, 'Churn Rate']} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="churnRate" 
                  name="Churn Rate (%)" 
                  stroke="rgba(54, 162, 235, 1)" 
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk Distribution Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Customer Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] overflow-x-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={churnData.riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="count"
                  nameKey="risk"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {churnData.riskDistribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        entry.risk === 'High Risk' ? COLORS.highRisk : 
                        entry.risk === 'Medium Risk' ? COLORS.mediumRisk : 
                        COLORS.lowRisk
                      } 
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} customers`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="text-sm text-gray-500 text-center mt-8">
        Analytics based on real-time data from Neon Database
      </div>
    </div>
  );
} 