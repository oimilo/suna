'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  TrendingUp, 
  Palette, 
  Beaker 
} from 'lucide-react';

interface ObjectiveLevel {
  id: string;
  icon: any;
  label: string;
  message: string;
  color: string;
}

const OBJECTIVE_LEVELS: ObjectiveLevel[] = [
  {
    id: 'sell_online',
    icon: ShoppingCart,
    label: 'Vender Online',
    message: 'Perfeito! Vamos criar algo que converta visitantes em clientes!',
    color: 'from-green-400 to-emerald-400'
  },
  {
    id: 'scale_business',
    icon: TrendingUp,
    label: 'Escalar Negócio',
    message: 'Excelente! Vamos automatizar e crescer seu negócio!',
    color: 'from-blue-400 to-cyan-400'
  },
  {
    id: 'portfolio',
    icon: Palette,
    label: 'Portfolio/Presença',
    message: 'Ótimo! Vamos criar algo que impressione e destaque seu trabalho!',
    color: 'from-purple-400 to-pink-400'
  },
  {
    id: 'test_idea',
    icon: Beaker,
    label: 'Testar Ideia',
    message: 'Legal! Vamos validar sua ideia com um MVP rápido e eficaz!',
    color: 'from-orange-400 to-red-400'
  }
];

interface ObjectiveSelectionProps {
  onAnswer: (answer: string) => void;
  disabled?: boolean;
}

export function ObjectiveSelection({ onAnswer, disabled }: ObjectiveSelectionProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleSelect = (objectiveId: string) => {
    if (disabled) return;
    
    setSelected(objectiveId);
    
    // Aguarda animação
    setTimeout(() => {
      onAnswer(objectiveId);
    }, 800);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Objective Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {OBJECTIVE_LEVELS.map((level, index) => (
          <motion.button
            key={level.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              delay: index * 0.1,
              type: "spring",
              damping: 15
            }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSelect(level.id)}
            onMouseEnter={() => setHoveredId(level.id)}
            onMouseLeave={() => setHoveredId(null)}
            disabled={disabled}
            className="relative group"
          >
            {/* Background Glow */}
            <div className={`
              absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100
              bg-gradient-to-br ${level.color} blur-xl
              transition-opacity duration-300
            `} />
            
            {/* Button Content */}
            <div className={`
              relative p-6 rounded-2xl border-2 transition-all duration-200
              ${selected === level.id 
                ? `bg-gradient-to-br ${level.color} text-white border-transparent shadow-xl` 
                : 'bg-background border-border hover:border-purple-500/50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}>
              {/* Icon */}
              <motion.div
                animate={selected === level.id ? {
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                } : {}}
                transition={{ duration: 0.5 }}
                className="mb-3"
              >
                <div className={`w-14 h-14 md:w-16 md:h-16 mx-auto rounded-2xl bg-gradient-to-br ${level.color} p-3 flex items-center justify-center`}>
                  <level.icon className="w-full h-full text-white" />
                </div>
              </motion.div>
              
              {/* Label */}
              <p className={`
                text-sm font-medium
                ${selected === level.id ? 'text-white' : 'text-foreground'}
              `}>
                {level.label}
              </p>
            </div>

            {/* Selection Ring Animation */}
            <AnimatePresence>
              {selected === level.id && (
                <motion.div
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.1, opacity: 1 }}
                  exit={{ scale: 1.2, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={`
                    w-full h-full rounded-2xl border-2 border-purple-500
                    animate-pulse
                  `} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Particle Effects on Selection */}
            <AnimatePresence>
              {selected === level.id && (
                <>
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute top-1/2 left-1/2 w-2 h-2 bg-purple-400 rounded-full"
                      initial={{ x: 0, y: 0, opacity: 1 }}
                      animate={{
                        x: Math.cos(i * 60 * Math.PI / 180) * 100,
                        y: Math.sin(i * 60 * Math.PI / 180) * 100,
                        opacity: 0
                      }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  ))}
                </>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>

      {/* Message Display */}
      <AnimatePresence mode="wait">
        {(selected || hoveredId) && (
          <motion.div
            key={selected || hoveredId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className={`
              inline-block px-6 py-3 rounded-2xl
              ${selected 
                ? 'bg-purple-500/20 border border-purple-500/30' 
                : 'bg-muted/50 border border-border'
              }
            `}>
              <p className={`
                text-sm
                ${selected ? 'text-purple-400 font-medium' : 'text-muted-foreground'}
              `}>
                {OBJECTIVE_LEVELS.find(l => l.id === (selected || hoveredId))?.message}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visual Progress Representation */}
      <div className="flex justify-center gap-2">
        {OBJECTIVE_LEVELS.map((level, index) => (
          <motion.div
            key={level.id}
            initial={{ width: 0 }}
            animate={{ 
              width: selected === level.id ? 100 : 20,
              backgroundColor: selected === level.id ? '#a855f7' : '#374151'
            }}
            transition={{ duration: 0.3 }}
            className="h-1 rounded-full"
          />
        ))}
      </div>
    </div>
  );
}