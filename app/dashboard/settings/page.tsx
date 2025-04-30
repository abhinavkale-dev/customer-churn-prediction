'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import prisma from '@/lib/prisma';

interface User {
  id: string;
  name: string;
  email: string;
  plan: string;
  createdAt: string;
}

interface PlanDetails {
  name: string;
  price: string;
  features: string[];
  buttonText: string;
  current: boolean;
  disabled: boolean;
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);


  const mockUserId = 'demo-user-id';

  useEffect(() => {
    setTimeout(() => {
      const hardcodedUser: User = {
        id: mockUserId,
        name: 'Abhinav Kale',
        email: 'abhinavkale19026166@gmail.com',
        plan: 'free', 
        createdAt: new Date().toISOString()
      };
      
      setUser(hardcodedUser);
      setLoading(false);
    }, 500);
  }, []);

  const handlePlanChange = async (newPlan: string) => {
    try {
      setUpdateSuccess(null);
      setUpdateError(null);
      
      setTimeout(() => {
        setUser(prev => prev ? { ...prev, plan: newPlan } : null);
        setUpdateSuccess(`Successfully updated to ${newPlan} plan`);
        
        if (user?.plan !== newPlan) {
          localStorage.setItem('planChange', JSON.stringify({
            plan: newPlan,
            timestamp: new Date().toISOString()
          }));
          
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'planChange',
            newValue: JSON.stringify({
              plan: newPlan,
              timestamp: new Date().toISOString()
            })
          }));
        }
        
        setTimeout(() => {
          setUpdateSuccess(null);
        }, 3000);
      }, 500);
      
    } catch (error) {
      console.error('Error updating plan:', error);
      setUpdateError('Failed to update plan. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-medium">Loading plans...</p>
        </div>
      </div>
    );
  }

  const plans: PlanDetails[] = [
    {
      name: 'Free',
      price: '$0',
      features: ['Limited access', 'Basic features', 'No customer support'],
      buttonText: user?.plan === 'free' ? 'Current Plan' : 'Downgrade',
      current: user?.plan === 'free',
      disabled: user?.plan === 'free'
    },
    {
      name: 'Basic',
      price: '$100/month',
      features: ['Full access', 'Priority support', 'Basic analytics'],
      buttonText: user?.plan === 'basic' ? 'Current Plan' : user?.plan === 'free' ? 'Upgrade' : 'Downgrade',
      current: user?.plan === 'basic',
      disabled: user?.plan === 'basic'
    },
    {
      name: 'Premium',
      price: '$300/month',
      features: ['All features', 'Premium support', 'Advanced analytics', 'Custom solutions'],
      buttonText: user?.plan === 'premium' ? 'Current Plan' : 'Upgrade',
      current: user?.plan === 'premium',
      disabled: user?.plan === 'premium'
    }
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Upgrade Plan</h1>
      
      {updateSuccess && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {updateSuccess}
        </div>
      )}
      
      {updateError && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {updateError}
        </div>
      )}
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">User Information</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                <div className="font-medium">Name</div>
                <div className="col-span-1 sm:col-span-2">{user?.name}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                <div className="font-medium">Email</div>
                <div className="col-span-1 sm:col-span-2">{user?.email}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                <div className="font-medium">Current Plan</div>
                <div className="col-span-1 sm:col-span-2 capitalize">{user?.plan}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                <div className="font-medium">Member Since</div>
                <div className="col-span-1 sm:col-span-2">
                  {user?.createdAt 
                    ? new Date(user.createdAt).toLocaleDateString() 
                    : new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Subscription Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`${plan.current ? 'border-2 border-brand-purple' : ''}`}
            >
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.price}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className={`w-full ${
                    plan.current 
                      ? 'bg-gray-300 hover:bg-gray-300 cursor-default' 
                      : 'bg-brand-purple hover:bg-brand-light-purple'
                  }`}
                  disabled={plan.disabled}
                  onClick={() => handlePlanChange(plan.name.toLowerCase())}
                >
                  {plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
      
      {user?.plan !== 'free' && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Cancel Subscription</h2>
          <Card>
            <CardContent className="pt-6">
              <p className="mb-4">
                If you wish to cancel your subscription, you will be downgraded to the free plan at the end of your current billing period.
              </p>
              <Button 
                variant="destructive"
                onClick={() => handlePlanChange('free')}
              >
                Cancel Subscription
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 