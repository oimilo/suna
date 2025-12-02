'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Globe,
  MessageSquare,
  PlayCircle,
  RefreshCcw,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CodeBlockCode } from '@/components/ui/code-block';
import { Separator } from '@/components/ui/separator';
import { BRANDING } from '@/lib/branding';

const API_BASE_URL = `${BRANDING.url}/api`;

const httpSteps: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
  command: string;
  note?: string;
}> = [
  {
    title: '1. Crie um thread e um sandbox isolado',
    description:
      'Cada execução precisa de um projeto/thread. O endpoint aceita multipart form-data (campo opcional name).',
    icon: Globe,
    command: `curl -X POST "${API_BASE_URL}/threads" \\
  -H 'x-api-key: pk_xxx:sk_xxx' \\
  -F 'name=Automação via n8n'`,
    note: 'Resposta: { "thread_id": "...", "project_id": "..." }',
  },
  {
    title: '2. Adicione a mensagem do usuário',
    description:
      'Envie o prompt que será usado na próxima execução do agente. Use JSON simples.',
    icon: MessageSquare,
    command: `curl -X POST "${API_BASE_URL}/threads/THREAD_ID/messages/add" \\
  -H 'Content-Type: application/json' \\
  -H 'x-api-key: pk_xxx:sk_xxx' \\
  -d '{"message":"Investigue notícias recentes sobre IA generativa."}'`,
  },
  {
    title: '3. Acione o agente',
    description:
      'O endpoint /agent/start dispara o workflow completo. Envie thread_id obrigatório e, opcionalmente, agent_id ou prompt adicional.',
    icon: PlayCircle,
    command: `curl -X POST "${API_BASE_URL}/agent/start" \\
  -H 'x-api-key: pk_xxx:sk_xxx' \\
  -F 'thread_id=THREAD_ID' \\
  -F 'agent_id=AGENT_ID' \\
  -F 'prompt=Use os links salvos no thread e gere um resumo executável.'`,
    note: 'Resposta: { "thread_id": "...", "agent_run_id": "...", "status": "running" }',
  },
  {
    title: '4. Busque as respostas',
    description:
      'Os resultados ficam em /threads/{id}/messages. Use order=asc para ler em sequência e combine com polling em n8n.',
    icon: RefreshCcw,
    command: `curl -X GET "${API_BASE_URL}/threads/THREAD_ID/messages?order=asc" \\
  -H 'x-api-key: pk_xxx:sk_xxx'`,
  },
];


export default function ApiDocsPage() {
  return (
    <div className="space-y-12 pb-10">
      <section className="space-y-6">
        <Badge variant="beta" className="inline-flex items-center gap-1">
          <Zap className="h-3.5 w-3.5" />
          Beta Programático
        </Badge>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            API do {BRANDING.name}
          </h1>
          <p className="text-lg text-muted-foreground">
            Conecte seus fluxos (n8n, Make, scripts próprios) diretamente ao{' '}
            {BRANDING.name}. Abaixo você encontra o fluxo HTTP oficial para
            automações.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/settings/api-keys">Gerar API key</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="#http-api">Ir para o fluxo HTTP</Link>
          </Button>
        </div>
      </section>

      <Separator />

      <section id="api-keys" className="space-y-6">
        <div className="space-y-2">
          <Badge variant="outline">Autenticação</Badge>
          <h2 className="text-2xl font-semibold">Como gerar e usar sua API key</h2>
          <p className="text-muted-foreground">
            Toda chamada precisa de{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              x-api-key: pk_xxx:sk_xxx
            </code>{' '}
            ou de um token Supabase padrão. O formato é sempre{' '}
            <strong>public:secret</strong>.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Passo a passo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                Acesse{' '}
                <Link
                  href="/settings/api-keys"
                  className="font-medium text-foreground underline-offset-2 hover:underline"
                >
                  Settings → API Keys
                </Link>{' '}
                e clique em <strong>New API Key</strong>.
              </li>
              <li>
                Copie o par{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  pk_xxx / sk_xxx
                </code>{' '}
                exibido após a criação.
              </li>
              <li>
                Monte o header{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  x-api-key: pk_xxx:sk_xxx
                </code>{' '}
                em toda requisição HTTP (n8n → Headers → Add Parameter).
              </li>
              <li>
                Opcionalmente, adicione{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  X-Guest-Session
                </code>{' '}
                apenas se estiver rodando uma sessão guest dentro do app.
              </li>
            </ol>
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section id="http-api" className="space-y-8">
        <div className="space-y-2">
          <Badge variant="outline" className="gap-1">
            <Globe className="h-3.5 w-3.5" />
            HTTP API
          </Badge>
          <h2 className="text-2xl font-semibold">Fluxo básico em 4 chamadas</h2>
          <p className="text-muted-foreground">
            Ideal para n8n/Make/Zapier. Cada etapa abaixo vira um node HTTP Request.
            Use <strong>POST</strong> com Form-Data onde indicado e{' '}
            <strong>JSON</strong> para mensagens.
          </p>
        </div>

        <div className="grid gap-6">
          {httpSteps.map((step) => (
            <Card key={step.title}>
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="rounded-2xl border bg-muted p-3">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>{step.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <CodeBlockCode code={step.command} language="bash" />
                {step.note ? (
                  <p className="text-xs text-muted-foreground">{step.note}</p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configurando no n8n</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                Adicione um node <strong>HTTP Request</strong> para cada etapa
                acima e marque <em>Send Body as</em> → <strong>Form-Data</strong>{' '}
                quando houver campos <code>thread_id</code>, <code>prompt</code>{' '}
                etc.
              </li>
              <li>
                Em <em>Headers</em>, crie{' '}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  x-api-key
                </code>{' '}
                com o valor completo <code>pk:sk</code>.
              </li>
              <li>
                Salve o <code>thread_id</code> do passo 1 em uma variável
                (exemplo: <strong>Set → threadId</strong>) e reutilize nos passos
                seguintes.
              </li>
              <li>
                Para aguardar o término do agente, adicione um loop com{' '}
                <strong>Wait → 5s</strong> + GET de mensagens até que um item com
                <code>type === "assistant"</code> apareça.
              </li>
            </ol>
          </CardContent>
        </Card>
      </section>

    </div>
  );
}


