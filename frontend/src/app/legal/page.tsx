'use client';

import { useState, useEffect, Suspense, useRef, useMemo } from 'react';
import Link from 'next/link';
// removed decorative background
import { ArrowLeft, ChevronDown, ChevronUp, Search, Copy, Check, FileText, Shield, Users, Mail, Phone, ExternalLink } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { BRANDING } from '@/lib/branding';
import { privacyPolicyRaw } from './privacy-policy-content';
import { termsRaw } from '@/app/legal/terms-content';

function LegalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Get tab from URL or default to "privacy"
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(
    tabParam === 'terms' || tabParam === 'privacy' ? tabParam : 'privacy',
  );

  // background effects removed
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  // Auto-expansion control (via search)
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  // const contentRef = useRef<HTMLDivElement>(null);

  // Mount flag removed (no background effects)

  // Sync URL when tab changes (avoid loops by checking current param)
  useEffect(() => {
    const current = tabParam;
    if (current !== activeTab) {
      const params = new URLSearchParams(searchParams);
      params.set('tab', activeTab);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Sync state when URL changes
  useEffect(() => {
    if (tabParam === 'terms' || tabParam === 'privacy') {
      if (tabParam !== activeTab) setActiveTab(tabParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);

  // Handle tab change
  const handleTabChange = (tab: 'terms' | 'privacy') => {
    setActiveTab(tab);
  };

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // (moved below after parsed sections are defined)

  // Copy link to clipboard
  const copyLink = async (sectionId: string) => {
    const url = `${window.location.origin}${pathname}?tab=${activeTab}#${sectionId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(sectionId);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  // Scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Parse privacy policy raw text into sections (id, title, content)
  type ParsedSection = { id: string; title: string; content: string };
  const privacySectionsParsed: ParsedSection[] = useMemo(() => {
    const lines = privacyPolicyRaw.split(/\r?\n/);
    const result: ParsedSection[] = [];
    let current: ParsedSection | null = null;
    const headerRegex = /^(\d+(?:\.\d+)*)(?:\.)?\s+(.+)$/;
    for (const line of lines) {
      const m = line.match(headerRegex);
      if (m) {
        if (current) result.push(current);
        current = { id: m[1], title: m[2].trim(), content: '' };
      } else if (current) {
        current.content += (current.content ? '\n' : '') + line;
      }
    }
    if (current) result.push(current);
    return result;
  }, []);

  const sanitizeId = (id: string) => id.replace(/\./g, '-');

  // Map to sidebar items with icons
  const privacySections = privacySectionsParsed.map((s) => ({
    id: sanitizeId(s.id),
    title: s.title,
    icon:
      s.title.toLowerCase().includes('seguran') ? (
        <Shield size={16} />
      ) : s.title.toLowerCase().includes('dados') || s.title.toLowerCase().includes('titulares') ? (
        <Users size={16} />
      ) : s.title.toLowerCase().includes('cookies') ? (
        <FileText size={16} />
      ) : s.title.toLowerCase().includes('google') || s.title.toLowerCase().includes('transfer') || s.title.toLowerCase().includes('integra') ? (
        <ExternalLink size={16} />
      ) : s.title.toLowerCase().includes('comunica') || s.title.toLowerCase().includes('contato') ? (
        <Mail size={16} />
      ) : (
        <FileText size={16} />
      ),
  }));

  // Terms of Service parsing
  const termsSectionsParsed: ParsedSection[] = useMemo(() => {
    const lines = termsRaw.split(/\r?\n/);
    const result: ParsedSection[] = [];
    let current: ParsedSection | null = null;
    const headerRegex = /^(\d+(?:\.\d+)*)(?:\.)?\s+(.+)$/;
    for (const line of lines) {
      const m = line.match(headerRegex);
      if (m) {
        if (current) result.push(current);
        current = { id: m[1], title: m[2].trim(), content: '' };
      } else if (current) {
        current.content += (current.content ? '\n' : '') + line;
      }
    }
    if (current) result.push(current);
    return result;
  }, []);

  const termsSectionsSidebar = termsSectionsParsed.map((s) => ({
    id: sanitizeId(s.id),
    title: s.title,
    icon:
      s.title.toLowerCase().includes('licen') || s.title.toLowerCase().includes('propriedade') ? (
        <FileText size={16} />
      ) : s.title.toLowerCase().includes('pagamento') || s.title.toLowerCase().includes('assinatura') ? (
        <Users size={16} />
      ) : s.title.toLowerCase().includes('responsab') || s.title.toLowerCase().includes('uso permitido') ? (
        <Shield size={16} />
      ) : s.title.toLowerCase().includes('google') || s.title.toLowerCase().includes('meta') || s.title.toLowerCase().includes('terceiros') ? (
        <ExternalLink size={16} />
      ) : s.title.toLowerCase().includes('contato') ? (
        <Mail size={16} />
      ) : (
        <FileText size={16} />
      ),
  }));

  // Terms sections (sidebar) derived from parsed content
  const termsSections = termsSectionsParsed.map((s) => ({
    id: sanitizeId(s.id),
    title: s.title,
    icon: <FileText size={16} />,
  }));

  const currentSections = activeTab === 'privacy' ? privacySections : termsSections;

  const currentSectionsFiltered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentSections;
    if (activeTab === 'privacy') {
      const ids = new Set(
        privacySectionsParsed
          .filter(s => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q))
          .map(s => sanitizeId(s.id))
      );
      return currentSections.filter(s => ids.has(s.id));
    } else {
      const ids = new Set(
        termsSectionsParsed
          .filter(s => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q))
          .map(s => sanitizeId(s.id))
      );
      return currentSections.filter(s => ids.has(s.id));
    }
  }, [searchQuery, activeTab, currentSections, privacySectionsParsed, termsSectionsParsed]);

  const matchedIds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null as Set<string> | null;
    if (activeTab === 'privacy') {
      return new Set(
        privacySectionsParsed
          .filter(s => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q))
          .map(s => sanitizeId(s.id))
      );
    }
    return new Set(
      termsSectionsParsed
        .filter(s => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q))
        .map(s => sanitizeId(s.id))
    );
  }, [searchQuery, activeTab, privacySectionsParsed, termsSectionsParsed]);

  // Auto expand on search (after parsed sections exist)
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setExpandedSections(new Set());
      return;
    }
    if (activeTab === 'privacy') {
      const ids = privacySectionsParsed
        .filter(s => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q))
        .map(s => sanitizeId(s.id));
      setExpandedSections(new Set(ids));
    } else {
      const ids = termsSectionsParsed
        .filter(s => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q))
        .map(s => sanitizeId(s.id));
      setExpandedSections(new Set(ids));
    }
  }, [searchQuery, activeTab, privacySectionsParsed, termsSectionsParsed]);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen w-full">
      <section className="w-full relative overflow-hidden pb-20">
        <div className="relative flex flex-col items-center w-full px-6 pt-10">
          {/* Decorative background removed to match /dashboard */}

          <div className="max-w-6xl w-full mx-auto">
            <div className="flex items-center justify-center mb-10 relative">
              <Link
                href="/"
                className="absolute left-0 group border border-border/50 bg-background hover:bg-accent/20 hover:border-secondary/40 rounded-full text-sm h-8 px-3 flex items-center gap-2 transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105"
              >
                <ArrowLeft size={14} className="text-muted-foreground" />
                <span className="font-medium text-muted-foreground text-xs tracking-wide">
                  Voltar
                </span>
              </Link>

              <h1 className="text-3xl md:text-4xl font-medium tracking-tighter text-center">
                Informações <span className="text-primary">Legais</span>
              </h1>
            </div>

            <div className="flex justify-center mb-8">
              <div className="flex space-x-4 border-b border-border">
                <button
                  onClick={() => handleTabChange('terms')}
                  className={`pb-2 px-4 ${
                    activeTab === 'terms'
                      ? 'border-b-2 border-primary font-medium text-primary'
                      : 'text-muted-foreground hover:text-primary/80 transition-colors'
                  }`}
                >
                  Termos de Uso
                </button>
                <button
                  onClick={() => handleTabChange('privacy')}
                  className={`pb-2 px-4 ${
                    activeTab === 'privacy'
                      ? 'border-b-2 border-primary font-medium text-primary'
                      : 'text-muted-foreground hover:text-primary/80 transition-colors'
                  }`}
                >
                  Política de Privacidade
                </button>
              </div>
            </div>

            {/* Search and Controls */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  type="text"
                  placeholder="Pesquisar nesta página..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
              </div>
              <div className="flex gap-2">
                <div className="text-xs text-muted-foreground flex items-center">
                  Última atualização: {new Date().toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>

            <div className="flex gap-6">
              {/* Sidebar Navigation */}
              <div className="hidden lg:block w-64 flex-shrink-0">
                <div className="sticky top-6">
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="font-medium mb-3 text-sm">Índice</h3>
                    <nav className="space-y-1">
                      {currentSectionsFiltered.map((section) => (
                        <button
                          key={`${section.id}-${section.title}`}
                          onClick={() => scrollToSection(section.id)}
                          className="w-full text-left flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground hover:text-primary hover:bg-accent/20 rounded transition-colors"
                        >
                          {section.icon}
                          <span className="truncate">{section.title}</span>
                        </button>
                      ))}
                    </nav>
                  </div>
                  
                  {/* Contact Card */}
                  <div className="mt-4 bg-card border border-border rounded-lg p-4">
                    <h3 className="font-medium mb-3 text-sm flex items-center gap-2">
                      <Mail size={16} />
                      Contato
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div>
                        <strong>Privacidade:</strong><br />
                        <a href="mailto:privacidade@oimilo.com" className="text-secondary hover:underline">
                          privacidade@oimilo.com
                        </a>
                      </div>
                      <div>
                        <strong>Suporte:</strong><br />
                        <a href="mailto:suporte@oimilo.com" className="text-secondary hover:underline">
                          suporte@oimilo.com
                        </a>
                      </div>
                      <div className="pt-2 border-t border-border">
                        <strong>ANPD:</strong><br />
                        <a href="https://gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline flex items-center gap-1">
                          gov.br/anpd
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1">
                <div className="rounded-xl border border-border bg-[#F3F4F6] dark:bg-[#F9FAFB]/[0.02] p-8 shadow-sm">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    {activeTab === 'privacy' ? (
                  <div>
                        {/* Privacy Policy TL;DR */}
                        <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <h2 className="text-lg font-semibold mb-4 text-blue-900 dark:text-blue-100">
                            📋 Resumo Executivo
                    </h2>
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <h3 className="font-medium mb-2">Dados Coletados:</h3>
                              <ul className="space-y-1 text-muted-foreground">
                                <li>• Nome, e-mail, senha (cadastro)</li>
                                <li>• Dados de automações (temporários)</li>
                                <li>• Dados técnicos (IP, navegador)</li>
                    </ul>
                            </div>
                            <div>
                              <h3 className="font-medium mb-2">Finalidades:</h3>
                              <ul className="space-y-1 text-muted-foreground">
                                <li>• Executar automações solicitadas</li>
                                <li>• Prestar suporte técnico</li>
                                <li>• Melhorar o serviço</li>
                    </ul>
                            </div>
                            <div>
                              <h3 className="font-medium mb-2">Seus Direitos:</h3>
                              <ul className="space-y-1 text-muted-foreground">
                                <li>• Acesso, correção, exclusão</li>
                                <li>• Portabilidade dos dados</li>
                                <li>• Revogação de consentimento</li>
                    </ul>
                            </div>
                            <div>
                              <h3 className="font-medium mb-2">Contato DPO:</h3>
                              <p className="text-muted-foreground">
                                <a href="mailto:contato@oimilo.com" className="text-secondary hover:underline">
                                  contato@oimilo.com
                                </a>
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Privacy Policy Content */}
                        <div className="space-y-6">
                          {(matchedIds ? privacySectionsParsed.filter(s => matchedIds.has(sanitizeId(s.id))) : privacySectionsParsed).map((section) => (
                            <div key={`${sanitizeId(section.id)}-${section.title}`} id={sanitizeId(section.id)} className="border border-border rounded-lg">
                              <button
                                onClick={() => toggleSection(sanitizeId(section.id))}
                                className="w-full p-4 text-left flex items-center justify-between hover:bg-accent/20 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <FileText size={20} className="text-secondary" />
                                  <h2 className="text-lg font-medium">{section.id}. {section.title}</h2>
                                </div>
                                {expandedSections.has(sanitizeId(section.id)) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                              </button>
                              {expandedSections.has(sanitizeId(section.id)) && (
                                <div className="px-4 pb-4 border-t border-border">
                                  <div className="pt-4 text-sm text-muted-foreground whitespace-pre-wrap">
                                    {section.content}
                                  </div>
                                  <div className="mt-3 flex gap-2">
                                    <button
                                      onClick={() => copyLink(sanitizeId(section.id))}
                                      className="text-xs px-2 py-1 border border-border rounded hover:bg-accent/20 transition-colors flex items-center gap-1"
                                    >
                                      {copiedLink === sanitizeId(section.id) ? <Check size={12} /> : <Copy size={12} />}
                                      {copiedLink === sanitizeId(section.id) ? 'Copiado!' : 'Copiar link'}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Footer note */}
                          <div className="text-center py-8 text-muted-foreground">
                            <p className="text-sm">
                              Use o índice lateral para navegar por todas as seções ou expanda/recolha conforme necessário.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {/* Terms of Service TL;DR */}
                        <div className="mb-8 p-6 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <h2 className="text-lg font-semibold mb-4 text-green-900 dark:text-green-100">
                            📋 Resumo dos Termos
                          </h2>
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <h3 className="font-medium mb-2">Serviço:</h3>
                              <ul className="space-y-1 text-muted-foreground">
                                <li>• Plataforma de automação Prophet</li>
                                <li>• Conecta serviços e aplicações</li>
                                <li>• Executa fluxos automatizados</li>
                              </ul>
                            </div>
                            <div>
                              <h3 className="font-medium mb-2">Responsabilidades:</h3>
                              <ul className="space-y-1 text-muted-foreground">
                                <li>• Você é responsável pelo conteúdo</li>
                                <li>• Uso legal e ético obrigatório</li>
                                <li>• Manter credenciais seguras</li>
                    </ul>
                            </div>
                            <div>
                              <h3 className="font-medium mb-2">Licenciamento:</h3>
                              <ul className="space-y-1 text-muted-foreground">
                                <li>• Apache License 2.0</li>
                                <li>• Você possui os Assets criados</li>
                                <li>• Uso comercial permitido</li>
                    </ul>
                            </div>
                            <div>
                              <h3 className="font-medium mb-2">Contato:</h3>
                              <p className="text-muted-foreground">
                                <a href="mailto:contato@oimilo.com" className="text-secondary hover:underline">
                                  contato@oimilo.com
                                </a>
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Terms of Service Content */}
                        <div className="space-y-6">
                          {(matchedIds ? termsSectionsParsed.filter(s => matchedIds.has(sanitizeId(s.id))) : termsSectionsParsed).map((section) => (
                            <div key={`${sanitizeId(section.id)}-${section.title}`} id={sanitizeId(section.id)} className="border border-border rounded-lg">
                              <button
                                onClick={() => toggleSection(sanitizeId(section.id))}
                                className="w-full p-4 text-left flex items-center justify-between hover:bg-accent/20 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <FileText size={20} className="text-secondary" />
                                  <h2 className="text-lg font-medium">{section.id}. {section.title}</h2>
                                </div>
                                {expandedSections.has(sanitizeId(section.id)) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                              </button>
                              {expandedSections.has(sanitizeId(section.id)) && (
                                <div className="px-4 pb-4 border-t border-border">
                                  <div className="pt-4 text-sm text-muted-foreground whitespace-pre-wrap">
                                    {section.content}
                                  </div>
                                  <div className="mt-3 flex gap-2">
                                    <button
                                      onClick={() => copyLink(sanitizeId(section.id))}
                                      className="text-xs px-2 py-1 border border-border rounded hover:bg-accent/20 transition-colors flex items-center gap-1"
                                    >
                                      {copiedLink === sanitizeId(section.id) ? <Check size={12} /> : <Copy size={12} />}
                                      {copiedLink === sanitizeId(section.id) ? 'Copiado!' : 'Copiar link'}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}

                          <div className="text-center py-8 text-muted-foreground">
                            <p className="text-sm">
                              Use o índice lateral para navegar por todas as seções ou expanda/recolha conforme necessário.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center pb-10">
              <Link
                href="/"
                className="group inline-flex h-10 items-center justify-center gap-2 text-sm font-medium tracking-wide rounded-full px-6 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_3px_3px_-1.5px_rgba(16,24,40,0.06),0_1px_1px_rgba(16,24,40,0.08)] bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-all duration-200 w-fit"
              >
                <span>Voltar ao Início</span>
                <span className="inline-flex items-center justify-center size-5 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors duration-200">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-white"
                  >
                    <path
                      d="M7 17L17 7M17 7H8M17 7V16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// Wrap the LegalContent component with Suspense to handle useSearchParams()
export default function LegalPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          Loading...
        </div>
      }
    >
      <LegalContent />
    </Suspense>
  );
}
