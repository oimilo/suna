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
  // Map personality profile types to template ids (8 profiles)
  const profileToTemplateMap: Record<string, string> = {
    // Visual + Aesthetic + Interactive = Game Designer
    'visual-aesthetic-interactive': 'game-termo',
    
    // Visual + Aesthetic + Automated = Artista Visual
    'visual-aesthetic-automated': 'blog-markdown',
    
    // Visual + Pragmatic + Interactive = UX Developer
    'visual-pragmatic-interactive': 'landing-page',
    
    // Visual + Pragmatic + Automated = Growth Hacker
    'visual-pragmatic-automated': 'dashboard-analytics',
    
    // Logical + Aesthetic + Interactive = Full Stack Developer
    'logical-aesthetic-interactive': 'api-nodejs',
    
    // Logical + Aesthetic + Automated = Arquiteto de Sistemas
    'logical-aesthetic-automated': 'automation-workflow',
    
    // Logical + Pragmatic + Interactive = Backend Developer
    'logical-pragmatic-interactive': 'ecommerce-cart',
    
    // Logical + Pragmatic + Automated = Automation Engineer
    'logical-pragmatic-automated': 'automation-workflow',
    
    // Fallback para perfis antigos (compatibilidade)
    'visual-aesthetic': 'blog-markdown',
    'visual-pragmatic': 'landing-page',
    'logical-aesthetic': 'api-nodejs',
    'logical-pragmatic': 'ecommerce-cart',
    'developer': 'api-nodejs',
    'designer': 'landing-page',
    'data-analyst': 'dashboard-analytics',
    'content-creator': 'blog-markdown',
    'ecommerce': 'ecommerce-cart',
    'gamer': 'game-2048'
  };

  const templateId = profileToTemplateMap[profileType] || 'landing-page';
  return templates.find(t => t.id === templateId);
}