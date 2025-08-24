'use client';

import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from '@/components/home/ui/accordion';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { siteConfig } from '@/lib/home';
import { HelpCircle, Plus, ChevronRight, MessageCircle, FileText, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function FAQSection() {
  const { faqSection } = siteConfig;
  const [openItem, setOpenItem] = useState<string | undefined>(undefined);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="relative w-full py-24 px-6 overflow-hidden">
      {/* Section background with subtle gradient */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent" />
      </div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600/10 border border-purple-600/20 mb-6"
          >
            <HelpCircle className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-xs font-medium text-purple-400">Perguntas Frequentes</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl lg:text-5xl font-semibold text-white mb-4"
          >
            Tudo que você <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-400">precisa saber</span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-gray-400 max-w-2xl mx-auto"
          >
            {faqSection.description}
          </motion.p>
        </div>

        {/* FAQ Accordion - Ultra Minimal Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-1"
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
              const isHovered = hoveredIndex === index;
              
              return (
                <AccordionItem
                  key={index}
                  value={index.toString()}
                  className="border-0"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <AccordionPrimitive.Header className="flex">
                    <AccordionPrimitive.Trigger
                      className="flex flex-1 items-center justify-between py-5 px-0 text-left transition-all outline-none group"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {/* Number indicator */}
                        <div className="relative">
                          <div className={`text-sm font-mono transition-all duration-300 ${
                            isOpen 
                              ? 'text-purple-400' 
                              : isHovered
                                ? 'text-purple-400/60'
                                : 'text-gray-600'
                          }`}>
                            {String(index + 1).padStart(2, '0')}
                          </div>
                          
                          {/* Active indicator line */}
                          <div className={`absolute -left-8 top-1/2 -translate-y-1/2 h-px transition-all duration-300 ${
                            isOpen 
                              ? 'w-6 bg-purple-400' 
                              : isHovered
                                ? 'w-4 bg-purple-400/40'
                                : 'w-0 bg-transparent'
                          }`} />
                        </div>
                        
                        {/* Question */}
                        <h3 className={`text-base md:text-lg font-medium transition-all duration-300 flex-1 ${
                          isOpen 
                            ? 'text-white translate-x-1' 
                            : isHovered 
                              ? 'text-gray-200 translate-x-0.5'
                              : 'text-gray-400'
                        }`}>
                          {faq.question}
                        </h3>
                        
                        {/* Arrow indicator */}
                        <div className={`relative transition-all duration-300 ${
                          isOpen ? 'rotate-90' : ''
                        }`}>
                          <ChevronRight className={`h-4 w-4 transition-colors duration-300 ${
                            isOpen || isHovered ? 'text-purple-400' : 'text-gray-600'
                          }`} />
                        </div>
                      </div>
                    </AccordionPrimitive.Trigger>
                  </AccordionPrimitive.Header>
                  
                  <AccordionContent className="overflow-hidden">
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="pb-5"
                        >
                          <div className="pl-12 pr-8">
                            <p className="text-gray-400 leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </AccordionContent>
                  
                  {/* Separator line */}
                  <div className={`h-px transition-all duration-300 ${
                    isOpen || isHovered 
                      ? 'bg-purple-600/20' 
                      : 'bg-white/5'
                  }`} />
                </AccordionItem>
              );
            })}
          </Accordion>
        </motion.div>

        {/* Contact Section - Minimal Hover Effects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-20"
        >
          {/* Divider with gradient */}
          <div className="relative mb-16">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-600/20 to-transparent" />
          </div>
          
          <div className="text-center mb-12">
            <h3 className="text-2xl font-semibold text-white mb-2">
              Ainda tem dúvidas?
            </h3>
            <p className="text-gray-400">
              Escolha a melhor forma de obter ajuda
            </p>
          </div>
          
          {/* Contact Options - No cards, just hover areas */}
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <a
              href="#"
              className="group relative"
            >
              <div className="flex items-start gap-4 p-6 rounded-2xl transition-all duration-300 hover:bg-purple-600/5">
                {/* Hover gradient background */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-600/0 to-violet-600/0 group-hover:from-purple-600/10 group-hover:to-violet-600/5 transition-all duration-500" />
                
                {/* Icon */}
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-600/20 flex items-center justify-center transition-all duration-300 group-hover:bg-purple-600/20 group-hover:border-purple-600/30">
                    <MessageCircle className="w-5 h-5 text-purple-400" />
                  </div>
                </div>
                
                {/* Text */}
                <div className="relative text-left">
                  <h4 className="font-medium text-white mb-1 transition-transform duration-300 group-hover:translate-x-0.5">
                    Fale com a equipe
                  </h4>
                  <p className="text-sm text-gray-500">
                    Resposta em até 24h
                  </p>
                </div>
                
                {/* Hover indicator */}
                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
                  <ChevronRight className="h-4 w-4 text-purple-400" />
                </div>
              </div>
            </a>
            
            <a
              href="#"
              className="group relative"
            >
              <div className="flex items-start gap-4 p-6 rounded-2xl transition-all duration-300 hover:bg-purple-600/5">
                {/* Hover gradient background */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-600/0 to-violet-600/0 group-hover:from-purple-600/10 group-hover:to-violet-600/5 transition-all duration-500" />
                
                {/* Icon */}
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-600/20 flex items-center justify-center transition-all duration-300 group-hover:bg-purple-600/20 group-hover:border-purple-600/30">
                    <FileText className="w-5 h-5 text-purple-400" />
                  </div>
                </div>
                
                {/* Text */}
                <div className="relative text-left">
                  <h4 className="font-medium text-white mb-1 transition-transform duration-300 group-hover:translate-x-0.5">
                    Documentação
                  </h4>
                  <p className="text-sm text-gray-500">
                    Guias detalhados
                  </p>
                </div>
                
                {/* Hover indicator */}
                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
                  <ChevronRight className="h-4 w-4 text-purple-400" />
                </div>
              </div>
            </a>
          </div>
        </motion.div>
      </div>

      {/* Subtle animated background elements */}
      <div className="absolute bottom-1/4 -left-32 w-64 h-64 bg-purple-600/5 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute top-1/3 -right-32 w-64 h-64 bg-violet-600/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
    </section>
  );
}