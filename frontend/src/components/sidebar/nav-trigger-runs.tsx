'use client';

import { useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, MoreHorizontal, Trash2 } from 'lucide-react';
import { ThreadIcon } from './thread-icon';
import { usePathname, useRouter } from 'next/navigation';
import { useSidebar } from '@/components/ui/sidebar';
import { ThreadWithProject, GroupedThreads } from '@/hooks/sidebar/use-sidebar';
import { processThreadsWithProjects, useProjects, useThreads, groupThreadsByDate, useDeleteThread } from '@/hooks/sidebar/use-sidebar';
import { cn } from '@/lib/utils';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { formatDateForList } from '@/lib/utils/date-formatting';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DeleteConfirmationDialog } from '@/components/thread/DeleteConfirmationDialog';
import { toast } from 'sonner';
import { threadKeys } from '@/hooks/threads/keys';

// Component for date group headers
const DateGroupHeader: React.FC<{ dateGroup: string; count: number }> = ({ dateGroup, count }) => {
    return (
        <div className="py-2 mt-4 first:mt-2">
            <div className="text-xs font-medium text-muted-foreground pl-2.5">
                {dateGroup}
            </div>
        </div>
    );
};

// Component for individual trigger run item
const TriggerRunItem: React.FC<{
    thread: ThreadWithProject;
    isActive: boolean;
    isThreadLoading: boolean;
    isDeleting: boolean;
    handleThreadClick: (e: React.MouseEvent<HTMLAnchorElement>, threadId: string, url: string) => void;
    onDelete: (thread: ThreadWithProject) => void;
}> = ({ thread, isActive, isThreadLoading, handleThreadClick, onDelete, isDeleting }) => {
    const [isHovering, setIsHovering] = useState(false);

    return (
        <SpotlightCard
            className={cn(
                "transition-colors cursor-pointer",
                isActive ? "bg-muted" : "bg-transparent"
            )}
        >
            <a
                href={thread.url}
                onClick={(e) => handleThreadClick(e, thread.threadId, thread.url)}
                className="block"
            >
                <div
                    className="flex items-center gap-3 p-2.5 text-sm"
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                >
                    <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-card border-[1.5px] border-border flex-shrink-0">
                        {isThreadLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : (
                            <ThreadIcon
                                iconName={thread.iconName}
                                className="text-muted-foreground"
                                size={16}
                            />
                        )}
                    </div>
                    <span className="flex-1 truncate">{thread.projectName}</span>
                    <div className="flex-shrink-0 relative">
                        <span
                            className={cn(
                                "text-xs text-muted-foreground transition-opacity",
                                isHovering ? "opacity-0" : "opacity-100"
                            )}
                        >
                            {formatDateForList(thread.updatedAt)}
                        </span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className={cn(
                                        "absolute top-1/2 right-0 -translate-y-1/2 p-1 rounded-md hover:bg-accent transition-all text-muted-foreground",
                                        isHovering ? "opacity-100" : "opacity-0 pointer-events-none"
                                    )}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    disabled={isDeleting}
                                >
                                    <MoreHorizontal className="h-4 w-4 rotate-90" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onDelete(thread);
                                    }}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </a>
        </SpotlightCard>
    );
};

export function NavTriggerRuns() {
    const { isMobile, state, setOpenMobile } = useSidebar();
    const [loadingThreadId, setLoadingThreadId] = useState<string | null>(null);
    const [threadToDelete, setThreadToDelete] = useState<ThreadWithProject | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const isNavigatingRef = useRef(false);
    const queryClient = useQueryClient();
    const { mutate: deleteThreadMutation, isPending: isDeletingThread } = useDeleteThread();

    const {
        data: projects = [],
        isLoading: isProjectsLoading,
        error: projectsError,
    } = useProjects();

    const {
        data: threads = [],
        isLoading: isThreadsLoading,
        error: threadsError,
    } = useThreads();

    const combinedThreads: ThreadWithProject[] =
        !isProjectsLoading && !isThreadsLoading ? processThreadsWithProjects(threads, projects) : [];

    // Filter only trigger threads (threads with projectName starting with "Trigger: ")
    const triggerThreads = combinedThreads.filter((thread) =>
        thread.projectName?.startsWith('Trigger: ')
    );

    const groupedTriggerThreads: GroupedThreads = groupThreadsByDate(triggerThreads);

    useEffect(() => {
        setLoadingThreadId(null);
    }, [pathname]);

    useEffect(() => {
        const handleNavigationComplete = () => {
            document.body.style.pointerEvents = 'auto';
            isNavigatingRef.current = false;
        };

        window.addEventListener('popstate', handleNavigationComplete);

        return () => {
            window.removeEventListener('popstate', handleNavigationComplete);
            document.body.style.pointerEvents = 'auto';
        };
    }, []);

    useEffect(() => {
        isNavigatingRef.current = false;
        document.body.style.pointerEvents = 'auto';
    }, [pathname]);

    // Function to handle thread click with loading state
    const handleThreadClick = (
        e: React.MouseEvent<HTMLAnchorElement>,
        threadId: string,
        url: string
    ) => {
        // Set loading state for normal clicks (not meta key)
        if (!e.metaKey) {
            setLoadingThreadId(threadId);
        }

        // Close mobile sidebar
        if (isMobile) {
            setOpenMobile(false);
        }
    };

    const handleDeleteRequest = (thread: ThreadWithProject) => {
        setThreadToDelete(thread);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!threadToDelete) return;
        const threadId = threadToDelete.threadId;
        const isViewing = pathname?.includes(threadId);

        deleteThreadMutation(
            { threadId },
            {
                onSuccess: () => {
                    toast.success('Trigger run deleted');
                    if (isViewing) {
                        router.push('/dashboard');
                    }
                    queryClient.invalidateQueries({ queryKey: threadKeys.lists() });
                },
                onError: (error) => {
                    console.error('Failed to delete trigger run', error);
                    toast.error('Failed to delete trigger run');
                },
                onSettled: () => {
                    setThreadToDelete(null);
                    setIsDeleteDialogOpen(false);
                }
            }
        );
    };

    // Loading state or error handling
    const isLoading = isProjectsLoading || isThreadsLoading;
    const hasError = projectsError || threadsError;

    if (hasError) {
        console.error('Error loading trigger runs:', { projectsError, threadsError });
    }

    return (
        <>
        <div>
            {/* Section Header */}
            <div className="py-2 mt-4 first:mt-2">
                <div className="text-xs font-medium text-muted-foreground pl-2.5">
                    Trigger Runs
                </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(100vh-480px)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] pb-10">
                {(state !== 'collapsed' || isMobile) && (
                    <>
                        {isLoading ? (
                            // Show skeleton loaders while loading
                            <div className="space-y-1">
                                {Array.from({ length: 3 }).map((_, index) => (
                                    <div key={`skeleton-${index}`} className="flex items-center gap-3 px-2 py-2">
                                        <div className="h-10 w-10 bg-muted/10 border-[1.5px] border-border rounded-2xl animate-pulse"></div>
                                        <div className="h-4 bg-muted rounded flex-1 animate-pulse"></div>
                                        <div className="h-3 w-8 bg-muted rounded animate-pulse"></div>
                                    </div>
                                ))}
                            </div>
                        ) : triggerThreads.length > 0 ? (
                            // Show trigger runs grouped by date
                            <>
                                {Object.entries(groupedTriggerThreads).map(([dateGroup, threadsInGroup]) => (
                                    <div key={dateGroup}>
                                        <DateGroupHeader dateGroup={dateGroup} count={threadsInGroup.length} />
                                        {threadsInGroup.map((thread) => {
                                            const isActive = pathname?.includes(thread.threadId) || false;
                                            const isThreadLoading = loadingThreadId === thread.threadId;

                                            return (
                                                <TriggerRunItem
                                                    key={`trigger-run-${thread.threadId}`}
                                                    thread={thread}
                                                    isActive={isActive}
                                                    isThreadLoading={isThreadLoading}
                                                handleThreadClick={handleThreadClick}
                                                onDelete={handleDeleteRequest}
                                                isDeleting={isDeletingThread && threadToDelete?.threadId === thread.threadId}
                                                />
                                            );
                                        })}
                                    </div>
                                ))}
                            </>
                        ) : (
                            <div className="py-2 text-sm text-muted-foreground pl-2">
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>

        {threadToDelete && (
            <DeleteConfirmationDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleConfirmDelete}
                threadName={threadToDelete.projectName}
                isDeleting={isDeletingThread}
            />
        )}
        </>
    );
}
