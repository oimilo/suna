/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { ExternalLink, ShieldCheck, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Markdown } from '@/components/ui/markdown';

interface ComposioUrlDetectorProps {
  content: string;
  className?: string;
}

interface ComposioUrl {
  url: string;
  toolkitName: string | null;
  toolkitSlug: string | null;
  startIndex: number;
  endIndex: number;
}

// Common toolkit name mappings for better display
const TOOLKIT_NAME_MAPPINGS: Record<string, string> = {
  gmail: 'Gmail',
  github: 'GitHub',
  gitlab: 'GitLab',
  google_sheets: 'Google Sheets',
  google_drive: 'Google Drive',
  google_calendar: 'Google Calendar',
  notion: 'Notion',
  slack: 'Slack',
  discord: 'Discord',
  twitter: 'Twitter',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
  youtube: 'YouTube',
  zoom: 'Zoom',
  microsoft_teams: 'Microsoft Teams',
  outlook: 'Outlook',
  dropbox: 'Dropbox',
  onedrive: 'OneDrive',
  salesforce: 'Salesforce',
  hubspot: 'HubSpot',
  mailchimp: 'Mailchimp',
  stripe: 'Stripe',
  paypal: 'PayPal',
  shopify: 'Shopify',
  wordpress: 'WordPress',
  airtable: 'Airtable',
  monday: 'Monday.com',
  asana: 'Asana',
  trello: 'Trello',
  jira: 'Jira',
  figma: 'Figma',
  twilio: 'Twilio',
  aws: 'AWS',
  google_cloud: 'Google Cloud',
  azure: 'Azure',
};

// Toolkit logos/icons mapping
const TOOLKIT_LOGOS: Record<string, string> = {
  gmail: 'https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/gmail.svg',
  github: 'https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/github.svg',
  slack: 'https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/slack.svg',
  notion: 'https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/notion.svg',
  google_sheets: 'https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/google-sheets.svg',
  google_drive: 'https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/google-drive.svg',
  linear: 'https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/linear.svg',
  airtable: 'https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/airtable.svg',
  asana: 'https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/asana.svg',
  trello: 'https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/trello.svg',
  salesforce: 'https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/salesforce.svg',
};

function formatToolkitName(toolkitSlug: string): string {
  if (TOOLKIT_NAME_MAPPINGS[toolkitSlug.toLowerCase()]) {
    return TOOLKIT_NAME_MAPPINGS[toolkitSlug.toLowerCase()];
  }

  return toolkitSlug
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function extractToolkitInfoFromContext(
  content: string,
  urlStartIndex: number,
): { toolkitName: string | null; toolkitSlug: string | null } {
  const contextBefore = content.substring(Math.max(0, urlStartIndex - 200), urlStartIndex);
  const contextAfter = content.substring(urlStartIndex, Math.min(content.length, urlStartIndex + 100));

  let match = contextBefore.match(/\[toolkit:([^:]+):([^\]]+)\]\s+Authentication:\s*$/i);
  if (match) {
    const toolkitSlug = match[1].trim();
    const toolkitName = match[2].trim();
    return { toolkitName, toolkitSlug };
  }

  match = contextBefore.match(/([A-Za-z]+(?:\s+[A-Za-z]+)*)\s+Authentication:\s*$/i);
  if (match) {
    const serviceName = match[1].trim();
    const slug = serviceName.toLowerCase().replace(/\s+/g, '_');
    return { toolkitName: serviceName, toolkitSlug: slug };
  }

  match = contextBefore.match(/\d+\.\s*([A-Za-z]+(?:\s+[A-Za-z]+)*)\s+(?:Integration|Authentication)(?:\s+[^:\n]*)?:?\s*$/i);
  if (match) {
    const serviceName = match[1].trim();
    const slug = serviceName.toLowerCase().replace(/\s+/g, '_');
    return { toolkitName: serviceName, toolkitSlug: slug };
  }

  match = contextBefore.match(/\d+\.\s*([A-Za-z]+(?:\s+[A-Za-z]+)*)\s+(?:Integration|Authentication)\s*[^\w\n]*\s*$/i);
  if (match) {
    const serviceName = match[1].trim();
    const slug = serviceName.toLowerCase().replace(/\s+/g, '_');
    return { toolkitName: serviceName, toolkitSlug: slug };
  }

  match = contextBefore.match(/([A-Za-z]+(?:\s+[A-Za-z]+)*)\s+Authentication\s+\([^)]*\)\s*:?\s*$/i);
  if (match) {
    const serviceName = match[1].trim();
    const slug = serviceName.toLowerCase().replace(/\s+/g, '_');
    return { toolkitName: serviceName, toolkitSlug: slug };
  }

  const urlContext = contextAfter.substring(0, 100);
  match = urlContext.match(/Sign\s+in\s+to\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)/i);
  if (match) {
    const serviceName = match[1].trim();
    const slug = serviceName.toLowerCase().replace(/\s+/g, '_');
    return { toolkitName: serviceName, toolkitSlug: slug };
  }

  const immediateContext = content.substring(Math.max(0, urlStartIndex - 100), urlStartIndex);
  match = immediateContext.match(/([A-Za-z]+)\s+(?:authentication|auth|connect)\s*(?:link|url)?:?\s*$/i);
  if (match) {
    const serviceName = match[1].trim();
    const slug = serviceName.toLowerCase().replace(/\s+/g, '_');
    return { toolkitName: serviceName, toolkitSlug: slug };
  }

  const commonToolkits = Object.keys(TOOLKIT_NAME_MAPPINGS);
  for (const toolkit of commonToolkits) {
    const toolkitName = TOOLKIT_NAME_MAPPINGS[toolkit];
    if (immediateContext.toLowerCase().includes(toolkitName.toLowerCase())) {
      return { toolkitName, toolkitSlug: toolkit };
    }
  }

  return { toolkitName: null, toolkitSlug: null };
}

function detectComposioUrls(content: string): ComposioUrl[] {
  const authUrlPatterns = [
    /https:\/\/accounts\.google\.com\/oauth\/authorize\?[^\s)]+/g,
    /https:\/\/accounts\.google\.com\/o\/oauth2\/[^\s)]+/g,
    /https:\/\/github\.com\/login\/oauth\/authorize\?[^\s)]+/g,
    /https:\/\/api\.notion\.com\/v1\/oauth\/authorize\?[^\s)]+/g,
    /https:\/\/slack\.com\/oauth\/[^\s)]+/g,
    /https:\/\/[^/\s]+\.slack\.com\/oauth\/[^\s)]+/g,
    /https:\/\/login\.microsoftonline\.com\/[^\s)]+/g,
    /https:\/\/[^/\s]+\/oauth2?\/authorize\?[^\s)]+/g,
    /https:\/\/backend\.composio\.dev\/[^\s)]+/g,
    /https:\/\/[^/\s]+\/auth\/[^\s)]+/g,
    /https:\/\/[^/\s]+\/authorize\?[^\s)]+/g,
    /https:\/\/[^/\s]+\/connect\/[^\s)]+/g,
    /https:\/\/[^\s)]+[?&](client_id|redirect_uri|response_type|scope)=[^\s)]+/g,
  ];

  const urls: ComposioUrl[] = [];
  const processedUrls = new Set<string>();

  for (const pattern of authUrlPatterns) {
    let match;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(content)) !== null) {
      const url = match[0];

      if (processedUrls.has(url)) {
        continue;
      }

      processedUrls.add(url);
      const { toolkitName, toolkitSlug } = extractToolkitInfoFromContext(content, match.index);

      urls.push({
        url,
        toolkitName,
        toolkitSlug,
        startIndex: match.index,
        endIndex: match.index + url.length,
      });
    }
  }

  return urls.sort((a, b) => a.startIndex - b.startIndex);
}

function hasAuthUrlPattern(content: string, url: ComposioUrl): boolean {
  const beforeUrl = content.substring(Math.max(0, url.startIndex - 100), url.startIndex);
  return /(?:(?:\[toolkit:[^:]+:[^\]]+\]|[A-Za-z]+(?:\s+[A-Za-z]+)*)\s+)?(?:authentication|auth|connect|visit)\s+(?:url|link)?:\s*$/i.test(beforeUrl);
}

interface ComposioConnectButtonProps {
  url: string;
  toolkitName?: string;
  toolkitSlug?: string;
}

const ComposioConnectButton: React.FC<ComposioConnectButtonProps> = ({
  url,
  toolkitName,
  toolkitSlug,
}) => {
  const displayName = toolkitName || (toolkitSlug ? formatToolkitName(toolkitSlug) : 'Service');
  const logoUrl = toolkitSlug ? TOOLKIT_LOGOS[toolkitSlug.toLowerCase()] : null;

  const handleConnect = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="bg-card border border-dashed border-primary/30 shadow-none">
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
            {logoUrl ? (
              <img src={logoUrl} alt={displayName} className="h-6 w-6 rounded-sm object-contain" />
            ) : (
              <ShieldCheck className="h-5 w-5 text-primary" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Autenticação necessária</p>
            <p className="text-sm text-muted-foreground">
              Clique para conectar sua conta {displayName} com o Composio.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
            <Server className="mr-1 h-3 w-3" />
            Composio Secure Connect
          </Badge>
          <span>•</span>
          <span>Sua autorização é necessária para completar esta etapa.</span>
        </div>

        <Button onClick={handleConnect} className="gap-2">
          Continuar com {displayName}
          <ExternalLink className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};

export const ComposioUrlDetector: React.FC<ComposioUrlDetectorProps> = ({
  content,
  className,
}) => {
  const detectedUrls = detectComposioUrls(content);

  if (detectedUrls.length === 0) {
    return <Markdown className={className}>{content}</Markdown>;
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  detectedUrls.forEach((url, index) => {
    if (url.startIndex > lastIndex) {
      parts.push(
        <Markdown key={`text-${index}`} className={className}>
          {content.substring(lastIndex, url.startIndex)}
        </Markdown>,
      );
    }

    if (hasAuthUrlPattern(content, url)) {
      parts.push(
        <div key={`connect-${index}`} className="my-3">
          <ComposioConnectButton
            url={url.url}
            toolkitName={url.toolkitName || undefined}
            toolkitSlug={url.toolkitSlug || undefined}
          />
        </div>,
      );
    } else {
      parts.push(
        <div key={`link-${index}`} className="my-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => window.open(url.url, '_blank', 'noopener,noreferrer')}
          >
            Abrir link de autenticação
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>,
      );
    }

    lastIndex = url.endIndex;
  });

  if (lastIndex < content.length) {
    parts.push(
      <Markdown key="final-text" className={className}>
        {content.substring(lastIndex)}
      </Markdown>,
    );
  }

  return <>{parts}</>;
};
