'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ChurnSummary {
  totalCustomers: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  recentPredictions: {
    id: string;
    userId: string;
    probability: number;
    riskCategory: string;
    predictedAt: string;
  }[];
}

export default function DashboardPage() {
  // In a real application, this would be fetched from an API
  const [summary, setSummary] = useState<ChurnSummary>({
    totalCustomers: 256,
    highRiskCount: 42,
    mediumRiskCount: 78,
    lowRiskCount: 136,
    recentPredictions: [
      {
        id: '1',
        userId: 'user1',
        probability: 0.82,
        riskCategory: 'High Risk',
        predictedAt: new Date().toISOString(),
      },
      {
        id: '2',
        userId: 'user2',
        probability: 0.45,
        riskCategory: 'Medium Risk',
        predictedAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: '3',
        userId: 'user3',
        probability: 0.12,
        riskCategory: 'Low Risk',
        predictedAt: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: '4',
        userId: 'user4',
        probability: 0.91,
        riskCategory: 'High Risk',
        predictedAt: new Date(Date.now() - 10800000).toISOString(),
      },
      {
        id: '5',
        userId: 'user5',
        probability: 0.28,
        riskCategory: 'Low Risk',
        predictedAt: new Date(Date.now() - 14400000).toISOString(),
      },
    ],
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
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
              {Math.round((summary.highRiskCount / summary.totalCustomers) * 100)}% of customer base
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
              {Math.round((summary.mediumRiskCount / summary.totalCustomers) * 100)}% of customer base
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
              {Math.round((summary.lowRiskCount / summary.totalCustomers) * 100)}% of customer base
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Predictions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left">User ID</th>
                  <th className="px-4 py-2 text-left">Risk Category</th>
                  <th className="px-4 py-2 text-left">Probability</th>
                  <th className="px-4 py-2 text-left">Predicted At</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentPredictions.map((prediction) => (
                  <tr key={prediction.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{prediction.userId}</td>
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
                    <td className="px-4 py-3">{(prediction.probability * 100).toFixed(1)}%</td>
                    <td className="px-4 py-3">{new Date(prediction.predictedAt).toLocaleString()}</td>
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
    </div>
  );
}
