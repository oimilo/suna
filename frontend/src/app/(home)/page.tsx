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
        <main className="flex flex-col items-center justify-center min-h-screen w-full">
          <div className="w-full divide-y divide-border">
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
