import { useState, useEffect } from 'react';

const INTRO_SHOWN_KEY = 'agent-builder-intro-shown';

export function useAgentBuilderIntro() {
  const [shouldShowIntro, setShouldShowIntro] = useState(false);
  const [hasShownIntro, setHasShownIntro] = useState(true);

  useEffect(() => {
    // Verifica se já mostrou a intro antes
    const shown = localStorage.getItem(INTRO_SHOWN_KEY);
    if (!shown) {
      setShouldShowIntro(true);
      setHasShownIntro(false);
    }
  }, []);

  const markIntroAsShown = () => {
    localStorage.setItem(INTRO_SHOWN_KEY, 'true');
    setHasShownIntro(true);
  };

  const resetIntro = () => {
    localStorage.removeItem(INTRO_SHOWN_KEY);
    setShouldShowIntro(true);
    setHasShownIntro(false);
  };

  return {
    shouldShowIntro,
    hasShownIntro,
    markIntroAsShown,
    resetIntro
  };
}