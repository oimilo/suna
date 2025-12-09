'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, ChevronRight, Link2, SkipForward } from 'lucide-react';
import { StepWrapper } from '../shared/step-wrapper';
import { userContext, updateUserContext, getAggregatedMcpRequirements } from '../shared/context';
import { ProfileConnector } from '@/components/agents/installation/streamlined-profile-connector';
import type { SetupStep } from '@/components/agents/installation/types';

export const CredentialsStep = () => {
  const [currentRequirementIndex, setCurrentRequirementIndex] = useState(0);
  const [profileMappings, setProfileMappings] = useState<Record<string, string>>({});
  const [customMcpConfigs, setCustomMcpConfigs] = useState<Record<string, Record<string, any>>>({});
  const [skippedRequirements, setSkippedRequirements] = useState<Set<string>>(new Set());

  // Get all unique MCP requirements from selected templates
  const requirements = useMemo(() => {
    return getAggregatedMcpRequirements();
  }, []);

  // Convert requirement to SetupStep format for ProfileConnector
  const convertToSetupStep = useCallback((req: typeof requirements[0]): SetupStep => {
    const isComposio = req.qualified_name?.startsWith('composio.') || req.custom_type === 'composio';
    
    return {
      id: req.qualified_name,
      title: `Connect ${req.display_name}`,
      description: `Select or create a profile for ${req.display_name}`,
      type: isComposio ? 'composio_profile' : (req.custom_type === 'sse' || req.custom_type === 'http') ? 'custom_server' : 'credential_profile',
      service_name: req.display_name,
      qualified_name: req.qualified_name,
      custom_type: req.custom_type,
      app_slug: req.app_slug || (req.qualified_name?.startsWith('composio.') 
        ? req.qualified_name.split('.')[1] 
        : undefined),
      required_config: req.required_config
    };
  }, []);

  const currentRequirement = requirements[currentRequirementIndex];
  const currentSetupStep = currentRequirement ? convertToSetupStep(currentRequirement) : null;

  // Update global context when mappings change
  useEffect(() => {
    updateUserContext({ 
      profileMappings,
      customMcpConfigs
    });
  }, [profileMappings, customMcpConfigs]);

  const handleProfileSelect = useCallback((qualifiedName: string, profileId: string | null) => {
    if (profileId) {
      setProfileMappings(prev => ({
        ...prev,
        [qualifiedName]: profileId
      }));
    }
  }, []);

  const handleComplete = useCallback(() => {
    // Move to next requirement
    if (currentRequirementIndex < requirements.length - 1) {
      setCurrentRequirementIndex(prev => prev + 1);
    }
  }, [currentRequirementIndex, requirements.length]);

  const handleSkip = useCallback(() => {
    if (currentRequirement) {
      setSkippedRequirements(prev => new Set(prev).add(currentRequirement.qualified_name));
    }
    
    if (currentRequirementIndex < requirements.length - 1) {
      setCurrentRequirementIndex(prev => prev + 1);
    }
  }, [currentRequirement, currentRequirementIndex, requirements.length]);

  const isCurrentConnected = currentRequirement 
    ? !!profileMappings[currentRequirement.qualified_name]
    : false;

  const isCurrentSkipped = currentRequirement
    ? skippedRequirements.has(currentRequirement.qualified_name)
    : false;

  // Calculate progress
  const connectedCount = Object.keys(profileMappings).length;
  const totalCount = requirements.length;

  // No requirements - show success message
  if (requirements.length === 0) {
    return (
      <StepWrapper>
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <h3 className="text-xl font-semibold">No Connections Needed</h3>
          <p className="text-muted-foreground text-center max-w-md">
            The agents you selected don&apos;t require any external connections. 
            You&apos;re all set to continue!
          </p>
        </div>
      </StepWrapper>
    );
  }

  return (
    <StepWrapper>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-medium">
            Connect Your Accounts
          </h2>
          <p className="text-muted-foreground mt-2">
            Link your accounts to enable your AI workers
          </p>
        </motion.div>

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center gap-2"
        >
          {requirements.map((req, index) => {
            const isConnected = !!profileMappings[req.qualified_name];
            const isSkipped = skippedRequirements.has(req.qualified_name);
            const isCurrent = index === currentRequirementIndex;
            
            return (
              <div
                key={req.qualified_name}
                className={`h-2 w-12 rounded-full transition-colors ${
                  isConnected ? 'bg-green-500' :
                  isSkipped ? 'bg-muted' :
                  isCurrent ? 'bg-primary' : 'bg-muted'
                }`}
              />
            );
          })}
        </motion.div>

        {/* Current requirement */}
        {currentSetupStep && (
          <motion.div
            key={currentRequirement.qualified_name}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Link2 className="h-5 w-5" />
                      {currentSetupStep.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Step {currentRequirementIndex + 1} of {requirements.length}
                    </CardDescription>
                  </div>
                  {isCurrentConnected && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProfileConnector
                  step={currentSetupStep}
                  selectedProfileId={profileMappings[currentRequirement.qualified_name]}
                  onProfileSelect={handleProfileSelect}
                  onComplete={handleComplete}
                />
                
                {/* Navigation buttons */}
                <div className="flex justify-between pt-4 border-t">
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    className="text-muted-foreground"
                  >
                    <SkipForward className="h-4 w-4 mr-2" />
                    Skip for now
                  </Button>
                  
                  {isCurrentConnected && currentRequirementIndex < requirements.length - 1 && (
                    <Button onClick={handleComplete}>
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center"
        >
          <Badge variant="outline" className="px-4 py-2">
            {connectedCount} of {totalCount} connected
            {skippedRequirements.size > 0 && ` (${skippedRequirements.size} skipped)`}
          </Badge>
        </motion.div>
      </div>
    </StepWrapper>
  );
};

