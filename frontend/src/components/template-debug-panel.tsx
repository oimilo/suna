'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, RefreshCw, Trash2 } from 'lucide-react';
import { getTemplateDebugLogs, clearTemplateDebugLogs } from '@/lib/onboarding/create-template-project';

interface TemplateDebugPanelProps {
  show: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function TemplateDebugPanel({ show, onClose, onRefresh }: TemplateDebugPanelProps) {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (show) {
      const debugLogs = getTemplateDebugLogs();
      setLogs(debugLogs.reverse()); // Mostrar mais recentes primeiro
    }
  }, [show]);

  if (!show) return null;

  const handleClear = () => {
    clearTemplateDebugLogs();
    setLogs([]);
  };

  const getStepColor = (step: string) => {
    if (step.includes('ERRO')) return 'text-red-600 dark:text-red-400';
    if (step.includes('SUCESSO') || step.includes('✅')) return 'text-emerald-600 dark:text-emerald-400';
    if (step.includes('AGUARDANDO')) return 'text-amber-600 dark:text-amber-400';
    return 'text-blue-600 dark:text-blue-400';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-2xl">
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Template Debug Logs</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="h-7 w-7 p-0"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-7 w-7 p-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-7 w-7 p-0"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-xs text-muted-foreground">Nenhum log disponível</div>
          ) : (
            <div className="space-y-2">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className="p-2 rounded-md bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-xs font-medium ${getStepColor(log.step)}`}>
                      {log.step}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.time).toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="text-xs mt-1 font-mono whitespace-pre-wrap break-all text-muted-foreground">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}