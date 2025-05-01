import React from 'react';
import PricingCard from './PricingCard';

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
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Choose Your Plan</h2>
          <p className="text-xl text-gray-600">
            Select the perfect plan for your business needs. All plans include our core prediction engine.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <PricingCard
            title="Free Plan"
            description="Free tier with limited features."
            price="0"
            features={freePlanFeatures}
          />
          <PricingCard
            title="Basic Plan"
            description="Basic tier for regular users."
            price="100"
            features={basicPlanFeatures}
            highlighted
          />
          <PricingCard
            title="Pro Plan"
            description="Pro tier for power users."
            price="300"
            features={proPlanFeatures}
          />
        </div>
      </div>
    </section>
  );
};

export default PricingSection; 