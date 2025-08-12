'use client';

import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from '@/components/home/ui/accordion';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { siteConfig } from '@/lib/home';
import { HelpCircle, Plus, Minus, MessageCircle, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

export function FAQSection() {
  const { faqSection } = siteConfig;
  const [openItem, setOpenItem] = useState<string | undefined>(undefined);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section
      id="faq"
      className="py-24 px-6 relative"
    >
      <div className="max-w-3xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium mb-6"
          >
            <HelpCircle className="w-4 h-4" />
            PERGUNTAS FREQUENTES
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            {faqSection.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            {faqSection.description}
          </motion.p>
        </div>

        {/* FAQ Accordion - Minimal design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Accordion
            type="single"
            collapsible
            value={openItem}
            onValueChange={setOpenItem}
            className="w-full"
          >
            {faqSection.faQitems.map((faq, index) => {
              const isOpen = openItem === index.toString();
              
              return (
                <AccordionItem
                  key={index}
                  value={index.toString()}
                  className="border-b border-border/50 last:border-0"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <AccordionPrimitive.Header className="flex">
                    <AccordionPrimitive.Trigger
                      className={cn(
                        "flex flex-1 items-center justify-between py-6 px-0 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-4 text-left">
                        {/* Dynamic icon */}
                        <div className="relative">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                            isOpen 
                              ? 'bg-primary text-primary-foreground' 
                              : hoveredIndex === index
                                ? 'bg-muted-foreground/10 text-foreground'
                                : 'bg-muted text-muted-foreground'
                          }`}>
                            <AnimatePresence mode="wait">
                              {isOpen ? (
                                <motion.div
                                  key="minus"
                                  initial={{ rotate: -90, opacity: 0 }}
                                  animate={{ rotate: 0, opacity: 1 }}
                                  exit={{ rotate: 90, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <Minus className="w-5 h-5" />
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="plus"
                                  initial={{ rotate: 90, opacity: 0 }}
                                  animate={{ rotate: 0, opacity: 1 }}
                                  exit={{ rotate: -90, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <Plus className="w-5 h-5" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          
                          {/* Progress indicator */}
                          {isOpen && (
                            <motion.div
                              className="absolute inset-0 rounded-full"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              <svg className="w-10 h-10 transform -rotate-90">
                                <circle
                                  cx="20"
                                  cy="20"
                                  r="18"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  fill="none"
                                  className="text-primary/20"
                                />
                                <motion.circle
                                  cx="20"
                                  cy="20"
                                  r="18"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  fill="none"
                                  strokeDasharray={`${2 * Math.PI * 18}`}
                                  strokeDashoffset={`${2 * Math.PI * 18}`}
                                  className="text-primary"
                                  initial={{ strokeDashoffset: 2 * Math.PI * 18 }}
                                  animate={{ strokeDashoffset: 0 }}
                                  transition={{ duration: 0.5, ease: "easeOut" }}
                                />
                              </svg>
                            </motion.div>
                          )}
                        </div>
                        
                        <h3 className={`text-base md:text-lg font-medium transition-colors duration-200 ${
                          isOpen || hoveredIndex === index ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {faq.question}
                        </h3>
                      </div>
                    </div>
                    </AccordionPrimitive.Trigger>
                  </AccordionPrimitive.Header>
                  
                  <AccordionContent className="pb-6 pl-14 pr-0">
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </motion.div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </motion.div>

        {/* Contact options - Minimal design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 pt-16 border-t border-border/50"
        >
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold mb-2">Ainda tem dúvidas?</h3>
            <p className="text-muted-foreground">
              Escolha a melhor forma de obter ajuda
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <a
              href="#"
              className="group flex items-center gap-4 p-6 rounded-2xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <h4 className="font-medium mb-1">Fale com a equipe</h4>
                <p className="text-sm text-muted-foreground">Resposta em até 24h</p>
              </div>
            </a>
            
            <a
              href="#"
              className="group flex items-center gap-4 p-6 rounded-2xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <h4 className="font-medium mb-1">Documentação</h4>
                <p className="text-sm text-muted-foreground">Guias detalhados</p>
              </div>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
