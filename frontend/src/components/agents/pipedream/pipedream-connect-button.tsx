'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Zap } from 'lucide-react';
import { pipedreamApi } from '@/hooks/react-query/pipedream/utils';
import { toast } from 'sonner';
import { PipedreamIntroDialog } from './pipedream-intro-dialog';

interface PipedreamConnectButtonProps {
  app?: string;
  onConnect?: () => void;
  className?: string;
}

export const PipedreamConnectButton: React.FC<PipedreamConnectButtonProps> = ({
  app,
  onConnect,
  className
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showIntroDialog, setShowIntroDialog] = useState(false);
  const [skipIntro, setSkipIntro] = useState(false);

  useEffect(() => {
    // Check if user has already seen the intro
    const hasSeenIntro = localStorage.getItem('pipedream-intro-seen');
    setSkipIntro(hasSeenIntro === 'true');
  }, []);

  const handleConnectClick = () => {
    if (skipIntro) {
      handleConnect();
    } else {
      setShowIntroDialog(true);
    }
  };

  const handleConnect = async () => {
    setShowIntroDialog(false);
    setIsConnecting(true);
    try {
      const response = await pipedreamApi.createConnectionToken({ app });
      
      if (response.success && response.link) {
        const connectWindow = window.open(response.link, '_blank', 'width=600,height=700');
        
        if (connectWindow) {
          const checkClosed = setInterval(() => {
            if (connectWindow.closed) {
              clearInterval(checkClosed);
              setIsConnecting(false);
              onConnect?.();
            }
          }, 1000);
          
          setTimeout(() => {
            clearInterval(checkClosed);
            if (!connectWindow.closed) {
              setIsConnecting(false);
            }
          }, 5 * 60 * 1000);
        } else {
          setIsConnecting(false);
          toast.error('Failed to open connection window. Please check your popup blocker.');
        }
      } else {
        setIsConnecting(false);
        toast.error(response.error || 'Failed to create connection');
      }
    } catch (error) {
      setIsConnecting(false);
      console.error('Connection error:', error);
      toast.error('Failed to connect to app');
    }
  };

  return (
    <>
      <Button
        onClick={handleConnectClick}
        disabled={isConnecting}
        className={className}
        size="sm"
      >
        {isConnecting ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            Conectando...
          </>
        ) : (
          <>
            <Zap className="h-3 w-3" />
            {app ? 'Conectar' : 'Conectar Apps'}
          </>
        )}
      </Button>

      <PipedreamIntroDialog
        open={showIntroDialog}
        onOpenChange={setShowIntroDialog}
        onContinue={handleConnect}
        appName={app}
      />
    </>
  );
}; 