'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Star, 
  MoreHorizontal, 
  Trash2, 
  Share2, 
  ArrowUpRight, 
  Loader2,
  FileText,
  Edit2,
  Check,
  X,
  Lightbulb,
  MessageSquare,
  Calendar,
  Bot,
  Code,
  BarChart3,
  Users,
  Briefcase,
  BookOpen,
  DollarSign,
  Mail,
  Phone,
  Settings,
  Search,
  Globe,
  Zap,
  Newspaper,
  TrendingUp,
  Target,
  Megaphone,
  Brain,
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useThreads, useProjects, processThreadsWithProjects } from '@/hooks/react-query/sidebar/use-sidebar';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFavorites } from '@/contexts/favorites-context';
import { Input } from '@/components/ui/input';
import { useUpdateProject } from '@/hooks/react-query/sidebar/use-project-mutations';
import { toast } from 'sonner';

// Função para determinar ícone baseado no título
function getIconFromTitle(title: string): LucideIcon {
  const lowerTitle = title.toLowerCase();
  
  // Mapeamento de palavras-chave para ícones
  const iconMap: { [key: string]: LucideIcon } = {
    // Notícias e Curadoria
    'notícia': Newspaper,
    'notícias': Newspaper,
    'curadoria': Newspaper,
    'news': Newspaper,
    
    // Comunicação
    'olá': MessageSquare,
    'oi': MessageSquare,
    'hello': MessageSquare,
    'conversa': MessageSquare,
    'chat': MessageSquare,
    'pergunta': MessageSquare,
    'qual': MessageSquare,
    
    // Ideias e Criatividade
    'ideia': Lightbulb,
    'ideias': Lightbulb,
    'brainstorm': Brain,
    'criativo': Lightbulb,
    'branding': Lightbulb,
    'plano': Target,
    
    // Estratégia e Negócios
    'estratégia': TrendingUp,
    'estratégias': TrendingUp,
    'resolver': Settings,
    'solução': Settings,
    'insights': Brain,
    'agência': Briefcase,
    'empresa': Briefcase,
    'negócio': Briefcase,
    
    // Marketing
    'marketing': Megaphone,
    'campanha': Megaphone,
    'anúncio': Megaphone,
    
    // Tecnologia
    'llm': Bot,
    'ia': Bot,
    'ai': Bot,
    'bot': Bot,
    'automação': Zap,
    'código': Code,
    'api': Code,
    'manus': Bot,
    
    // Documentos
    'resumo': FileText,
    'documento': FileText,
    'arquivo': FileText,
    'relatório': BarChart3,
    'análise': BarChart3,
    'comparação': BarChart3,
    
    // Agenda
    'reunião': Calendar,
    'meeting': Calendar,
    'agenda': Calendar,
    'compromisso': Calendar,
    
    // Educação
    'estudo': BookOpen,
    'curso': BookOpen,
    'tutorial': BookOpen,
    'aprender': BookOpen,
    
    // Finanças
    'pagamento': DollarSign,
    'fatura': DollarSign,
    'orçamento': DollarSign,
    'venda': DollarSign,
    
    // Pesquisa
    'pesquisa': Search,
    'buscar': Search,
    'encontrar': Search,
    
    // Global
    'mundo': Globe,
    'global': Globe,
    'internacional': Globe,
    
    // Pessoas
    'cliente': Users,
    'equipe': Users,
    'time': Users,
    'pessoa': Users,
    
    // Email
    'email': Mail,
    'mensagem': Mail,
    
    // Telefone
    'ligar': Phone,
    'telefone': Phone,
    'call': Phone,
  };
  
  // Procura por palavras-chave no título
  for (const [keyword, icon] of Object.entries(iconMap)) {
    if (lowerTitle.includes(keyword)) {
      return icon;
    }
  }
  
  // Ícone padrão se nenhuma palavra-chave for encontrada
  return FileText;
}

interface ThreadItemProps {
  thread: any;
  isActive: boolean;
  isLoading: boolean;
  isFavorite: boolean;
  onThreadClick: (e: React.MouseEvent<HTMLDivElement>, threadId: string, url: string) => void;
  onFavorite?: (threadId: string) => void;
  onDelete?: (threadId: string, threadName: string) => void;
  onShare?: (threadId: string, projectId: string) => void;
}

function ThreadItem({ 
  thread, 
  isActive, 
  isLoading,
  isFavorite,
  onThreadClick,
  onFavorite,
  onDelete,
  onShare
}: ThreadItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(thread.projectName);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateProjectMutation = useUpdateProject();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavorite?.(thread.threadId);
  };

  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditName(thread.projectName);
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditName(thread.projectName);
  };

  const saveNewName = async (e?: React.FocusEvent) => {
    // Prevent saving when clicking on cancel button
    if (e?.relatedTarget?.getAttribute('data-cancel') === 'true') {
      return;
    }
    
    if (editName.trim() === '') {
      setEditName(thread.projectName);
      setIsEditing(false);
      return;
    }

    if (editName !== thread.projectName) {
      try {
        await updateProjectMutation.mutateAsync({
          projectId: thread.projectId,
          data: { name: editName }
        });
        toast.success('Nome atualizado com sucesso');
      } catch (error) {
        console.error('Failed to rename:', error);
        toast.error('Falha ao renomear');
        setEditName(thread.projectName);
      }
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      saveNewName();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  return (
    <div
      className={cn(
        "group flex items-start gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-200",
        "hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
        isActive && "bg-black/[0.06] dark:bg-white/[0.08]"
      )}
      onClick={(e) => onThreadClick(e, thread.threadId, thread.url)}
    >
      {/* Avatar com ícone dinâmico */}
      <div className="shrink-0 w-7 h-7 rounded-md bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 flex items-center justify-center">
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin opacity-60" />
        ) : (
          (() => {
            const Icon = getIconFromTitle(thread.projectName);
            return <Icon className="h-3.5 w-3.5 opacity-60" />;
          })()
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        {/* Título */}
        {isEditing ? (
          <div className="flex items-center gap-1 mb-0.5" onClick={(e) => e.stopPropagation()}>
            <Input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={(e) => saveNewName(e)}
              className="h-6 text-sm px-1.5 py-0.5"
              maxLength={50}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0 hover:bg-black/5 dark:hover:bg-white/5"
              onClick={() => saveNewName()}
              disabled={updateProjectMutation.isPending}
            >
              {updateProjectMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0 hover:bg-black/5 dark:hover:bg-white/5"
              onClick={cancelEditing}
              data-cancel="true"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <h4 className="text-sm font-medium truncate leading-tight mb-0.5">
            {thread.projectName}
          </h4>
        )}
        
        {/* Linha inferior com tempo e ações */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Iniciada {thread.createdAt ? formatDistanceToNow(new Date(thread.createdAt), {
              locale: ptBR
            }).replace(' atrás', '') : 'agora'}
          </p>
          
          {/* Ações inline no hover */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-5 w-5 p-0",
                isFavorite ? "text-amber-500" : "text-muted-foreground hover:text-amber-500"
              )}
              onClick={handleFavoriteClick}
            >
              <Star className={cn("h-3 w-3", isFavorite && "fill-current")} />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onShare?.(thread.threadId, thread.projectId)}>
              <Share2 className="h-3.5 w-3.5 mr-2" />
              Compartilhar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={startEditing}
              onSelect={(e) => {
                e.preventDefault();
                startEditing(e as any);
              }}
            >
              <Edit2 className="h-3.5 w-3.5 mr-2" />
              Renomear
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a
                href={thread.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <ArrowUpRight className="h-3.5 w-3.5 mr-2" />
                Abrir em nova aba
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600 dark:text-red-400"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(thread.threadId, thread.projectName);
              }}
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Excluir
            </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NavThreads({ showOnlyFavorites = false }: { showOnlyFavorites?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loadingThreadId, setLoadingThreadId] = useState<string | null>(null);
  const { toggleFavorite, isFavorite } = useFavorites();

  const { data: projects = [], isLoading: isProjectsLoading } = useProjects();
  const { data: threads = [], isLoading: isThreadsLoading } = useThreads();

  const combinedThreads = !isProjectsLoading && !isThreadsLoading
    ? processThreadsWithProjects(threads, projects)
    : [];

  // Filtra favoritos se necessário
  const displayThreads = showOnlyFavorites
    ? combinedThreads.filter(thread => isFavorite(thread.threadId))
    : combinedThreads;

  const handleThreadClick = (e: React.MouseEvent<HTMLDivElement>, threadId: string, url: string) => {
    e.preventDefault();
    setLoadingThreadId(threadId);
    router.push(url);
  };

  const handleDelete = (threadId: string, threadName: string) => {
    // TODO: Implementar lógica de exclusão
    console.log('Delete thread:', threadId, threadName);
  };

  const handleShare = (threadId: string, projectId: string) => {
    // TODO: Implementar lógica de compartilhamento
    console.log('Share thread:', threadId, projectId);
  };

  const handleFavorite = (threadId: string) => {
    console.log('Toggling favorite for:', threadId);
    toggleFavorite(threadId);
    console.log('Is favorite now?', isFavorite(threadId));
  };

  const isLoading = isProjectsLoading || isThreadsLoading;

  if (isLoading) {
    return (
      <div className="space-y-2 px-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-start gap-3 py-2.5">
            <div className="w-8 h-8 rounded-full bg-black/[0.02] dark:bg-white/[0.03] animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-black/[0.02] dark:bg-white/[0.03] rounded animate-pulse w-3/4" />
              <div className="h-3 bg-black/[0.02] dark:bg-white/[0.03] rounded animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (displayThreads.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm px-3">
        {showOnlyFavorites ? (
          <>
            <Star className="h-8 w-8 mx-auto mb-2 opacity-20" />
            <p>Nenhum favorito ainda</p>
            <p className="text-xs mt-1">Marque conversas como favoritas para acessá-las rapidamente</p>
          </>
        ) : (
          <>
            <p>Nenhuma conversa ainda</p>
            <p className="text-xs mt-1">Crie uma nova tarefa para começar</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {displayThreads.map((thread) => {
        const isActive = pathname?.includes(thread.threadId) || false;
        const isThreadLoading = loadingThreadId === thread.threadId;

        return (
          <ThreadItem
            key={thread.threadId}
            thread={thread}
            isActive={isActive}
            isLoading={isThreadLoading}
            isFavorite={isFavorite(thread.threadId)}
            onThreadClick={handleThreadClick}
            onDelete={handleDelete}
            onShare={handleShare}
            onFavorite={handleFavorite}
          />
        );
      })}
    </div>
  );
}