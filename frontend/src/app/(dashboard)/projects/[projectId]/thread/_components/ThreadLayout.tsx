import React from 'react';
import { SiteHeader } from '@/components/thread/thread-site-header';
import { FileViewerModal } from '@/components/thread/file-viewer-modal';
import { ToolCallSidePanel } from '@/components/thread/tool-call-side-panel';
import { BillingErrorAlert } from '@/components/billing/usage-limit-alert';
import { Project } from '@/lib/api';
import { ApiMessageType, BillingData } from '../_types';
import { ToolCallInput } from '@/components/thread/tool-call-side-panel';
import { useSidebarContext } from '@/contexts/sidebar-context';

interface ThreadLayoutProps {
  children: React.ReactNode;
  threadId: string;
  projectName: string;
  projectId: string;
  project: Project | null;
  sandboxId: string | null;
  isSidePanelOpen: boolean;
  isPanelMinimized?: boolean;
  onToggleSidePanel: () => void;
  onProjectRenamed?: (newName: string) => void;
  onViewFiles: (filePath?: string, filePathList?: string[]) => void;
  fileViewerOpen: boolean;
  setFileViewerOpen: (open: boolean) => void;
  fileToView: string | null;
  filePathList?: string[];
  toolCalls: ToolCallInput[];
  messages: ApiMessageType[];
  externalNavIndex?: number;
  agentStatus: 'idle' | 'running' | 'connecting' | 'error';
  currentToolIndex: number;
  onSidePanelNavigate: (index: number) => void;
  onSidePanelClose: () => void;
  onSidePanelMinimize?: () => void;
  onSidePanelRequestOpen?: () => void;
  renderAssistantMessage: (assistantContent?: string, toolContent?: string) => React.ReactNode;
  renderToolResult: (toolContent?: string, isSuccess?: boolean) => React.ReactNode;
  isLoading: boolean;
  showBillingAlert: boolean;
  billingData: BillingData;
  onDismissBilling: () => void;
  debugMode: boolean;
  isMobile: boolean;
  initialLoadCompleted: boolean;
  agentName?: string;
  disableInitialAnimation?: boolean;
}

export function ThreadLayout({
  children,
  threadId,
  projectName,
  projectId,
  project,
  sandboxId,
  isSidePanelOpen,
  isPanelMinimized = false,
  onToggleSidePanel,
  onProjectRenamed,
  onViewFiles,
  fileViewerOpen,
  setFileViewerOpen,
  fileToView,
  filePathList,
  toolCalls,
  messages,
  externalNavIndex,
  agentStatus,
  currentToolIndex,
  onSidePanelNavigate,
  onSidePanelClose,
  onSidePanelMinimize,
  onSidePanelRequestOpen,
  renderAssistantMessage,
  renderToolResult,
  isLoading,
  showBillingAlert,
  billingData,
  onDismissBilling,
  debugMode,
  isMobile,
  initialLoadCompleted,
  agentName,
  disableInitialAnimation = false
}: ThreadLayoutProps) {
  const { isPinned } = useSidebarContext();
  
  return (
    <div className="flex h-screen">
      {debugMode && (
        <div className="fixed top-16 right-4 bg-amber-500 text-black text-xs px-2 py-1 rounded-md shadow-md z-50">
          Debug Mode
        </div>
      )}

      <div
        className={`flex flex-col flex-1 overflow-hidden transition-all duration-200 ease-in-out ${(!initialLoadCompleted || (isSidePanelOpen && !isPanelMinimized))
          ? 'mr-[60%]' // Deixa 60% para a área de trabalho quando não minimizado
          : ''
          }`}
      >
        {/* Site Header com título e botões */}
        <SiteHeader
          threadId={threadId}
          projectId={projectId}
          projectName={projectName}
          onViewFiles={onViewFiles}
          onToggleSidePanel={onToggleSidePanel}
          onProjectRenamed={onProjectRenamed}
          isMobileView={isMobile}
          debugMode={debugMode}
        />

        {children}
      </div>

      <ToolCallSidePanel
        isOpen={isSidePanelOpen && initialLoadCompleted}
        onClose={onSidePanelClose}
        onMinimize={onSidePanelMinimize}
        toolCalls={toolCalls}
        messages={messages}
        externalNavigateToIndex={externalNavIndex}
        agentStatus={agentStatus}
        currentIndex={currentToolIndex}
        onNavigate={onSidePanelNavigate}
        project={project || undefined}
        renderAssistantMessage={renderAssistantMessage}
        renderToolResult={renderToolResult}
        isLoading={!initialLoadCompleted || isLoading}
        onFileClick={onViewFiles}
        agentName={agentName}
        disableInitialAnimation={disableInitialAnimation}
        onRequestOpen={onSidePanelRequestOpen}
      />

      {sandboxId && (
        <FileViewerModal
          open={fileViewerOpen}
          onOpenChange={setFileViewerOpen}
          sandboxId={sandboxId}
          initialFilePath={fileToView}
          project={project || undefined}
          filePathList={filePathList}
        />
      )}

      <BillingErrorAlert
        message={billingData.message}
        currentUsage={billingData.currentUsage}
        limit={billingData.limit}
        accountId={billingData.accountId}
        onDismiss={onDismissBilling}
        isOpen={showBillingAlert}
      />
    </div>
  );
} 