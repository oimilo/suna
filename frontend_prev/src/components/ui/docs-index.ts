'use client';

import { DocsSidebar } from './docs-sidebar';
import { DocsHeader } from './docs-header';
import { DocsCard } from './docs-card';
import { DocsBody } from './docs-body';
import { DocsBullets, DocsBulletItem } from './docs-bullets';
import { DocsTable, createDocsTableColumn } from './docs-table';
import { DocsImage } from './docs-image';
import { DocsThemeToggle } from './docs-theme-toggle';

export {
  DocsSidebar,
  DocsHeader,
  DocsCard,
  DocsBody,
  DocsBullets,
  DocsBulletItem,
  DocsTable,
  createDocsTableColumn,
  DocsImage,
  DocsThemeToggle,
};

export type { 
  DocsNavigationItem, 
  DocsSidebarProps 
} from './docs-sidebar';

export type { 
  DocsBreadcrumbItem, 
  DocsHeaderProps 
} from './docs-header';

export type { 
  DocsCardAction, 
  DocsCardProps 
} from './docs-card';

export type { 
  DocsBodyProps 
} from './docs-body';

export type { 
  DocsBulletItemProps, 
  DocsBulletsProps 
} from './docs-bullets';

export type { 
  DocsTableColumn, 
  DocsTableRow, 
  DocsTableProps 
} from './docs-table';

export type { 
  DocsImageProps 
} from './docs-image';

export type { 
  DocsThemeToggleProps 
} from './docs-theme-toggle';

import type { DocsNavigationItem } from './docs-sidebar';
import type { DocsBreadcrumbItem } from './docs-header';

export const createDocsNavigation = (items: DocsNavigationItem[]) => ({
  items
});

export const createDocsBreadcrumbs = (items: DocsBreadcrumbItem[]) => items;

export const defaultDocsConfig = {
  sidebar: {
    width: '280px',
    showSearch: true,
    searchPlaceholder: 'Search docs...'
  },
  header: {
    size: 'default' as const,
    showSeparator: true
  },
  card: {
    size: 'default' as const,
    variant: 'default' as const,
    hover: true
  },
  body: {
    size: 'default' as const,
    spacing: 'default' as const,
    prose: true,
    maxWidth: '3xl' as const
  },
  bullets: {
    variant: 'default' as const,
    size: 'default' as const,
    spacing: 'default' as const
  },
  table: {
    size: 'default' as const,
    variant: 'default' as const,
    showHeader: true
  },
  image: {
    size: 'default' as const,
    aspect: 'auto' as const,
    rounded: true,
    loading: 'lazy' as const
  }
} as const; 