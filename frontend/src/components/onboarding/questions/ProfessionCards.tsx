'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { 
  Rocket, 
  Code2, 
  Palette, 
  TrendingUp, 
  GraduationCap, 
  Building2, 
  Heart, 
  Sparkles, 
  Search,
  CheckCircle2
} from 'lucide-react';

interface ProfessionOption {
  id: string;
  icon: any;
  title: string;
  subtitle: string;
  tags: string[];
  color: string;
}

const PROFESSIONS: ProfessionOption[] = [
  {
    id: 'empreendedor',
    icon: Rocket,
    title: 'Empreendedor',
    subtitle: 'Tenho ou quero ter um negócio',
    tags: ['business', 'startup', 'vendas'],
    color: 'from-orange-400 to-red-400'
  },
  {
    id: 'dev_tech',
    icon: Code2,
    title: 'Dev/Tech',
    subtitle: 'Trabalho com tecnologia',
    tags: ['dev', 'tech', 'programacao'],
    color: 'from-blue-400 to-cyan-400'
  },
  {
    id: 'criativo',
    icon: Palette,
    title: 'Criativo',
    subtitle: 'Designer, creator, marketer',
    tags: ['design', 'content', 'marketing'],
    color: 'from-purple-400 to-pink-400'
  },
  {
    id: 'analista',
    icon: TrendingUp,
    title: 'Analista',
    subtitle: 'Dados são meu forte',
    tags: ['data', 'analytics', 'insights'],
    color: 'from-green-400 to-emerald-400'
  },
  {
    id: 'educador',
    icon: GraduationCap,
    title: 'Educador',
    subtitle: 'Ensino e compartilho',
    tags: ['education', 'teaching', 'courses'],
    color: 'from-amber-400 to-yellow-400'
  },
  {
    id: 'corporativo',
    icon: Building2,
    title: 'Corporativo',
    subtitle: 'Trabalho em empresa',
    tags: ['corporate', 'b2b', 'enterprise'],
    color: 'from-gray-400 to-slate-400'
  },
  {
    id: 'saude',
    icon: Heart,
    title: 'Saúde',
    subtitle: 'Área médica/bem-estar',
    tags: ['health', 'wellness', 'medical'],
    color: 'from-pink-400 to-rose-400'
  },
  {
    id: 'freelancer',
    icon: Sparkles,
    title: 'Freelancer',
    subtitle: 'Trabalho por conta',
    tags: ['freelance', 'autonomo', 'services'],
    color: 'from-violet-400 to-purple-400'
  },
  {
    id: 'explorador',
    icon: Search,
    title: 'Explorador',
    subtitle: 'Ainda descobrindo',
    tags: ['general', 'explore', 'learning'],
    color: 'from-teal-400 to-cyan-400'
  }
];

interface ProfessionCardsProps {
  onAnswer: (answer: string) => void;
  disabled?: boolean;
}

export function ProfessionCards({ onAnswer, disabled }: ProfessionCardsProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [flipped, setFlipped] = useState<string | null>(null);

  const handleSelect = (professionId: string) => {
    if (disabled) return;
    
    setSelected(professionId);
    setFlipped(professionId);
    
    // Aguarda animação do card virando
    setTimeout(() => {
      onAnswer(professionId);
    }, 600);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
      {PROFESSIONS.map((profession, index) => (
        <motion.div
          key={profession.id}
          initial={{ opacity: 0, rotateY: -180 }}
          animate={{ opacity: 1, rotateY: 0 }}
          transition={{ 
            delay: index * 0.05,
            duration: 0.5,
            type: "spring"
          }}
          className="relative h-32 md:h-36 preserve-3d cursor-pointer"
          style={{ transformStyle: 'preserve-3d' }}
          onClick={() => handleSelect(profession.id)}
        >
          <motion.div
            animate={{ 
              rotateY: flipped === profession.id ? 180 : 0,
            }}
            transition={{ duration: 0.6 }}
            style={{ transformStyle: 'preserve-3d' }}
            className="relative w-full h-full"
          >
            {/* Front of card */}
            <motion.div
              className={`
                absolute inset-0 backface-hidden
                bg-gradient-to-br from-background to-background/50 
                border-2 rounded-xl p-4
                flex flex-col items-center justify-center text-center
                transition-all duration-200
                ${selected === profession.id 
                  ? 'border-purple-500 shadow-lg shadow-purple-500/20' 
                  : 'border-border hover:border-purple-500/50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
              `}
              whileHover={!disabled ? { scale: 1.05 } : {}}
              whileTap={!disabled ? { scale: 0.95 } : {}}
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br ${profession.color} p-3 flex items-center justify-center mb-3`}>
                <profession.icon className="w-full h-full text-white" />
              </div>
              <h3 className="font-semibold text-sm md:text-base">{profession.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{profession.subtitle}</p>
            </motion.div>

            {/* Back of card */}
            <div
              className="
                absolute inset-0 backface-hidden
                bg-gradient-to-br from-purple-500 to-pink-500
                rounded-xl p-4
                flex flex-col items-center justify-center
                text-white
              "
              style={{ 
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)'
              }}
            >
              <CheckCircle2 className="w-12 h-12 mb-3 text-white" />
              <p className="font-bold">Perfeito!</p>
              <p className="text-xs opacity-90 mt-1">Vamos nessa!</p>
            </div>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}