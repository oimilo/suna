import { getDashboardData } from "./dashboard-server"
import DashboardClient from "./dashboard-client"

export default async function AdminDashboard() {
  const data = await getDashboardData()
  return <DashboardClient initialData={data} />
}