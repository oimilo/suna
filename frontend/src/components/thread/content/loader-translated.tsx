import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';
import { usePtTranslations } from '@/hooks/use-pt-translations';

export const AgentLoaderTranslated = () => {
  const { t } = usePtTranslations();
  const [index, setIndex] = useState(0);
  
  // Mapeamento das chaves de tradução
  const translationKeys = [
    'chat.loader.analyzing',
    'chat.loader.collecting',
    'chat.loader.processing',
    'chat.loader.accessing',
    'chat.loader.evaluating',
    'chat.loader.synthesizing',
    'chat.loader.building',
    'chat.loader.optimizing',
    'chat.loader.crossReferencing',
    'chat.loader.structuring',
    'chat.loader.integrating',
    'chat.loader.refining',
    'chat.loader.validating',
    'chat.loader.assembling',
    'chat.loader.preparing',
    'chat.loader.finalizing'
  ];
  
  useEffect(() => {
    const id = setInterval(() => {
      setIndex((state) => {
        if (state >= translationKeys.length - 1) return 0;
        return state + 1;
      });
    }, 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex py-2 items-center w-full">
      <AnimatePresence>
        <motion.div
          key={translationKeys[index]}
          initial={{ y: 20, opacity: 0, filter: "blur(8px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: -20, opacity: 0, filter: "blur(8px)" }}
          transition={{ ease: "easeInOut" }}
          style={{ position: "absolute" }}
        >
          <AnimatedShinyText>{t(translationKeys[index])}</AnimatedShinyText>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};