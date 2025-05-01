import { Button } from "./ui/button";
import { motion } from "framer-motion";

const Hero = () => {
  return (
    <section className="py-20">
      <div className="container text-center max-w-3xl mx-auto">
        <motion.h1 
          className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-brand-light-purple"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          Predict Customer Churn with Confidence
        </motion.h1>
        <motion.p 
          className="text-xl text-gray-700 mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
           Turn churn into loyalty with predictive insights that empower you to act before customers leave
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button className="bg-brand-purple hover:bg-brand-light-purple text-white px-8 py-6 text-lg rounded-md">
            Learn More
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero; 