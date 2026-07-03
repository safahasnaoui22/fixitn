import { getDashboardData } from "@/lib/db/admin";
import Dashboard from "./dashboard/Dashboard";

export default async function AdminDashboardPage() {
  const data = await getDashboardData();
  return <Dashboard data={data} />;
}