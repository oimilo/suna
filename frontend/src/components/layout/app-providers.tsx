'use client';

import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { SidebarLeft } from '@/components/sidebar/sidebar-left';
import { DeleteOperationProvider } from '@/contexts/DeleteOperationContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { BillingProvider } from '@/contexts/BillingContext';

interface AppProvidersProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  sidebarContent?: React.ReactNode;
  sidebarSiblings?: React.ReactNode; // Components to render as siblings of SidebarInset (e.g., StatusOverlay, FloatingMobileMenuButton)
}

/**
 * Shared wrapper component that provides common app-level providers:
 * - DeleteOperationEffectsWrapper
 * - SubscriptionProvider + BillingProvider (subscription data & billing status)
 * - SidebarProvider + SidebarLeft + SidebarInset (if showSidebar is true)
 */
export function AppProviders({
  children,
  showSidebar = true,
  sidebarContent,
  sidebarSiblings
}: AppProvidersProps) {
  const content = (
    <BillingProvider>
      <SubscriptionProvider>
        <DeleteOperationProvider>
          {children}
        </DeleteOperationProvider>
      </SubscriptionProvider>
    </BillingProvider>
  );

  if (!showSidebar) {
    return content;
  }

  return (
    <SidebarProvider>
      {sidebarContent || <SidebarLeft />}
      <SidebarInset>
        {content}
      </SidebarInset>
      {sidebarSiblings}
    </SidebarProvider>
  );
}

