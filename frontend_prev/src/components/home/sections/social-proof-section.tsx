'use client';

import { useState } from 'react';
import { Users, Clock, Zap, Star, TrendingUp, Award, Building2, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const stats = [
  {
    icon: <Users className="w-6 h-6" />,
    value: '10.000+',
    label: 'Usuários ativos',
    gradient: 'from-blue-500 to-blue-600',
    bgGradient: 'from-blue-500/20 to-blue-600/10',
    description: 'Empresas confiam no Prophet'
  },
  {
    icon: <Clock className="w-6 h-6" />,
    value: '500k+',
    label: 'Horas economizadas',
    gradient: 'from-emerald-500 to-emerald-600',
    bgGradient: 'from-emerald-500/20 to-emerald-600/10',
    description: 'De trabalho manual automatizado'
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    value: '85%',
    label: 'Aumento em produtividade',
    gradient: 'from-purple-500 to-purple-600',
    bgGradient: 'from-purple-500/20 to-purple-600/10',
    description: 'Relatado pelos nossos clientes'
  },
  {
    icon: <Star className="w-6 h-6" />,
    value: '4.9/5',
    label: 'Avaliação média',
    gradient: 'from-amber-500 to-amber-600',
    bgGradient: 'from-amber-500/20 to-amber-600/10',
    description: 'De satisfação dos usuários'
  }
];

const testimonials = [
  {
    quote: "O Prophet transformou completamente nossa operação. O que antes levava horas de trabalho manual, agora é feito automaticamente em minutos.",
    author: "Carlos Mendes",
    role: "CEO",
    company: "TechHub Brasil",
    industry: "Tecnologia",
    image: null,
    highlight: "horas → minutos"
  },
  {
    quote: "A facilidade de criar automações complexas sem código é impressionante. Nossa equipe economiza 30 horas por semana com o Prophet.",
    author: "Ana Paula Santos",
    role: "Diretora de Operações",
    company: "E-commerce Plus",
    industry: "Varejo",
    image: null,
    highlight: "30 horas/semana"
  },
  {
    quote: "Integrar WhatsApp, planilhas e emails nunca foi tão simples. O Prophet é essencial para nossa comunicação com clientes.",
    author: "Roberto Silva",
    role: "Gerente de Vendas",
    company: "Consultoria Prime",
    industry: "Serviços",
    image: null,
    highlight: "comunicação unificada"
  }
];

export function SocialProofSection() {
  const [hoveredStat, setHoveredStat] = useState<number | null>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  return (
    <section className="py-32 px-6 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/10 to-background" />
      
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-[0.02]" 
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} 
      />
      
      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Award className="w-4 h-4" />
            RESULTADOS COMPROVADOS
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Números que falam por si
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Milhares de empresas já transformaram suas operações com o Prophet
          </p>
        </div>

        {/* Stats Grid with enhanced design */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-24">
          {stats.map((stat, index) => (
            <div
              key={index}
              onMouseEnter={() => setHoveredStat(index)}
              onMouseLeave={() => setHoveredStat(null)}
              className="group relative"
            >
              <Card className="h-full border-2 hover:border-primary/30 transition-all duration-300 overflow-hidden">
                {/* Background gradient on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <CardContent className="relative p-6 text-center">
                  {/* Icon with gradient background */}
                  <div className="mb-4 inline-block">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-lg transform transition-transform duration-300 group-hover:scale-110`}>
                      {stat.icon}
                    </div>
                  </div>
                  
                  {/* Value with animation */}
                  <div className="mb-2">
                    <div className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                  </div>
                  
                  {/* Label */}
                  <div className="text-sm font-medium mb-2">
                    {stat.label}
                  </div>
                  
                  {/* Description (visible on hover) */}
                  <div className={`text-xs text-muted-foreground transition-all duration-300 ${
                    hoveredStat === index ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
                  }`}>
                    {stat.description}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Testimonials Section */}
        <div className="relative">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold mb-4">O que nossos clientes dizem</h3>
            <p className="text-muted-foreground">Histórias reais de transformação digital</p>
          </div>
          
          {/* Testimonial Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={index} 
                className="relative overflow-hidden border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-xl"
              >
                {/* Quote icon */}
                <div className="absolute top-6 right-6">
                  <Quote className="w-8 h-8 text-muted-foreground/10" />
                </div>
                
                <CardContent className="p-8">
                  {/* Industry badge */}
                  <Badge variant="secondary" className="mb-6 bg-primary/10 text-primary border-0">
                    {testimonial.industry}
                  </Badge>
                  
                  {/* Quote */}
                  <blockquote className="text-base leading-relaxed mb-6">
                    "{testimonial.quote}"
                  </blockquote>
                  
                  {/* Highlight */}
                  {testimonial.highlight && (
                    <div className="mb-6">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-primary/10 to-primary/5 rounded-full">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-primary">
                          {testimonial.highlight}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Author info */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role} • {testimonial.company}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-20 text-center">
          <p className="text-sm text-muted-foreground mb-8">Confiança de empresas líderes em seus segmentos</p>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-32 h-12 bg-muted rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground text-sm">Logo {i}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}