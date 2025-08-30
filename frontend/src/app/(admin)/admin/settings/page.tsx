"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Settings, Bell, Shield, Database, Globe, Mail, CreditCard, Save } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

export default function AdminSettingsPage() {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast({
      title: "Configurações salvas",
      description: "As configurações foram atualizadas com sucesso."
    })
    setIsSaving(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações do sistema
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="billing">Cobrança</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Configurações básicas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="app-name">Nome da Aplicação</Label>
                <Input id="app-name" defaultValue="Prophet" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="app-url">URL da Aplicação</Label>
                <Input id="app-url" defaultValue="https://prophet.build" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="support-email">Email de Suporte</Label>
                <Input id="support-email" type="email" defaultValue="support@prophet.build" />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Modo de Manutenção</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar modo de manutenção para todos os usuários
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Registros Públicos</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir novos registros de usuários
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Segurança</CardTitle>
              <CardDescription>
                Configurações de segurança e autenticação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Autenticação de Dois Fatores</Label>
                  <p className="text-sm text-muted-foreground">
                    Exigir 2FA para contas administrativas
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sessão Única</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir apenas uma sessão ativa por usuário
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Logs de Auditoria</Label>
                  <p className="text-sm text-muted-foreground">
                    Registrar todas as ações administrativas
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="session-timeout">Timeout de Sessão (minutos)</Label>
                <Input id="session-timeout" type="number" defaultValue="60" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-attempts">Máximo de Tentativas de Login</Label>
                <Input id="max-attempts" type="number" defaultValue="5" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>
                Configure notificações do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alertas de Sistema</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber alertas sobre problemas do sistema
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Novos Usuários</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificar quando novos usuários se registrarem
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Relatórios Diários</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar relatório diário de métricas
                  </p>
                </div>
                <Switch />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="notification-email">Email para Notificações</Label>
                <Input id="notification-email" type="email" defaultValue="admin@prophet.build" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slack-webhook">Webhook do Slack</Label>
                <Input id="slack-webhook" placeholder="https://hooks.slack.com/..." />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Cobrança</CardTitle>
              <CardDescription>
                Gerencie planos e configurações de pagamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stripe-key">Chave Pública do Stripe</Label>
                <Input id="stripe-key" defaultValue="pk_live_..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="free-credits">Créditos Gratuitos Iniciais</Label>
                <Input id="free-credits" type="number" defaultValue="1000" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="credit-price">Preço por 1000 Créditos (R$)</Label>
                <Input id="credit-price" type="number" step="0.01" defaultValue="10.00" />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Trial Automático</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar período de trial para novos usuários
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trial-days">Dias de Trial</Label>
                <Input id="trial-days" type="number" defaultValue="7" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integrações</CardTitle>
              <CardDescription>
                Configure integrações com serviços externos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-transparent opacity-60">
                      <Globe className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">OpenRouter</p>
                      <p className="text-sm text-muted-foreground">Provedor de LLM</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-transparent opacity-60">
                      <Database className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">Supabase</p>
                      <p className="text-sm text-muted-foreground">Database & Auth</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-transparent opacity-60">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">SendGrid</p>
                      <p className="text-sm text-muted-foreground">Email Service</p>
                    </div>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-transparent opacity-60">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">Stripe</p>
                      <p className="text-sm text-muted-foreground">Payment Processing</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}