'use client';

import React, { useState, useEffect, useRef } from 'react';

const INTRO_MESSAGES = [
  "Olá! Eu sou o Prophet, vou te ajudar a configurar seu novo agente",
  "Vamos transformar este agente em algo especial, personalizado para suas necessidades",
  "Me conte que tipo de tarefas você quer que ele execute",
  "Posso configurar integrações com Gmail, Slack, Notion, Google Calendar e mais de 2700 serviços",
  "Como você gostaria que seu agente te ajudasse no dia a dia?"
];

export function AgentBuilderIntro() {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [showDots, setShowDots] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const messages = INTRO_MESSAGES;

  useEffect(() => {
    if (currentMessageIndex >= messages.length) return;
    
    const currentMessage = messages[currentMessageIndex];
    let currentIndex = 0;
    const typingSpeed = 15; // ms por caractere
    
    // Reset para nova mensagem
    setDisplayedText('');
    setIsTyping(true);
    setShowDots(false);
    
    const typingInterval = setInterval(() => {
      if (currentIndex < currentMessage.length) {
        setDisplayedText(currentMessage.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typingInterval);
        
        // Se não for a última mensagem, mostrar dots e depois próxima mensagem
        if (currentMessageIndex < messages.length - 1) {
          setTimeout(() => {
            setShowDots(true);
            setTimeout(() => {
              setCurrentMessageIndex(prev => prev + 1);
            }, 1500); // Tempo dos dots
          }, 800); // Pausa após mensagem
        }
      }
    }, typingSpeed);

    return () => clearInterval(typingInterval);
  }, [currentMessageIndex, messages]);
  
  // Auto scroll quando nova mensagem aparece
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [currentMessageIndex, showDots]);

  return (
    <div className="w-full h-full flex flex-col items-start justify-start overflow-y-auto scrollbar-hide">
      <div className="w-full mx-auto max-w-3xl px-4 md:px-8 pt-8">
        <div className="space-y-4">
          {/* Renderizar todas as mensagens anteriores */}
          {messages.slice(0, currentMessageIndex).map((message, index) => (
            <div key={index}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center">
                  <p className="text-sm text-muted-foreground">
                    Prophet
                  </p>
                </div>
                <div className="flex max-w-[90%] text-sm break-words overflow-hidden">
                  <div className="space-y-2 min-w-0 flex-1">
                    <div>
                      <div className="prose prose-sm dark:prose-invert chat-markdown max-w-none [&>:first-child]:mt-0 prose-headings:mt-3 break-words overflow-hidden">
                        <p className="whitespace-pre-wrap mb-0">
                          {message}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Mensagem atual sendo digitada */}
          {currentMessageIndex < messages.length && (
            <div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center">
                  <p className="text-sm text-muted-foreground">
                    Prophet
                  </p>
                </div>
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
          )}
          
          {/* Three dots indicando próxima mensagem */}
          {showDots && (
            <div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center">
                  <p className="text-sm text-muted-foreground">
                    Prophet
                  </p>
                </div>
                <div className="flex max-w-[90%] text-sm break-words overflow-hidden">
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex gap-1 items-center h-6">
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={scrollRef} />
      </div>
    </div>
  );
}