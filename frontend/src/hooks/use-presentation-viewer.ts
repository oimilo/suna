import { useState } from 'react';

interface PresentationViewerState {
  isOpen: boolean;
  presentationName?: string;
  sandboxUrl?: string;
  initialSlide?: number;
}

interface OpenPresentationOptions {
  initialSlide?: number;
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
