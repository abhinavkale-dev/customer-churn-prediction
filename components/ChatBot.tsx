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
    
    trendsToLookFor: "When analyzing churn, look for these key trends: 1) Increasing churn rates in specific customer segments, 2) Correlation between feature usage and retention, 3) Timing patterns (seasonal churn or time-based triggers), 4) Changes in engagement before churn occurs, 5) Plan downgrade patterns, and 6) Support ticket frequency increases. The analytics dashboard provides visualizations for these trends, and you can create custom reports to track them over time."
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
      'what machine learning'
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
      'retention feature'
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
      'key indicators'
    ];
    
    return keywords.some(keyword => question.toLowerCase().includes(keyword));
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
    
    if (isAlgorithmQuestion(input)) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: accurateResponses.algorithm,
        showOptions: false
      }]);
      setIsLoading(false);
      return;
    }
    
    if (isRetentionQuestion(input)) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: accurateResponses.retentionStrategies,
        showOptions: false
      }]);
      setIsLoading(false);
      return;
    }
    
    if (isTrendsQuestion(input)) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: accurateResponses.trendsToLookFor,
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
      setMessages(prev => [
        ...prev, 
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again later.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    const userMessage = { role: 'user' as const, content: question };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    if (isAlgorithmQuestion(question)) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: accurateResponses.algorithm,
        showOptions: false
      }]);
      setIsLoading(false);
      return;
    }
    
    if (isRetentionQuestion(question)) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: accurateResponses.retentionStrategies,
        showOptions: false
      }]);
      setIsLoading(false);
      return;
    }
    
    if (isTrendsQuestion(question)) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: accurateResponses.trendsToLookFor,
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
        setMessages(prev => [
          ...prev, 
          { role: 'assistant', content: 'Sorry, I encountered an error. Please try again later.' }
        ]);
      })
      .finally(() => {
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [
        ...prev, 
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again later.' }
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