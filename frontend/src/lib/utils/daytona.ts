import type { Project } from '@/lib/api/projects';

const DAYTONA_PROXY_BASE = process.env.NEXT_PUBLIC_DAYTONA_PREVIEW_BASE_URL?.replace(
  /\/$/,
  '',
);

const DAYTONA_HOST_REGEX =
  /^https?:\/\/\d+-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.proxy\.daytona\.works/i;

const buildProxyPreviewUrl = (sandboxId?: string, path?: string) => {
  if (!DAYTONA_PROXY_BASE || !sandboxId) return undefined;
  const normalizedPath = path ? `/${path.replace(/^\/+/, '')}` : '';
  return `${DAYTONA_PROXY_BASE}/${sandboxId}${normalizedPath}`;
};

const getSandboxIdFromProject = (project?: Project) =>
  project?.sandbox?.id?.trim() || undefined;

const getSandboxIdFromUrl = (originalUrl?: string) => {
  if (!originalUrl) return undefined;
  const match = DAYTONA_HOST_REGEX.exec(originalUrl);
  return match?.[1];
};

type PreviewUrlOptions = {
  project?: Project;
  originalUrl?: string;
  path?: string;
};

export const getProxyPreviewUrl = ({
  project,
  originalUrl,
  path,
}: PreviewUrlOptions) => {
  const sandboxId = getSandboxIdFromProject(project) ?? getSandboxIdFromUrl(originalUrl);
  return buildProxyPreviewUrl(sandboxId, path);
};

