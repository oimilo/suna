'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Sparkles, Crown, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOnboarding } from '@/hooks/onboarding';
import { allAgents } from '../shared/data';
import { IconRenderer } from '../shared/icon-renderer';
import { userContext } from '../shared/context';

export const CompletionStep = () => {
  // Get the configured agents from global context
  const selectedAgentIds = userContext.selectedAgents || [];
  const router = useRouter();
  const { completeOnboarding } = useOnboarding();

  const completedAgents = allAgents.filter(agent =>
    selectedAgentIds.includes(agent.id)
  );

  const handleGoToBuilder = () => {
    if (selectedAgentIds.length > 0 && typeof window !== 'undefined') {
      window.sessionStorage.setItem(
        'onboarding:selectedAgents',
        JSON.stringify(selectedAgentIds)
      );
    }

    // Close the onboarding modal so it doesn't linger over the dashboard
    completeOnboarding();

    const params = new URLSearchParams({
      source: 'onboarding',
    });

    if (selectedAgentIds.length > 0) {
      params.set('prefillAgents', selectedAgentIds.join(','));
    }

    const target = `/agents${params.toString() ? `?${params.toString()}` : ''}`;

    // Small timeout ensures the modal close animation finishes before navigation
    setTimeout(() => {
      router.push(target);
    }, 50);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] relative overflow-hidden">
      {/* Background sparkles animation */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 3,
              delay: i * 0.2,
              repeat: Infinity,
              repeatDelay: 2
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          >
            <Sparkles className="h-4 w-4 text-primary/30" />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: 0.8,
          type: "spring",
          stiffness: 100,
          damping: 15
        }}
        className="text-center max-w-3xl mx-auto space-y-8 relative z-10"
      >
        {/* Grandiose success icon with crown */}
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: -180 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.3
          }}
          className="relative mx-auto mb-6"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-2 border-dashed border-primary/20"
            />
            <Crown className="h-12 w-12 text-primary" />
          </div>
        </motion.div>

        {/* Grandiose main message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="space-y-4"
        >

          <h1 className="text-4xl md:text-5xl font-medium bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent leading-tight">
            Your AI Workforce
            <br />
            is Ready to Dominate!
          </h1>

          <motion.p
            className="text-lg text-muted-foreground max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            AI Workforce
            are now configured, trained, and ready to revolutionize your workflow
          </motion.p>
        </motion.div>

        {/* Selected agents summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="space-y-4"
        >
          {completedAgents.length > 0 ? (
            <>
              <p className="text-base text-muted-foreground">
                We saved your preferred AI workers. Hop into the builder to turn
                them into real agents and plug in the right data sources.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {completedAgents.map(agent => (
                  <Badge key={agent.id} variant="outline" className="gap-2">
                    <IconRenderer iconName={agent.icon} size={16} />
                    {agent.name}
                  </Badge>
                ))}
              </div>
            </>
          ) : (
            <p className="text-base text-muted-foreground">
              You can still build agents from scratch—jump into the builder to
              explore the latest templates.
            </p>
          )}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="flex flex-col items-center gap-3"
        >
          <Button
            size="lg"
            className="h-12 px-8 text-base"
            onClick={handleGoToBuilder}
          >
            <Rocket className="mr-2 h-4 w-4" />
            Build These Agents
          </Button>
          <p className="text-xs text-muted-foreground max-w-sm">
            We’ll open the Agents workspace in a new view with your onboarding
            selections ready to revisit later.
          </p>
        </motion.div>

      </motion.div>
    </div>
  );
};

