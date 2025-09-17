import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Edit2, Expand, Save } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ExpandableMarkdownEditorProps {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  placeholder?: string;
  title?: string;
  disabled?: boolean;
}

export const ExpandableMarkdownEditor: React.FC<ExpandableMarkdownEditorProps> = ({ 
  value, 
  onSave, 
  className = '', 
  placeholder = 'Click to edit...',
  title = 'Edit Instructions',
  disabled = false
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
    setIsDialogOpen(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter' && e.metaKey) {
      handleSave();
    }
  };

  const openDialog = () => {
    setIsDialogOpen(true);
    setIsEditing(false);
  };

  const startEditing = () => {
    setIsEditing(true);
  };

  const renderMarkdown = (content: string) => (
    <ReactMarkdown 
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <h1 className="text-lg font-semibold mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-base font-semibold mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="text-sm">{children}</li>,
        code: ({ children, className }) => {
          const isInline = !className?.includes('language-');
          return isInline ? (
            <code className="bg-black/[0.02] dark:bg-white/[0.03] px-1.5 py-0.5 rounded text-xs font-mono border border-black/6 dark:border-white/8">{children}</code>
          ) : (
            <code className={cn('block bg-black/[0.02] dark:bg-white/[0.03] p-3 rounded-lg text-xs font-mono overflow-x-auto border border-black/6 dark:border-white/8', className)}>
              {children}
            </code>
          );
        },
        pre: ({ children }) => <pre className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto mb-2">{children}</pre>,
        blockquote: ({ children }) => <blockquote className="border-l-4 border-muted-foreground/20 pl-4 italic mb-2">{children}</blockquote>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        hr: () => <hr className="my-4 border-muted-foreground/20" />,
        table: ({ children }) => (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-muted-foreground/20 mb-2">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-muted-foreground/20 px-2 py-1 bg-muted font-semibold text-left text-xs">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-muted-foreground/20 px-2 py-1 text-xs">
            {children}
          </td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );

  return (
    <>
      <div className={cn('relative', className)}>
        <div 
          className="group relative p-4 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all duration-200 cursor-pointer overflow-hidden"
          onClick={openDialog}
        >
          <div className="max-h-32 overflow-hidden">
            {value ? (
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                {renderMarkdown(value)}
              </div>
            ) : (
              <div className="text-muted-foreground italic text-sm">
                {placeholder}
              </div>
            )}
          </div>
          {value && value.length > 200 && (
            <div className="absolute bottom-2 left-4 text-xs text-muted-foreground/60 z-10">
              .........
            </div>
          )}
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <Button
              size="sm"
              className="h-6 w-6 p-0 shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                openDialog();
              }}
            >
              <Expand className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] w-[95vw] md:w-full flex flex-col p-0 gap-0">
          <div className="px-6 pt-6 pb-4 border-b border-black/6 dark:border-white/8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{title}</h2>
              {!isEditing && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={startEditing}
                  className="h-8 px-3 hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                  Editar
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden px-6 py-4">
            {isEditing ? (
              <div className="h-full flex flex-col gap-3">
                <div className="flex-1 relative">
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full h-full min-h-[400px] p-4 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent font-mono text-sm"
                    placeholder={placeholder}
                    disabled={disabled}
                  />
                </div>
                <div className="text-xs text-muted-foreground/60">
                  Markdown suportado • Cmd+Enter para salvar • Esc para cancelar
                </div>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="pr-4">
                  {value ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {renderMarkdown(value)}
                    </div>
                  ) : (
                    <div className="text-muted-foreground italic text-center py-8">
                      {placeholder}
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>

          {isEditing && (
            <div className="border-t border-black/6 dark:border-white/8 px-6 py-4">
              <div className="flex justify-end gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  className="h-9 px-4"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleSave}
                  className="h-9 px-4"
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}; 