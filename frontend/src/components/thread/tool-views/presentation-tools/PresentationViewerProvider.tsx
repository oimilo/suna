import React, { createContext, useContext } from 'react';
// Fallback para ausência do hook original
function usePresentationViewer() {
  const [state, setState] = React.useState({
    isOpen: false,
    presentationName: '',
    sandboxUrl: '',
    initialSlide: 0,
  });
  const openPresentation = (presentationName: string, sandboxUrl: string, initialSlide = 0) => {
    setState({ isOpen: true, presentationName, sandboxUrl, initialSlide });
  };
  const closePresentation = () => setState(s => ({ ...s, isOpen: false }));
  return { viewerState: state, openPresentation, closePresentation } as const;
}
import { FullScreenPresentationViewer } from './FullScreenPresentationViewer';

interface PresentationViewerContextType {
  openPresentation: (presentationName: string, sandboxUrl: string, initialSlide?: number) => void;
  closePresentation: () => void;
}

const PresentationViewerContext = createContext<PresentationViewerContextType | null>(null);

export function PresentationViewerProvider({ children }: { children: React.ReactNode }) {
  const { viewerState, openPresentation, closePresentation } = usePresentationViewer();

  return (
    <PresentationViewerContext.Provider value={{ openPresentation, closePresentation }}>
      {children}
      <FullScreenPresentationViewer
        isOpen={viewerState.isOpen}
        onClose={closePresentation}
        presentationName={viewerState.presentationName}
        sandboxUrl={viewerState.sandboxUrl}
        initialSlide={viewerState.initialSlide}
      />
    </PresentationViewerContext.Provider>
  );
}

export function usePresentationViewerContext() {
  const context = useContext(PresentationViewerContext);
  if (!context) {
    throw new Error('usePresentationViewerContext must be used within a PresentationViewerProvider');
  }
  return context;
}

// Example usage in File Explorer:
// const { openPresentation } = usePresentationViewerContext();
// 
// const handleOpenPresentation = () => {
//   openPresentation('my-presentation', 'https://sandbox-url.com', 1);
// };
