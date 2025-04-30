'use client';
import Hero from '@/components/Hero';
import PricingSection from '@/components/PricingSection';
import NewsletterSection from '@/components/NewsletterSection';
import Footer from '@/components/Footer';
import Header from '@/components/Header';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Hero />
      <PricingSection />
      <NewsletterSection />
      <Footer />
    </div>
  );
}

