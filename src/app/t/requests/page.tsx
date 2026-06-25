import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getTechnicianByUserId } from "@/lib/db/catalog";
import { listRequestsForTechnician } from "@/lib/db/requests";
import { TechBottomNav } from "@/components/TechBottomNav";
import { RequestTabs } from "./RequestTabs";

export default async function TechRequestsPage() {
  const session = await requireRole("TECHNICIAN");
  const technician = await getTechnicianByUserId(session.userId);
  if (!technician) redirect("/onboarding");

  const [pending, active, done] = await Promise.all([
    listRequestsForTechnician(technician.id, ["PENDING"]),
    listRequestsForTechnician(technician.id, [
      "ACCEPTED",
      "ON_THE_WAY",
      "ARRIVED",
      "IN_PROGRESS",
    ]),
    listRequestsForTechnician(technician.id, [
      "COMPLETED",
      "DECLINED",
      "CANCELLED",
    ]),
  ]);

  return (
    <>
      <div className="app-content flex flex-col">
        <div className="border-b border-line px-5 py-4 shrink-0">
          <p className="font-heading text-lg font-semibold text-ink">My Jobs</p>
        </div>
        <RequestTabs pending={pending} active={active} done={done} />
      </div>
      <TechBottomNav />
    </>
  );
}