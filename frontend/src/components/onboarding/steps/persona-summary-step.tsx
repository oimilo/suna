'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { StepWrapper } from '../shared/step-wrapper';
import { userContext, updateUserContext } from '../shared/context';
import {
  personaLabels,
  goalOptions,
  focusOptions,
  toneOptions,
} from '../shared/persona-options';

const integrationOptions = [
  {
    id: 'crm-sync',
    label: 'Sincronizar com CRM / Google Sheets',
    description: 'Mantém contatos e leads atualizados automaticamente.',
  },
  {
    id: 'analytics-layer',
    label: 'Camada de analytics',
    description: 'Relatórios e dashboards com métricas principais.',
  },
  {
    id: 'email-automation',
    label: 'Automação de emails',
    description: 'Fluxos de nutrição, follow-ups e notificações.',
  },
];

const findOptionDescription = (id: string | undefined, collection: typeof goalOptions) => {
  if (!id) return '';
  return collection.find((option) => option.id === id)?.description ?? '';
};

export const PersonaSummaryStep = () => {
  const persona = userContext.persona ?? {};
  const [selectedExtras, setSelectedExtras] = useState<string[]>(persona.interests ?? []);

  useEffect(() => {
    updateUserContext({
      persona: {
        ...(persona ?? {}),
        interests: selectedExtras,
      },
    });
  }, [selectedExtras]);

  if (!persona.goal || !persona.focus || !persona.tone) {
    return (
      <StepWrapper>
        <div className="text-center py-12 text-muted-foreground">
          Complete o passo anterior para ver o resumo personalizado.
        </div>
      </StepWrapper>
    );
  }

  const goalLabel = personaLabels.goal[persona.goal];
  const focusLabel = personaLabels.focus[persona.focus];
  const toneLabel = personaLabels.tone[persona.tone];

  return (
    <StepWrapper>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="text-center space-y-3"
        >
          <h2 className="text-3xl font-medium">Seu ponto de partida</h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            Revise e ajuste o foco antes de criarmos o projeto inicial. Você pode escolher integrações
            que queira explorar assim que o workspace estiver pronto.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Resumo das escolhas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-3">
                <SummaryChip
                  label="Objetivo"
                  value={goalLabel}
                  description={findOptionDescription(persona.goal, goalOptions)}
                />
                <SummaryChip
                  label="Foco inicial"
                  value={focusLabel}
                  description={findOptionDescription(persona.focus, focusOptions)}
                />
                <SummaryChip
                  label="Tom"
                  value={toneLabel}
                  description={findOptionDescription(persona.tone, toneOptions)}
                />
              </div>

              {persona.profile && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-primary flex flex-wrap items-center gap-2">
                  <span className="font-medium">Template recomendado:</span>
                  <Badge variant="outline" className="capitalize">
                    {persona.profile.replace(/-/g, ' ')}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Integrações e automações para explorar depois</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {integrationOptions.map((option) => {
                const checked = selectedExtras.includes(option.id);
                return (
                  <label key={option.id} className="flex items-start gap-3">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => {
                        setSelectedExtras((prev) => {
                          if (value) {
                            return prev.includes(option.id) ? prev : [...prev, option.id];
                          }
                          return prev.filter((item) => item !== option.id);
                        });
                      }}
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </label>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </StepWrapper>
  );
};

const SummaryChip = ({
  label,
  value,
  description,
}: {
  label: string;
  value?: string;
  description?: string;
}) => {
  if (!value) return null;

  return (
    <div className="rounded-lg border bg-muted/40 p-4 space-y-1">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="text-base font-semibold text-foreground">{value}</div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
};


