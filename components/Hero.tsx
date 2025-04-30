import { Button } from "./ui/button";

const Hero = () => {
  return (
    <section className="py-20">
      <div className="container text-center max-w-3xl mx-auto">
        <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-brand-light-purple">
          Predict Customer Churn with Confidence
        </h1>
        <p className="text-xl text-gray-700 mb-10">
           Turn churn into loyalty with predictive insights that empower you to act before customers leave
        </p>
        <Button className="bg-brand-purple hover:bg-brand-light-purple text-white px-8 py-6 text-lg rounded-md">
          Learn More
        </Button>
      </div>
    </section>
  );
};

export default Hero; 