'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function AgentBuilderIntro() {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  
  const fullText = `Olá! 👋 Eu sou o Agent Builder, seu assistente especializado em criar agentes de IA personalizados.

Posso ajudá-lo a criar agentes que:
• 🤖 Automatizam tarefas repetitivas
• 📊 Analisam dados e geram relatórios
• 🔍 Fazem pesquisas e monitoram informações
• 📧 Integram com Gmail, Slack, Notion e mais de 2700 ferramentas
• ⏰ Executam processos agendados automaticamente

Como posso ajudá-lo hoje? Descreva o que você gostaria que seu agente fizesse e eu cuidarei de toda a configuração!`;

  useEffect(() => {
    let currentIndex = 0;
    const typingSpeed = 15; // ms por caractere (velocidade média de digitação de IA)
    
    const typingInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typingInterval);
      }
    }, typingSpeed);

    return () => clearInterval(typingInterval);
  }, [fullText]);

  return (
    <div className="mx-auto max-w-3xl md:px-8 min-w-0">
      <div className="space-y-8 min-w-0">
        <div>
          <div className="flex flex-col gap-2">
            {/* Cabeçalho do assistente - espelhando o layout original */}
            <div className="flex items-center">
              <div className="rounded-md flex items-center justify-center relative">
                <div className="h-5 w-5 flex items-center justify-center rounded text-xs">
                  <span className="text-lg">🤖</span>
                </div>
              </div>
              <p className="ml-2 text-sm text-muted-foreground">
                Agent Builder
              </p>
            </div>
            
            {/* Conteúdo da mensagem */}
            <div className="flex max-w-[90%] text-sm break-words overflow-hidden">
              <div className="space-y-2 min-w-0 flex-1">
                <div>
                  <div className="prose prose-sm dark:prose-invert chat-markdown max-w-none [&>:first-child]:mt-0 prose-headings:mt-3 break-words overflow-hidden">
                    <div className="whitespace-pre-wrap">
                      {displayedText}
                      {isTyping && (
                        <span className="inline-block h-4 w-0.5 bg-primary ml-0.5 -mb-1 animate-pulse" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}