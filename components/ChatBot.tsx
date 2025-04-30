'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

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

  // Navigation options for quick access
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
      title: 'Upgrade Plan',
      description: 'Explore premium features',
      path: '/dashboard/settings',
      icon: 'M13 10V3L4 14h7v7l9-11h-7z'
    }
  ];

  // Get contextual information based on the current page
  const getContextFromPath = () => {
    if (pathname?.includes('/dashboard') && !pathname?.includes('/analytics') && !pathname?.includes('/churn-prediction') && !pathname?.includes('/settings')) {
      return 'dashboard overview showing churn metrics, risk distribution, and recent predictions';
    } else if (pathname?.includes('/analytics')) {
      return 'customer analytics showing churn rates, plan distribution, and activity metrics';
    } else if (pathname?.includes('/churn-prediction')) {
      return 'churn prediction interface with user database and prediction capabilities';
    } else if (pathname?.includes('/settings')) {
      return 'plan upgrade options and subscription settings';
    }
    return 'churn analysis application';
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleNavigationClick = (path: string) => {
    router.push(path);
    
    // Add a message about the navigation
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
    
    // Add user message
    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Context for the current page
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
      
      // Determine if we should show options based on the response content
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
    // Add user message directly without setting input
    const userMessage = { role: 'user' as const, content: question };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Context for the current page
      const context = getContextFromPath();
      
      // Make API call directly instead of using handleSubmit
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
        // Determine if we should show options based on the response content
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
                        className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center mb-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-purple mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={option.icon} />
                          </svg>
                          <span className="text-sm font-medium">{option.title}</span>
                        </div>
                        <p className="text-xs text-gray-500">{option.description}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {message.role === 'assistant' && i === messages.length - 1 && i > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => handleQuickQuestion("How do I predict customer churn?")}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-2 rounded-full"
                      >
                        How do I predict customer churn?
                      </button>
                      <button 
                        onClick={() => handleQuickQuestion("What metrics should I look at?")}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-2 rounded-full"
                      >
                        What metrics should I look at?
                      </button>
                      <button 
                        onClick={() => handleQuickQuestion("How to reduce customer churn?")}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-2 rounded-full"
                      >
                        How to reduce customer churn?
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
            
            {isLoading && (
              <div className="flex justify-center items-center gap-1 text-gray-500">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
              </div>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200">
            <div className="flex">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-brand-purple"
                disabled={isLoading}
              />
              <button
                type="submit"
                className="bg-brand-purple text-white px-4 py-2 rounded-r-lg disabled:bg-gray-400"
                disabled={isLoading || !input.trim()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 