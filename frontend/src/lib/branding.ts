/**
 * Centralized branding configuration
 * This allows easy white-labeling of the application
 */

export const BRANDING = {
  // App name
  name: process.env.NEXT_PUBLIC_APP_NAME || "Suna",
  
  // App description
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || "AI assistant that helps you get real work done",
  
  // App URL
  url: process.env.NEXT_PUBLIC_APP_URL || "https://suna.so",
  
  // Company/organization
  company: process.env.NEXT_PUBLIC_COMPANY_NAME || "Kortix",
  
  // Team name (for credits like "Kortix Team")
  teamName: process.env.NEXT_PUBLIC_TEAM_NAME || "Kortix Team",
  
  // Support email
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@suna.so",
  
  // Company URL (separate from app URL)
  companyUrl: process.env.NEXT_PUBLIC_COMPANY_URL || "https://kortix.ai",
  
  // Contact email (can be different from support email)
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hey@kortix.ai",
  
  // Careers URL
  careersUrl: process.env.NEXT_PUBLIC_CAREERS_URL || "https://kortix.ai/careers",
  
  // Logo paths
  logo: {
    light: process.env.NEXT_PUBLIC_LOGO_LIGHT || "/logo-light.svg",
    dark: process.env.NEXT_PUBLIC_LOGO_DARK || "/logo-dark.svg",
    favicon: process.env.NEXT_PUBLIC_FAVICON || "/favicon.ico"
  },
  
  // Social links
  social: {
    twitter: process.env.NEXT_PUBLIC_TWITTER_URL || "https://twitter.com/kortixai",
    github: process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com/kortix-ai/suna",
    discord: process.env.NEXT_PUBLIC_DISCORD_URL || "https://discord.gg/kortixai",
    linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL || "https://www.linkedin.com/company/kortix/",
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://instagram.com/kortixai"
  },
  
  // Legal pages
  legal: {
    privacy: process.env.NEXT_PUBLIC_PRIVACY_URL || "https://suna.so/legal?tab=privacy",
    terms: process.env.NEXT_PUBLIC_TERMS_URL || "https://suna.so/legal?tab=terms",
    license: process.env.NEXT_PUBLIC_LICENSE_URL || "https://github.com/kortix-ai/suna/blob/main/LICENSE"
  },
  
  // Feature flags
  features: {
    showPoweredBy: process.env.NEXT_PUBLIC_SHOW_POWERED_BY !== "false", // Default true
    allowSignup: process.env.NEXT_PUBLIC_ALLOW_SIGNUP !== "false", // Default true
    showPricing: process.env.NEXT_PUBLIC_SHOW_PRICING !== "false" // Default true
  },
  
  // Calendar/Demo booking
  calendarLink: process.env.NEXT_PUBLIC_CALENDAR_LINK || "team/kortix/enterprise-demo",
  
  // Legal entity information
  legalEntity: {
    name: process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME || "Kortix AI Corp",
    address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS || "701 Tillery Street Unit 12-2521 Austin, Texas 78702, United States",
    email: process.env.NEXT_PUBLIC_LEGAL_EMAIL || "legal@kortix.ai"
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