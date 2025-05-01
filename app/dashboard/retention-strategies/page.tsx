'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardData, useUsers } from '@/lib/hooks/use-query-hooks';

interface Strategy {
  id: number;
  title: string;
  description: string;
  impact: string;
  timeToImplement: string;
  steps: string[];
  relevance: number;
}

const baseStrategies: Strategy[] = [
  {
    id: 1,
    title: 'Personalized Onboarding',
    description: 'Customized onboarding flows based on user demographics and goals to ensure users see value quickly.',
    impact: 'High',
    timeToImplement: 'Medium',
    steps: [
      'Map out customer journeys by segment',
      'Identify key activation points for each segment',
      'Develop tailored welcome sequences',
      'Implement behavioral triggers for onboarding guidance'
    ],
    relevance: 0
  },
  {
    id: 2,
    title: 'Proactive Customer Success',
    description: 'Reach out to users showing signs of disengagement before they churn.',
    impact: 'Very High',
    timeToImplement: 'Low',
    steps: [
      'Set up usage pattern monitoring',
      'Create email templates for different risk scenarios',
      'Train customer success team on intervention strategies',
      'Implement automated alerts for at-risk accounts'
    ],
    relevance: 0
  },
  {
    id: 3,
    title: 'Value-Driven Feature Updates',
    description: 'Release new features based on user feedback and usage data to improve stickiness.',
    impact: 'Medium',
    timeToImplement: 'High',
    steps: [
      'Analyze feature usage patterns across segments',
      'Conduct user interviews with power users',
      'Prioritize development based on retention impact',
      'Create targeted communications about new features'
    ],
    relevance: 0
  },
  {
    id: 4,
    title: 'Loyalty Program',
    description: 'Implement a tiered loyalty program that rewards long-term customers with exclusive benefits.',
    impact: 'Medium',
    timeToImplement: 'Medium',
    steps: [
      'Define loyalty tiers and benefits',
      'Implement tracking and reward distribution system',
      'Create marketing materials to promote the program',
      'Train customer-facing teams on program details'
    ],
    relevance: 0
  },
  {
    id: 5,
    title: 'Enhanced Customer Education',
    description: 'Develop comprehensive knowledge base and training materials to increase product mastery.',
    impact: 'Medium',
    timeToImplement: 'Low',
    steps: [
      'Audit existing educational materials',
      'Identify knowledge gaps based on support tickets',
      'Create multimedia training resources',
      'Implement in-app guidance for complex features'
    ],
    relevance: 0
  },
  {
    id: 6,
    title: 'Win-Back Campaign',
    description: 'Targeted campaign to recover recently churned customers with personalized offers.',
    impact: 'High',
    timeToImplement: 'Low',
    steps: [
      'Segment churned customers by reason for leaving',
      'Develop specific offers for each segment',
      'Create automated win-back email sequence',
      'Track and optimize campaign performance'
    ],
    relevance: 0
  }
];

const ImpactBadge = ({ impact }: { impact: string }) => {
  const colorClass = 
    impact === 'Very High' ? 'bg-purple-100 text-purple-800' :
    impact === 'High' ? 'bg-blue-100 text-blue-800' :
    impact === 'Medium' ? 'bg-green-100 text-green-800' :
    'bg-yellow-100 text-yellow-800';
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {impact} Impact
    </span>
  );
};

const TimeToImplementBadge = ({ time }: { time: string }) => {
  const colorClass = 
    time === 'Low' ? 'bg-green-100 text-green-800' :
    time === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
    'bg-red-100 text-red-800';
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {time} Effort
    </span>
  );
};

const RelevanceBadge = ({ relevance }: { relevance: number }) => {
  // Only show for high relevance
  if (relevance < 80) return null;
  
  return (
    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
      Highly Recommended
    </span>
  );
};

export default function RetentionStrategiesPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { data: dashboardData, isLoading: isDashboardLoading } = useDashboardData();
  const { data: usersData, isLoading: isUsersLoading } = useUsers({
    page: 1,
    limit: 100, // Get more users for better analysis
    search: '',
    plan: 'all',
    riskCategory: 'all',
    datePeriod: 'all'
  });

  useEffect(() => {
    if (isDashboardLoading || isUsersLoading) return;
    
    const analyzeData = () => {
      // Clone base strategies
      const analyzedStrategies = [...baseStrategies];
      
      if (!dashboardData || !usersData) {
        setStrategies(analyzedStrategies);
        setIsLoading(false);
        return;
      }
      
      // Analyze churn summary data
      const { highRiskCount, mediumRiskCount, totalCustomers } = dashboardData;
      const users = usersData.users || [];
      
      const highRiskPercentage = (highRiskCount / totalCustomers) * 100;
      const mediumRiskPercentage = (mediumRiskCount / totalCustomers) * 100;
      
      // Count users by plan
      const planCounts = {
        free: 0,
        basic: 0,
        premium: 0
      };
      
      users.forEach(user => {
        if (user.plan in planCounts) {
          planCounts[user.plan as keyof typeof planCounts]++;
        }
      });
      
      // Customize strategy relevance based on data
      const customizedStrategies = analyzedStrategies.map(strategy => {
        let relevance = 50; // Base relevance
        
        switch (strategy.id) {
          case 1: // Personalized Onboarding
            // More relevant for newer users with high churn risk
            const newUsers = users.filter(u => {
              const created = new Date(u.createdAt);
              const threeMonthsAgo = new Date();
              threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
              return created > threeMonthsAgo;
            }).length;
            const newUserPercentage = (newUsers / users.length) * 100;
            relevance += newUserPercentage > 30 ? 40 : 20;
            break;
            
          case 2: // Proactive Customer Success
            // Critical when high risk users are high
            relevance += highRiskPercentage > 20 ? 45 : 
                         highRiskPercentage > 10 ? 30 : 15;
            break;
            
          case 3: // Value-Driven Feature Updates
            // More relevant for premium users who expect more features
            relevance += planCounts.premium > (users.length * 0.3) ? 35 : 15;
            break;
            
          case 4: // Loyalty Program
            // More relevant when medium risk is high
            relevance += mediumRiskPercentage > 30 ? 40 : 
                         mediumRiskPercentage > 15 ? 25 : 10;
            break;
            
          case 5: // Enhanced Customer Education
            // More relevant when there's a mix of user plans
            const hasGoodPlanMix = (
              planCounts.free > 0 && 
              planCounts.basic > 0 && 
              planCounts.premium > 0
            );
            relevance += hasGoodPlanMix ? 30 : 10;
            break;
            
          case 6: // Win-Back Campaign
            // More relevant when high risk percentage is high
            relevance += highRiskPercentage > 25 ? 45 : 
                         highRiskPercentage > 15 ? 30 : 15;
            break;
        }
        
        return {
          ...strategy,
          relevance: Math.min(relevance, 100) // Cap at 100
        };
      });
      
      // Sort by relevance (highest first)
      customizedStrategies.sort((a, b) => b.relevance - a.relevance);
      
      setStrategies(customizedStrategies);
      setIsLoading(false);
    };
    
    analyzeData();
  }, [dashboardData, usersData, isDashboardLoading, isUsersLoading]);

  if (isLoading || isDashboardLoading || isUsersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-medium">Analyzing your customer data...</p>
          <p className="text-sm text-gray-500">Creating personalized retention strategies</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Customer Retention Strategies</h1>
      </div>
      
      <div className="mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Personalized Recommendations Based on Your Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              Based on your customer data, we've analyzed and prioritized the following retention strategies 
              that are most likely to reduce churn in your business. Strategies are ranked by relevance to your 
              specific customer base and churn patterns.
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {strategies.map((strategy) => (
          <Card key={strategy.id} className="h-full flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <CardTitle className="text-lg">{strategy.title}</CardTitle>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <ImpactBadge impact={strategy.impact} />
                <TimeToImplementBadge time={strategy.timeToImplement} />
                <RelevanceBadge relevance={strategy.relevance} />
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-gray-700 mb-4">
                {strategy.description}
              </p>
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-brand-purple h-2.5 rounded-full" 
                    style={{ width: `${strategy.relevance}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {strategy.relevance}% relevant based on your data
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Implementation Steps:</h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  {strategy.steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 