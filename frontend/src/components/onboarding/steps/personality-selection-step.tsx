'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { StepWrapper } from '../shared/step-wrapper';
import { userContext, updateUserContext } from '../shared/context';
import {
  type PersonaOption,
  goalOptions,
  focusOptions,
  toneOptions,
  profileByGoalFocus,
} from '../shared/persona-options';

const OptionGroup = ({
  title,
  subtitle,
  options,
  selectedId,
  onSelect,
}: {
  title: string;
  subtitle: string;
  options: PersonaOption[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-4"
    >
      <div className="text-center space-y-1">
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {options.map((option) => {
          const isSelected = selectedId === option.id;
          return (
            <Button
              key={option.id}
              type="button"
              variant={isSelected ? 'default' : 'outline'}
              className="h-auto justify-start text-left py-4 px-5 flex flex-col gap-1"
              onClick={() => onSelect(option.id)}
            >
              <span className="text-base font-medium">{option.title}</span>
              <span className="text-sm text-muted-foreground">{option.description}</span>
            </Button>
          );
        })}
      </div>
    </motion.div>
  );
};

export const PersonalitySelectionStep = () => {
  const initialPersona = userContext.persona ?? {};
  const [goal, setGoal] = useState<string | undefined>(initialPersona.goal);
  const [focus, setFocus] = useState<string | undefined>(initialPersona.focus);
  const [tone, setTone] = useState<string | undefined>(initialPersona.tone);

  const updatePersona = (updates: Partial<NonNullable<typeof initialPersona>>) => {
    const previous = userContext.persona ?? {};
    updateUserContext({ persona: { ...previous, ...updates } });
  };

  useEffect(() => {
    if (goal) {
      updatePersona({ goal });
    }
  }, [goal]);

  useEffect(() => {
    if (focus) {
      updatePersona({ focus });
    }
  }, [focus]);

  useEffect(() => {
    if (tone) {
      updatePersona({ tone });
    }
  }, [tone]);

  const profile = useMemo(() => {
    if (!goal || !focus) return undefined;
    return profileByGoalFocus[`${goal}:${focus}`] ?? 'website-general';
  }, [goal, focus]);

  useEffect(() => {
    if (profile) {
      updatePersona({ profile });
    }
  }, [profile]);

  return (
    <StepWrapper>
      <div className="space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-center space-y-4"
        >
          <h2 className="text-3xl font-medium">Vamos personalizar seu Prophet</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Escolha o objetivo, o foco e o tom que mais combinam com o que você quer construir agora.
            Essas respostas guiam o primeiro projeto e como o Prophet se comunica com você.
          </p>
        </motion.div>

        <OptionGroup
          title="Qual é o seu objetivo principal?"
          subtitle="Ajuda a priorizar o tipo de projeto inicial."
          options={goalOptions}
          selectedId={goal}
          onSelect={setGoal}
        />

        <OptionGroup
          title="Onde quer concentrar os esforços?"
          subtitle="Mostre em que tipo de entrega focamos primeiro."
          options={focusOptions}
          selectedId={focus}
          onSelect={setFocus}
        />

        <OptionGroup
          title="Qual tom combina melhor com você?"
          subtitle="Usaremos esse tom em mensagens e exemplos."
          options={toneOptions}
          selectedId={tone}
          onSelect={setTone}
        />

        {profile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground text-center"
          >
            <span className="font-medium text-primary">Perfil sugerido:</span>{' '}
            <span className="text-foreground">{profile.replace(/-/g, ' ')}</span>
          </motion.div>
        )}
      </div>
    </StepWrapper>
  );
};


