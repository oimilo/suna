'use client';

import { Users, Clock, Zap, Star } from 'lucide-react';

const stats = [
  {
    icon: <Users className="w-6 h-6" />,
    value: '1.000+',
    label: 'Usuários ativos',
    color: 'text-blue-500'
  },
  {
    icon: <Clock className="w-6 h-6" />,
    value: '50k+',
    label: 'Horas economizadas',
    color: 'text-green-500'
  },
  {
    icon: <Zap className="w-6 h-6" />,
    value: '100+',
    label: 'Integrações disponíveis',
    color: 'text-purple-500'
  },
  {
    icon: <Star className="w-6 h-6" />,
    value: '4.9/5',
    label: 'Avaliação média',
    color: 'text-yellow-500'
  }
];

export function SocialProofSection() {
  return (
    <section className="py-16 px-6 bg-muted/20">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-background border mb-4 ${stat.color}`}>
                {stat.icon}
              </div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
        
        {/* Testimonial */}
        <div className="mt-16 text-center">
          <blockquote className="text-xl text-muted-foreground italic max-w-3xl mx-auto">
            "O Prophet transformou completamente nossa operação. O que antes levava horas de trabalho manual, agora é feito automaticamente. É como ter um assistente 24/7."
          </blockquote>
          <div className="mt-4">
            <p className="font-semibold">Maria Silva</p>
            <p className="text-sm text-muted-foreground">CEO, TechStartup BR</p>
          </div>
        </div>
      </div>
    </section>
  );
}