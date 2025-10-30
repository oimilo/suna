'use client';

import { useState } from 'react';
import { ImageIcon } from 'lucide-react';
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
import { useEditorStore } from '@/lib/stores/use-editor-store';

export function ImageDialog() {
  const { editor } = useEditorStore();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');
  const [title, setTitle] = useState('');

  const handleSubmit = () => {
    if (!editor || !url) return;

    editor
      .chain()
      .focus()
      .setImage({ src: url, alt, title })
      .run();

    setOpen(false);
    setUrl('');
    setAlt('');
    setTitle('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 rounded-sm p-0 transition-colors hover:bg-muted hover:text-foreground"
        >
          <ImageIcon className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Inserir imagem</DialogTitle>
          <DialogDescription>
            Adicione uma imagem ao documento via URL.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="image-url" className="text-right">
              URL
            </Label>
            <Input
              id="image-url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://exemplo.com/imagem.jpg"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="image-alt" className="text-right">
              Alt
            </Label>
            <Input
              id="image-alt"
              value={alt}
              onChange={(event) => setAlt(event.target.value)}
              placeholder="Descrição da imagem"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="image-title" className="text-right">
              Título
            </Label>
            <Input
              id="image-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Título opcional"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>
            Inserir imagem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

