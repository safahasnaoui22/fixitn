import { redirect } from "next/navigation";

// Reports from clients / technicians are handled in one place: Complaints.
export default function DisputesRedirect() {
  redirect("/admin/complaints");
}
