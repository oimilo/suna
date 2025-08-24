'use client';

import { siteConfig } from '@/lib/home';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export function CTASection() {
  const { ctaSection } = siteConfig;

  return (
    <section className="relative w-full min-h-[50vh] flex items-center px-6 overflow-hidden">
      {/* Intense gradient background for impact */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/50 via-violet-900/60 to-purple-900/50" />
      
      {/* Large animated glow for depth */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px]">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/40 via-violet-600/50 to-purple-600/40 blur-[150px] animate-pulse" />
      </div>
      
      {/* Grid pattern overlay for texture */}
      <div className="absolute inset-0 opacity-[0.02]" 
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} 
      />
      
      <div className="max-w-7xl mx-auto relative z-10 w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col lg:flex-row items-center justify-between gap-12"
        >
          {/* Left side - Text content */}
          <div className="flex-1 text-center lg:text-left">
            {/* Title with stronger presence */}
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 leading-tight"
            >
              Comece a automatizar{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-400 to-purple-400 animate-gradient">
                hoje mesmo
              </span>
            </motion.h2>
            
            {/* Subtitle - simplified */}
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl lg:text-2xl text-gray-300"
            >
              Sem cartão. Configure em 5 minutos.
            </motion.p>
          </div>

          {/* Right side - Optimized CTA buttons */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            {/* Primary CTA - Following best practices */}
            <Link
              href={ctaSection.button.href}
              className="group relative inline-flex items-center justify-center gap-2 px-10 py-5 rounded-lg font-bold text-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {/* Solid gradient background for better contrast */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-violet-600 rounded-lg" />
              
              {/* Subtle glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-violet-600 rounded-lg blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-200" />
              
              {/* White text for maximum contrast */}
              <span className="relative text-white">
                {ctaSection.button.text}
              </span>
              <ArrowRight className="relative w-5 h-5 text-white group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
            
            {/* Secondary CTA - Ghost style */}
            <Link
              href="#pricing"
              className="group inline-flex items-center justify-center px-10 py-5 rounded-lg font-bold text-lg border-2 border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/30 transition-all duration-200"
            >
              <span className="text-white/90 group-hover:text-white transition-colors">
                Ver planos
              </span>
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Corner glows for depth */}
      <div className="absolute top-0 left-0 w-96 h-96">
        <div className="w-full h-full bg-purple-600/20 rounded-full blur-[150px]" />
      </div>
      <div className="absolute bottom-0 right-0 w-96 h-96">
        <div className="w-full h-full bg-violet-600/20 rounded-full blur-[150px]" />
      </div>

      {/* Gradient animation */}
      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          animation: gradient 4s ease infinite;
          background-size: 200% 200%;
        }
      `}</style>
    </section>
  );
}
