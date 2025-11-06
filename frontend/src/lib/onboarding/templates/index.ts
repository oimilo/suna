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
  const modernPersonaMap: Record<string, string> = {
    'website-showcase': 'landing-page',
    'website-general': 'landing-page',
    'ecommerce': 'ecommerce-cart',
    'analytics': 'dashboard-analytics',
    'automation': 'automation-workflow',
    'content-visual': 'blog-markdown',
    'content-technical': 'api-nodejs',
    'developer': 'api-nodejs',
  };

  // Compatibilidade com perfis antigos que ainda podem existir em metadados prévios
  const legacyPersonaMap: Record<string, string> = {
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

  const profileToTemplateMap: Record<string, string> = {
    ...legacyPersonaMap,
    ...modernPersonaMap,
  };

  const templateId = profileToTemplateMap[profileType] || 'landing-page';
  return templates.find(t => t.id === templateId);
}