'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Code, Globe, Database, Zap, Sparkles, ArrowRight, ChevronRight } from 'lucide-react';

interface WelcomeFullScreenProps {
  onStart: () => void;
  onSkip: () => void;
}

export function WelcomeFullScreen({ onStart, onSkip }: WelcomeFullScreenProps) {
  const features = [
    { icon: Code, text: 'Criar e editar arquivos' },
    { icon: Globe, text: 'Navegar e extrair dados' },
    { icon: Database, text: 'Executar comandos' },
    { icon: Zap, text: 'Conectar seus apps' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0">
        {/* Gradient orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 rounded-full blur-3xl" />
        
        {/* Floating particles */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/4 right-1/4"
        >
          <Sparkles className="h-6 w-6 text-violet-500/20" />
        </motion.div>
        
        <motion.div
          animate={{
            y: [0, 20, 0],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-1/3 left-1/3"
        >
          <Sparkles className="h-4 w-4 text-indigo-500/20" />
        </motion.div>
      </div>
      
      <div className="relative flex h-full flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl"
        >
          {/* Main Content Container */}
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            
            {/* Left Side - Welcome Text */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex-1 text-center lg:text-left"
            >
              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
              >
                <span className="inline-block text-xs font-medium text-muted-foreground/60 uppercase tracking-[0.3em]">
                  Bem-vindo ao
                </span>
                <h1 className="text-7xl lg:text-8xl font-dancing text-foreground/90 dark:text-foreground/80 leading-none">
                  Prophet
                </h1>
                <p className="text-lg text-muted-foreground max-w-md">
                  Transforme ideias em realidade com o poder da inteligência artificial
                </p>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-3 mt-8"
              >
                <Button
                  size="lg"
                  onClick={onStart}
                  className="group relative overflow-hidden bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0 shadow-lg shadow-indigo-500/25"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Começar Jornada
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Button>
                
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={onSkip}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Já conheço o Prophet
                </Button>
              </motion.div>
            </motion.div>

            {/* Right Side - Features Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex-1 w-full max-w-sm"
            >
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-xl" />
                
                {/* Card */}
                <div className="relative bg-card/50 backdrop-blur border border-border/50 rounded-2xl p-8 shadow-2xl">
                  <h3 className="text-sm font-medium text-muted-foreground mb-6">
                    O que posso fazer por você
                  </h3>
                  
                  <div className="space-y-4">
                    {features.map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                        className="flex items-center gap-3 group"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 group-hover:border-indigo-500/30 transition-colors">
                          <feature.icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className="text-sm text-foreground/80">{feature.text}</span>
                        <ChevronRight className="h-3 w-3 text-muted-foreground/40 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.div>
                    ))}
                  </div>

                  {/* Bottom hint */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="mt-8 pt-6 border-t border-border/50"
                  >
                    <p className="text-xs text-muted-foreground/60 text-center">
                      Responda algumas perguntas rápidas para<br />
                      personalizar sua experiência
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}