import { Template } from './types';
import automationWorkflow from './automation-workflow';
import landingPage from './landing-page';
import dashboardAnalytics from './dashboard-analytics';
import apiNodejs from './api-nodejs';
import blogMarkdown from './blog-markdown';
import ecommerceCart from './ecommerce-cart';
import gameTermo from './game-termo';

export const templates: Template[] = [
  automationWorkflow,
  landingPage,
  dashboardAnalytics,
  apiNodejs,
  blogMarkdown,
  ecommerceCart,
  gameTermo,
];

// Re-export types for convenience
export type { Template, OnboardingTemplate, TemplateMessage, TemplateFile } from './types';

// Function to get a template based on profile type
export function getTemplateForProfile(profileType: string): Template | undefined {
  // Novo mapeamento mais intuitivo baseado nos perfis reformulados
  const profileToTemplateMap: Record<string, string> = {
    // Novos perfis diretos
    'website-showcase': 'landing-page',      // Landing Page Designer → Landing Page
    'website-general': 'landing-page',       // Web Developer → Landing Page
    'ecommerce': 'ecommerce-cart',          // E-commerce Specialist → E-commerce
    'content-visual': 'blog-markdown',       // Content Creator → Blog
    'content-technical': 'api-nodejs',       // Technical Writer → API (documentação)
    'game': 'game-termo',                   // Game Developer → Game
    'analytics': 'dashboard-analytics',      // Data Analyst → Dashboard
    'automation': 'automation-workflow',     // Automation Engineer → Automation
    'developer': 'api-nodejs',              // Full Stack Developer → API
    
    // Fallback para perfis antigos (compatibilidade)
    'visual-aesthetic-interactive': 'game-termo',
    'visual-aesthetic-automated': 'blog-markdown',
    'visual-pragmatic-interactive': 'landing-page',
    'visual-pragmatic-automated': 'dashboard-analytics',
    'logical-aesthetic-interactive': 'api-nodejs',
    'logical-aesthetic-automated': 'automation-workflow',
    'logical-pragmatic-interactive': 'ecommerce-cart',
    'logical-pragmatic-automated': 'automation-workflow',
    'visual-aesthetic': 'blog-markdown',
    'visual-pragmatic': 'landing-page',
    'logical-aesthetic': 'api-nodejs',
    'logical-pragmatic': 'ecommerce-cart',
    'designer': 'landing-page',
    'data-analyst': 'dashboard-analytics',
    'content-creator': 'blog-markdown',
    'gamer': 'game-termo'
  };

  const templateId = profileToTemplateMap[profileType] || 'landing-page';
  return templates.find(t => t.id === templateId);
}