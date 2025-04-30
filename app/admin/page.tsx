'use client';
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChurnData {
  total: number;
  churned: number;
  churnRate: number;
  byPlan: Array<{
    plan: string;
    total: number;
    lost: number;
  }>;
  avgDaysSinceActivity: number;
}

const COLORS = ['var(--color-primary)', 'var(--color-warning)', 'var(--color-secondary)', 'var(--color-accent)'];

export default function ChurnDashboard() {
  const [data, setData] = useState<ChurnData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChurnData() {
      try {
        const response = await fetch('/api/analysis');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError('Error loading churn analysis data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchChurnData();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-screen">Loading dashboard data...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  if (!data) return <div className="flex justify-center items-center h-screen">No data available</div>;

  // Prepare data for pie chart
  const pieData = [
    { name: 'Retained', value: data.total - data.churned },
    { name: 'Churned', value: data.churned }
  ];

  // Prepare data for plan breakdown chart
  const planData = data.byPlan.map(plan => ({
    plan: plan.plan.charAt(0).toUpperCase() + plan.plan.slice(1),
    retained: plan.total - plan.lost,
    churned: plan.lost
  }));

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-6">Churn Analysis Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Overall Churn Rate</h2>
          <p className="text-4xl font-bold">{(data.churnRate * 100).toFixed(1)}%</p>
          <p className="text-gray-500">{data.churned} out of {data.total} customers</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Avg Days Since Activity</h2>
          <p className="text-4xl font-bold">{data.avgDaysSinceActivity.toFixed(1)}</p>
          <p className="text-gray-500">days on average</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Total Customers</h2>
          <p className="text-4xl font-bold">{data.total}</p>
          <p className="text-gray-500">across all plans</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Customer Retention Overview</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Churn by Plan</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={planData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="plan" type="category" />
                <Tooltip />
                <Legend />
                <Bar dataKey="retained" fill="var(--color-primary)" name="Retained" />
                <Bar dataKey="churned" fill="var(--color-warning)" name="Churned" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </main>
  );
} 