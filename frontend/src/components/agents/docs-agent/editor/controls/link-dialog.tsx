'use client';

import { useEffect, useState } from 'react';
import { LinkIcon, UnlinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/lib/stores/use-editor-store';

export function LinkDialog() {
  const { editor } = useEditorStore();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');

  useEffect(() => {
    if (open && editor) {
      const { href } = editor.getAttributes('link');
      if (href) {
        setUrl(href);
      }

      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to);
      setText(selectedText);
    }
  }, [open, editor]);

  const handleSubmit = () => {
    if (!editor || !url) return;

    if (editor.state.selection.empty && text) {
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${url}">${text}</a>`)
        .run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url })
        .run();
    }

    setOpen(false);
    setUrl('');
    setText('');
  };

  const handleRemoveLink = () => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
    setOpen(false);
  };

  const isActive = editor?.isActive('link');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className={cn(
            'h-7 w-7 rounded-sm p-0 transition-colors hover:bg-muted hover:text-foreground',
            isActive && 'bg-muted text-foreground'
          )}
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isActive ? 'Editar link' : 'Inserir link'}</DialogTitle>
          <DialogDescription>Adicione uma URL e um texto opcional.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="link-url" className="text-right">
              URL
            </Label>
            <Input
              id="link-url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://exemplo.com"
              className="col-span-3"
            />
          </div>
          {editor?.state.selection.empty && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="link-text" className="text-right">
                Texto
              </Label>
              <Input
                id="link-text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Texto do link"
                className="col-span-3"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          {isActive && (
            <Button
              variant="outline"
              onClick={handleRemoveLink}
              className="mr-auto"
            >
              <UnlinkIcon className="mr-2 h-4 w-4" />
              Remover link
            </Button>
          )}
          <Button type="submit" onClick={handleSubmit}>
            {isActive ? 'Atualizar' : 'Inserir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

