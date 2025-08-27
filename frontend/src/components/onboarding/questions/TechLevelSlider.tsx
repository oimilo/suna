'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Baby, GraduationCap, Briefcase, Zap } from 'lucide-react';

interface TechLevelSliderProps {
  onAnswer: (answer: number) => void;
  disabled?: boolean;
}

const LEVELS = [
  {
    range: [0, 24],
    icon: Baby,
    title: 'Iniciante Total',
    description: 'Uso computador para o básico',
    color: 'from-green-400 to-emerald-400',
    skills: ['Templates prontos', 'Interface visual', 'Suporte completo']
  },
  {
    range: [25, 49],
    icon: GraduationCap,
    title: 'Aprendiz',
    description: 'Já mexi em algumas ferramentas',
    color: 'from-blue-400 to-cyan-400',
    skills: ['Personalização visual', 'Integrações simples', 'Tutoriais']
  },
  {
    range: [50, 74],
    icon: Briefcase,
    title: 'Profissional',
    description: 'Trabalho com tech regularmente',
    color: 'from-purple-400 to-pink-400',
    skills: ['Integrações avançadas', 'APIs', 'Customização']
  },
  {
    range: [75, 100],
    icon: Zap,
    title: 'Ninja',
    description: 'Codifico de olhos fechados',
    color: 'from-orange-400 to-red-400',
    skills: ['Acesso total ao código', 'Deploy customizado', 'DevOps']
  }
];

export function TechLevelSlider({ onAnswer, disabled }: TechLevelSliderProps) {
  const [value, setValue] = useState(50);
  const [hasInteracted, setHasInteracted] = useState(false);

  const getCurrentLevel = () => {
    return LEVELS.find(level => 
      value >= level.range[0] && value <= level.range[1]
    ) || LEVELS[0];
  };

  const handleChange = (newValue: number) => {
    setValue(newValue);
    setHasInteracted(true);
  };

  const handleConfirm = () => {
    if (disabled) return;
    onAnswer(value);
  };

  const currentLevel = getCurrentLevel();
  const Icon = currentLevel.icon;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Visual Level Display */}
      <div className="text-center">
        <motion.div
          key={currentLevel.title}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 15 }}
          className="inline-block"
        >
          <div className={`
            w-32 h-32 mx-auto mb-4 rounded-full
            bg-gradient-to-br ${currentLevel.color}
            flex items-center justify-center shadow-xl
          `}>
            <Icon className="w-16 h-16 text-white" />
          </div>
        </motion.div>

        <motion.div
          key={`${currentLevel.title}-text`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-2xl font-bold mb-2">{currentLevel.title}</h3>
          <p className="text-muted-foreground">{currentLevel.description}</p>
        </motion.div>
      </div>

      {/* Slider */}
      <div className="space-y-4">
        <div className="relative">
          {/* Gradient background for slider track */}
          <div className="absolute inset-0 h-3 top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-green-400 via-purple-400 to-red-400 opacity-20" />
          
          <input
            type="range"
            min="0"
            max="100"
            value={value}
            onChange={(e) => handleChange(Number(e.target.value))}
            disabled={disabled}
            className="
              w-full h-3 rounded-full appearance-none cursor-pointer
              bg-transparent relative z-10
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-6
              [&::-webkit-slider-thumb]:h-6
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-white
              [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-purple-500
              [&::-webkit-slider-thumb]:shadow-lg
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:transition-all
              [&::-webkit-slider-thumb]:hover:scale-110
              [&::-moz-range-thumb]:appearance-none
              [&::-moz-range-thumb]:w-6
              [&::-moz-range-thumb]:h-6
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-white
              [&::-moz-range-thumb]:border-2
              [&::-moz-range-thumb]:border-purple-500
              [&::-moz-range-thumb]:shadow-lg
              [&::-moz-range-thumb]:cursor-pointer
              [&::-moz-range-thumb]:transition-all
              [&::-moz-range-thumb]:hover:scale-110
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          />
          
          {/* Progress fill */}
          <div 
            className="absolute h-3 top-1/2 -translate-y-1/2 left-0 rounded-full bg-gradient-to-r from-green-400 to-purple-400 pointer-events-none"
            style={{ width: `${value}%` }}
          />
        </div>

        {/* Level markers */}
        <div className="flex justify-between px-2">
          {LEVELS.map((level, index) => (
            <div 
              key={index}
              className="flex flex-col items-center gap-1"
            >
              <div className={`
                w-2 h-2 rounded-full
                ${value >= level.range[0] && value <= level.range[1] 
                  ? 'bg-purple-500' 
                  : 'bg-muted'
                }
              `} />
              <span className="text-xs text-muted-foreground hidden md:block">
                {level.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Skills Unlocked */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: hasInteracted ? 1 : 0.5 }}
        className="space-y-2"
      >
        <p className="text-sm text-muted-foreground text-center">
          Recursos desbloqueados:
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {currentLevel.skills.map((skill, index) => (
            <motion.span
              key={skill}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="
                px-3 py-1 text-xs rounded-full
                bg-purple-500/10 border border-purple-500/20
              "
            >
              {skill}
            </motion.span>
          ))}
        </div>
      </motion.div>

      {/* Confirm Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: hasInteracted ? 1 : 0 }}
        onClick={handleConfirm}
        disabled={disabled || !hasInteracted}
        className="
          w-full py-3 rounded-lg font-medium
          bg-gradient-to-r from-purple-500 to-pink-500 text-white
          hover:from-purple-600 hover:to-pink-600
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all
        "
      >
        Confirmar: {currentLevel.title} ({value}%)
      </motion.button>
    </div>
  );
}