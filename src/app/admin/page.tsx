import { requireRole } from "@/lib/auth";
import { getDashboardData } from "@/lib/db/admin";
import Dashboard from "./dashboard/Dashboard";
import { AttentionBox } from "@/components/AttentionBox";

export default async function AdminDashboardPage() {
  await requireRole("ADMIN");
  const data = await getDashboardData();
  return (
    <>
      <AttentionBox />
      <Dashboard data={data} />
    </>
  );
}