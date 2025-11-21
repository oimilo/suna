'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  BellRing,
  GitBranch,
  Megaphone,
  Rocket,
  Sparkles,
  CalendarDays,
  Info,
  X,
} from 'lucide-react';

import { DEFAULT_ANNOUNCEMENTS } from '@/data/announcements';
import {
  useAnnouncementStore,
  type BaseAnnouncement,
  type AnnouncementAction,
} from '@/hooks/use-announcement-store';
import { useShallow } from 'zustand/react/shallow';
import { BRANDING } from '@/lib/branding';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

const priorityStyles: Record<
  BaseAnnouncement['priority'],
  { badge: string; pill: string }
> = {
  urgent: {
    badge: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-200',
    pill: 'text-red-600 dark:text-red-200',
  },
  high: {
    badge: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200',
    pill: 'text-amber-600 dark:text-amber-200',
  },
  medium: {
    badge: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200',
    pill: 'text-blue-600 dark:text-blue-200',
  },
  low: {
    badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-200',
    pill: 'text-slate-500 dark:text-slate-300',
  },
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  sparkles: Sparkles,
  rocket: Rocket,
  workflow: GitBranch,
  chart: BarChart3,
  calendar: CalendarDays,
  megaphone: Megaphone,
};

function getIconComponent(announcement: BaseAnnouncement) {
  const key = announcement.metadata?.icon as string | undefined;
  const Icon = (key && iconMap[key]) || Info;
  return <Icon className="h-5 w-5 text-primary" />;
}

function formatTimestamp(timestamp: number) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(timestamp);
  } catch {
    return '';
  }
}

function handleAction(action: AnnouncementAction, router: ReturnType<typeof useRouter>) {
  if (action.onClick) {
    action.onClick();
    return;
  }
  if (action.href) {
    if (action.href.startsWith('http')) {
      if (typeof window !== 'undefined') {
        window.open(action.href, action.target ?? '_blank');
      }
    } else {
      router.push(action.href);
    }
  }
}

export function AnnouncementsCenter() {
  const router = useRouter();
  const {
    announcements,
    dismissedAnnouncements,
    addAnnouncement,
    showAnnouncement,
    dismissAnnouncement,
    currentAnnouncement,
    isDialogOpen,
    closeDialog,
  } = useAnnouncementStore(
    useShallow((state) => ({
      announcements: state.announcements,
      dismissedAnnouncements: state.dismissedAnnouncements,
      addAnnouncement: state.addAnnouncement,
      showAnnouncement: state.showAnnouncement,
      dismissAnnouncement: state.dismissAnnouncement,
      currentAnnouncement: state.currentAnnouncement,
      isDialogOpen: state.isOpen,
      closeDialog: state.closeDialog,
    })),
  );

  useEffect(() => {
    DEFAULT_ANNOUNCEMENTS.forEach((announcement) => {
      const slug = announcement.metadata?.slug;
      const exists = announcements.some((item) => item.metadata?.slug === slug);
      if (!exists) {
        addAnnouncement(announcement);
      }
    });
  }, [announcements, addAnnouncement]);

  const activeAnnouncements = useMemo(() => {
    const dismissedSet = new Set(dismissedAnnouncements);
    return announcements
      .filter((announcement) => !dismissedSet.has(announcement.id))
      .sort((a, b) => {
        const order = { urgent: 4, high: 3, medium: 2, low: 1 };
        return order[b.priority] - order[a.priority];
      });
  }, [announcements, dismissedAnnouncements]);

  if (!activeAnnouncements.length) {
    return null;
  }

  const [featured, ...rest] = activeAnnouncements;

  return (
    <>
      <div className="w-full px-4 pt-2 pb-4">
        <div className="max-w-5xl mx-auto">
          <Card className="border border-dashed border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-background via-background to-neutral-50/50 dark:to-neutral-900/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <BellRing className="h-3.5 w-3.5" />
                    Updates
                  </p>
                  <CardTitle className="mt-1 text-lg">
                    Novidades no {BRANDING.company}
                  </CardTitle>
                </div>
                <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                  Beta
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {featured && (
                <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/60 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {getIconComponent(featured)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {featured.metadata?.tag && (
                            <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs">
                              {featured.metadata.tag}
                            </Badge>
                          )}
                          <span
                            className={cn(
                              'text-xs font-medium',
                              priorityStyles[featured.priority].pill,
                            )}
                          >
                            {featured.priority === 'high'
                              ? 'Alta prioridade'
                              : featured.priority === 'urgent'
                              ? 'Urgente'
                              : 'Atualização'}
                          </span>
                        </div>
                        <p className="text-base font-semibold mt-1">{featured.title}</p>
                        {featured.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                            {featured.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => dismissAnnouncement(featured.id)}
                      aria-label="Dispensar anúncio"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>Atualizado {formatTimestamp(featured.timestamp)}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => showAnnouncement(featured.id)}>
                      Ver detalhes
                    </Button>
                    {featured.actions?.slice(0, 2).map((action) => (
                      <Button
                        key={action.id}
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(action, router)}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {rest.length > 0 && (
                <div className="grid gap-3 md:grid-cols-2">
                  {rest.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="rounded-lg border border-border/50 bg-background/60 p-3 hover:border-border transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="secondary"
                              className={cn(
                                'rounded-full px-2 py-0.5 text-[10px] border',
                                priorityStyles[announcement.priority].badge,
                              )}
                            >
                              {announcement.metadata?.tag || 'Atualização'}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">
                              {formatTimestamp(announcement.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{announcement.title}</p>
                          {announcement.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {announcement.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => dismissAnnouncement(announcement.id)}
                          aria-label="Dispensar anúncio"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <Button
                          variant="link"
                          className="h-auto px-0 text-xs"
                          onClick={() => showAnnouncement(announcement.id)}
                        >
                          Saber mais
                        </Button>
                        {announcement.actions && announcement.actions.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction(announcement.actions[0], router)}
                          >
                            {announcement.actions[0].label}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={Boolean(isDialogOpen && currentAnnouncement)} onOpenChange={closeDialog}>
        <DialogContent className="max-w-lg">
          {currentAnnouncement && (
            <>
              <DialogHeader className="space-y-1.5">
                <DialogTitle className="flex items-center gap-2">
                  {getIconComponent(currentAnnouncement)}
                  {currentAnnouncement.title}
                </DialogTitle>
                {currentAnnouncement.description && (
                  <DialogDescription className="text-base leading-relaxed">
                    {currentAnnouncement.description}
                  </DialogDescription>
                )}
              </DialogHeader>
              <ScrollArea className="max-h-60 pr-3">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Prioridade:{' '}
                    <span className="font-medium text-foreground">
                      {currentAnnouncement.priority === 'urgent'
                        ? 'Urgente'
                        : currentAnnouncement.priority === 'high'
                        ? 'Alta'
                        : 'Normal'}
                    </span>
                  </p>
                  {currentAnnouncement.customContent}
                  {currentAnnouncement.htmlContent && (
                    <div
                      className="prose dark:prose-invert text-sm"
                      dangerouslySetInnerHTML={{ __html: currentAnnouncement.htmlContent }}
                    />
                  )}
                </div>
              </ScrollArea>
              <DialogFooter className="flex flex-wrap gap-2 justify-between">
                <Button variant="outline" onClick={() => dismissAnnouncement(currentAnnouncement.id)}>
                  Marcar como lido
                </Button>
                <div className="flex gap-2 flex-wrap justify-end">
                  {currentAnnouncement.actions?.map((action) => (
                    <Button
                      key={action.id}
                      onClick={() => handleAction(action, router)}
                      variant={action.variant ?? 'default'}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}


