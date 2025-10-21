import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  AlertCircle,
  Plus,
  ExternalLink,
  ChevronRight,
  Save,
  Loader2,
  User,
  Settings,
  Info,
  Eye,
  Zap,
  Wrench,
  Shield,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { backendApi } from '@/lib/api-client';
import { useCreateComposioProfile, useComposioTools, useComposioToolkitDetails } from '@/hooks/react-query/composio/use-composio';
import { useComposioProfiles } from '@/hooks/react-query/composio/use-composio-profiles';
import type {
  ComposioToolkit,
  ComposioProfile,
  AuthConfigField,
} from '@/hooks/react-query/composio/utils';
import { composioApi } from '@/hooks/react-query/composio/utils';
import { ComposioToolsSelector } from './composio-tools-selector';

interface ComposioConnectorProps {
  app: ComposioToolkit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (profileId: string, appName: string, appSlug: string) => void;
  mode?: 'full' | 'profile-only';
  agentId?: string;
}

enum Step {
  ProfileSelect = 'profile-select',
  ProfileCreate = 'profile-create',
  Connecting = 'connecting',
  ToolsSelection = 'tools-selection',
  Success = 'success',
}

interface StepConfig {
  id: Step;
  title: string;
  description?: string;
  icon: React.ReactNode;
  showInProgress?: boolean;
}

const stepConfigs: StepConfig[] = [
  {
    id: Step.ProfileSelect,
    title: 'Connect & Preview',
    description: 'Choose profile and explore available tools',
    icon: <User className="w-4 h-4" />,
    showInProgress: true,
  },
  {
    id: Step.ProfileCreate,
    title: 'Create Profile',
    icon: <Plus className="h-4 w-4" />,
    showInProgress: true,
  },
  {
    id: Step.Connecting,
    title: 'Authenticate',
    icon: <ExternalLink className="h-4 w-4" />,
    showInProgress: true,
  },
  {
    id: Step.ToolsSelection,
    title: 'Select Tools',
    icon: <Settings className="h-4 w-4" />,
    showInProgress: true,
  },
  {
    id: Step.Success,
    title: 'Complete',
    description: 'Successfully connected',
    icon: <Check className="h-4 w-4" />,
    showInProgress: false,
  },
];

const getStepIndex = (step: Step): number => stepConfigs.findIndex((config) => config.id === step);

const StepIndicator = ({ currentStep, mode }: { currentStep: Step; mode: 'full' | 'profile-only' }) => {
  const currentIndex = getStepIndex(currentStep);
  const visibleSteps =
    mode === 'profile-only'
      ? stepConfigs.filter((step) => step.id !== Step.ToolsSelection && step.id !== Step.ProfileSelect)
      : stepConfigs;

  const visibleCurrentIndex = visibleSteps.findIndex((step) => step.id === currentStep);

  return (
    <div className="px-6 py-3">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 right-0 top-[10px] h-[1px] bg-muted-foreground/20 -z-10" />
        <motion.div
          className="absolute left-0 top-[10px] h-[1px] bg-primary -z-10"
          initial={{ width: 0 }}
          animate={{
            width:
              visibleSteps.length > 1
                ? `${(visibleCurrentIndex / (visibleSteps.length - 1)) * 100}%`
                : '0%',
          }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />

        {visibleSteps.map((step, index) => {
          const stepIndex = getStepIndex(step.id);
          const isCompleted = stepIndex < currentIndex;
          const isCurrent = step.id === currentStep;
          const isUpcoming = stepIndex > currentIndex;

          return (
            <motion.div
              key={step.id}
              className="flex flex-col items-center gap-1 relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="bg-background p-0.5 rounded-full">
                <div
                  className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 relative',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isCurrent && 'bg-primary text-primary-foreground shadow-lg shadow-primary/25',
                    isUpcoming && 'bg-muted-foreground/20 text-muted-foreground',
                    isCurrent && 'ring-2 ring-primary/20',
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-2.5 w-2.5" />
                  ) : (
                    <div className="h-2.5 w-2.5 flex items-center justify-center">{step.icon}</div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const InitiationFieldInput = ({
  field,
  value,
  onChange,
  error,
}: {
  field: AuthConfigField;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) => {
  const getInputType = (fieldType: string) => {
    switch (fieldType.toLowerCase()) {
      case 'password':
        return 'password';
      case 'email':
        return 'email';
      case 'url':
        return 'url';
      case 'number':
      case 'double':
        return 'number';
      case 'boolean':
        return 'checkbox';
      default:
        return 'text';
    }
  };

  const inputType = getInputType(field.type);
  const isBooleanField = field.type.toLowerCase() === 'boolean';
  const isNumberField = field.type.toLowerCase() === 'number' || field.type.toLowerCase() === 'double';

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={field.name} className="text-sm font-medium">
          {field.displayName}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
      </div>

      {isBooleanField ? (
        <div className="flex items-center space-x-2">
          <Switch
            id={field.name}
            checked={value === 'true'}
            onCheckedChange={(checked) => onChange(checked ? 'true' : 'false')}
          />
          <Label htmlFor={field.name} className="text-sm text-muted-foreground">
            {field.description || 'Enable this feature'}
          </Label>
        </div>
      ) : (
        <>
          <Input
            id={field.name}
            type={inputType}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.description}
            step={isNumberField ? 'any' : undefined}
          />
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
        </>
      )}

      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
};

const InstructionsCard = ({ instructions }: { instructions?: string }) => {
  if (!instructions) return null;

  return (
    <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Info className="h-4 w-4" />
        Connection instructions
      </div>
      <p className="text-sm text-muted-foreground whitespace-pre-line">{instructions}</p>
    </div>
  );
};

const LoadingOverlay = ({ message }: { message: string }) => (
  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);

const SuccessStep = ({
  profile,
  onClose,
  onConfigureTools,
  mode,
}: {
  profile: ComposioProfile;
  onClose: () => void;
  onConfigureTools: () => void;
  mode: 'full' | 'profile-only';
}) => (
  <div className="space-y-6 p-6">
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-300 flex items-center justify-center">
          <Check className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Connection successful</h3>
          <p className="text-sm text-muted-foreground">
            {profile.toolkit_name} is now connected and ready to use.
          </p>
        </div>
      </div>
    </div>

    <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Shield className="h-4 w-4" />
        Connection details
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Profile</p>
          <p className="font-medium text-foreground">{profile.profile_name}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Toolkit</p>
          <p className="font-medium text-foreground">{profile.toolkit_name}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Status</p>
          <p className="font-medium text-green-600">Connected</p>
        </div>
        <div>
          <p className="text-muted-foreground">Created</p>
          <p className="font-medium text-foreground">
            {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>

    <div className="flex flex-col sm:flex-row gap-3">
      <Button onClick={onClose} variant="outline" className="flex-1">
        Done
      </Button>
      {mode === 'full' && (
        <Button onClick={onConfigureTools} className="flex-1">
          <Wrench className="h-4 w-4 mr-2" /> Configure Tools
        </Button>
      )}
    </div>
  </div>
);

export const ComposioConnector: React.FC<ComposioConnectorProps> = ({
  app,
  open,
  onOpenChange,
  onComplete,
  mode = 'full',
  agentId,
}) => {
  const [currentStep, setCurrentStep] = useState<Step>(Step.ProfileSelect);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [initiationFields, setInitiationFields] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [connectionResult, setConnectionResult] = useState<ComposioProfile | null>(null);
  const [authMode, setAuthMode] = useState<'managed' | 'custom'>('managed');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  const { data: toolkitDetails, isLoading: isLoadingToolkitDetails } = useComposioToolkitDetails(app.slug, {
    enabled: open,
  });
  const { data: existingProfiles = [], refetch: refetchProfiles } = useComposioProfiles({
    toolkit_slug: app.slug,
  });
  const createProfileMutation = useCreateComposioProfile();
  const { data: toolkitTools } = useComposioTools(app.slug, {
    enabled: open,
  });

  const toolkitInstructions = toolkitDetails?.toolkit?.description;

  useEffect(() => {
    if (!open) {
      setCurrentStep(Step.ProfileSelect);
      setSelectedProfileId(null);
      setInitiationFields({});
      setFieldErrors({});
      setConnectionResult(null);
      setAuthMode('managed');
      setSelectedTools([]);
    }
  }, [open]);

  const existingProfilesForApp = useMemo(
    () => existingProfiles.filter((profile) => profile.toolkit_slug === app.slug),
    [existingProfiles, app.slug],
  );

  const initiationFieldGroups = useMemo(() => {
    const details = toolkitDetails?.toolkit?.auth_config_details;
    if (!details) return [] as Array<{ name: string; fields: AuthConfigField[] }>;

    return details.map((detail) => {
      const flattenedFields = Object.values(detail.fields || {}).flatMap((level) =>
        Object.values(level || {}).flat(),
      );

      return {
        name: detail.name,
        fields: flattenedFields,
      };
    });
  }, [toolkitDetails]);

  const handleBack = () => {
    if (currentStep === Step.ProfileCreate) {
      setCurrentStep(Step.ProfileSelect);
    } else if (currentStep === Step.Connecting) {
      setCurrentStep(Step.ProfileCreate);
    } else if (currentStep === Step.ToolsSelection) {
      setCurrentStep(Step.Connecting);
    }
  };

  const validateFields = () => {
    const errors: Record<string, string> = {};

    initiationFieldGroups.forEach((group) => {
      group.fields.forEach((field) => {
        if (field.required && !initiationFields[field.name]) {
          errors[field.name] = `${field.displayName} is required`;
        }
      });
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSelectProfile = (profileId: string) => {
    setSelectedProfileId(profileId);
  };

  const handleStartConnection = () => {
    if (selectedProfileId === 'new' || !selectedProfileId) {
      setCurrentStep(Step.ProfileCreate);
    } else {
      const profile = existingProfilesForApp.find((p) => p.profile_id === selectedProfileId);
      if (profile) {
        setConnectionResult(profile);
        setCurrentStep(mode === 'profile-only' ? Step.Success : Step.ToolsSelection);
        onComplete(profile.profile_id, profile.toolkit_name, profile.toolkit_slug);
      }
    }
  };

  const handleCreateProfile = async () => {
    if (!validateFields()) {
      toast.error('Please fix the highlighted fields');
      return;
    }

    setIsLoading(true);

    try {
      const response = await createProfileMutation.mutateAsync({
        toolkit_slug: app.slug,
        profile_name: `${app.name} Connection ${Math.floor(Math.random() * 1000)}`,
        display_name: `${app.name} via Composio`,
        initiation_fields: initiationFields,
        use_custom_auth: authMode === 'custom',
        custom_auth_config: authMode === 'custom' ? initiationFields : undefined,
      });

      const profile: ComposioProfile = {
        profile_id: response.profile_id,
        profile_name: response.profile_id,
        display_name: `${app.name} Connection`,
        toolkit_slug: app.slug,
        toolkit_name: app.name,
        mcp_url: response.mcp_url,
        redirect_url: response.redirect_url,
        connected_account_id: response.profile_id,
        is_connected: false,
        is_default: false,
        created_at: new Date().toISOString(),
      };

      setConnectionResult(profile);
      setCurrentStep(Step.Connecting);

      refetchProfiles();

      if (response.redirect_url) {
        window.open(response.redirect_url, '_blank', 'width=600,height=700,resizable=yes,scrollbars=yes');
      }

      if (mode === 'profile-only') {
        setCurrentStep(Step.Success);
        onComplete(profile.profile_id, profile.toolkit_name, profile.toolkit_slug);
      } else {
        setCurrentStep(Step.ToolsSelection);
      }

      toast.success(`${app.name} connected successfully!`);
    } catch (error: any) {
      console.error('Failed to create Composio profile:', error);
      toast.error(error.message || 'Failed to create profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    if (connectionResult) {
      onComplete(connectionResult.profile_id, app.name, app.slug);
    }
    onOpenChange(false);
  };

  const managedFields = useMemo(() => {
    if (!initiationFieldGroups.length) return [] as AuthConfigField[];
    const managedGroup = initiationFieldGroups.find((group) => group.name === 'MANAGED');
    return managedGroup?.fields ?? [];
  }, [initiationFieldGroups]);

  const customFields = useMemo(() => {
    if (!initiationFieldGroups.length) return [] as AuthConfigField[];
    const customGroup = initiationFieldGroups.find((group) => group.name === 'CUSTOM');
    return customGroup?.fields ?? [];
  }, [initiationFieldGroups]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
              {app.logo ? (
                <Image
                  src={app.logo}
                  alt={app.name}
                  width={40}
                  height={40}
                  className="h-full w-full object-contain"
                  unoptimized
                />
              ) : (
                <span className="text-lg font-semibold text-primary">{app.name.charAt(0)}</span>
              )}
            </div>
            <div>
              <span className="text-lg font-semibold text-foreground">Connect {app.name}</span>
              <p className="text-sm text-muted-foreground mt-0.5">Securely connect to {app.name} via Composio</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <StepIndicator currentStep={currentStep} mode={mode} />

        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {currentStep === Step.ProfileSelect && (
              <motion.div
                key="profile-select"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="p-6 h-full flex flex-col"
              >
                <div className="space-y-4 flex-1">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">Choose connection mode</h3>
                    <p className="text-sm text-muted-foreground">
                      Select an existing connection or create a new one.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={cn('rounded-2xl border p-5 space-y-3 transition-all', 'bg-muted/40')}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold text-sm text-foreground">Existing Connections</h4>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Reuse a previously created connection to {app.name}.
                      </p>
                      <div className="space-y-2">
                        <Select value={selectedProfileId || ''} onValueChange={handleSelectProfile}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an existing connection" />
                          </SelectTrigger>
                          <SelectContent>
                            {existingProfilesForApp.length === 0 ? (
                              <SelectItem disabled value="">
                                No existing connections yet
                              </SelectItem>
                            ) : (
                              existingProfilesForApp.map((profile) => (
                                <SelectItem key={profile.profile_id} value={profile.profile_id}>
                                  <div className="flex flex-col gap-1">
                                    <span className="font-medium">{profile.profile_name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      Connected {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className={cn('rounded-2xl border p-5 space-y-3 transition-all', 'bg-background')}>
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold text-sm text-foreground">New Connection</h4>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Create a new secure connection to {app.name}. Recommended for new accounts.
                      </p>
                      <Button variant="outline" className="w-full" onClick={() => setSelectedProfileId('new')}>
                        Create new connection
                      </Button>
                    </div>
                  </div>

                  {toolkitInstructions && (
                    <InstructionsCard instructions={toolkitInstructions} />
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 mt-6 border-t">
                  <p className="text-xs text-muted-foreground">
                    Connections include secure authentication and MCP server provisioning.
                  </p>
                  <Button onClick={handleStartConnection} disabled={!selectedProfileId}>
                    Continue
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {currentStep === Step.ProfileCreate && (
              <motion.div
                key="profile-create"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="p-6 h-full flex flex-col"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Button variant="ghost" size="sm" onClick={handleBack} className="-ml-2">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-6 flex-1 min-h-0">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground">Authentication details</h3>
                      <p className="text-sm text-muted-foreground">
                        Provide the required information to create a secure connection.
                      </p>
                    </div>

                    <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          <h4 className="font-semibold text-sm text-foreground">Authentication mode</h4>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className={authMode === 'managed' ? 'text-foreground font-medium' : ''}>Managed</span>
                          <Switch
                            checked={authMode === 'custom'}
                            onCheckedChange={(checked) => setAuthMode(checked ? 'custom' : 'managed')}
                          />
                          <span className={authMode === 'custom' ? 'text-foreground font-medium' : ''}>Custom</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Managed mode uses Composio-managed authentication flows. Custom mode lets you provide your own keys.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {(authMode === 'managed' ? managedFields : customFields).map((field) => (
                        <InitiationFieldInput
                          key={field.name}
                          field={field}
                          value={initiationFields[field.name] || ''}
                          onChange={(value) =>
                            setInitiationFields((prev) => ({
                              ...prev,
                              [field.name]: value,
                            }))
                          }
                          error={fieldErrors[field.name]}
                        />
                      ))}
                    </div>

                    <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Zap className="h-4 w-4" />
                        Quick tip
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Use a dedicated integration user for the most reliable automations.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-6">
                    <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Eye className="h-4 w-4" />
                        Preview setup
                      </div>
                      <div className="space-y-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Shield className="h-3 w-3 text-primary" />
                          <span>Secure OAuth flow handled by Composio</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Wrench className="h-3 w-3 text-primary" />
                          <span>Automatic MCP server provisioning</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-3 w-3 text-primary" />
                          <span>Optional tool selection step after authentication</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border bg-muted/30 p-4 space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-foreground">Available tools</h4>
                        <p className="text-xs text-muted-foreground">
                          Preview of popular tools included with {app.name}
                        </p>
                      </div>
                      <div className="space-y-3">
                        {toolkitTools?.tools?.slice(0, 3).map((tool) => (
                          <div key={tool.slug} className="rounded-lg border bg-background/80 p-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                                Tool
                              </Badge>
                              <span className="text-sm font-medium text-foreground">{tool.name}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {tool.description || 'No description available'}
                            </p>
                          </div>
                        ))}
                        {toolkitTools?.tools && toolkitTools.tools.length > 3 && (
                          <p className="text-[11px] text-muted-foreground">
                            +{toolkitTools.tools.length - 3} more tools available
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-6 border-t">
                  <Button variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                  <Button onClick={handleCreateProfile} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Connect {app.name}
                  </Button>
                </div>
              </motion.div>
            )}

            {currentStep === Step.ToolsSelection && connectionResult && (
              <motion.div
                key="tools-selection"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="p-6 h-full flex flex-col"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Button variant="ghost" size="sm" onClick={handleBack} className="-ml-2">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                </div>

                <div className="space-y-4 flex-1 min-h-0">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">Select tools to enable</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose the tools from {app.name} that should be available to your agent.
                    </p>
                  </div>

                  <ScrollArea className="flex-1 min-h-0">
                    <ComposioToolsSelector
                      profileId={connectionResult.profile_id}
                      agentId={agentId}
                      toolkitName={app.name}
                      toolkitSlug={app.slug}
                      selectedTools={selectedTools}
                      onToolsChange={setSelectedTools}
                      showSaveButton={false}
                    />
                  </ScrollArea>
                </div>

                <div className="flex items-center justify-between pt-4 mt-6 border-t">
                  <div className="text-xs text-muted-foreground">
                    Tools can be updated later from the agent configuration page.
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleComplete}>
                      Skip
                    </Button>
                    <Button onClick={handleComplete}>
                      Save &amp; Continue
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === Step.Success && connectionResult && (
              <motion.div
                key="success"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="flex-1 overflow-auto"
              >
                <SuccessStep
                  profile={connectionResult}
                  onClose={handleComplete}
                  onConfigureTools={() => setCurrentStep(Step.ToolsSelection)}
                  mode={mode}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {isLoading && <LoadingOverlay message="Completing connection..." />}
      </DialogContent>
    </Dialog>
  );
};
