'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Customer {
  plan: string;
  daysSinceActivity: number;
  eventsLast30: number;
  revenueLast30: number;
}

interface PredictionResult {
  probability: number;
  willChurn: boolean;
  riskCategory: string;
}

export default function ChurnPredictionPage() {
  const [customer, setCustomer] = useState<Customer>({
    plan: 'basic',
    daysSinceActivity: 0,
    eventsLast30: 0,
    revenueLast30: 0
  });
  
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCustomer(prev => ({
      ...prev,
      [name]: name === 'plan' ? value : Number(value)
    }));
  };

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/churn-prediction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customer),
      });
      
      if (!response.ok) {
        throw new Error('Failed to predict churn');
      }
      
      const result = await response.json();
      setPredictionResult(result);
    } catch (err) {
      setError('An error occurred while predicting churn');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Customer Churn Prediction</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Customer Data</CardTitle>
            <CardDescription>Enter customer details to predict churn</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subscription Plan</label>
                <select
                  name="plan"
                  value={customer.plan}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Days Since Last Activity</label>
                <Input
                  type="number"
                  name="daysSinceActivity"
                  value={customer.daysSinceActivity}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Events in Last 30 Days</label>
                <Input
                  type="number"
                  name="eventsLast30"
                  value={customer.eventsLast30}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Revenue in Last 30 Days ($)</label>
                <Input
                  type="number"
                  name="revenueLast30"
                  value={customer.revenueLast30}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                />
              </div>
              
              <Button 
                onClick={handlePredict} 
                disabled={loading}
                className="w-full mt-4"
              >
                {loading ? 'Predicting...' : 'Predict Churn'}
              </Button>
              
              {error && (
                <div className="text-red-500 mt-2">{error}</div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Prediction Results</CardTitle>
            <CardDescription>Customer churn prediction analysis</CardDescription>
          </CardHeader>
          <CardContent>
            {predictionResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center mb-6">
                  <div className={`w-40 h-40 rounded-full flex items-center justify-center text-white text-xl font-bold ${
                    predictionResult.riskCategory === 'Low Risk' ? 'bg-green-500' :
                    predictionResult.riskCategory === 'Medium Risk' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}>
                    {Math.round(predictionResult.probability * 100)}% Risk
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium">Risk Category</h3>
                    <p className={`font-bold ${
                      predictionResult.riskCategory === 'Low Risk' ? 'text-green-600' :
                      predictionResult.riskCategory === 'Medium Risk' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {predictionResult.riskCategory}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Will Churn</h3>
                    <p className={`font-bold ${predictionResult.willChurn ? 'text-red-600' : 'text-green-600'}`}>
                      {predictionResult.willChurn ? 'Yes' : 'No'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Churn Probability</h3>
                    <p>{(predictionResult.probability * 100).toFixed(2)}%</p>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-gray-100 rounded">
                  <h3 className="font-medium mb-2">Recommendation:</h3>
                  <p>
                    {predictionResult.riskCategory === 'Low Risk' ? 
                      'This customer appears satisfied. Continue monitoring their engagement.' :
                      predictionResult.riskCategory === 'Medium Risk' ?
                      'Consider reaching out to this customer with a personalized offer to increase engagement.' :
                      'This customer is at high risk of churning. Immediate intervention recommended.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No prediction data yet. Enter customer details and click "Predict Churn".
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 