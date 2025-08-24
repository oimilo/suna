'use client';
import { CTASection } from '@/components/home/sections/cta-section';
import { FAQSection } from '@/components/home/sections/faq-section';
import { FooterSection } from '@/components/home/sections/footer-section';
import { HeroSection } from '@/components/home/sections/hero-section';
import { FeaturesSection } from '@/components/home/sections/features-section';
import { PricingSection } from '@/components/home/sections/pricing-section';
import { IntegrationsSection } from '@/components/home/sections/integrations-section';
import { HowItWorksSection } from '@/components/home/sections/how-it-works-section';
// import { SocialProofSection } from '@/components/home/sections/social-proof-section';
import { ModalProviders } from '@/providers/modal-providers';
import { BackgroundAALChecker } from '@/components/auth/background-aal-checker';

export default function Home() {
  return (
    <>
      <ModalProviders />
      <BackgroundAALChecker>
        <main className="flex flex-col items-center justify-center min-h-screen w-full relative overflow-hidden">
          {/* Dark background with purple light spots - Builder.io inspired */}
          <div className="fixed inset-0 -z-10">
            {/* Base dark gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]" />
            
            {/* Purple/violet light spots for glow effect */}
            {/* Top left purple glow */}
            <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
            
            {/* Center right purple glow */}
            <div className="absolute top-[40%] right-[10%] w-[400px] h-[400px] bg-violet-600/15 rounded-full blur-[100px]" />
            
            {/* Bottom center purple glow */}
            <div className="absolute bottom-[20%] left-[50%] -translate-x-1/2 w-[600px] h-[400px] bg-purple-700/10 rounded-full blur-[120px]" />
            
            {/* Small accent glows */}
            <div className="absolute top-[60%] left-[20%] w-[200px] h-[200px] bg-violet-500/10 rounded-full blur-[80px]" />
            <div className="absolute top-[25%] right-[30%] w-[250px] h-[250px] bg-purple-500/8 rounded-full blur-[90px]" />
            
            {/* Very subtle mesh gradient overlay */}
            <div className="absolute inset-0" 
              style={{
                background: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139, 92, 246, 0.05), transparent)`,
              }} 
            />
            
            {/* Noise texture for depth */}
            <div className="absolute inset-0 opacity-[0.025]" 
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat',
                backgroundSize: '256px 256px'
              }} 
            />
          </div>
          
          <div className="w-full divide-y divide-gray-800/50 relative">
            <HeroSection />
            <div className="bg-black/30 backdrop-blur-sm">
              <HowItWorksSection />
            </div>
            <div className="bg-black/30 backdrop-blur-sm">
              <IntegrationsSection />
            </div>
            <div className="bg-black/30 backdrop-blur-sm">
              <CTASection />
            </div>
            <div className="bg-black/30 backdrop-blur-sm">
              <FeaturesSection />
            </div>
            {/* <CompanyShowcase /> */}
            {/* <BentoSection /> */}
            {/* <QuoteSection /> */}
            {/* <FeatureSection /> */}
            {/* <GrowthSection /> */}
            <div className='flex flex-col items-center px-4 bg-black/30 backdrop-blur-sm'>
              <PricingSection />
            </div>
            {/* <SocialProofSection /> */}
            {/* <TestimonialSection /> */}
            <div className="bg-black/30 backdrop-blur-sm">
              <FAQSection />
            </div>
            <div className="bg-black/40 backdrop-blur-sm">
              <FooterSection />
            </div>
          </div>
        </main>
      </BackgroundAALChecker>
    </>
  );
}
