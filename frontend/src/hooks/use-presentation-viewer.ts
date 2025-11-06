import { useState } from 'react';

interface PresentationViewerState {
  isOpen: boolean;
  presentationName?: string;
  sandboxUrl?: string;
  initialSlide?: number;
  projectId?: string;
}

interface OpenPresentationOptions {
  initialSlide?: number;
  projectId?: string;
}

export function usePresentationViewer() {
  const [viewerState, setViewerState] = useState<PresentationViewerState>({
    isOpen: false,
  });

  const openPresentation = (
    presentationName: string,
    sandboxUrl: string,
    options: OpenPresentationOptions = {}
  ) => {
    setViewerState({
      isOpen: true,
      presentationName,
      sandboxUrl,
      initialSlide: options.initialSlide ?? 1,
      projectId: options.projectId,
    });
  };

  const closePresentation = () => {
    setViewerState({
      isOpen: false,
    });
  };

  return {
    viewerState,
    openPresentation,
    closePresentation,
  };
}
