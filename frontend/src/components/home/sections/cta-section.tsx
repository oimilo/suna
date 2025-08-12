'use client';

import { siteConfig } from '@/lib/home';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function CTASection() {
  const { ctaSection } = siteConfig;

  return (
    <section
      id="cta"
      className="py-24 px-6 relative"
    >
      <div className="max-w-6xl mx-auto">
        <Card className="relative overflow-hidden border-2 bg-gradient-to-br from-muted/50 to-muted/30">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-[0.03]" 
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }} 
          />
          
          {/* Gradient accent */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative p-12 md:p-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left content */}
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {ctaSection.title}
                </h2>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  Transforme horas de trabalho manual em minutos de automação inteligente. 
                  Configure seus primeiros agentes em menos de 5 minutos.
                </p>
                
                {/* Benefits list */}
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm">Teste grátis por 14 dias, sem cartão</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm">Integração com mais de 100 ferramentas</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm">Suporte dedicado para configuração inicial</span>
                  </div>
                </div>
                
                {/* CTA buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href={ctaSection.button.href}
                    className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    {ctaSection.button.text}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  
                  <Link
                    href="#pricing"
                    className="inline-flex items-center justify-center px-6 py-3 border-2 border-border rounded-xl font-medium hover:border-primary/50 hover:bg-muted/50 transition-all duration-300"
                  >
                    Ver planos
                  </Link>
                </div>
                
                <p className="text-sm text-muted-foreground mt-4">
                  {ctaSection.subtext}
                </p>
              </div>
              
              {/* Right content - Visual element */}
              <div className="relative">
                <div className="aspect-square max-w-md mx-auto">
                  {/* Animated circles */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-64 h-64 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 animate-pulse" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-primary/30 to-primary/10 animate-pulse delay-150" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-bl from-primary/40 to-primary/20 animate-pulse delay-300" />
                  </div>
                  
                  {/* Center content */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl font-bold text-primary mb-2">∞</div>
                      <p className="text-sm font-medium text-muted-foreground">Possibilidades infinitas</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
