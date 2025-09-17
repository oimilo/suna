/**
 * Centralized branding configuration
 * This allows easy white-labeling of the application
 */

export const BRANDING = {
  // App name
  name: process.env.NEXT_PUBLIC_APP_NAME || "Prophet",
  
  // App description
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Plataforma de automação inteligente que conecta suas ferramentas favoritas usando linguagem natural",
  
  // App URL
  url: process.env.NEXT_PUBLIC_APP_URL || "https://prophet.build",
  
  // Company/organization
  company: process.env.NEXT_PUBLIC_COMPANY_NAME || "Milo",
  
  // Team name (for credits like "Milo Team")
  teamName: process.env.NEXT_PUBLIC_TEAM_NAME || "Milo Team",
  
  // Support email
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@milo.com",
  
  // Company URL (separate from app URL)
  companyUrl: process.env.NEXT_PUBLIC_COMPANY_URL || "https://oimilo.com",
  
  // Contact email (can be different from support email)
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contato@oimilo.com",
  
  // Careers URL
  careersUrl: process.env.NEXT_PUBLIC_CAREERS_URL || "https://oimilo.com/careers",
  
  // Logo paths
  logo: {
    light: process.env.NEXT_PUBLIC_LOGO_LIGHT || "/preto.svg",
    dark: process.env.NEXT_PUBLIC_LOGO_DARK || "/branco.svg",
    favicon: process.env.NEXT_PUBLIC_FAVICON || "/symbol.svg"
  },
  
  // Social links
  social: {
    twitter: process.env.NEXT_PUBLIC_TWITTER_URL || "https://twitter.com/oimilo",
    github: process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com/oimilo/suna",
    discord: process.env.NEXT_PUBLIC_DISCORD_URL || "https://discord.gg/milo",
    linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL || "https://www.linkedin.com/company/milo/",
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://instagram.com/oimilo"
  },
  
  // Legal pages
  legal: {
    privacy: process.env.NEXT_PUBLIC_PRIVACY_URL || "https://prophet.build/legal?tab=privacy",
    terms: process.env.NEXT_PUBLIC_TERMS_URL || "https://prophet.build/legal?tab=terms",
    license: process.env.NEXT_PUBLIC_LICENSE_URL || "https://github.com/oimilo/suna/blob/main/LICENSE"
  },
  
  // Feature flags
  features: {
    showPoweredBy: process.env.NEXT_PUBLIC_SHOW_POWERED_BY !== "false", // Default true
    allowSignup: process.env.NEXT_PUBLIC_ALLOW_SIGNUP !== "false", // Default true
    showPricing: process.env.NEXT_PUBLIC_SHOW_PRICING !== "false" // Default true
  },
  
  // Calendar/Demo booking
  calendarLink: process.env.NEXT_PUBLIC_CALENDAR_LINK || "team/milo/demo",
  
  // Legal entity information
  legalEntity: {
    name: process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME || "Milo Corp",
    address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS || "São Paulo, SP, Brasil",
    email: process.env.NEXT_PUBLIC_LEGAL_EMAIL || "legal@oimilo.com"
  }
};

// Helper function to get branded page title
export const getPageTitle = (pageTitle?: string) => {
  if (pageTitle) {
    return `${pageTitle} | ${BRANDING.name}`;
  }
  return BRANDING.name;
};

// Helper function to get branded meta description
export const getMetaDescription = (pageDescription?: string) => {
  return pageDescription || BRANDING.description;
};