import { Suspense } from "react"
import { fetchAnalyticsData } from "./analytics-server"
import { AnalyticsClient } from "./analytics-client"
import { Loader2 } from "lucide-react"

interface PageProps {
  searchParams: Promise<{ period?: string }>
}

export default async function AdminAnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const period = params.period || "30d"
  const data = await fetchAnalyticsData(period)
  
  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AnalyticsClient initialData={data} initialPeriod={period} />
    </Suspense>
  )
}