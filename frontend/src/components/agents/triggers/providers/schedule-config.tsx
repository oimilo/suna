"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Clock, Calendar as CalendarIcon, Info, Zap, Repeat, Timer, Target } from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { TriggerProvider, ScheduleTriggerConfig } from '../types';
import { useAgentWorkflows } from '@/hooks/react-query/agents/use-agent-workflows';

interface ScheduleTriggerConfigFormProps {
  provider: TriggerProvider;
  config: ScheduleTriggerConfig;
  onChange: (config: ScheduleTriggerConfig) => void;
  errors: Record<string, string>;
  agentId: string;
  name: string;
  description: string;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  isActive: boolean;
  onActiveChange: (active: boolean) => void;
}

type ScheduleType = 'quick' | 'recurring' | 'advanced' | 'one-time';

interface QuickPreset {
  name: string;
  cron: string;
  description: string;
  icon: React.ReactNode;
  category: 'frequent' | 'daily' | 'weekly' | 'monthly';
}

const QUICK_PRESETS: QuickPreset[] = [
  { name: 'A cada minuto', cron: '* * * * *', description: 'A cada minuto', icon: <Zap className="h-4 w-4" />, category: 'frequent' },
  { name: 'A cada 5 minutos', cron: '*/5 * * * *', description: 'A cada 5 minutos', icon: <Timer className="h-4 w-4" />, category: 'frequent' },
  { name: 'A cada 15 minutos', cron: '*/15 * * * *', description: 'A cada 15 minutos', icon: <Timer className="h-4 w-4" />, category: 'frequent' },
  { name: 'A cada 30 minutos', cron: '*/30 * * * *', description: 'A cada 30 minutos', icon: <Timer className="h-4 w-4" />, category: 'frequent' },
  { name: 'A cada hora', cron: '0 * * * *', description: 'No início de cada hora', icon: <Clock className="h-4 w-4" />, category: 'frequent' },
  
  { name: 'Diariamente às 9h', cron: '0 9 * * *', description: 'Todos os dias às 9:00', icon: <Target className="h-4 w-4" />, category: 'daily' },
  { name: 'Diariamente às 12h', cron: '0 12 * * *', description: 'Todos os dias às 12:00', icon: <Target className="h-4 w-4" />, category: 'daily' },
  { name: 'Diariamente às 18h', cron: '0 18 * * *', description: 'Todos os dias às 18:00', icon: <Target className="h-4 w-4" />, category: 'daily' },
  { name: 'Duas vezes ao dia', cron: '0 9,17 * * *', description: 'Todos os dias às 9h e 17h', icon: <Repeat className="h-4 w-4" />, category: 'daily' },
  
  { name: 'Dias úteis às 9h', cron: '0 9 * * 1-5', description: 'Segunda a sexta às 9:00', icon: <Target className="h-4 w-4" />, category: 'weekly' },
  { name: 'Segundas de manhã', cron: '0 9 * * 1', description: 'Toda segunda às 9:00', icon: <CalendarIcon className="h-4 w-4" />, category: 'weekly' },
  { name: 'Sextas à tarde', cron: '0 17 * * 5', description: 'Toda sexta às 17:00', icon: <CalendarIcon className="h-4 w-4" />, category: 'weekly' },
  { name: 'Fins de semana de manhã', cron: '0 10 * * 0,6', description: 'Sábado e domingo às 10:00', icon: <CalendarIcon className="h-4 w-4" />, category: 'weekly' },
  
  { name: 'Mensal no dia 1º', cron: '0 9 1 * *', description: 'Primeiro dia do mês às 9:00', icon: <CalendarIcon className="h-4 w-4" />, category: 'monthly' },
  { name: 'Mensal no dia 15', cron: '0 9 15 * *', description: 'Dia 15 do mês às 9:00', icon: <CalendarIcon className="h-4 w-4" />, category: 'monthly' },
  { name: 'Final do mês', cron: '0 9 28-31 * *', description: 'Últimos dias do mês às 9:00', icon: <CalendarIcon className="h-4 w-4" />, category: 'monthly' },
];

const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Europe/Berlin', label: 'Central European Time (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
];

const WEEKDAYS = [
  { value: '1', label: 'Segunda', short: 'Seg' },
  { value: '2', label: 'Terça', short: 'Ter' },
  { value: '3', label: 'Quarta', short: 'Qua' },
  { value: '4', label: 'Quinta', short: 'Qui' },
  { value: '5', label: 'Sexta', short: 'Sex' },
  { value: '6', label: 'Sábado', short: 'Sáb' },
  { value: '0', label: 'Domingo', short: 'Dom' },
];

const MONTHS = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

export const ScheduleTriggerConfigForm: React.FC<ScheduleTriggerConfigFormProps> = ({
  config,
  onChange,
  errors,
  agentId,
  name,
  description,
  onNameChange,
  onDescriptionChange,
  isActive,
  onActiveChange,
}) => {
  const { data: workflows = [], isLoading: isLoadingWorkflows } = useAgentWorkflows(agentId);
  const [scheduleType, setScheduleType] = useState<ScheduleType>('quick');
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  
  const [recurringType, setRecurringType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>(['1', '2', '3', '4', '5']);
  const [selectedMonths, setSelectedMonths] = useState<string[]>(['*']);
  const [dayOfMonth, setDayOfMonth] = useState<string>('1');
  const [scheduleTime, setScheduleTime] = useState<{ hour: string; minute: string }>({ hour: '09', minute: '00' });
  
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [oneTimeTime, setOneTimeTime] = useState<{ hour: string; minute: string }>({ hour: '09', minute: '00' });

  useEffect(() => {
    if (!config.timezone) {
      try {
        const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        onChange({
          ...config,
          timezone: detectedTimezone,
        });
      } catch (error) {
        onChange({
          ...config,
          timezone: 'UTC',
        });
      }
    }
  }, []);

  useEffect(() => {
    if (config.cron_expression) {
      const preset = QUICK_PRESETS.find(p => p.cron === config.cron_expression);
      if (preset) {
        setScheduleType('quick');
        setSelectedPreset(config.cron_expression);
      } else {
        setScheduleType('advanced');
      }
    }
  }, [config.cron_expression]);

  const generateCronExpression = () => {
    if (scheduleType === 'quick' && selectedPreset) {
      return selectedPreset;
    }
    if (scheduleType === 'recurring') {
      const { hour, minute } = scheduleTime;
      switch (recurringType) {
        case 'daily':
          return `${minute} ${hour} * * *`;
        case 'weekly':
          const weekdayStr = selectedWeekdays.join(',');
          return `${minute} ${hour} * * ${weekdayStr}`;
        case 'monthly':
          const monthStr = selectedMonths.includes('*') ? '*' : selectedMonths.join(',');
          return `${minute} ${hour} ${dayOfMonth} ${monthStr} *`;
        default:
          return `${minute} ${hour} * * *`;
      }
    }
    if (scheduleType === 'one-time' && selectedDate) {
      const { hour, minute } = oneTimeTime;
      const day = selectedDate.getDate();
      const month = selectedDate.getMonth() + 1;
      return `${minute} ${hour} ${day} ${month} *`;
    }
    return config.cron_expression || '';
  };

  useEffect(() => {
    const newCron = generateCronExpression();
    if (newCron && newCron !== config.cron_expression) {
      onChange({
        ...config,
        cron_expression: newCron,
      });
    }
  }, [scheduleType, selectedPreset, recurringType, selectedWeekdays, selectedMonths, dayOfMonth, scheduleTime, selectedDate, oneTimeTime]);

  const handlePresetSelect = (preset: QuickPreset) => {
    setSelectedPreset(preset.cron);
    onChange({
      ...config,
      cron_expression: preset.cron,
    });
  };

  const handleAgentPromptChange = (value: string) => {
    onChange({
      ...config,
      agent_prompt: value,
    });
  };

  const handleTimezoneChange = (value: string) => {
    onChange({
      ...config,
      timezone: value,
    });
  };

  const getSchedulePreview = () => {
    if (!config.cron_expression) return null;
    
    try {
      const descriptions: Record<string, string> = {
        '0 9 * * *': 'Todos os dias às 9:00',
        '0 18 * * *': 'Todos os dias às 18:00',
        '0 9 * * 1-5': 'Dias úteis às 9:00',
        '0 10 * * 1-5': 'Dias úteis às 10:00',
        '0 9 * * 1': 'Toda segunda às 9:00',
        '0 9 1 * *': 'Mensal no dia 1º às 9:00',
        '0 */2 * * *': 'A cada 2 horas',
        '*/30 * * * *': 'A cada 30 minutos',
        '0 0 * * *': 'Todos os dias à meia-noite',
        '0 12 * * *': 'Todos os dias ao meio-dia',
      };
      
      return descriptions[config.cron_expression] || config.cron_expression;
    } catch {
      return config.cron_expression;
    }
  };

  const handleExecutionTypeChange = (value: 'agent' | 'workflow') => {
    const newConfig = {
      ...config,
      execution_type: value,
    };
    if (value === 'agent') {
      delete newConfig.workflow_id;
      delete newConfig.workflow_input;
    } else {
      delete newConfig.agent_prompt;
      if (!newConfig.workflow_input) {
        newConfig.workflow_input = { prompt: '' };
      }
    }
    onChange(newConfig);
  };

  const handleWorkflowChange = (workflowId: string) => {
    if (workflowId.startsWith('__')) {
      return;
    }
    onChange({
      ...config,
      workflow_id: workflowId,
    });
  };

  const handleWeekdayToggle = (weekday: string) => {
    setSelectedWeekdays(prev => 
      prev.includes(weekday) 
        ? prev.filter(w => w !== weekday)
        : [...prev, weekday].sort()
    );
  };

  const handleMonthToggle = (month: string) => {
    if (month === '*') {
      setSelectedMonths(['*']);
    } else {
      setSelectedMonths(prev => {
        const filtered = prev.filter(m => m !== '*');
        return filtered.includes(month)
          ? filtered.filter(m => m !== month)
          : [...filtered, month].sort((a, b) => parseInt(a) - parseInt(b));
      });
    }
  };

  const groupedPresets = QUICK_PRESETS.reduce((acc, preset) => {
    if (!acc[preset.category]) acc[preset.category] = [];
    acc[preset.category].push(preset);
    return acc;
  }, {} as Record<string, QuickPreset[]>);

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 p-4 mb-6">
        <p className="text-sm text-muted-foreground">
          Configure quando seu agente deve ser acionado automaticamente. Escolha entre presets rápidos, agendamentos recorrentes ou configure expressões cron avançadas.
        </p>
      </div>
      <div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pr-2">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-black/[0.03] dark:bg-white/[0.05]">
                    <Target className="h-3.5 w-3.5 opacity-70" />
                  </div>
                  Detalhes do Gatilho
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="trigger-name">Nome *</Label>
                    <Input
                      id="trigger-name"
                      value={name}
                      onChange={(e) => onNameChange(e.target.value)}
                      placeholder="Digite um nome para este gatilho"
                      className={errors.name ? 'border-destructive' : ''}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="trigger-description">Descrição</Label>
                    <Textarea
                      id="trigger-description"
                      value={description}
                      onChange={(e) => onDescriptionChange(e.target.value)}
                      placeholder="Descrição opcional para este gatilho"
                      rows={2}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="trigger-active"
                      checked={isActive}
                      onCheckedChange={onActiveChange}
                    />
                    <Label htmlFor="trigger-active">
                      Ativar gatilho imediatamente
                    </Label>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-black/[0.03] dark:bg-white/[0.05]">
                    <Zap className="h-3.5 w-3.5 opacity-70" />
                  </div>
                  Configuração de Execução
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-3 block">
                      Tipo de Execução *
                    </Label>
                    <RadioGroup value={config.execution_type || 'agent'} onValueChange={handleExecutionTypeChange}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="agent" id="execution-agent" />
                        <Label htmlFor="execution-agent">Executar Agente</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="workflow" id="execution-workflow" />
                        <Label htmlFor="execution-workflow">Executar Fluxo de Trabalho</Label>
                      </div>
                    </RadioGroup>
                    <p className="text-xs text-muted-foreground mt-1">
                      Escolha se deseja executar o agente diretamente ou rodar um fluxo de trabalho específico.
                    </p>
                  </div>

                  {config.execution_type === 'workflow' ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="workflow_id" className="text-sm font-medium">
                          Fluxo de Trabalho *
                        </Label>
                        <Select value={config.workflow_id || ''} onValueChange={handleWorkflowChange}>
                          <SelectTrigger className={errors.workflow_id ? 'border-destructive' : ''}>
                            <SelectValue placeholder="Selecione um fluxo de trabalho" />
                          </SelectTrigger>
                          <SelectContent>
                            {isLoadingWorkflows ? (
                              <SelectItem value="__loading__" disabled>Carregando fluxos de trabalho...</SelectItem>
                            ) : workflows.length === 0 ? (
                              <SelectItem value="__no_workflows__" disabled>Nenhum fluxo de trabalho disponível</SelectItem>
                            ) : (
                              workflows.filter(w => w.status === 'active').map((workflow) => (
                                <SelectItem key={workflow.id} value={workflow.id}>
                                  {workflow.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {errors.workflow_id && (
                          <p className="text-xs text-destructive mt-1">{errors.workflow_id}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Selecione o fluxo de trabalho para executar quando acionado.
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="workflow_input" className="text-sm font-medium">
                          Instruções para o Fluxo de Trabalho
                        </Label>
                        <Textarea
                          id="workflow_input"
                          value={config.workflow_input?.prompt || config.workflow_input?.message || ''}
                          onChange={(e) => {
                            onChange({
                              ...config,
                              workflow_input: { prompt: e.target.value },
                            });
                          }}
                          placeholder="Escreva o que você quer que o fluxo de trabalho faça..."
                          rows={4}
                          className={errors.workflow_input ? 'border-destructive' : ''}
                        />
                        {errors.workflow_input && (
                          <p className="text-xs text-destructive mt-1">{errors.workflow_input}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Simplesmente descreva o que você quer que o fluxo de trabalho realize. O fluxo interpretará suas instruções naturalmente.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="agent_prompt" className="text-sm font-medium">
                        Prompt do Agente *
                      </Label>
                      <Textarea
                        id="agent_prompt"
                        value={config.agent_prompt || ''}
                        onChange={(e) => handleAgentPromptChange(e.target.value)}
                        placeholder="Digite o prompt que será enviado ao seu agente quando acionado..."
                        rows={4}
                        className={errors.agent_prompt ? 'border-destructive' : ''}
                      />
                      {errors.agent_prompt && (
                        <p className="text-xs text-destructive mt-1">{errors.agent_prompt}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Este prompt será enviado ao seu agente toda vez que o agendamento for acionado.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-black/[0.03] dark:bg-white/[0.05]">
                    <Clock className="h-3.5 w-3.5 opacity-70" />
                  </div>
                  Configuração de Agendamento
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="timezone" className="text-sm font-medium">
                      Fuso Horário
                      <span className="text-xs text-muted-foreground ml-2">
                        (Detectado automaticamente: {Intl.DateTimeFormat().resolvedOptions().timeZone})
                      </span>
                    </Label>
                    <Select value={config.timezone || 'UTC'} onValueChange={handleTimezoneChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o fuso horário" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            <div className="flex items-center justify-between w-full">
                              <span>{tz.label}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {new Date().toLocaleTimeString('en-US', { 
                                  timeZone: tz.value, 
                                  hour12: false, 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {config.timezone && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Hora atual: {new Date().toLocaleString('pt-BR', { 
                          timeZone: config.timezone, 
                          hour12: true,
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>

                  <Tabs value={scheduleType} onValueChange={(value) => setScheduleType(value as ScheduleType)} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-black/[0.02] dark:bg-white/[0.03] p-1">
                      <TabsTrigger value="quick" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm" title="Agendamentos rápidos pré-definidos">
                        <Zap className="h-3.5 w-3.5" />
                        <span>Rápido</span>
                      </TabsTrigger>
                      <TabsTrigger value="recurring" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm" title="Agendamento recorrente personalizado">
                        <Repeat className="h-3.5 w-3.5" />
                        <span>Recorrente</span>
                      </TabsTrigger>
                      <TabsTrigger value="one-time" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm" title="Executar apenas uma vez">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        <span>Única vez</span>
                      </TabsTrigger>
                      <TabsTrigger value="advanced" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm" title="Expressão cron avançada">
                        <Target className="h-3.5 w-3.5" />
                        <span>Avançado</span>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="quick" className="space-y-4 mt-6">
                      <div className="space-y-4">
                        {Object.entries(groupedPresets).map(([category, presets]) => (
                          <div key={category}>
                            <h4 className="text-sm font-medium mb-3 capitalize">Agendamentos {category === 'frequent' ? 'Frequentes' : category === 'daily' ? 'Diários' : category === 'weekly' ? 'Semanais' : 'Mensais'}</h4>
                            <div className="grid grid-cols-1 gap-2">
                              {presets.map((preset) => (
                                <div
                                  key={preset.cron}
                                  className={cn(
                                    "p-3 rounded-lg cursor-pointer transition-all duration-200",
                                    selectedPreset === preset.cron 
                                      ? "bg-primary/10 border border-primary/20" 
                                      : "bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 hover:bg-muted/30"
                                  )}
                                  onClick={() => handlePresetSelect(preset)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="opacity-60">{preset.icon}</div>
                                    <div className="flex-1">
                                      <div className="font-medium text-sm">{preset.name}</div>
                                      <div className="text-xs text-muted-foreground">{preset.description}</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="recurring" className="space-y-6 mt-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium mb-3 block">Tipo de Agendamento</Label>
                          <RadioGroup value={recurringType} onValueChange={(value) => setRecurringType(value as any)}>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="daily" id="daily" />
                              <Label htmlFor="daily">Diário</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="weekly" id="weekly" />
                              <Label htmlFor="weekly">Semanal</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="monthly" id="monthly" />
                              <Label htmlFor="monthly">Mensal</Label>
                            </div>
                          </RadioGroup>
                        </div>

                        {recurringType === 'weekly' && (
                          <div>
                            <Label className="text-sm font-medium mb-3 block">Dias da Semana</Label>
                            <div className="flex flex-wrap gap-2">
                              {WEEKDAYS.map((day) => (
                                <Button
                                  key={day.value}
                                  variant={selectedWeekdays.includes(day.value) ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleWeekdayToggle(day.value)}
                                >
                                  {day.short}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}

                        {recurringType === 'monthly' && (
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium mb-3 block">Dia do Mês</Label>
                              <Select value={dayOfMonth} onValueChange={setDayOfMonth}>
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 31 }, (_, i) => (
                                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                                      {i + 1}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-sm font-medium mb-3 block">Meses</Label>
                              <div className="space-y-2">
                                <Button
                                  variant={selectedMonths.includes('*') ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleMonthToggle('*')}
                                >
                                  Todos os Meses
                                </Button>
                                <div className="grid grid-cols-3 gap-2">
                                  {MONTHS.map((month) => (
                                    <Button
                                      key={month.value}
                                      variant={selectedMonths.includes(month.value) ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => handleMonthToggle(month.value)}
                                      disabled={selectedMonths.includes('*')}
                                    >
                                      {month.label.slice(0, 3)}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div>
                          <Label className="text-sm font-medium mb-3 block">Horário</Label>
                          <div className="flex gap-2 items-center">
                            <Select value={scheduleTime.hour} onValueChange={(value) => setScheduleTime(prev => ({ ...prev, hour: value }))}>
                              <SelectTrigger className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 24 }, (_, i) => (
                                  <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                                    {i.toString().padStart(2, '0')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span>:</span>
                            <Select value={scheduleTime.minute} onValueChange={(value) => setScheduleTime(prev => ({ ...prev, minute: value }))}>
                              <SelectTrigger className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 60 }, (_, i) => (
                                  <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                                    {i.toString().padStart(2, '0')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="one-time" className="space-y-6 mt-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium mb-3 block">Data</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !selectedDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="h-4 w-4" />
                                {selectedDate ? format(selectedDate, "PPP") : "Escolha uma data"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                disabled={(date) => date < startOfDay(new Date())}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-3 block">Horário</Label>
                          <div className="flex gap-2 items-center">
                            <Select value={oneTimeTime.hour} onValueChange={(value) => setOneTimeTime(prev => ({ ...prev, hour: value }))}>
                              <SelectTrigger className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 24 }, (_, i) => (
                                  <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                                    {i.toString().padStart(2, '0')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span>:</span>
                            <Select value={oneTimeTime.minute} onValueChange={(value) => setOneTimeTime(prev => ({ ...prev, minute: value }))}>
                              <SelectTrigger className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 60 }, (_, i) => (
                                  <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                                    {i.toString().padStart(2, '0')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="advanced" className="space-y-4 mt-6">
                      <div>
                        <Label htmlFor="cron_expression" className="text-sm font-medium">
                          Expressão Cron *
                        </Label>
                        <Input
                          id="cron_expression"
                          type="text"
                          value={config.cron_expression || ''}
                          onChange={(e) => onChange({ ...config, cron_expression: e.target.value })}
                          placeholder="0 9 * * 1-5"
                          className={errors.cron_expression ? 'border-destructive' : ''}
                        />
                        {errors.cron_expression && (
                          <p className="text-xs text-destructive mt-1">{errors.cron_expression}</p>
                        )}
                        {config.cron_expression && !errors.cron_expression && (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ {getSchedulePreview()}
                          </p>
                        )}
                        <div className="mt-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Formato Cron</span>
                              <div className="text-sm text-amber-600/80 dark:text-amber-400/80 space-y-1 mt-2">
                                <div>Formato: <code className="bg-amber-500/20 px-1 rounded text-xs">minuto hora dia mês dia-da-semana</code></div>
                                <div>Exemplo: <code className="bg-amber-500/20 px-1 rounded text-xs">0 9 * * 1-5</code> = Dias úteis às 9h</div>
                                <div>Use <code className="bg-amber-500/20 px-1 rounded text-xs">*</code> para qualquer valor, <code className="bg-amber-500/20 px-1 rounded text-xs">*/5</code> para cada 5 unidades</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                  {config.cron_expression && (
                    <div className="rounded-lg p-4 bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Info className="h-3.5 w-3.5 opacity-60" />
                        Previsão do Agendamento
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{getSchedulePreview()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{config.timezone || 'UTC'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm capitalize">Execução de {config.execution_type === 'workflow' ? 'fluxo de trabalho' : 'agente'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};
