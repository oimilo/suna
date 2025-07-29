import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';

const items = [
    { id: 1, content: "Analisando sua solicitação..." },
    { id: 2, content: "Coletando informações relevantes..." },
    { id: 3, content: "Processando dados disponíveis..." },
    { id: 4, content: "Acessando bases de conhecimento..." },
    { id: 5, content: "Avaliando diferentes abordagens..." },
    { id: 6, content: "Sintetizando insights..." },
    { id: 7, content: "Construindo resposta completa..." },
    { id: 8, content: "Otimizando precisão da solução..." },
    { id: 9, content: "Cruzando referências..." },
    { id: 10, content: "Estruturando framework lógico..." },
    { id: 11, content: "Integrando elementos contextuais..." },
    { id: 12, content: "Refinando análise..." },
    { id: 13, content: "Validando coerência da resposta..." },
    { id: 14, content: "Montando insights finais..." },
    { id: 15, content: "Preparando análise detalhada..." },
    { id: 16, content: "Finalizando estrutura da resposta..." }
  ];

export const AgentLoader = () => {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setIndex((state) => {
        if (state >= items.length - 1) return 0;
        return state + 1;
      });
    }, 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex py-2 items-center w-full">
      <AnimatePresence>
        <motion.div
          key={items[index].id}
          initial={{ y: 20, opacity: 0, filter: "blur(8px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: -20, opacity: 0, filter: "blur(8px)" }}
          transition={{ ease: "easeInOut" }}
          style={{ position: "absolute" }}
        >
          <AnimatedShinyText>{items[index].content}</AnimatedShinyText>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
