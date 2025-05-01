import React from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { motion } from "framer-motion";

const NewsletterSection = () => {
  return (
    <section className="py-16 text-center">
      <div className="container mx-auto px-4">
        <motion.div 
          className="mb-12 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
        >
          <motion.h2 
            className="text-4xl font-bold mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Stay Updated
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Subscribe to our newsletter for the latest updates on customer retention strategies and product news.
          </motion.p>
        </motion.div>
        <motion.div 
          className="flex flex-col md:flex-row gap-4 max-w-md mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Input 
            type="email" 
            placeholder="Enter your email" 
            className="flex-grow md:flex-1"
          />
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button className="bg-brand-purple hover:bg-brand-light-purple text-white">
              Subscribe
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default NewsletterSection; 