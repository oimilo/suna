"use client"

import { UserGrowthChart } from "@/components/admin/dashboard/charts/user-growth-chart"
import { UsageChart } from "@/components/admin/dashboard/charts/usage-chart"
import { RevenueChart } from "@/components/admin/dashboard/charts/revenue-chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Download, RefreshCw } from "lucide-react"
import { useState } from "react"

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState("7d")
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Análise detalhada de métricas e tendências
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
              <SelectItem value="1y">1 ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Charts */}
      <Tabs defaultValue="growth" className="space-y-4">
        <TabsList>
          <TabsTrigger value="growth">Crescimento</TabsTrigger>
          <TabsTrigger value="usage">Uso do Sistema</TabsTrigger>
          <TabsTrigger value="revenue">Receita</TabsTrigger>
          <TabsTrigger value="retention">Retenção</TabsTrigger>
        </TabsList>

        <TabsContent value="growth" className="space-y-4">
          <UserGrowthChart period={period} />
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Aquisição por Canal</CardTitle>
                <CardDescription>De onde vêm os novos usuários</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Dados em breve
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Taxa de Conversão</CardTitle>
                <CardDescription>Visitantes → Usuários → Pagantes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Dados em breve
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <UsageChart period={period} />
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Features Mais Usadas</CardTitle>
                <CardDescription>Ranking de funcionalidades</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Dados em breve
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Modelos de IA</CardTitle>
                <CardDescription>Distribuição de uso por modelo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Dados em breve
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <RevenueChart />
        </TabsContent>

        <TabsContent value="retention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cohort Analysis</CardTitle>
              <CardDescription>Retenção por coorte de usuários</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-16 text-muted-foreground">
                Análise de coorte em desenvolvimento
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}