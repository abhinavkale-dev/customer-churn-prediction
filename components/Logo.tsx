import React from 'react';

const Logo = () => {
  return (
    <div className="flex items-center">
      <div className="bg-brand-purple rounded-md p-2 mr-2">
        <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.4 3.6h-4.8v4.8h4.8V3.6Z"></path>
          <path d="M3.6 3.6h8.4v8.4H3.6V3.6Z"></path>
          <path d="M20.4 12h-8.4v8.4h8.4V12Z"></path>
          <path d="M3.6 16.8h4.8v4.8H3.6v-4.8Z"></path>
        </svg>
      </div>
      <span className="text-xl font-bold text-brand-purple">Customer Churn Prediction</span>
    </div>
  );
};

export default Logo; 