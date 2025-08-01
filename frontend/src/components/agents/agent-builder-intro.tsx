'use client';

import React, { useState, useEffect } from 'react';

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
    <div className="w-full h-full flex flex-col items-start justify-start overflow-y-auto scrollbar-hide">
      <div className="w-full mx-auto max-w-3xl px-4 md:px-8 pt-8">
        <div className="space-y-8">
          <div>
            <div className="flex flex-col gap-2">
              {/* Cabeçalho do assistente */}
              <div className="flex items-center">
                <p className="text-sm text-muted-foreground">
                  Agent Builder
                </p>
              </div>
              
              {/* Conteúdo da mensagem */}
              <div className="flex max-w-[90%] text-sm break-words overflow-hidden">
                <div className="space-y-2 min-w-0 flex-1">
                  <div>
                    <div className="prose prose-sm dark:prose-invert chat-markdown max-w-none [&>:first-child]:mt-0 prose-headings:mt-3 break-words overflow-hidden">
                      <p className="whitespace-pre-wrap mb-0">
                        {displayedText}
                        {isTyping && (
                          <span className="inline-block h-4 w-0.5 bg-primary ml-0.5 -mb-1 animate-pulse" />
                        )}
                      </p>
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