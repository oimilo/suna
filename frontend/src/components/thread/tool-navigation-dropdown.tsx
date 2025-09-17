'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronRight, FileText, Code, Terminal, Globe, Rocket, CheckCircle, CircleDashed, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { getToolIcon, getUserFriendlyToolName } from './utils';

export interface ToolCallSnapshot {
  id: string;
  toolCall: {
    assistantCall: {
      name?: string;
      content?: any;
    };
    toolResult?: {
      content?: string;
      isSuccess?: boolean;
    };
  };
}

interface ProcessedToolCall {
  index: number;
  name: string;
  displayName: string;
  category: 'delivery' | 'technical';
  isMainDelivery: boolean;
  icon: React.ReactNode;
  status: 'success' | 'error' | 'running' | 'pending';
  fileName?: string;
}

interface ToolNavigationDropdownProps {
  toolCallSnapshots: ToolCallSnapshot[];
  currentIndex: number;
  mainDeliveryIndex: number;
  onNavigate: (index: number) => void;
  showTechnicalDetails: boolean;
  onToggleTechnicalDetails: () => void;
  isTechnicalOperation: (name?: string) => boolean;
  isDeliveryMoment: (toolCall: any) => boolean;
}

export function ToolNavigationDropdown({
  toolCallSnapshots,
  currentIndex,
  mainDeliveryIndex,
  onNavigate,
  showTechnicalDetails,
  onToggleTechnicalDetails,
  isTechnicalOperation,
  isDeliveryMoment
}: ToolNavigationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Processa e agrupa tool calls
  const processToolCalls = (): { deliveries: ProcessedToolCall[], technical: ProcessedToolCall[] } => {
    const deliveries: ProcessedToolCall[] = [];
    const technical: ProcessedToolCall[] = [];

    toolCallSnapshots.forEach((snapshot, idx) => {
      const name = snapshot.toolCall?.assistantCall?.name || '';
      const content = snapshot.toolCall?.assistantCall?.content;
      
      // Extrai nome do arquivo se for create-file
      let fileName: string | undefined;
      if (name === 'create_file' || name === 'full_file_rewrite') {
        const contentStr = typeof content === 'string' ? content : JSON.stringify(content || '');
        const fileMatch = contentStr.match(/file[_\-]?(?:path|name)?["\s:=]+["']?([^"'\s]+\.[a-z]+)/i);
        if (fileMatch) {
          fileName = fileMatch[1].split('/').pop();
        }
      }

      // Determina status usando a mesma lógica da topbar
      let status: ProcessedToolCall['status'] = 'success'; // Default é sucesso
      
      if (snapshot.toolCall?.toolResult?.content === 'STREAMING') {
        status = 'running';
      } else {
        // Usa a mesma lógica complexa do getActualSuccess do tool-call-side-panel
        const getActualSuccess = (toolCall: any): boolean => {
          const content = toolCall?.toolResult?.content;
          if (!content) return toolCall?.toolResult?.isSuccess ?? true;

          const safeParse = (data: any) => {
            try { return typeof data === 'string' ? JSON.parse(data) : data; }
            catch { return null; }
          };

          const parsed = safeParse(content);
          if (!parsed) return toolCall?.toolResult?.isSuccess ?? true;

          // Check if there's a nested content field that needs another parse
          if (parsed.content) {
            const inner = safeParse(parsed.content);
            if (inner?.tool_execution?.result?.success !== undefined) {
              return inner.tool_execution.result.success;
            }
          }
          
          const success = parsed.tool_execution?.result?.success ??
            parsed.result?.success ??
            parsed.success;

          return success !== undefined ? success : (toolCall?.toolResult?.isSuccess ?? true);
        };

        const isSuccess = getActualSuccess(snapshot.toolCall);
        status = isSuccess ? 'success' : 'error';
      }

      const IconComponent = getToolIcon(name);
      // Para create-file, mostra apenas o nome do arquivo
      let displayName = getUserFriendlyToolName(name);
      if ((name === 'create_file' || name === 'full_file_rewrite') && fileName) {
        displayName = fileName;
      }
      
      const processed: ProcessedToolCall = {
        index: idx,
        name,
        displayName,
        category: isTechnicalOperation(name) ? 'technical' : 'delivery',
        isMainDelivery: idx === mainDeliveryIndex,
        icon: <IconComponent className="h-3.5 w-3.5 opacity-60" />,
        status,
        fileName
      };

      // Verifica se é momento de entrega
      if (isDeliveryMoment(snapshot.toolCall) || processed.isMainDelivery) {
        processed.category = 'delivery';
        deliveries.push(processed);
      } else if (processed.category === 'technical') {
        technical.push(processed);
      } else {
        // Outros casos vão para deliveries
        deliveries.push(processed);
      }
    });

    // Ordena deliveries por importância
    deliveries.sort((a, b) => {
      if (a.isMainDelivery) return -1;
      if (b.isMainDelivery) return 1;
      return a.index - b.index;
    });

    return { deliveries, technical };
  };

  const { deliveries, technical } = processToolCalls();
  
  // Determina o que mostrar quando fechado
  const getClosedLabel = () => {
    const current = [...deliveries, ...technical].find(t => t.index === currentIndex);
    
    if (current?.isMainDelivery) {
      return (
        <span className="flex items-center gap-2">
          <div className="opacity-70">
            {current.icon}
          </div>
          <span className="text-[13px]">{current.displayName}</span>
          <div className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            Principal
          </div>
        </span>
      );
    }
    
    if (current?.category === 'delivery') {
      return (
        <span className="flex items-center gap-2">
          <div className="opacity-60">
            {current.icon}
          </div>
          <span className="text-[13px]">{current.displayName}</span>
        </span>
      );
    }
    
    // Para operações técnicas, mostra com contador
    const technicalIndex = technical.findIndex(t => t.index === currentIndex) + 1;
    return (
      <span className="flex items-center gap-2 text-muted-foreground/70">
        <div className="opacity-50">
          {current?.icon || <Terminal className="h-3.5 w-3.5" />}
        </div>
        <span className="text-[13px]">{current?.displayName || 'Processando'}</span>
        {technical.length > 0 && (
          <span className="text-[10px] opacity-50">({technicalIndex}/{technical.length})</span>
        )}
      </span>
    );
  };

  const handleItemClick = (index: number) => {
    onNavigate(index);
    setIsOpen(false);
  };

  const getStatusIcon = (status: ProcessedToolCall['status'], isMainDelivery: boolean = false) => {
    // Para entrega principal com estrela, não mostra checkmark duplicado
    if (isMainDelivery) {
      return null;
    }
    
    switch (status) {
      case 'running':
        return <CircleDashed className="h-3 w-3 animate-spin text-blue-500 opacity-60" />;
      case 'error':
        // Erro real (muito raro) - só aparece se explicitamente falhou
        return <X className="h-3 w-3 text-red-500 opacity-40" />;
      default:
        // Sucesso é o padrão
        return <CheckCircle className="h-3 w-3 text-emerald-500 opacity-60" />;
    }
  };

  return (
    <div ref={dropdownRef} className="relative inline-block">
      {/* Botão Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg",
          "bg-black/[0.01] dark:bg-white/[0.02]",
          "border border-black/4 dark:border-white/5",
          "hover:bg-black/[0.02] dark:hover:bg-white/[0.03]",
          "hover:border-black/6 dark:hover:border-white/8",
          "transition-all duration-200",
          "min-w-[180px] justify-between"
        )}
      >
        {getClosedLabel()}
        <ChevronUp className={cn(
          "h-3.5 w-3.5 opacity-40 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Dropup Lista (abre para cima) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute bottom-full mb-2 min-w-[280px] max-w-[360px]",
              "bg-background/95 backdrop-blur-sm",
              "border border-black/5 dark:border-white/6",
              "rounded-xl shadow-xl overflow-hidden",
              "z-50"
            )}
          >
            {/* Seção de Entregas */}
            {deliveries.length > 0 && (
              <div className="border-b border-black/4 dark:border-white/6">
                <div className="px-4 py-2.5 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest">
                  Entregas Principais
                </div>
                <div className="py-1">
                  {deliveries.map((item) => (
                    <button
                      key={item.index}
                      onClick={() => handleItemClick(item.index)}
                      className={cn(
                        "w-full px-4 py-2.5 flex items-center gap-3 text-left",
                        "hover:bg-black/[0.03] dark:hover:bg-white/[0.04]",
                        "transition-colors duration-150",
                        item.index === currentIndex && "bg-black/[0.05] dark:bg-white/[0.06]",
                        item.isMainDelivery && "bg-emerald-500/[0.03] border-l-2 border-emerald-500/40"
                      )}
                    >
                      <div className="flex items-center gap-2.5 flex-1">
                        <div className="opacity-70">
                          {item.icon}
                        </div>
                        <span className={cn(
                          "text-[13px] leading-relaxed",
                          item.isMainDelivery ? "font-medium text-foreground" : "text-foreground/90"
                        )}>
                          {item.displayName}
                        </span>
                        {/* Tag principal para arquivo principal */}
                        {item.isMainDelivery && (
                          <div className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ml-1">
                            Principal
                          </div>
                        )}
                      </div>
                      <div className="opacity-50">
                        {getStatusIcon(item.status, item.isMainDelivery)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Seção Técnica */}
            {technical.length > 0 && (
              <div className="py-1">
                <button
                  onClick={onToggleTechnicalDetails}
                  className={cn(
                    "w-full px-4 py-2.5 flex items-center gap-2",
                    "text-[11px] text-muted-foreground/60",
                    "hover:bg-black/[0.02] dark:hover:bg-white/[0.02]",
                    "transition-colors duration-150"
                  )}
                >
                  <ChevronRight className={cn(
                    "h-3 w-3 transition-transform duration-200 opacity-50",
                    showTechnicalDetails && "rotate-90"
                  )} />
                  <span>Processo Técnico ({technical.length} operações)</span>
                </button>
                
                {showTechnicalDetails && (
                  <div className="max-h-[180px] overflow-y-auto pb-1">
                    {technical.map((item, idx) => (
                      <button
                        key={item.index}
                        onClick={() => handleItemClick(item.index)}
                        className={cn(
                          "w-full px-6 py-2 flex items-center gap-2.5 text-left",
                          "text-[11px] text-muted-foreground/50",
                          "hover:text-muted-foreground/70 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]",
                          "transition-all duration-150",
                          item.index === currentIndex && "text-muted-foreground/80 bg-black/[0.03] dark:bg-white/[0.03]"
                        )}
                      >
                        <span className="opacity-40 text-[10px] w-4">{idx + 1}.</span>
                        <div className="opacity-60">
                          {item.icon}
                        </div>
                        <span className="truncate flex-1">{item.displayName}</span>
                        <div className="opacity-40">
                          {item.status === 'running' ? (
                            <CircleDashed className="h-2.5 w-2.5 animate-spin text-muted-foreground" />
                          ) : item.status === 'error' ? (
                            <X className="h-2.5 w-2.5 text-red-500/50" />
                          ) : (
                            <CheckCircle className="h-2.5 w-2.5 text-muted-foreground" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Se não houver nada */}
            {deliveries.length === 0 && technical.length === 0 && (
              <div className="px-4 py-6 text-xs text-muted-foreground/50 text-center">
                Nenhuma operação disponível
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}