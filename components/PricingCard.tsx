import React from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Check } from "./icons";

interface Feature {
  text: string;
}

interface PricingCardProps {
  title: string;
  description: string;
  price: string;
  features: Feature[];
  highlighted?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({
  title,
  description,
  price,
  features,
  highlighted = false,
}) => {
  return (
    <Card className={`w-full ${
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
            <li key={index} className="flex items-start">
              <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
              <span>{feature.text}</span>
            </li>
          ))}
        </ul>
        <Button className={`w-full ${
          highlighted 
            ? 'bg-brand-purple hover:bg-brand-light-purple' 
            : 'bg-brand-purple hover:bg-brand-light-purple'
        }`}>
          Subscribe
        </Button>
        <p className="text-center text-sm text-gray-500 mt-3">Cancel anytime</p>
      </CardContent>
    </Card>
  );
};

export default PricingCard; 