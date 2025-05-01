import React from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const NewsletterSection = () => {
  return (
    <section className="py-16 text-center">
      <div className="container mx-auto px-4">
        <div className="mb-12 max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">Stay Updated</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Subscribe to our newsletter for the latest updates on customer retention strategies and product news.
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 max-w-md mx-auto">
          <Input 
            type="email" 
            placeholder="Enter your email" 
            className="flex-grow md:flex-1"
          />
          <Button className="bg-brand-purple hover:bg-brand-light-purple text-white">
            Subscribe
          </Button>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection; 