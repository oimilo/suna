'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Clock, 
  Brain, 
  Users, 
  TrendingDown, 
  Shuffle, 
  Target,
  Bot
} from 'lucide-react';

interface PainPoint {
  id: string;
  icon: any;
  text: string;
  response: string;
  color: string;
}

const PAIN_POINTS: PainPoint[] = [
  {
    id: 'no_time',
    icon: Clock,
    text: 'Perco muito tempo com tarefas manuais',
    response: 'Entendi! Tarefas repetitivas sugando seu tempo? Vou focar em automação então!',
    color: 'from-orange-400 to-red-400'
  },
  {
    id: 'too_complex',
    icon: Brain,
    text: 'Tudo é muito complexo e técnico',
    response: 'Compreendo! Vamos simplificar tudo e fazer funcionar sem complicação!',
    color: 'from-purple-400 to-pink-400'
  },
  {
    id: 'no_clients',
    icon: Users,
    text: 'Ninguém me encontra online',
    response: 'Ah, visibilidade! Vamos fazer você brilhar na internet!',
    color: 'from-blue-400 to-cyan-400'
  },
  {
    id: 'low_conversion',
    icon: TrendingDown,
    text: 'Tenho visitas mas não converto',
    response: 'Conversão é tudo! Vamos transformar visitantes em clientes!',
    color: 'from-green-400 to-emerald-400'
  },
  {
    id: 'disorganized',
    icon: Shuffle,
    text: 'Tudo está bagunçado e espalhado',
    response: 'Organização é poder! Vamos centralizar e estruturar tudo!',
    color: 'from-indigo-400 to-purple-400'
  },
  {
    id: 'no_metrics',
    icon: Target,
    text: 'Não sei o que está funcionando',
    response: 'Dados são essenciais! Vamos medir e entender tudo!',
    color: 'from-amber-400 to-yellow-400'
  }
];

interface PainPointChatProps {
  onAnswer: (answer: string) => void;
  disabled?: boolean;
}

interface Message {
  id: string;
  type: 'bot' | 'user';
  text: string;
  timestamp: Date;
}

export function PainPointChat({ onAnswer, disabled }: PainPointChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      text: 'Oi! Sou o Prophet',
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    // Adiciona segunda mensagem do bot após um delay
    const timer1 = setTimeout(() => {
      setIsTyping(true);
    }, 500);

    const timer2 = setTimeout(() => {
      setMessages(prev => [...prev, {
        id: '2',
        type: 'bot',
        text: 'Qual dessas situações mais te incomoda hoje?',
        timestamp: new Date()
      }]);
      setIsTyping(false);
      setShowOptions(true);
    }, 1500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const handleSelectPain = (pain: PainPoint) => {
    if (disabled) return;

    // Adiciona mensagem do usuário
    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      type: 'user',
      text: pain.text,
      timestamp: new Date()
    }]);

    setShowOptions(false);
    setIsTyping(true);

    // Adiciona resposta do bot
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: `bot-${Date.now()}`,
        type: 'bot',
        text: pain.response,
        timestamp: new Date()
      }]);
      setIsTyping(false);
      
      // Envia resposta após dar tempo para ler
      setTimeout(() => {
        onAnswer(pain.id);
      }, 2500);
    }, 1000);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-background/50 border border-border rounded-2xl h-[400px] flex flex-col">
        {/* Chat Header */}
        <div className="border-b border-border p-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 p-1.5 flex items-center justify-center">
            <Bot className="w-full h-full text-white" />
          </div>
          <div>
            <p className="text-sm font-medium">Prophet Assistant</p>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
        </div>
        
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`
                  max-w-[80%] px-4 py-2 rounded-2xl
                  ${message.type === 'user' 
                    ? 'bg-purple-500 text-white rounded-br-sm' 
                    : 'bg-muted rounded-bl-sm'
                  }
                `}>
                  <p className="text-sm">{message.text}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex justify-start"
              >
                <div className="bg-muted px-4 py-2 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1">
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.4, repeat: Infinity, delay: 0 }}
                      className="w-2 h-2 bg-foreground/50 rounded-full"
                    />
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
                      className="w-2 h-2 bg-foreground/50 rounded-full"
                    />
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.4, repeat: Infinity, delay: 0.4 }}
                      className="w-2 h-2 bg-foreground/50 rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Reply Options */}
        <AnimatePresence>
          {showOptions && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-t border-border p-4"
            >
              <p className="text-xs text-muted-foreground mb-3">Respostas rápidas:</p>
              <div className="grid grid-cols-2 gap-2">
                {PAIN_POINTS.map((pain, index) => (
                  <motion.button
                    key={pain.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSelectPain(pain)}
                    disabled={disabled}
                    className="
                      flex items-center gap-2 px-3 py-2
                      bg-background border border-border rounded-lg
                      hover:bg-purple-500/10 hover:border-purple-500/30
                      transition-colors text-left text-sm
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    <div className={`w-6 h-6 rounded bg-gradient-to-br ${pain.color} p-1 flex items-center justify-center shrink-0`}>
                      <pain.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs line-clamp-2">{pain.text}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}