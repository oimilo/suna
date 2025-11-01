import React, { useState, useRef, useEffect } from 'react';
import {
  Palette,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Layers,
  Sparkles,
  Wand2,
  ExternalLink,
  Lock,
  Unlock,
} from 'lucide-react';
import { ToolViewProps } from '../types';
import { formatTimestamp } from '../utils';
import { extractDesignerData } from './_utils';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Toggle } from '@/components/ui/toggle';
import { useImageContent } from '@/hooks/react-query/files/use-image-content';

interface DesignElement {
  id: string;
  sandboxId: string;
  filePath: string;
  directUrl?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  opacity: number;
  name: string;
  locked: boolean;
}

interface DesignerToolViewProps extends ToolViewProps {
  onFileClick?: (filePath: string) => void;
}

function DesignElementImage({
  element,
  isSelected,
}: {
  element: DesignElement;
  isSelected: boolean;
}) {
  const [imageError, setImageError] = useState(false);

  const { data: imageUrl, isLoading, error } = useImageContent(
    element.sandboxId,
    element.filePath,
    {
      enabled: !element.directUrl && !imageError,
    },
  );

  const finalUrl = element.directUrl || imageUrl;

  if (!element.directUrl && isLoading && !finalUrl) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-muted/50 animate-pulse rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!finalUrl || imageError || (!element.directUrl && error)) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-muted/50 rounded-lg">
        <AlertTriangle className="h-8 w-8 text-muted-foreground mb-2" />
        <span className="text-xs text-muted-foreground text-center px-2">{element.name}</span>
      </div>
    );
  }

  return (
    <img
      src={finalUrl}
      alt={element.name}
      className="w-full h-full object-contain"
      style={{ borderRadius: 'inherit' }}
      draggable={false}
      onError={() => setImageError(true)}
      loading="eager"
    />
  );
}

export function DesignerToolView({
  name = 'designer_create_or_edit',
  assistantContent,
  toolContent,
  assistantTimestamp,
  toolTimestamp,
  isSuccess = true,
  isStreaming = false,
  onFileClick,
  project,
}: DesignerToolViewProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [elements, setElements] = useState<DesignElement[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [elementStart, setElementStart] = useState({ x: 0, y: 0 });
  const [canvasScale, setCanvasScale] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [canvasOffsetStart, setCanvasOffsetStart] = useState({ x: 0, y: 0 });
  const gridSize = 20;
  const artboardPadding = 50;

  const {
    mode,
    prompt,
    designStyle,
    platformPreset,
    width,
    height,
    quality,
    imagePath,
    generatedImagePath,
    designUrl,
    status,
    error,
    actualIsSuccess,
    actualToolTimestamp,
    actualAssistantTimestamp,
    sandbox_id,
  } = extractDesignerData(assistantContent, toolContent, isSuccess, toolTimestamp, assistantTimestamp);

  const processedPathsRef = useRef<Set<string>>(new Set());
  const lastProcessedPath = useRef<string>('');

  useEffect(() => {
    if (generatedImagePath && !isStreaming) {
      const sandboxId = sandbox_id || project?.sandbox?.id || project?.id;

      if (!sandboxId) {
        console.warn('Designer Tool: No sandbox ID available');
        return;
      }

      let relativePath = generatedImagePath;
      if (relativePath.startsWith('/workspace/')) {
        relativePath = relativePath.substring('/workspace/'.length);
      } else if (relativePath.startsWith('/')) {
        relativePath = relativePath.substring(1);
      }

      const contentKey = `${relativePath}-${designUrl || ''}-${JSON.stringify(toolContent)}`;

      if (lastProcessedPath.current === contentKey) {
        console.log('Designer Tool: Skipping duplicate content');
        return;
      }

      lastProcessedPath.current = contentKey;
      const elementId = `design-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

      if (processedPathsRef.current.has(contentKey)) {
        console.log('Designer Tool: Content already processed previously');
        return;
      }

      processedPathsRef.current.add(contentKey);

      console.log('Designer Tool: Adding new element', {
        relativePath,
        designUrl,
        elementId,
        currentCount: elements.length,
      });

      setElements(prevElements => {
        let x = 100;
        let y = 100;

        if (prevElements.length > 0) {
          const rightmostElement = prevElements.reduce((rightmost, el) => {
            const rightmostRight = rightmost.x + rightmost.width;
            const currentRight = el.x + el.width;
            return currentRight > rightmostRight ? el : rightmost;
          }, prevElements[0]);

          x = rightmostElement.x + rightmostElement.width + artboardPadding;
          y = rightmostElement.y;
        }

        const newElement: DesignElement = {
          id: elementId,
          sandboxId,
          filePath: relativePath,
          directUrl: designUrl,
          x,
          y,
          width: width || 400,
          height: height || 400,
          rotation: 0,
          zIndex: prevElements.length,
          opacity: 100,
          name: relativePath.split('/').pop() || 'design',
          locked: false,
        };

        console.log('Designer Tool: New elements array', [...prevElements, newElement]);
        return [...prevElements, newElement];
      });

      setSelectedElement(elementId);
    }
  }, [generatedImagePath, designUrl, sandbox_id, project, width, height, isStreaming, toolContent, elements.length]);

  const snapToGridValue = (value: number) => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  };

  const handleElementMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    const element = elements.find(el => el.id === elementId);
    if (!element || element.locked) return;

    setSelectedElement(elementId);
    setDraggedElement(elementId);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setElementStart({ x: element.x, y: element.y });
    e.preventDefault();
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-content')) {
      if (e.button === 0 || e.button === 1) {
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
        setCanvasOffsetStart({ ...canvasOffset });
        e.preventDefault();
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && draggedElement) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      setElements(prevElements => prevElements.map(el => {
        if (el.id === draggedElement) {
          return {
            ...el,
            x: snapToGridValue(elementStart.x + deltaX / canvasScale),
            y: snapToGridValue(elementStart.y + deltaY / canvasScale),
          };
        }
        return el;
      }));
    } else if (isPanning) {
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;

      setCanvasOffset({
        x: canvasOffsetStart.x + deltaX,
        y: canvasOffsetStart.y + deltaY,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedElement(null);
    setIsPanning(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsPanning(true);
      setPanStart({ x: touch.clientX, y: touch.clientY });
      setCanvasOffsetStart({ ...canvasOffset });
      e.preventDefault();
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPanning && e.touches.length === 1) {
      const touch = e.touches[0];
      const deltaX = touch.clientX - panStart.x;
      const deltaY = touch.clientY - panStart.y;

      setCanvasOffset({
        x: canvasOffsetStart.x + deltaX,
        y: canvasOffsetStart.y + deltaY,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
  };

  const updateElement = (elementId: string, updates: Partial<DesignElement>) => {
    setElements(prevElements => prevElements.map(el => (el.id === elementId ? { ...el, ...updates } : el)));
  };

  const handleZoomIn = () => {
    setCanvasScale(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setCanvasScale(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleResetView = () => {
    setCanvasScale(1);
    setCanvasOffset({ x: 0, y: 0 });
  };

  const handleDownload = () => {
    const element = elements.find(el => el.id === selectedElement);
    if (element?.directUrl || element?.filePath) {
      const link = document.createElement('a');
      link.href = element.directUrl || `/api/sandboxes/${element.sandboxId}/files?path=${encodeURIComponent(element.filePath)}`;
      link.download = element.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleOpenInNewTab = () => {
    const element = elements.find(el => el.id === selectedElement);
    if (element?.directUrl || element?.filePath) {
      const url = element.directUrl || `/api/sandboxes/${element.sandboxId}/files?path=${encodeURIComponent(element.filePath)}`;
      window.open(url, '_blank');
    }
  };

  const handleOpenInWorkspace = () => {
    const element = elements.find(el => el.id === selectedElement);
    if (element?.filePath && onFileClick) {
      onFileClick(element.filePath);
    }
  };

  const gridBackground = showGrid
    ? {
        backgroundImage:
          'linear-gradient(to right, rgba(148, 163, 184, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.15) 1px, transparent 1px)',
        backgroundSize: `${gridSize * canvasScale}px ${gridSize * canvasScale}px`,
      }
    : undefined;

  return (
    <Card className="gap-0 flex border shadow-none border-t border-b-0 border-x-0 p-0 rounded-none flex-col h-full overflow-hidden bg-card">
      <CardHeader className="h-16 border-b p-3 px-4">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20">
              <Palette className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Designer Canvas
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {platformPreset && platformPreset !== 'custom' && (
                  <Badge variant="secondary" className="text-xs">
                    {platformPreset.replace(/_/g, ' ')}
                  </Badge>
                )}
                {designStyle && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {designStyle}
                  </Badge>
                )}
                {width && height && (
                  <Badge variant="outline" className="text-xs">
                    {width}×{height}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {status && (
              <Badge variant="outline" className="text-xs max-w-[220px] truncate">
                {status}
              </Badge>
            )}
            {error && (
              <Badge variant="destructive" className="text-xs max-w-[220px] truncate">
                {error}
              </Badge>
            )}
            <Badge variant={actualIsSuccess ? 'default' : 'destructive'} className="gap-1 text-xs">
              {actualIsSuccess ? (
                <CheckCircle className="h-3.5 w-3.5" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5" />
              )}
              {actualIsSuccess ? 'Concluído' : 'Erro'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <div className="flex h-full">
          <div className="flex-1 relative overflow-hidden bg-muted/30">
            <div className="absolute inset-0 flex flex-col">
              <div className="flex justify-between p-3">
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="secondary" size="sm" onClick={handleZoomOut}>
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Diminuir zoom</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="secondary" size="sm" onClick={handleZoomIn}>
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Aumentar zoom</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="secondary" size="sm" onClick={handleResetView}>
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Centralizar</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <div className="w-28">
                    <Slider
                      value={[canvasScale * 100]}
                      min={50}
                      max={200}
                      step={5}
                      onValueChange={([value]) => setCanvasScale(value / 100)}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground w-12">{Math.round(canvasScale * 100)}%</div>
                </div>
                <div className="flex items-center gap-2">
                  <Toggle
                    pressed={showGrid}
                    onPressedChange={setShowGrid}
                    aria-label="Toggle grid"
                  >
                    <Grid className="h-4 w-4" />
                  </Toggle>
                  <Toggle
                    pressed={snapToGrid}
                    onPressedChange={setSnapToGrid}
                    aria-label="Toggle snap to grid"
                  >
                    <Layers className="h-4 w-4" />
                  </Toggle>
                </div>
              </div>

              <div
                ref={canvasRef}
                className="flex-1 relative overflow-auto"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onMouseDown={handleCanvasMouseDown}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div
                  className={cn(
                    'canvas-content min-h-full min-w-full transition-transform duration-150 ease-out',
                    isDragging && 'cursor-grabbing',
                    isPanning && 'cursor-grabbing',
                  )}
                  style={{
                    transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)`,
                    ...gridBackground,
                  }}
                >
                  <div className="relative" style={{ padding: artboardPadding }}>
                    {elements.map(element => (
                      <div
                        key={element.id}
                        className={cn(
                          'absolute bg-white rounded-2xl shadow-lg border transition-all duration-150',
                          selectedElement === element.id
                            ? 'border-primary ring-2 ring-primary/40'
                            : 'border-border/70',
                        )}
                        style={{
                          left: element.x,
                          top: element.y,
                          width: element.width,
                          height: element.height,
                          transform: `rotate(${element.rotation}deg)`,
                          opacity: element.opacity / 100,
                          zIndex: element.zIndex,
                        }}
                        onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                        onClick={() => setSelectedElement(element.id)}
                      >
                        <DesignElementImage element={element} isSelected={selectedElement === element.id} />
                        <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
                          <Sparkles className="h-3 w-3" />
                          <span className="truncate max-w-[140px]">{element.name}</span>
                        </div>
                      </div>
                    ))}

                    {elements.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4 text-muted-foreground">
                          <Wand2 className="h-8 w-8" />
                          <div className="text-center">
                            <p className="font-medium">Nenhum design processado ainda</p>
                            <p className="text-sm">
                              Assim que o agente gerar uma arte, ela aparecerá aqui automaticamente.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-[320px] border-l p-4 space-y-4 bg-background">
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Parâmetros</p>
                <div className="space-y-2">
                  {mode && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Modo</span>
                      <span>{mode}</span>
                    </div>
                  )}
                  {platformPreset && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Plataforma</span>
                      <span className="capitalize">{platformPreset.replace(/_/g, ' ')}</span>
                    </div>
                  )}
                  {quality && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Qualidade</span>
                      <span>{quality}</span>
                    </div>
                  )}
                  {width && height && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Dimensões</span>
                      <span>
                        {width}×{height} px
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {prompt && (
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Prompt</p>
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap bg-muted/60 rounded-lg p-3">
                    {prompt}
                  </p>
                </div>
              )}

              {imagePath && (
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Imagem base</p>
                  <Button variant="secondary" size="sm" className="w-full" onClick={() => onFileClick?.(imagePath)}>
                    <ExternalLink className="h-3.5 w-3.5 mr-2" /> Abrir no workspace
                  </Button>
                </div>
              )}

              {designUrl && (
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">URL pública</p>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => window.open(designUrl, '_blank')}>
                    <ExternalLink className="h-3.5 w-3.5 mr-2" /> Abrir em nova aba
                  </Button>
                </div>
              )}

              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Ações</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!selectedElement}
                    onClick={handleOpenInWorkspace}
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-2" /> Workspace
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!selectedElement}
                    onClick={handleDownload}
                  >
                    <Download className="h-3.5 w-3.5 mr-2" /> Download
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!selectedElement}
                    onClick={handleOpenInNewTab}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-2" /> Nova aba
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!selectedElement}
                    onClick={() => selectedElement && updateElement(selectedElement, { locked: !elements.find(el => el.id === selectedElement)?.locked })}
                  >
                    {elements.find(el => el.id === selectedElement)?.locked ? (
                      <>
                        <Unlock className="h-3.5 w-3.5 mr-2" /> Desbloquear
                      </>
                    ) : (
                      <>
                        <Lock className="h-3.5 w-3.5 mr-2" /> Bloquear
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                {actualAssistantTimestamp && (
                  <div className="flex justify-between">
                    <span>Solicitação</span>
                    <span>{formatTimestamp(actualAssistantTimestamp)}</span>
                  </div>
                )}
                {actualToolTimestamp && (
                  <div className="flex justify-between">
                    <span>Execução</span>
                    <span>{formatTimestamp(actualToolTimestamp)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

