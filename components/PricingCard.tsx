import React from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Check } from "./icons";
import { motion } from "framer-motion";

interface Feature {
  text: string;
}

interface PricingCardProps {
  title: string;
  description: string;
  price: string;
  features: Feature[];
  highlighted?: boolean;
  delay?: number;
}

const PricingCard: React.FC<PricingCardProps> = ({
  title,
  description,
  price,
  features,
  highlighted = false,
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: delay,
        ease: "easeOut"
      }}
      whileHover={{ y: -10 }}
      className="w-full"
    >
      <Card className={`w-full h-full ${
        highlighted ? 'border-brand-purple bg-brand-purple/5' : ''
      }`}>
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <p className="text-sm text-gray-500">{description}</p>
          <div className="mt-4">
            <span className="text-4xl font-bold">${price}</span>
            <span className="text-gray-500 ml-2">/month</span>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 mb-6">
            {features.map((feature, index) => (
              <motion.li 
                key={index} 
                className="flex items-start"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  duration: 0.2, 
                  delay: delay + 0.1 + (index * 0.05)
                }}
              >
                <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                <span>{feature.text}</span>
              </motion.li>
            ))}
          </ul>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button className={`w-full ${
              highlighted 
                ? 'bg-brand-purple hover:bg-brand-light-purple' 
                : 'bg-brand-purple hover:bg-brand-light-purple'
            }`}>
              Subscribe
            </Button>
          </motion.div>
          <p className="text-center text-sm text-gray-500 mt-3">Cancel anytime</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PricingCard; 