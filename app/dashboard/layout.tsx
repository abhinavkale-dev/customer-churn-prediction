'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ChatBot from '@/components/ChatBot';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import QueryProvider from '@/lib/providers/query-provider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<{id: string, message: string, date: string}[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    const mockNotifications = [
      { 
        id: '1', 
        message: 'New churn prediction available', 
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() 
      }
    ];
    
    setNotifications(mockNotifications);
    setNotificationCount(mockNotifications.length);
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'planChange') {
        const data = e.newValue ? JSON.parse(e.newValue) : null;
        if (data) {
          const newNotification = {
            id: Date.now().toString(),
            message: `Your plan was changed to ${data.plan}`,
            date: new Date().toISOString()
          };
          
          setNotifications(prev => [newNotification, ...prev]);
          setNotificationCount(prev => prev + 1);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  const navItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Churn Prediction', href: '/dashboard/churn-prediction' },
    { name: 'Customer Analytics', href: '/dashboard/analytics' },
    { name: 'Get Retention Strategies', href: '/dashboard/retention-strategies' },
    { name: 'Upgrade Plan', href: '/dashboard/settings' },
  ];
  
  const handleLogout = () => {
    router.push('/');
  };

  const clearNotifications = () => {
    setNotificationCount(0);
  };

  return (
    <QueryProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Top navigation */}
        <nav className="bg-white border-b fixed w-full top-0 z-30">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                {/* Mobile menu button */}
                <button 
                  className="md:hidden p-2 mr-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <span className="sr-only">Open menu</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div className="flex-shrink-0 flex items-center">
                  <Link href="/">
                    <span className="text-xl font-bold text-brand-purple hidden md:inline cursor-pointer">Customer Churn Prediction</span>
                    <span className="text-xl font-bold text-brand-purple md:hidden cursor-pointer">Churn Predictor</span>
                  </Link>
                </div>
              </div>
              <div className="flex items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none relative">
                      <span className="sr-only">View notifications</span>
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      {notificationCount > 0 && (
                        <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-brand-purple rounded-full">
                          {notificationCount}
                        </span>
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="end">
                    <div className="border-b border-gray-200 px-4 py-3 flex justify-between items-center">
                      <h3 className="text-sm font-medium">Notifications</h3>
                      {notificationCount > 0 && (
                        <button 
                          onClick={clearNotifications}
                          className="text-xs text-brand-purple hover:text-brand-light-purple"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map(notification => (
                          <div key={notification.id} className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50">
                            <p className="text-sm">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(notification.date).toLocaleString()}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-6 text-center text-sm text-gray-500">
                          No notifications
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                <div className="ml-3 relative">
                  <div>
                    <button 
                      onClick={() => setShowProfileMenu(!showProfileMenu)} 
                      className="max-w-xs flex items-center text-sm rounded-full focus:outline-none"
                    >
                      <span className="inline-block h-8 w-8 rounded-full overflow-hidden bg-gray-200 border-2 border-brand-purple">
                        <svg className="h-full w-full text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </span>
                    </button>
                  </div>
                  
                  {/* Profile dropdown */}
                  {showProfileMenu && (
                    <div 
                      className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-10"
                    >
                      <Link href="/dashboard/settings">
                        <span className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                          Upgrade Plan
                        </span>
                      </Link>
                      <span 
                        onClick={handleLogout}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      >
                        Log Out
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Navigation Menu - Sidebar that appears when hamburger is clicked */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-25" 
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            ></div>
            
            {/* Sidebar panel */}
            <div className="relative flex-shrink-0 w-64 max-w-xs bg-white h-full overflow-y-auto shadow-lg">
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-brand-purple rounded-md p-1.5 mr-2">
                      <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.4 3.6h-4.8v4.8h4.8V3.6Z"></path>
                        <path d="M3.6 3.6h8.4v8.4H3.6V3.6Z"></path>
                        <path d="M20.4 12h-8.4v8.4h8.4V12Z"></path>
                        <path d="M3.6 16.8h4.8v4.8H3.6v-4.8Z"></path>
                      </svg>
                    </div>
                    <span className="text-lg font-bold text-brand-purple">Customer Churn Prediction</span>
                  </div>
                  <button 
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="sr-only">Close menu</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                <nav className="space-y-2">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href || 
                                   (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`
                          flex items-center px-3 py-3 rounded-md text-sm font-medium whitespace-nowrap
                          ${isActive
                            ? 'bg-brand-purple text-white'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }
                        `}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name === 'Dashboard' && (
                          <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        )}
                        {item.name === 'Churn Prediction' && (
                          <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        )}
                        {item.name === 'Customer Analytics' && (
                          <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                        {item.name === 'Upgrade Plan' && (
                          <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        )}
                        {item.name === 'Get Retention Strategies' && (
                          <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        )}
                        <span className="truncate">{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
                
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    User
                  </div>
                  <button 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left flex items-center px-3 py-3 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
                  >
                    <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Log Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content area with top padding for fixed header */}
        <div className="pt-16 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row">
              {/* Desktop sidebar - hidden on mobile */}
              <div className="hidden md:block md:w-64 md:mr-8">
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href || 
                                   (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`
                          group flex items-center px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap
                          ${isActive
                            ? 'bg-brand-purple text-white'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }
                        `}
                      >
                        {item.name === 'Dashboard' && (
                          <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        )}
                        {item.name === 'Churn Prediction' && (
                          <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        )}
                        {item.name === 'Customer Analytics' && (
                          <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                        {item.name === 'Upgrade Plan' && (
                          <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        )}
                        {item.name === 'Get Retention Strategies' && (
                          <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        )}
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Main content */}
              <div className="flex-1">
                <main>
                  {children}
                </main>
              </div>
            </div>
          </div>
        </div>
        
        {/* Chat Bot */}
        <ChatBot />
      </div>
    </QueryProvider>
  );
} 