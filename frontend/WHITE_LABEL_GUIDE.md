# White-Label Configuration Guide

This guide explains how to customize Suna with your own branding.

## Quick Start

### Frontend Configuration

1. Copy the example environment file:
   ```bash
   cd frontend
   cp .env.whitelabel.example .env.local
   ```

2. Edit `.env.local` with your brand values:
   ```bash
   # Your app name
   NEXT_PUBLIC_APP_NAME=MyAI
   
   # Your company name
   NEXT_PUBLIC_COMPANY_NAME=MyCompany
   
   # ... etc
   ```

### Backend Configuration

1. Copy the backend example environment file:
   ```bash
   cd backend
   cp .env.whitelabel.example .env
   ```

2. Edit `.env` with your brand values (or add to existing .env):
   ```bash
   # Your app name
   APP_NAME=MyAI
   
   # Your company name
   COMPANY_NAME=MyCompany
   
   # ... etc
   ```

3. Restart both frontend and backend servers to apply changes.

## Available Configuration

All branding is centralized in `/frontend/src/lib/branding.ts`. You can customize:

### Basic Information
- `NEXT_PUBLIC_APP_NAME` - Your application name (default: "Suna")
- `NEXT_PUBLIC_APP_DESCRIPTION` - App description for metadata
- `NEXT_PUBLIC_APP_URL` - Your application URL
- `NEXT_PUBLIC_COMPANY_NAME` - Your company/organization name
- `NEXT_PUBLIC_TEAM_NAME` - Team name for credits (default: "Milo Team")

### Contact Information
- `NEXT_PUBLIC_SUPPORT_EMAIL` - Support email address
- `NEXT_PUBLIC_CONTACT_EMAIL` - General contact email
- `NEXT_PUBLIC_COMPANY_URL` - Company website URL
- `NEXT_PUBLIC_CAREERS_URL` - Careers page URL

### Visual Assets
- `NEXT_PUBLIC_LOGO_LIGHT` - Light theme logo path
- `NEXT_PUBLIC_LOGO_DARK` - Dark theme logo path
- `NEXT_PUBLIC_FAVICON` - Favicon path

Place your logo files in the `/public` folder.

### Social Links
- `NEXT_PUBLIC_TWITTER_URL` - Twitter/X profile
- `NEXT_PUBLIC_GITHUB_URL` - GitHub repository
- `NEXT_PUBLIC_DISCORD_URL` - Discord server
- `NEXT_PUBLIC_LINKEDIN_URL` - LinkedIn page
- `NEXT_PUBLIC_INSTAGRAM_URL` - Instagram profile

### Legal Pages
- `NEXT_PUBLIC_PRIVACY_URL` - Privacy policy URL
- `NEXT_PUBLIC_TERMS_URL` - Terms of service URL
- `NEXT_PUBLIC_LICENSE_URL` - License URL

### Feature Flags
- `NEXT_PUBLIC_SHOW_POWERED_BY` - Show "Powered by" text (default: true)
- `NEXT_PUBLIC_ALLOW_SIGNUP` - Allow new user signups (default: true)
- `NEXT_PUBLIC_SHOW_PRICING` - Show pricing page (default: true)

## Usage in Code

The branding configuration is automatically applied throughout the application. You can also access it programmatically:

```typescript
import { BRANDING } from '@/lib/branding';

// Use in your components
<h1>Welcome to {BRANDING.name}</h1>
<p>{BRANDING.description}</p>
```

## Production Deployment

For production deployments on Vercel or other platforms:

1. Add all the environment variables to your platform's environment settings
2. Ensure your logo files are included in the deployment
3. Update your backend CORS settings if using a custom domain

## Examples

### Minimal Configuration
```bash
NEXT_PUBLIC_APP_NAME=MyAI
NEXT_PUBLIC_COMPANY_NAME=MyCompany
```

### Full White-Label
```bash
# See .env.whitelabel.example for complete example
```

## Notes

- All environment variables are optional - defaults will be used if not provided
- Changes require a server restart to take effect
- Logo files should be SVG or PNG format for best results
- The branding system is designed to be non-intrusive - no core functionality is affected