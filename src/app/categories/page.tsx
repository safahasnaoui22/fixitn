import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listCategories } from "@/lib/db/catalog";
import { ClientBottomNav } from "@/components/ClientBottomNav";
import { AllCategories } from "./AllCategories";
import { DARK_BG } from "@/lib/theme";

// Every service in one page (opened from "Autres" on the client home).
export default async function AllCategoriesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "CLIENT") redirect("/");

  const categories = await listCategories();

  return (
    <>
      <div className="app-content no-scrollbar" style={{ background: DARK_BG }}>
        <AllCategories categories={categories} />
      </div>
      <ClientBottomNav dark />
    </>
  );
}
