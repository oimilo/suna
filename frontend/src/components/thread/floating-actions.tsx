'use client';

import { Button } from "@/components/ui/button";
import { FolderOpen, Share2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ShareModal } from "@/components/sidebar/share-modal";
import { useState } from "react";

interface FloatingActionsProps {
  threadId: string;
  projectId: string;
  onViewFiles: () => void;
}

export function FloatingActions({
  threadId,
  projectId,
  onViewFiles,
}: FloatingActionsProps) {
  const [showShareModal, setShowShareModal] = useState(false);

  return (
    <>
      <div className="fixed top-4 right-4 z-20 flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onViewFiles}
                className="h-9 w-9 cursor-pointer bg-background/80 backdrop-blur-sm shadow-sm"
              >
                <FolderOpen className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View Files in Task</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowShareModal(true)}
                className="h-9 w-9 cursor-pointer bg-background/80 backdrop-blur-sm shadow-sm"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Share Chat</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        threadId={threadId}
        projectId={projectId}
      />
    </>
  );
}