'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Sparkles, Crown, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { userContext, updateUserContext } from '../shared/context';
import { useInstallTemplate } from '@/hooks/secure-mcp/use-secure-mcp';
import { AgentAvatar } from '@/components/thread/content/agent-avatar';

type InstallationStatus = 'pending' | 'installing' | 'success' | 'error';

interface InstallationResult {
  templateId: string;
  templateName: string;
  status: InstallationStatus;
  agentId?: string;
  error?: string;
}

export const CompletionStep = () => {
  const router = useRouter();
  const installMutation = useInstallTemplate();
  const hasStartedInstallation = useRef(false);
  
  const [isInstalling, setIsInstalling] = useState(false);
  const [installationComplete, setInstallationComplete] = useState(false);
  const [results, setResults] = useState<InstallationResult[]>([]);
  
  const selectedTemplates = userContext.selectedTemplates || [];
  const profileMappings = userContext.profileMappings || {};
  const customMcpConfigs = userContext.customMcpConfigs || {};

  // Install all selected templates
  const installTemplates = useCallback(async () => {
    if (selectedTemplates.length === 0) {
      setInstallationComplete(true);
      return;
    }

    setIsInstalling(true);
    
    // Initialize results
    const initialResults: InstallationResult[] = selectedTemplates.map(t => ({
      templateId: t.template_id,
      templateName: t.name,
      status: 'pending'
    }));
    setResults(initialResults);

    const installedAgentIds: string[] = [];

    // Install each template sequentially
    for (let i = 0; i < selectedTemplates.length; i++) {
      const template = selectedTemplates[i];
      
      // Update status to installing
      setResults(prev => prev.map((r, idx) => 
        idx === i ? { ...r, status: 'installing' } : r
      ));

      try {
        // Build profile mappings for this specific template
        const templateProfileMappings: Record<string, string> = {};
        (template.mcp_requirements || []).forEach(req => {
          if (profileMappings[req.qualified_name]) {
            templateProfileMappings[req.qualified_name] = profileMappings[req.qualified_name];
          }
        });

        // Build custom MCP configs for this template
        const templateCustomConfigs: Record<string, Record<string, any>> = {};
        (template.mcp_requirements || []).forEach(req => {
          if (customMcpConfigs[req.qualified_name]) {
            templateCustomConfigs[req.qualified_name] = customMcpConfigs[req.qualified_name];
          }
        });

        const response = await installMutation.mutateAsync({
          template_id: template.template_id,
          instance_name: template.name,
          profile_mappings: Object.keys(templateProfileMappings).length > 0 ? templateProfileMappings : undefined,
          custom_mcp_configs: Object.keys(templateCustomConfigs).length > 0 ? templateCustomConfigs : undefined,
        });

        if (response.status === 'installed' && response.instance_id) {
          installedAgentIds.push(response.instance_id);
          setResults(prev => prev.map((r, idx) => 
            idx === i ? { ...r, status: 'success', agentId: response.instance_id } : r
          ));
        } else {
          // Installation requires more config - mark as partial success
          setResults(prev => prev.map((r, idx) => 
            idx === i ? { ...r, status: 'success', error: 'Requires additional configuration' } : r
          ));
        }
      } catch (error: any) {
        console.error(`Failed to install template ${template.name}:`, error);
        setResults(prev => prev.map((r, idx) => 
          idx === i ? { ...r, status: 'error', error: error.message } : r
        ));
      }
    }

    // Save installed agent IDs to context
    updateUserContext({ installedAgentIds });
    
    setIsInstalling(false);
    setInstallationComplete(true);
    
    const successCount = results.filter(r => r.status === 'success').length;
    if (successCount > 0) {
      toast.success(`Successfully created ${successCount} agent${successCount !== 1 ? 's' : ''}!`);
    }
  }, [selectedTemplates, profileMappings, customMcpConfigs, installMutation]);

  // Auto-start installation when component mounts
  useEffect(() => {
    if (!hasStartedInstallation.current && selectedTemplates.length > 0) {
      hasStartedInstallation.current = true;
      installTemplates();
    } else if (selectedTemplates.length === 0) {
      setInstallationComplete(true);
    }
  }, [installTemplates, selectedTemplates.length]);

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  // Installing state
  if (isInstalling) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-8 max-w-2xl mx-auto"
        >
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
          <div>
            <h2 className="text-2xl font-semibold mb-2">Creating Your AI Workers</h2>
            <p className="text-muted-foreground">
              Please wait while we set up your agents...
            </p>
          </div>

          {/* Progress list */}
          <div className="space-y-3 text-left">
            {results.map((result, index) => (
              <motion.div
                key={result.templateId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
              >
                {result.status === 'pending' && (
                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                )}
                {result.status === 'installing' && (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                )}
                {result.status === 'success' && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
                {result.status === 'error' && (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                )}
                <span className={result.status === 'installing' ? 'text-foreground' : 'text-muted-foreground'}>
                  {result.templateName}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // No templates selected
  if (selectedTemplates.length === 0 && installationComplete) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 max-w-xl mx-auto"
        >
          <Sparkles className="h-16 w-16 text-primary mx-auto" />
          <div>
            <h2 className="text-3xl font-semibold mb-2">You&apos;re All Set!</h2>
            <p className="text-muted-foreground">
              You can create agents anytime from the dashboard.
            </p>
          </div>
          <Button size="lg" onClick={handleGoToDashboard}>
            Go to Dashboard
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    );
  }

  // Completion state with results
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
        {/* Success icon */}
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

        {/* Main message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="space-y-4"
        >
          <h1 className="text-4xl md:text-5xl font-medium bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent leading-tight">
            Your AI Workforce
            <br />
            is Ready!
          </h1>

          <motion.p
            className="text-lg text-muted-foreground max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {successCount > 0 
              ? `${successCount} agent${successCount !== 1 ? 's' : ''} created and ready to help you.`
              : 'Your workspace is set up and ready to go!'
            }
            {errorCount > 0 && ` (${errorCount} failed)`}
          </motion.p>
        </motion.div>

        {/* Created agents summary */}
        {successCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="flex flex-wrap justify-center gap-3"
          >
            {results.filter(r => r.status === 'success').map((result, index) => {
              const template = selectedTemplates.find(t => t.template_id === result.templateId);
              return (
                <Badge 
                  key={result.templateId} 
                  variant="secondary" 
                  className="px-3 py-2 text-sm flex items-center gap-2"
                >
                  {template && (
                    <AgentAvatar
                      iconName={template.icon_name}
                      iconColor={template.icon_color}
                      backgroundColor={template.icon_background}
                      size={16}
                    />
                  )}
                  {result.templateName}
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                </Badge>
              );
            })}
          </motion.div>
        )}

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          <Button size="lg" onClick={handleGoToDashboard} className="px-8">
            Start Working
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};
