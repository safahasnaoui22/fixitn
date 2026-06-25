import Link from "next/link";
import { redirect } from "next/navigation";
import { Star, Briefcase, ThumbsUp, Crown, LogOut } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getTechnicianByUserId, getTechnicianStats, listCategoriesForTechnician } from "@/lib/db/catalog";
import { Avatar } from "@/components/ui/Avatar";
import { CategoryIcon } from "@/components/CategoryIcon";
import { TechBottomNav } from "@/components/TechBottomNav";
import { Button } from "@/components/ui/Button";
import { logoutAction, updateProfileAction } from "./actions";

export default async function TechProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const session = await requireRole("TECHNICIAN");
  const { error, success } = await searchParams;

  const technician = await getTechnicianByUserId(session.userId);
  if (!technician) redirect("/onboarding");

  const [stats, categories] = await Promise.all([
    getTechnicianStats(technician.id),
    listCategoriesForTechnician(technician.id),
  ]);

  return (
    <>
      <div className="app-content no-scrollbar">
        <div className="bg-brand-navy px-5 pb-8 pt-6 text-white">
          <p className="font-heading text-lg font-bold mb-5">My Profile</p>
          <div className="flex items-center gap-4">
            <Avatar src={technician.avatarUrl} name={technician.fullName} size={64} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-heading text-lg font-semibold">{technician.fullName}</p>
                {technician.verified && (
                  <span className="shrink-0 rounded-full bg-success px-2 py-0.5 text-[10px] font-bold text-white">
                    Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-white/60">{technician.title}</p>
              {technician.ratingAvg != null && (
                <div className="mt-1 flex items-center gap-1">
                  <Star size={13} className="fill-star text-star" />
                  <span className="text-sm font-semibold">{technician.ratingAvg.toFixed(1)}</span>
                  <span className="text-xs text-white/60">({technician.ratingCount})</span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <StatBox icon={Briefcase} label="Completed" value={String(stats.jobsCompleted)} />
            <StatBox
              icon={ThumbsUp}
              label="Satisfaction"
              value={stats.satisfactionPct != null ? `${stats.satisfactionPct}%` : "—"}
            />
            <StatBox icon={Crown} label="Plan" value={technician.planId ? "Pro" : "Free"} />
          </div>
        </div>

        <div className="px-5 py-5 flex flex-col gap-5">
          {success && (
            <p className="rounded-xl bg-success-light px-4 py-3 text-sm font-medium text-success">
              ✓ Profile updated successfully
            </p>
          )}
          {error && (
            <p className="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger">{error}</p>
          )}

          <div>
            <p className="font-heading text-sm font-semibold text-ink mb-3">Edit Details</p>
            <form action={updateProfileAction} className="flex flex-col gap-4">
              <Field label="Title" name="title" defaultValue={technician.title} required />
              <div>
                <label htmlFor="bio" className="text-sm font-medium text-ink">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={3}
                  defaultValue={technician.bio ?? ""}
                  placeholder="A short intro for clients..."
                  className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-[15px] outline-none focus:border-brand-orange"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Years exp." name="yearsExperience" type="number" defaultValue={String(technician.yearsExperience)} />
                <Field label="Starting price (DT)" name="startingPrice" type="number" defaultValue={String(technician.startingPrice)} />
              </div>
              <Button type="submit" fullWidth size="lg">Save Changes</Button>
            </form>
          </div>

          {categories.length > 0 && (
            <div>
              <p className="font-heading text-sm font-semibold text-ink mb-2">My Services</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <span key={cat.id} className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink">
                    <CategoryIcon icon={cat.icon} color={cat.color} size={12} badgeSize={20} />
                    {cat.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Link href="/plans" className="flex items-center gap-3 rounded-2xl border border-brand-orange bg-brand-orange-light p-4">
            <Crown size={20} className="text-brand-orange shrink-0" />
            <div className="flex-1">
              <p className="font-heading text-sm font-semibold text-brand-orange-dark">
                {technician.planId ? "Manage Plan" : "Upgrade to Pro"}
              </p>
              <p className="text-xs text-brand-orange-dark/70">Lower commission, more visibility</p>
            </div>
          </Link>

          <form action={logoutAction}>
            <button type="submit" className="flex w-full items-center gap-3 rounded-2xl border border-danger-light bg-danger-light px-4 py-3.5 text-sm font-semibold text-danger">
              <LogOut size={18} />
              Log Out
            </button>
          </form>
        </div>
      </div>
      <TechBottomNav />
    </>
  );
}

function StatBox({ icon: Icon, label, value }: { icon: typeof Briefcase; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl bg-white/10 px-3 py-2.5 text-center">
      <Icon size={14} className="text-white/60 mx-auto" />
      <p className="font-heading text-sm font-bold text-white">{value}</p>
      <p className="text-[10px] text-white/60">{label}</p>
    </div>
  );
}

function Field({ label, name, type = "text", defaultValue, required }: { label: string; name: string; type?: string; defaultValue?: string; required?: boolean }) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium text-ink">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-[15px] outline-none focus:border-brand-orange"
      />
    </div>
  );
}