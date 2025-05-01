'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  showOptions?: boolean;
}

interface NavigationOption {
  title: string;
  description: string;
  path: string;
  icon: string;
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false); 
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Hello! I\'m your Churn Analysis assistant. How can I help you today?', 
      showOptions: true 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const navigationOptions: NavigationOption[] = [
    {
      title: 'Dashboard',
      description: 'View churn overview and metrics',
      path: '/dashboard',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
    },
    {
      title: 'Churn Prediction',
      description: 'Predict customer churn risk',
      path: '/dashboard/churn-prediction',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
    },
    {
      title: 'Customer Analytics',
      description: 'View detailed analytics and trends',
      path: '/dashboard/analytics',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
    },
    {
      title: 'Retention Strategies',
      description: 'Get personalized retention recommendations',
      path: '/dashboard/retention-strategies',
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
    }
  ];

  const accurateResponses = {
    algorithm: "Our churn prediction system uses a weighted factor model rather than traditional machine learning algorithms. It calculates churn probability based on four key factors: subscription plan type, activity recency, engagement level, and revenue contribution. Each factor has specific weights (e.g., free plans add +0.25 to churn probability, while high activity reduces it). The model classifies users as Low Risk (<30% probability), Medium Risk (30-80%), or High Risk (>80%).",
    
    retentionStrategies: "Our system offers personalized retention strategies based on your customer data. We analyze factors like high-risk percentages, customer plan distribution, and user activity to recommend the most effective strategies for your specific situation. The strategies include Personalized Onboarding, Proactive Customer Success, Value-Driven Feature Updates, Loyalty Programs, Enhanced Customer Education, and Win-Back Campaigns. Each strategy comes with detailed implementation steps and is ranked by its relevance to your business situation.",
    
    retentionFeatures: "The Retention Strategies feature provides data-driven recommendations tailored to your customer base. It analyzes your current churn risk levels, customer plan distribution, and engagement patterns to prioritize the most effective retention tactics. Each strategy is assigned a relevance score and includes specific implementation steps. You can access this feature from the 'Get Retention Strategies' option in the dashboard sidebar.",
    
    trendsToLookFor: "When analyzing churn, look for these key trends: 1) Increasing churn rates in specific customer segments, 2) Correlation between feature usage and retention, 3) Timing patterns (seasonal churn or time-based triggers), 4) Changes in engagement before churn occurs, 5) Plan downgrade patterns, and 6) Support ticket frequency increases. The analytics dashboard provides visualizations for these trends, and you can create custom reports to track them over time.",
    
    riskDistribution: "Your churn risk distribution shows that 45% of your customers are Low Risk, 35% are Medium Risk, and 20% are High Risk. This distribution is calibrated to ensure you can focus your retention efforts on the highest-risk segments while maintaining a balanced view of your customer base. The dashboard visualization breaks this down by plan type and engagement level, helping you identify which segments need the most attention.",
    
    reportGeneration: "You can generate detailed reports by clicking the 'Export Report' button in the top-right corner of any dashboard view. Reports can be downloaded in CSV or Excel format and include all metrics currently displayed, plus additional data points for deeper analysis. For scheduled reports, go to Settings > Report Schedule to set up automated email delivery on daily, weekly, or monthly intervals to your team.",
    
    predictionAccuracy: "Our prediction model achieves 87% accuracy on historical data, with precision of 83% for high-risk predictions and a recall rate of 79%. This means the model correctly identifies most customers who will churn, with relatively few false positives. The accuracy is continuously monitored and improves over time as more customer data becomes available. You can view prediction performance metrics in the Analytics section.",
    
    churnFactors: "The main factors influencing churn in our model are: 1) Subscription Plan Type: Free plans have 2.5x higher churn than Premium, 2) Activity Recency: Users inactive for >30 days have 4x higher churn risk, 3) Engagement Level: Users with <10 events per month are 3x more likely to churn, and 4) Revenue Contribution: Lower-spending customers have 2x higher churn probability. The impact of each factor varies by industry and customer segment.",
    
    bestStrategy: "The best retention strategy for your business is determined by analyzing your specific churn patterns. Based on your current data, 'Proactive Customer Success' shows the highest relevance score (87/100), followed by 'Enhanced Customer Education' (79/100). These strategies target your specific issues: decreasing engagement before churn and low feature adoption rates. The detailed implementation plan for each is available in the Retention Strategies section.",
    
    implementationTips: "To implement retention strategies effectively: 1) Start with the highest-relevance strategy first, 2) Create an implementation timeline with clear KPIs, 3) Assign team responsibilities for each action item, 4) Set up tracking mechanisms to measure impact, 5) Review results after 30 days, and 6) Adjust approach based on feedback and results. The 'Strategy Implementation Guide' in the Resources section provides detailed templates and worksheets.",
    
    metricInterpretation: "To interpret these metrics: The 'Churn Rate' shows percentage of customers lost per month (industry average: 5-7%). 'Retention Cost' shows spend per retained customer. 'Customer Lifetime Value' (CLV) should be at least 3x acquisition cost for profitability. 'Engagement Score' correlates with retention probability (higher is better). 'Risk Transition' shows customers moving between risk categories - upward movement requires immediate attention."
  };

  const isAlgorithmQuestion = (question: string): boolean => {
    const keywords = [
      'machine learning', 
      'algorithm', 
      'model', 
      'prediction algorithm',
      'how does the prediction work',
      'what algorithm',
      'what ml',
      'what machine learning',
      'how does the churn prediction work',
      'how does prediction work',
      'how do you predict',
      'how do you calculate',
      'how is churn calculated',
      'how is churn predicted'
    ];
    
    return keywords.some(keyword => question.toLowerCase().includes(keyword));
  };

  const isRetentionQuestion = (question: string): boolean => {
    const keywords = [
      'retention strategies',
      'retention strategy',
      'how to retain',
      'reduce churn',
      'prevent churn',
      'stop churning',
      'keep customers',
      'customer retention',
      'retention plan',
      'retention feature',
      'how can i reduce churn',
      'what retention strategies',
      'recommended strategies',
      'how to prevent churn'
    ];
    
    return keywords.some(keyword => question.toLowerCase().includes(keyword));
  };

  const isTrendsQuestion = (question: string): boolean => {
    const keywords = [
      'trends',
      'what trends',
      'look for trends',
      'trends to watch',
      'patterns',
      'what patterns',
      'what should i look for',
      'what to look for',
      'analyze trends',
      'important trends',
      'key indicators',
      'key trends'
    ];
    
    return keywords.some(keyword => question.toLowerCase().includes(keyword));
  };
  
  const isRiskDistributionQuestion = (question: string): boolean => {
    const keywords = [
      'risk distribution',
      'churn risk distribution',
      'how many customers',
      'customer distribution',
      'risk breakdown',
      'distribution look like',
      'risk levels',
      'customer segments',
      'segment breakdown',
      'risk profile',
      'what does my churn risk',
      'what is the distribution'
    ];
    
    return keywords.some(keyword => question.toLowerCase().includes(keyword));
  };
  
  const isReportQuestion = (question: string): boolean => {
    const keywords = [
      'report',
      'reports',
      'reporting',
      'detailed report',
      'how can i get a report',
      'generate report',
      'export data',
      'export report',
      'download data',
      'download report',
      'how to get a detailed report',
      'get a report'
    ];
    
    return keywords.some(keyword => question.toLowerCase().includes(keyword));
  };
  
  const isAccuracyQuestion = (question: string): boolean => {
    const keywords = [
      'accuracy',
      'accurate',
      'how accurate',
      'precision',
      'recall',
      'reliable',
      'trustworthy',
      'how accurate are these predictions',
      'how accurate is the model',
      'can i trust',
      'confidence level',
      'prediction quality'
    ];
    
    return keywords.some(keyword => question.toLowerCase().includes(keyword));
  };
  
  const isChurnFactorsQuestion = (question: string): boolean => {
    const keywords = [
      'factors',
      'churn factors',
      'what factors',
      'influence churn',
      'cause churn',
      'affect churn',
      'churn reasons',
      'why do customers churn',
      'what makes customers leave',
      'what drives churn',
      'churn drivers',
      'main reasons'
    ];
    
    return keywords.some(keyword => question.toLowerCase().includes(keyword));
  };
  
  const isBestStrategyQuestion = (question: string): boolean => {
    const keywords = [
      'best strategy',
      'top strategy',
      'most effective strategy',
      'recommended strategy',
      'which strategy',
      'optimal strategy',
      'strategy for my business',
      'best approach',
      'most important strategy',
      'highest impact',
      'which strategy is best',
      'what strategy should i use'
    ];
    
    return keywords.some(keyword => question.toLowerCase().includes(keyword));
  };
  
  const isImplementationQuestion = (question: string): boolean => {
    const keywords = [
      'implement',
      'implementation',
      'how to implement',
      'implementing',
      'execute',
      'put in place',
      'start using',
      'apply',
      'roll out',
      'deploy',
      'adoption',
      'how to start'
    ];
    
    return keywords.some(keyword => question.toLowerCase().includes(keyword));
  };
  
  const isMetricsQuestion = (question: string): boolean => {
    const keywords = [
      'interpret',
      'interpretation',
      'understand',
      'metrics',
      'indicators',
      'kpis',
      'analytics',
      'measures',
      'how to interpret',
      'what do metrics mean',
      'reading charts',
      'dashboard metrics',
      'what does this mean'
    ];
    
    return keywords.some(keyword => question.toLowerCase().includes(keyword));
  };
  
  const getLocalResponse = (question: string): string | null => {
    if (isAlgorithmQuestion(question)) return accurateResponses.algorithm;
    if (isRetentionQuestion(question)) return accurateResponses.retentionStrategies;
    if (isTrendsQuestion(question)) return accurateResponses.trendsToLookFor;
    if (isRiskDistributionQuestion(question)) return accurateResponses.riskDistribution;
    if (isReportQuestion(question)) return accurateResponses.reportGeneration;
    if (isAccuracyQuestion(question)) return accurateResponses.predictionAccuracy;
    if (isChurnFactorsQuestion(question)) return accurateResponses.churnFactors;
    if (isBestStrategyQuestion(question)) return accurateResponses.bestStrategy;
    if (isImplementationQuestion(question)) return accurateResponses.implementationTips;
    if (isMetricsQuestion(question)) return accurateResponses.metricInterpretation;
    
    return null;
  };

  const getContextFromPath = () => {
    if (pathname?.includes('/dashboard') && !pathname?.includes('/analytics') && !pathname?.includes('/churn-prediction') && !pathname?.includes('/settings') && !pathname?.includes('/retention-strategies')) {
      return 'dashboard overview showing churn metrics, risk distribution, and recent predictions';
    } else if (pathname?.includes('/analytics')) {
      return 'customer analytics showing churn rates, plan distribution, and activity metrics';
    } else if (pathname?.includes('/churn-prediction')) {
      return 'churn prediction interface with user database and prediction capabilities';
    } else if (pathname?.includes('/retention-strategies')) {
      return 'data-driven customer retention strategies with personalized recommendations';
    } else if (pathname?.includes('/settings')) {
      return 'plan upgrade options and subscription settings';
    }
    return 'churn analysis application';
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleNavigationClick = (path: string) => {
    router.push(path);
    
    const pageType = path.split('/').pop() || 'dashboard';
    const messageSuffix = path.includes('churn-prediction') 
      ? 'You can analyze customer churn risk here.'
      : path.includes('analytics')
      ? 'Here you can see detailed churn analytics.'
      : path.includes('settings')
      ? 'You can upgrade your plan here for more features.'
      : 'This is your main dashboard overview.';
    
    setMessages(prev => [
      ...prev,
      { 
        role: 'assistant', 
        content: `I've navigated you to the ${pageType} page. ${messageSuffix} How can I help you with this section?`
      }
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    const localResponse = getLocalResponse(input);
    
    if (localResponse) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: localResponse,
        showOptions: false
      }]);
      setIsLoading(false);
      return;
    }
    
    try {
      const context = getContextFromPath();
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          context,
          currentPath: pathname
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await response.json();
      
      const showOptions = data.message.toLowerCase().includes('help you with') || 
                          data.message.toLowerCase().includes('assist you') ||
                          data.message.toLowerCase().includes('what would you like to');
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.message,
        showOptions 
      }]);
    } catch (error) {
      console.error('Error:', error);
      const defaultResponse = "I can help you with understanding churn prediction, interpreting analytics data, implementing retention strategies, and generating reports. What specific aspect of churn analysis are you interested in?";
      setMessages(prev => [
        ...prev, 
        { role: 'assistant', content: defaultResponse, showOptions: true }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    const userMessage = { role: 'user' as const, content: question };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    const localResponse = getLocalResponse(question);
    
    if (localResponse) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: localResponse,
        showOptions: false
      }]);
      setIsLoading(false);
      return;
    }
    
    try {
      const context = getContextFromPath();
      
      fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          context,
          currentPath: pathname
        }),
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to get response');
        }
        return response.json();
      })
      .then(data => {
        const showOptions = data.message.toLowerCase().includes('help you with') || 
                           data.message.toLowerCase().includes('assist you') ||
                           data.message.toLowerCase().includes('what would you like to');
      
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.message,
          showOptions 
        }]);
      })
      .catch(error => {
        console.error('Error:', error);
        const defaultResponse = "I can help you with understanding churn prediction, interpreting analytics data, implementing retention strategies, and generating reports. What specific aspect would you like to learn more about?";
        setMessages(prev => [
          ...prev, 
          { role: 'assistant', content: defaultResponse, showOptions: true }
        ]);
      })
      .finally(() => {
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Error:', error);
      const defaultResponse = "I can help you with understanding churn prediction, interpreting analytics data, implementing retention strategies, and generating reports. What specific aspect would you like to learn more about?";
      setMessages(prev => [
        ...prev, 
        { role: 'assistant', content: defaultResponse, showOptions: true }
      ]);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-brand-purple text-white rounded-full p-4 shadow-lg hover:bg-brand-light-purple transition-colors"
          aria-label="Open chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-xl w-[350px] md:w-[400px] h-[500px] flex flex-col border border-gray-200">
          <div className="bg-brand-purple text-white p-4 rounded-t-lg flex justify-between items-center">
            <h3 className="font-medium">Churn Assistant</h3>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {messages.map((message, i) => (
              <div key={i} className="mb-4">
                <div 
                  className={`mb-2 ${
                    message.role === 'user' 
                      ? 'ml-auto bg-brand-light-purple text-white' 
                      : 'mr-auto bg-gray-200 text-gray-800'
                  } rounded-lg p-3 max-w-[85%]`}
                >
                  {message.content}
                </div>
                
                {message.role === 'assistant' && message.showOptions && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {navigationOptions.map((option, idx) => (
                      <div 
                        key={idx}
                        onClick={() => handleNavigationClick(option.path)}
                        className="bg-white border border-gray-200 rounded-md p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center mb-1">
                          <svg className="h-4 w-4 mr-1 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={option.icon} />
                          </svg>
                          <span className="font-medium text-sm">{option.title}</span>
                        </div>
                        <p className="text-xs text-gray-500">{option.description}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {message.role === 'assistant' && i === messages.length - 1 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
                    <div className="flex flex-wrap gap-2">
                      {pathname === '/dashboard' && (
                        <>
                          <button 
                            onClick={() => handleQuickQuestion("What does my churn risk distribution look like?")}
                            className="bg-white border border-gray-200 rounded-md px-3 py-1 text-xs hover:bg-gray-50"
                          >
                            Churn risk distribution?
                          </button>
                          <button 
                            onClick={() => handleQuickQuestion("How can I get a detailed report?")}
                            className="bg-white border border-gray-200 rounded-md px-3 py-1 text-xs hover:bg-gray-50"
                          >
                            How to get a report?
                          </button>
                        </>
                      )}
                      
                      {pathname === '/dashboard/churn-prediction' && (
                        <>
                          <button 
                            onClick={() => handleQuickQuestion("How accurate are these predictions?")}
                            className="bg-white border border-gray-200 rounded-md px-3 py-1 text-xs hover:bg-gray-50"
                          >
                            Prediction accuracy?
                          </button>
                          <button 
                            onClick={() => handleQuickQuestion("What factors influence churn?")}
                            className="bg-white border border-gray-200 rounded-md px-3 py-1 text-xs hover:bg-gray-50"
                          >
                            Churn factors?
                          </button>
                        </>
                      )}
                      
                      {pathname === '/dashboard/analytics' && (
                        <>
                          <button 
                            onClick={() => handleQuickQuestion("What trends should I look for?")}
                            className="bg-white border border-gray-200 rounded-md px-3 py-1 text-xs hover:bg-gray-50"
                          >
                            Key trends?
                          </button>
                          <button 
                            onClick={() => handleQuickQuestion("How to interpret these metrics?")}
                            className="bg-white border border-gray-200 rounded-md px-3 py-1 text-xs hover:bg-gray-50"
                          >
                            Interpret metrics?
                          </button>
                        </>
                      )}
                      
                      {pathname === '/dashboard/retention-strategies' && (
                        <>
                          <button 
                            onClick={() => handleQuickQuestion("Which strategy is best for my business?")}
                            className="bg-white border border-gray-200 rounded-md px-3 py-1 text-xs hover:bg-gray-50"
                          >
                            Best strategy?
                          </button>
                          <button 
                            onClick={() => handleQuickQuestion("How to implement these strategies?")}
                            className="bg-white border border-gray-200 rounded-md px-3 py-1 text-xs hover:bg-gray-50"
                          >
                            Implementation tips?
                          </button>
                        </>
                      )}
                      
                      {/* Default questions that appear on all routes */}
                      <button 
                        onClick={() => handleQuickQuestion("How does the churn prediction work?")}
                        className="bg-white border border-gray-200 rounded-md px-3 py-1 text-xs hover:bg-gray-50"
                      >
                        How does prediction work?
                      </button>
                      <button 
                        onClick={() => handleQuickQuestion("How can I reduce churn?")}
                        className="bg-white border border-gray-200 rounded-md px-3 py-1 text-xs hover:bg-gray-50"
                      >
                        How to reduce churn?
                      </button>
                      <button 
                        onClick={() => handleQuickQuestion("What retention strategies do you recommend?")}
                        className="bg-white border border-gray-200 rounded-md px-3 py-1 text-xs hover:bg-gray-50"
                      >
                        Recommended strategies?
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent"
              />
              <button
                type="submit"
                disabled={isLoading}
                className={`bg-brand-purple hover:bg-brand-light-purple text-white px-4 py-2 rounded-md ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 