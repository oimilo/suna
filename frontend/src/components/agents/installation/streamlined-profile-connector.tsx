import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Loader2,
  Shield,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { CredentialProfileSelector } from '@/components/workflows/CredentialProfileSelector';
// Removed Pipedream connector and hooks to align with Suna
import { useCreateCredentialProfile, type CreateCredentialProfileRequest } from '@/hooks/react-query/mcp/use-credential-profiles';
import { useMCPServerDetails } from '@/hooks/react-query/mcp/use-mcp-servers';
import type { SetupStep } from './types';

interface ProfileConnectorProps {
  step: SetupStep;
  selectedProfileId: string | undefined;
  onProfileSelect: (qualifiedName: string, profileId: string | null) => void;
  onComplete?: () => void;
}

export const ProfileConnector: React.FC<ProfileConnectorProps> = ({
  step,
  selectedProfileId,
  onProfileSelect,
  onComplete
}) => {
  const [profileStep, setProfileStep] = useState<'select' | 'create'>('select');
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [config, setConfig] = useState<Record<string, string>>({});
  // Pipedream connector removed
  
  const createProfileMutation = useCreateCredentialProfile();
  const { data: serverDetails } = useMCPServerDetails(step.qualified_name);
  
  const configProperties = useMemo(() => serverDetails?.connections?.[0]?.configSchema?.properties ?? {}, [serverDetails]);
  const requiredFields = useMemo(() => serverDetails?.connections?.[0]?.configSchema?.required ?? [], [serverDetails]);

  useEffect(() => {
    setProfileStep('select');
    setIsCreatingProfile(false);
    setNewProfileName('');
    setConfig({});
    // no-op
  }, [step.qualified_name]);


  const handleCreateProfile = useCallback(async () => {
    if (!newProfileName.trim()) {
      toast.error('Por favor, insira um nome de perfil');
      return;
    }

    setIsCreatingProfile(true);
    try {
      const request: CreateCredentialProfileRequest = {
        mcp_qualified_name: step.qualified_name,
        profile_name: newProfileName.trim(),
        display_name: step.service_name,
        config: config,
        is_default: false
      };

      const response = await createProfileMutation.mutateAsync(request);
      toast.success('Perfil criado com sucesso!');
      
      onProfileSelect(step.qualified_name, response.profile_id || 'new-profile');
      setProfileStep('select');
      setNewProfileName('');
      setConfig({});
      onComplete?.();
    } catch (error: any) {
      toast.error(error.message || 'Falha ao criar perfil');
    } finally {
      setIsCreatingProfile(false);
    }
  }, [newProfileName, config, step.qualified_name, step.service_name, createProfileMutation, onProfileSelect, onComplete]);

  const handleConfigChange = useCallback((key: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleProfileNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewProfileName(e.target.value);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && profileStep === 'create') {
      handleCreateProfile();
    }
  }, [handleCreateProfile, profileStep]);

  const isFieldRequired = useCallback((fieldName: string) => requiredFields.includes(fieldName), [requiredFields]);

  const SelectProfileStep = useMemo(() => (
    <div className="space-y-4">
      {
        <div className="space-y-4">
          <CredentialProfileSelector
            mcpQualifiedName={step.qualified_name}
            mcpDisplayName={step.service_name}
            selectedProfileId={selectedProfileId}
            onProfileSelect={(profileId) => {
              onProfileSelect(step.qualified_name, profileId);
            }}
          />

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">OR</span>
            <Separator className="flex-1" />
          </div>

          <Button 
            variant="outline" 
            onClick={() => {
              setNewProfileName(`${step.service_name} Profile`);
              setProfileStep('create');
            }}
            className="w-full"
          >
            <Plus className="h-4 w-4" />
            Create New Profile
          </Button>
        </div>
      }
    </div>
  ), [
    step.service_name,
    step.qualified_name,
    selectedProfileId,
    onProfileSelect
  ]);

  const CreateProfileStep = useMemo(() => (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Button 
            variant="link" 
            size="sm"
            onClick={() => setProfileStep('select')}
            className="mb-4 p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
          >
            ← Back to Selection
          </Button>
        </div>
        <h3 className="font-semibold">Create {step.service_name} Profile</h3>
        <p className="text-sm text-muted-foreground">
          Set up a new credential profile for {step.service_name}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="profile-name">Profile Name</Label>
          <Input
            id="profile-name"
            placeholder="e.g., Personal Account, Work Account"
            value={newProfileName}
            onChange={handleProfileNameChange}
            onKeyDown={handleKeyDown}
            autoFocus
            className="h-11"
          />
          <p className="text-xs text-muted-foreground">
            This helps you identify different configurations
          </p>
        </div>

        {Object.keys(configProperties).length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="text-sm font-medium">Connection Settings</span>
            </div>
            {Object.entries(configProperties).map(([key, schema]: [string, any]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>
                  {schema.title || key}
                  {isFieldRequired(key) && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </Label>
                <Input
                  id={key}
                  type={schema.format === 'password' ? 'password' : 'text'}
                  placeholder={schema.description || `Enter ${key}`}
                  value={config[key] || ''}
                  onChange={(e) => handleConfigChange(key, e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-11"
                />
                {schema.description && (
                  <p className="text-xs text-muted-foreground">{schema.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Alert className="border-primary/20 bg-primary/5">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              This service doesn't require any credentials to connect.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="pt-4 border-t">
        <Button 
          onClick={handleCreateProfile}
          disabled={!newProfileName.trim() || isCreatingProfile}
          className="w-full"
        >
          {isCreatingProfile ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Create & Continue
            </>
          )}
        </Button>
      </div>
    </div>
  ), [
    step.service_name,
    newProfileName,
    config,
    configProperties,
    isCreatingProfile,
    handleProfileNameChange,
    handleKeyDown,
    handleConfigChange,
    handleCreateProfile,
    isFieldRequired
  ]);

  return (
    <>
      <div className="space-y-6">
        {profileStep === 'select' ? SelectProfileStep : CreateProfileStep}
      </div>

      {null}
    </>
  );
}; 
