'use client';

import React, { useEffect, useState } from 'react';
import { Github } from 'lucide-react';
import { FaWhatsapp, FaTrello } from 'react-icons/fa';
import { SiNotion, SiGooglesheets } from 'react-icons/si';
import { cn } from '@/lib/utils';

// Custom Gmail icon (2020 version)
const GmailIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 256 193" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid">
    <path d="M58.182 192.05V93.14L27.507 65.077L0 49.504v125.091c0 9.658 7.825 17.455 17.455 17.455h40.727z" fill="#4285F4"/>
    <path d="M197.818 192.05h40.727c9.659 0 17.455-7.826 17.455-17.455V49.505l-27.507 15.573-30.675 28.063v98.91z" fill="#34A853"/>
    <path d="M58.182 93.14l-4.174-44.465 4.174-37.946L128 69.868l69.818-59.14 4.174 37.946-4.174 44.465L128 144.423z" fill="#EA4335"/>
    <path d="M197.818 10.729V93.14L256 49.504V26.614c0-21.585-24.64-33.89-41.89-20.945l-16.292 13.06z" fill="#FBBC04"/>
    <path d="M0 49.504l58.182 43.636V10.729l-16.291-13.06C24.64-15.276 0 -2.971 0 18.614v30.89z" fill="#C5221F"/>
  </svg>
);

// Custom Slack icon (2019 version)
const SlackIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 127 127" xmlns="http://www.w3.org/2000/svg">
    <path d="M27.2 80c0 7.3-5.9 13.2-13.2 13.2C6.7 93.2.8 87.3.8 80c0-7.3 5.9-13.2 13.2-13.2h13.2V80zm6.6 0c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v33c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V80z" fill="#E01E5A"/>
    <path d="M47 27c-7.3 0-13.2-5.9-13.2-13.2C33.8 6.5 39.7.6 47 .6c7.3 0 13.2 5.9 13.2 13.2V27H47zm0 6.7c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H13.9C6.6 60.1.7 54.2.7 46.9c0-7.3 5.9-13.2 13.2-13.2H47z" fill="#36C5F0"/>
    <path d="M99.9 46.9c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H99.9V46.9zm-6.6 0c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V13.8C66.9 6.5 72.8.6 80.1.6c7.3 0 13.2 5.9 13.2 13.2v33.1z" fill="#2EB67D"/>
    <path d="M80.1 99.8c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V99.8h13.2zm0-6.6c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h33.1c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H80.1z" fill="#ECB22E"/>
  </svg>
);

interface FloatingPill {
  id: string;
  Icon: React.ElementType;
  color?: string;
  prompt: string;
  position: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  lineEnd: {
    x: string;
    y: string;
  };
}

const pills: FloatingPill[] = [
  {
    id: 'github',
    Icon: Github,
    prompt: 'Monitore meu repositório no GitHub e me avise no Slack quando houver novos pull requests',
    position: { top: '10%', left: '5%' },
    lineEnd: { x: '41%', y: '47%' },
  },
  {
    id: 'gmail',
    Icon: GmailIcon,
    prompt: 'Todo dia às 8h da manhã me envie um resumo dos e-mails não lidos mais recentes',
    position: { top: '15%', right: '8%' },
    lineEnd: { x: '59%', y: '49%' },
  },
  {
    id: 'slack',
    Icon: SlackIcon,
    prompt: 'Crie um bot no Slack que responda perguntas sobre a documentação do projeto',
    position: { bottom: '20%', left: '3%' },
    lineEnd: { x: '42%', y: '53%' },
  },
  {
    id: 'notion',
    Icon: SiNotion,
    prompt: 'Sincronize automaticamente tarefas do Notion com o Google Calendar',
    position: { bottom: '15%', right: '5%' },
    lineEnd: { x: '58%', y: '51%' },
  },
  {
    id: 'whatsapp',
    Icon: FaWhatsapp,
    color: 'text-green-500',
    prompt: 'Envie notificações no WhatsApp quando receber novos pedidos na loja',
    position: { top: '55%', left: '-5%' },
    lineEnd: { x: '44%', y: '51%' },
  },
  {
    id: 'sheets',
    Icon: SiGooglesheets,
    color: 'text-green-600',
    prompt: 'Atualize minha planilha no Google Sheets sempre que houver uma nova venda',
    position: { bottom: '35%', right: '-6%' },
    lineEnd: { x: '56%', y: '52%' },
  },
  {
    id: 'trello',
    Icon: FaTrello,
    color: 'text-blue-600',
    prompt: 'Sempre que houver movimento em uma coluna do Trello me notifique no WhatsApp',
    position: { top: '38%', left: '-5%' },
    lineEnd: { x: '43%', y: '49%' },
  },
];

interface FloatingPillsProps {
  onPillClick?: (prompt: string) => void;
}

export function FloatingPills({ onPillClick }: FloatingPillsProps) {
  const [visiblePills, setVisiblePills] = useState<string[]>([]);
  const [activePills, setActivePills] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Show pills one by one initially
    pills.forEach((pill, index) => {
      setTimeout(() => {
        setVisiblePills(prev => [...prev, pill.id]);
      }, index * 400 + 800);
    });

    // After all pills are shown, start cycling through groups
    setTimeout(() => {
      // Define pill groups for cycling
      const pillGroups = [
        ['gmail', 'sheets'],
        ['github', 'notion'],
        ['whatsapp', 'trello'],
        ['slack', 'gmail', 'github'],
        ['notion', 'sheets', 'whatsapp'],
        ['trello', 'slack'],
        ['github', 'gmail', 'notion', 'trello'],
        ['sheets', 'whatsapp', 'slack'],
      ];

      let currentGroupIndex = 0;

      const cycleInterval = setInterval(() => {
        setActivePills(pillGroups[currentGroupIndex]);
        currentGroupIndex = (currentGroupIndex + 1) % pillGroups.length;
      }, 2500); // Change groups every 2.5 seconds

      // Start with first group
      setActivePills(pillGroups[0]);

      return () => clearInterval(cycleInterval);
    }, pills.length * 400 + 1500); // Wait for all pills to appear first

    return () => {};
  }, [mounted]);

  if (!mounted) return null;

  const getLinePoints = (pill: FloatingPill) => {
    // Create polyline points with corners for some pills
    // Using numeric values for viewBox 0 0 100 100
    let points = '';
    const endX = parseFloat(pill.lineEnd.x.replace('%', ''));
    const endY = parseFloat(pill.lineEnd.y.replace('%', ''));
    
    // Calculate direction to stop 5px before chat input (in viewBox units)
    // 5px in viewBox units is approximately 1.5 units
    const offset = 2; // Offset in viewBox units to stop before chat input
    
    if (pill.id === 'github') {
      // Top left - L-shaped path (right then down)
      const adjustedEndX = endX - offset;
      const adjustedEndY = endY - offset;
      points = `8,33 25,33 ${adjustedEndX},${adjustedEndY}`;
    } else if (pill.id === 'gmail') {
      // Top right - L-shaped path (left then down)
      const adjustedEndX = endX + offset;
      const adjustedEndY = endY - offset;
      points = `90,35 75,35 ${adjustedEndX},${adjustedEndY}`;
    } else if (pill.id === 'slack') {
      // Bottom left - L-shaped path (right then up)
      const adjustedEndX = endX - offset;
      const adjustedEndY = endY + offset;
      points = `6,63 25,63 ${adjustedEndX},${adjustedEndY}`;
    } else if (pill.id === 'notion') {
      // Bottom right - L-shaped path (left then up)
      const adjustedEndX = endX + offset;
      const adjustedEndY = endY + offset;
      points = `93,66 75,66 ${adjustedEndX},${adjustedEndY}`;
    } else if (pill.id === 'whatsapp') {
      // Left middle - L-shaped path (right then slight adjustment)
      const adjustedEndX = endX - offset;
      points = `-5,56 15,56 ${adjustedEndX},${endY}`;
    } else if (pill.id === 'sheets') {
      // Right middle-bottom - L-shaped path (left then slight adjustment)
      const adjustedEndX = endX + offset;
      points = `103,56 85,56 ${adjustedEndX},${endY}`;
    } else if (pill.id === 'trello') {
      // Top left middle - L-shaped path (right then down)
      const adjustedEndX = endX - offset;
      points = `-2,47 18,47 ${adjustedEndX},${endY}`;
    }
    
    return points;
  };

  return (
    <>
      {/* SVG Lines Container */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="pillLine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgb(109 40 217)" stopOpacity="0.2" />
            <stop offset="50%" stopColor="rgb(109 40 217)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="rgb(109 40 217)" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="pulseLine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(147 51 234)" stopOpacity="0">
              <animate attributeName="stopOpacity" values="0;0;0.8;0;0" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="20%" stopColor="rgb(168 85 247)" stopOpacity="0.8">
              <animate attributeName="stopOpacity" values="0;0.8;0;0;0" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="rgb(147 51 234)" stopOpacity="0">
              <animate attributeName="stopOpacity" values="0;0;0;0;0" dur="3s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
          <linearGradient id="pulseLineBlue" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(29 78 216)" stopOpacity="0">
              <animate attributeName="stopOpacity" values="0;0;0.8;0;0" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="20%" stopColor="rgb(37 99 235)" stopOpacity="0.8">
              <animate attributeName="stopOpacity" values="0;0.8;0;0;0" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="rgb(29 78 216)" stopOpacity="0">
              <animate attributeName="stopOpacity" values="0;0;0;0;0" dur="3s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
          <linearGradient id="pulseLineGreen" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(21 128 61)" stopOpacity="0">
              <animate attributeName="stopOpacity" values="0;0;0.8;0;0" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="20%" stopColor="rgb(34 197 94)" stopOpacity="0.8">
              <animate attributeName="stopOpacity" values="0;0.8;0;0;0" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="rgb(21 128 61)" stopOpacity="0">
              <animate attributeName="stopOpacity" values="0;0;0;0;0" dur="3s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
          <linearGradient id="pulseLineRed" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(185 28 28)" stopOpacity="0">
              <animate attributeName="stopOpacity" values="0;0;0.8;0;0" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="20%" stopColor="rgb(239 68 68)" stopOpacity="0.8">
              <animate attributeName="stopOpacity" values="0;0.8;0;0;0" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="rgb(185 28 28)" stopOpacity="0">
              <animate attributeName="stopOpacity" values="0;0;0;0;0" dur="3s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
          <linearGradient id="pulseLineYellow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(180 83 9)" stopOpacity="0">
              <animate attributeName="stopOpacity" values="0;0;0.8;0;0" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="20%" stopColor="rgb(251 191 36)" stopOpacity="0.8">
              <animate attributeName="stopOpacity" values="0;0.8;0;0;0" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="rgb(180 83 9)" stopOpacity="0">
              <animate attributeName="stopOpacity" values="0;0;0;0;0" dur="3s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
          <linearGradient id="pulseLineGray" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(156 163 175)" stopOpacity="0">
              <animate attributeName="stopOpacity" values="0;0;0.8;0;0" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="20%" stopColor="rgb(209 213 219)" stopOpacity="0.8">
              <animate attributeName="stopOpacity" values="0;0.8;0;0;0" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="rgb(156 163 175)" stopOpacity="0">
              <animate attributeName="stopOpacity" values="0;0;0;0;0" dur="3s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
        </defs>
        
        {pills.map((pill) => {
          const isVisible = visiblePills.includes(pill.id);
          const isActive = activePills.includes(pill.id);
          const points = getLinePoints(pill);
          
          return (
            <g key={`line-${pill.id}`}>
              {/* Main solid line - thin like reference */}
              <polyline
                points={points}
                fill="none"
                stroke={
                  pill.id === 'gmail' ? "rgb(239 68 68)" :
                  pill.id === 'slack' ? "rgb(251 191 36)" :
                  pill.id === 'trello' ? "rgb(37 99 235)" : 
                  pill.id === 'whatsapp' ? "rgb(34 197 94)" :
                  pill.id === 'sheets' ? "rgb(34 197 94)" :
                  pill.id === 'notion' ? "rgb(209 213 219)" :
                  "rgb(168 85 247)"
                }
                strokeWidth="0.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={cn(
                  "transition-all duration-1000",
                  isVisible && isActive ? "opacity-60" : "opacity-0"
                )}
              />
              {/* Pulse effect - gradient traveling wave */}
              <polyline
                points={points}
                fill="none"
                stroke={
                  pill.id === 'gmail' ? "url(#pulseLineRed)" :
                  pill.id === 'slack' ? "url(#pulseLineYellow)" :
                  pill.id === 'trello' ? "url(#pulseLineBlue)" : 
                  pill.id === 'whatsapp' ? "url(#pulseLineGreen)" :
                  pill.id === 'sheets' ? "url(#pulseLineGreen)" :
                  pill.id === 'notion' ? "url(#pulseLineGray)" :
                  "url(#pulseLine)"
                }
                strokeWidth="0.3"
                strokeDasharray="10,90"
                strokeLinecap="round"
                className={cn(
                  "transition-opacity duration-500",
                  isVisible && isActive ? "opacity-100" : "opacity-0"
                )}
                style={{
                  animation: isVisible && isActive ? `pulse-line ${
                    // Different durations for variety
                    pill.id === 'github' ? '2.5s' :
                    pill.id === 'gmail' ? '3.2s' :
                    pill.id === 'slack' ? '2.8s' :
                    pill.id === 'notion' ? '3.5s' :
                    pill.id === 'whatsapp' ? '2.3s' :
                    pill.id === 'trello' ? '3.8s' :
                    '3s'
                  } linear ${
                    // Staggered delays that create overlapping pulses
                    pill.id === 'github' ? '0s' :
                    pill.id === 'gmail' ? '0.8s' :
                    pill.id === 'slack' ? '1.5s' :
                    pill.id === 'notion' ? '0.3s' :
                    pill.id === 'whatsapp' ? '2.1s' :
                    pill.id === 'trello' ? '1.2s' :
                    '0.5s'
                  } infinite` : 'none',
                  filter: 'blur(0.5px)'
                }}
              />
            </g>
          );
        })}
      </svg>

      {/* Floating Pills */}
      {pills.map((pill) => {
        const Icon = pill.Icon;
        const isVisible = visiblePills.includes(pill.id);
        const isActive = activePills.includes(pill.id);
        
        return (
          <div
            key={pill.id}
            onClick={() => onPillClick?.(pill.prompt)}
            className={cn(
              "absolute flex items-center justify-center",
              "w-12 h-12",
              "bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm",
              "rounded-xl shadow-lg",
              "transition-all duration-700 ease-out",
              "cursor-pointer",
              isVisible ? "scale-100" : "scale-50",
              isVisible ? (isActive ? "opacity-100" : "opacity-30") : "opacity-0",
              "hover:scale-110 hover:shadow-xl hover:opacity-100"
            )}
            style={{
              ...pill.position,
              zIndex: 2,
              border: pill.id === 'gmail'
                ? (isVisible && isActive ? '1px solid rgba(239, 68, 68, 0.8)' : '1px solid rgba(239, 68, 68, 0.2)')
                : pill.id === 'slack'
                ? (isVisible && isActive ? '1px solid rgba(251, 191, 36, 0.8)' : '1px solid rgba(251, 191, 36, 0.2)')
                : pill.id === 'trello' 
                ? (isVisible && isActive ? '1px solid rgba(37, 99, 235, 0.8)' : '1px solid rgba(37, 99, 235, 0.2)')
                : pill.id === 'whatsapp'
                ? (isVisible && isActive ? '1px solid rgba(34, 197, 94, 0.8)' : '1px solid rgba(34, 197, 94, 0.2)')
                : pill.id === 'sheets'
                ? (isVisible && isActive ? '1px solid rgba(34, 197, 94, 0.8)' : '1px solid rgba(34, 197, 94, 0.2)')
                : pill.id === 'notion'
                ? (isVisible && isActive ? '1px solid rgba(209, 213, 219, 0.8)' : '1px solid rgba(209, 213, 219, 0.2)')
                : (isVisible && isActive ? '1px solid rgba(168, 85, 247, 0.8)' : '1px solid rgba(168, 85, 247, 0.2)'),
              animation: isVisible ? `float ${
                // Different float durations for natural movement
                pill.id === 'github' ? '3.5s' :
                pill.id === 'gmail' ? '4s' :
                pill.id === 'slack' ? '3.2s' :
                pill.id === 'notion' ? '4.2s' :
                pill.id === 'whatsapp' ? '3.8s' :
                pill.id === 'trello' ? '3.3s' :
                pill.id === 'sheets' ? '4.5s' :
                '3s'
              } ease-in-out ${
                // Different delays for staggered floating
                pill.id === 'github' ? '0.2s' :
                pill.id === 'gmail' ? '0.8s' :
                pill.id === 'slack' ? '1.4s' :
                pill.id === 'notion' ? '0.5s' :
                pill.id === 'whatsapp' ? '1.1s' :
                pill.id === 'trello' ? '0.9s' :
                pill.id === 'sheets' ? '1.7s' :
                '0s'
              } infinite` : 'none',
            }}
          >
            <Icon 
              className={cn(
                "w-6 h-6",
                pill.color || "text-gray-700 dark:text-gray-300"
              )}
            />
          </div>
        );
      })}
    </>
  );
}