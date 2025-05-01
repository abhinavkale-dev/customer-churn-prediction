import React from 'react';
import Logo from './Logo';
import { motion } from 'framer-motion';

const Footer = () => {
  return (
    <footer className="bg-gray-100 pt-16 pb-8 text-center">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-center">
              <Logo />
            </div>
            <p className="mt-4 text-gray-600">
              AI-powered customer churn prediction to help your business retain customers.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="font-bold text-lg mb-4">Product</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-brand-purple">Features</a></li>
              <li><a href="#" className="text-gray-600 hover:text-brand-purple">Pricing</a></li>
              <li><a href="#" className="text-gray-600 hover:text-brand-purple">Case Studies</a></li>
              <li><a href="#" className="text-gray-600 hover:text-brand-purple">Documentation</a></li>
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="font-bold text-lg mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-brand-purple">About</a></li>
              <li><a href="#" className="text-gray-600 hover:text-brand-purple">Blog</a></li>
              <li><a href="#" className="text-gray-600 hover:text-brand-purple">Careers</a></li>
              <li><a href="#" className="text-gray-600 hover:text-brand-purple">Contact</a></li>
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="font-bold text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-brand-purple">Privacy</a></li>
              <li><a href="#" className="text-gray-600 hover:text-brand-purple">Terms</a></li>
              <li><a href="#" className="text-gray-600 hover:text-brand-purple">Cookie Policy</a></li>
            </ul>
          </motion.div>
        </div>
        <motion.div 
          className="border-t pt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <p className="text-gray-500">
            © {new Date().getFullYear()} Customer Churn Prediction. All rights reserved.
          </p>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer; 