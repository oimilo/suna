'use client';

import { useState } from 'react';
import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/lib/stores/use-editor-store';

const presetColors = [
  '#000000',
  '#ffffff',
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#6b7280',
];

export function ColorPicker() {
  const { editor } = useEditorStore();
  const [open, setOpen] = useState(false);

  if (!editor) return null;

  const currentColor = editor.getAttributes('textStyle').color || '#000000';

  const setColor = (color: string) => {
    editor.chain().focus().setColor(color).run();
    setOpen(false);
  };

  const unsetColor = () => {
    editor.chain().focus().unsetColor().run();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="relative h-7 w-7 rounded-sm p-0 transition-colors hover:bg-muted hover:text-foreground"
        >
          <Palette className="h-3.5 w-3.5" />
          <div
            className="absolute bottom-0.5 left-1/2 h-0.5 w-3 -translate-x-1/2 rounded-full"
            style={{ backgroundColor: currentColor }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          <div className="text-sm font-medium">Text Color</div>

          <div className="grid grid-cols-8 gap-1">
            {presetColors.map((color) => (
              <button
                key={color}
                className={cn(
                  'h-7 w-7 rounded-sm border border-gray-200 transition-transform hover:scale-110 dark:border-gray-700',
                  currentColor === color && 'ring-2 ring-offset-1 ring-blue-500'
                )}
                style={{ backgroundColor: color }}
                onClick={() => setColor(color)}
                aria-label={`Set color to ${color}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="color"
              value={currentColor}
              onChange={(event) => setColor(event.target.value)}
              className="h-8 w-full cursor-pointer rounded"
              aria-label="Custom text color"
            />
            <Button size="sm" variant="outline" onClick={unsetColor}>
              Reset
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

