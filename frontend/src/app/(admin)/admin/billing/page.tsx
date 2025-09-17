import { getBillingData } from "./billing-server"
import BillingClient from "./billing-client"

export default async function BillingPage() {
  const data = await getBillingData()
  return <BillingClient initialData={data} />
}