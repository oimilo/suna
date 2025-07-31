'use client';

import { useEffect, useState } from 'react';
import { CTASection } from '@/components/home/sections/cta-section';
import { FAQSection } from '@/components/home/sections/faq-section';
import { FooterSection } from '@/components/home/sections/footer-section';
import { HeroSection } from '@/components/home/sections/hero-section';
import { PricingSection } from '@/components/home/sections/pricing-section';
import { IntegrationsSection } from '@/components/home/sections/integrations-section';
import { HowItWorksSection } from '@/components/home/sections/how-it-works-section';
import { SocialProofSection } from '@/components/home/sections/social-proof-section';
import { ModalProviders } from '@/providers/modal-providers';
import { BackgroundAALChecker } from '@/components/auth/background-aal-checker';

export default function Home() {
  return (
    <>
      <ModalProviders />
      <BackgroundAALChecker>
        <main className="flex flex-col items-center justify-center min-h-screen w-full relative overflow-hidden">
          {/* Elegant gradient background with light spots */}
          <div className="fixed inset-0 -z-10">
            {/* Base gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-300 via-gray-200 to-gray-300 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" />
            
            {/* Light spots for luminosity effect */}
            <div className="absolute top-20 left-20 w-96 h-96 bg-white/50 dark:bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-40 right-40 w-80 h-80 bg-white/60 dark:bg-gray-800/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/40 dark:bg-white/5 rounded-full blur-3xl" />
            
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.02]" 
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
              }} 
            />
          </div>
          
          <div className="w-full divide-y divide-border relative">
            <HeroSection />
            <IntegrationsSection />
            <HowItWorksSection />
            {/* <CompanyShowcase /> */}
            {/* <BentoSection /> */}
            {/* <QuoteSection /> */}
            {/* <FeatureSection /> */}
            {/* <GrowthSection /> */}
            <div className='flex flex-col items-center px-4'>
              <PricingSection />
            </div>
            <SocialProofSection />
            {/* <TestimonialSection /> */}
            <FAQSection />
            <CTASection />
            <FooterSection />
          </div>
        </main>
      </BackgroundAALChecker>
    </>
  );
}
