import React from 'react';
import PricingCard from './PricingCard';
import { motion } from 'framer-motion';

const PricingSection = () => {
  const freePlanFeatures = [
    { text: 'Basic churn analysis' },
    { text: 'Up to 100 customers' },
    { text: 'Email support' },
    { text: 'Weekly reports' },
  ];

  const basicPlanFeatures = [
    { text: 'Advanced churn analysis' },
    { text: 'Up to 1,000 customers' },
    { text: 'Priority email support' },
    { text: 'Daily reports' },
    { text: 'Customer segmentation' },
  ];

  const proPlanFeatures = [
    { text: 'Enterprise churn analysis' },
    { text: 'Unlimited customers' },
    { text: '24/7 phone support' },
    { text: 'Real-time reports' },
    { text: 'Advanced segmentation' },
    { text: 'Custom integrations' },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <motion.h2 
            className="text-4xl font-bold mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Choose Your Plan
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Select the perfect plan for your business needs. All plans include our core prediction engine.
          </motion.p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <PricingCard
            title="Free Plan"
            description="Free tier with limited features."
            price="0"
            features={freePlanFeatures}
            delay={0.2}
          />
          <PricingCard
            title="Basic Plan"
            description="Basic tier for regular users."
            price="100"
            features={basicPlanFeatures}
            highlighted
            delay={0.4}
          />
          <PricingCard
            title="Pro Plan"
            description="Pro tier for power users."
            price="300"
            features={proPlanFeatures}
            delay={0.6}
          />
        </div>
      </div>
    </section>
  );
};

export default PricingSection; 