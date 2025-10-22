import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Search, Save, AlertCircle, Loader2, Filter, X, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { backendApi } from '@/lib/api-client';
import { useComposioTools } from '@/hooks/react-query/composio/use-composio';
import { cn } from '@/lib/utils';
import type { ComposioTool } from '@/hooks/react-query/composio/utils';

interface ComposioToolsSelectorProps {
  profileId?: string;
  agentId?: string;
  toolkitName: string;
  toolkitSlug: string;
  selectedTools: string[];
  onToolsChange: (tools: string[]) => void;
  onSave?: () => Promise<void>;
  onCancel?: () => void;
  showSaveButton?: boolean;
  className?: string;
  searchPlaceholder?: string;
}

const ToolCard = ({
  tool,
  isSelected,
  onToggle,
  searchTerm,
}: {
  tool: ComposioTool;
  isSelected: boolean;
  onToggle: () => void;
  searchTerm: string;
}) => {
  const highlightText = (text: string, term: string) => {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/50">
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all p-0 shadow-none bg-card hover:bg-muted/50',
        isSelected && 'bg-primary/10 ring-1 ring-primary/20',
      )}
    >
      <CardContent className="p-4" onClick={onToggle}>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-sm truncate">{highlightText(tool.name, searchTerm)}</h3>
              {tool.tags?.includes('important') && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                >
                  Important
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {highlightText(tool.description || 'No description available', searchTerm)}
            </p>

            <div className="flex items-center gap-2 flex-wrap">
              {tool.input_parameters?.properties && (
                <Badge variant="outline" className="text-xs">
                  {Object.keys(tool.input_parameters.properties).length} params
                </Badge>
              )}
              {tool.tags
                ?.filter((tag) => tag !== 'important')
                .slice(0, 2)
                .map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs text-muted-foreground">
                    {tag}
                  </Badge>
                ))}
            </div>
          </div>

          <div className="flex-shrink-0 ml-2">
            <Checkbox checked={isSelected} onCheckedChange={onToggle} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ToolSkeleton = () => (
  <Card className="shadow-none p-0 bg-muted/30">
    <CardContent className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        <Skeleton className="h-6 w-11 rounded-full flex-shrink-0" />
      </div>
    </CardContent>
  </Card>
);

export const ComposioToolsSelector: React.FC<ComposioToolsSelectorProps> = ({
  profileId,
  agentId,
  toolkitName,
  toolkitSlug,
  selectedTools,
  onToolsChange,
  onSave,
  onCancel,
  showSaveButton = true,
  className,
  searchPlaceholder = 'Search tools...',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTagFilters, setSelectedTagFilters] = useState<Set<string>>(new Set());
  const {
    data: toolsResponse,
    isLoading,
    error,
  } = useComposioTools(toolkitSlug, { enabled: !!toolkitSlug });

  const availableTools = useMemo(() => {
    const rawTools = toolsResponse?.tools || [];
    const toolMap = new Map<string, ComposioTool>();

    rawTools.forEach((tool) => {
      const existing = toolMap.get(tool.name);
      if (!existing) {
        toolMap.set(tool.name, tool);
      } else {
        const hasImportant = tool.tags?.includes('important');
        const existingHasImportant = existing.tags?.includes('important');

        if (hasImportant && !existingHasImportant) {
          toolMap.set(tool.name, tool);
        }
      }
    });

    return Array.from(toolMap.values());
  }, [toolsResponse?.tools]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    availableTools.forEach((tool) => {
      tool.tags?.forEach((tag) => {
        tags.add(tag);
      });
    });
    return Array.from(tags);
  }, [availableTools]);

  const filteredTools = useMemo(() => {
    return availableTools.filter((tool) => {
      const matchesSearch =
        tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.description?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedTagFilters.size === 0) return true;

      return tool.tags?.some((tag) => selectedTagFilters.has(tag));
    });
  }, [availableTools, searchTerm, selectedTagFilters]);

  const toggleToolSelection = (toolSlug: string) => {
    if (selectedTools.includes(toolSlug)) {
      onToolsChange(selectedTools.filter((tool) => tool !== toolSlug));
    } else {
      onToolsChange([...selectedTools, toolSlug]);
    }
  };

  const toggleTagFilter = (tag: string) => {
    const newFilters = new Set(selectedTagFilters);
    if (newFilters.has(tag)) {
      newFilters.delete(tag);
    } else {
      newFilters.add(tag);
    }
    setSelectedTagFilters(newFilters);
  };

  const clearFilters = () => {
    setSelectedTagFilters(new Set());
    setSearchTerm('');
  };

  const handleSave = async () => {
    if (!profileId) return;
    setIsSaving(true);
    try {
      toast.success('Tools saved successfully');
      await onSave?.();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save tools');
    } finally {
      setIsSaving(false);
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load tools for {toolkitName}. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 h-9"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9 gap-1">
              <Filter className="h-4 w-4" />
              Filters
              {selectedTagFilters.size > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] h-5 px-1">
                  {selectedTagFilters.size}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Filter by tags</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {allTags.length === 0 ? (
              <DropdownMenuItem disabled>No tags available</DropdownMenuItem>
            ) : (
              allTags.map((tag) => (
                <DropdownMenuItem key={tag} onClick={() => toggleTagFilter(tag)}>
                  <div className="flex items-center justify-between w-full">
                    <span>{tag}</span>
                    {selectedTagFilters.has(tag) && <Check className="h-3.5 w-3.5 text-primary" />}
                  </div>
                </DropdownMenuItem>
              ))
            )}
            {selectedTagFilters.size > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={clearFilters}>
                  <X className="h-3.5 w-3.5 mr-2" />
                  Clear filters
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <ToolSkeleton key={index} />
            ))}
          </div>
        ) : filteredTools.length === 0 ? (
          <div className="text-center py-12">
            <Alert>
              <AlertDescription>
                No tools found matching &quot;{searchTerm}&quot;. Try adjusting your search or filters.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <ScrollArea className="h-[360px] pr-3">
            <div className="space-y-3">
              {filteredTools.map((tool) => (
                <ToolCard
                  key={tool.slug}
                  tool={tool}
                  isSelected={selectedTools.includes(tool.slug)}
                  onToggle={() => toggleToolSelection(tool.slug)}
                  searchTerm={searchTerm}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {showSaveButton && (
        <div className="flex items-center justify-between pt-4 mt-4 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="text-[11px]">
              {selectedTools.length} selected
            </Badge>
            <span>Selected tools will be available to this agent through Composio.</span>
          </div>
          <div className="flex gap-2">
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save tools
            </Button>
          </div>
        </div>
      )}

      {!showSaveButton && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-3">
          <ChevronDown className="h-3 w-3" />
          <span>Changes save automatically when you continue.</span>
        </div>
      )}
    </div>
  );
};
