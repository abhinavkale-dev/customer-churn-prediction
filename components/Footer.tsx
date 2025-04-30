import React from 'react';
import Logo from './Logo';

const Footer = () => {
  return (
    <footer className="bg-gray-100 pt-16 pb-8">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <Logo />
            <p className="mt-4 text-gray-600">
              AI-powered customer churn prediction to help your business retain customers.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Product</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-brand-purple">Features</a></li>
              <li><a href="#" className="text-gray-600 hover:text-brand-purple">Pricing</a></li>
              <li><a href="#" className="text-gray-600 hover:text-brand-purple">Case Studies</a></li>
              <li><a href="#" className="text-gray-600 hover:text-brand-purple">Documentation</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-brand-purple">About</a></li>
              <li><a href="#" className="text-gray-600 hover:text-brand-purple">Blog</a></li>
              <li><a href="#" className="text-gray-600 hover:text-brand-purple">Careers</a></li>
              <li><a href="#" className="text-gray-600 hover:text-brand-purple">Contact</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-brand-purple">Privacy</a></li>
              <li><a href="#" className="text-gray-600 hover:text-brand-purple">Terms</a></li>
              <li><a href="#" className="text-gray-600 hover:text-brand-purple">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t pt-8">
          <p className="text-center text-gray-500">
            © {new Date().getFullYear()} Customer Churn Prediction. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 