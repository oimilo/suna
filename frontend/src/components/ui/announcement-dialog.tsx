'use client';

import { useAnnouncementStore } from '@/hooks/use-announcement-store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function AnnouncementDialog() {
  const { currentAnnouncement, isOpen, closeDialog, dismissAnnouncement } = useAnnouncementStore();

  if (!currentAnnouncement) {
    return null;
  }

  const handleActionClick = (action: any) => {
    action.onClick();
    if (action.id !== 'skip' && action.id !== 'cancel') {
      dismissAnnouncement(currentAnnouncement.id);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeDialog}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {currentAnnouncement.title}
          </DialogTitle>
          {currentAnnouncement.description && (
            <DialogDescription className="mt-2">
              {currentAnnouncement.description}
            </DialogDescription>
          )}
        </DialogHeader>

        {currentAnnouncement.htmlContent && (
          <div 
            className="mt-4"
            dangerouslySetInnerHTML={{ __html: currentAnnouncement.htmlContent }}
          />
        )}

        {currentAnnouncement.customContent && (
          <div className="mt-4">
            {currentAnnouncement.customContent}
          </div>
        )}

        {currentAnnouncement.actions && currentAnnouncement.actions.length > 0 && (
          <DialogFooter className="mt-6">
            {currentAnnouncement.actions.map((action) => (
              <Button
                key={action.id}
                variant={action.variant || 'default'}
                onClick={() => handleActionClick(action)}
                className={cn(
                  action.variant === 'default' && 'bg-primary text-primary-foreground'
                )}
              >
                {action.label}
              </Button>
            ))}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}