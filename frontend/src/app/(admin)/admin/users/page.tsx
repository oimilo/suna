import { getUsersData } from "./users-server"
import UsersClient from "./users-client"
export default async function UsersPage() {
  const data = await getUsersData()
  return <UsersClient initialData={data} />
}