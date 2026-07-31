import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Star, Briefcase, ThumbsUp, Crown, LogOut,
  ShieldCheck, Image as ImageIcon, FileText,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import {
  getTechnicianByUserId,
  getTechnicianStats,
  listCategoriesForTechnician,
} from "@/lib/db/catalog";
import { hasFaceDescriptor } from "@/lib/db/face";
import { getPortfolioCount } from "@/lib/db/portfolio";
import { Avatar } from "@/components/ui/Avatar";
import { CategoryIcon } from "@/components/CategoryIcon";
import { SeniorBadge } from "@/components/SeniorBadge";
import { TechBottomNav } from "@/components/TechBottomNav";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
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

  const [stats, categories, faceRegistered, portfolioCount] = await Promise.all([
    getTechnicianStats(technician.id),
    listCategoriesForTechnician(technician.id),
    hasFaceDescriptor(session.userId),
    getPortfolioCount(technician.id),
  ]);

  return (
    <>
      <div className="app-content no-scrollbar">
        {/* Header */}
        <div className="bg-brand-navy px-5 pb-8 pt-6 text-white">
          <p className="font-heading text-lg font-bold mb-5">My Profile</p>
          <div className="flex items-center gap-4">
            <Avatar
              src={technician.avatarUrl}
              name={technician.fullName}
              size={64}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <p className="font-heading text-lg font-semibold truncate">
                  {technician.fullName}
                </p>
                {technician.isSenior && <SeniorBadge size="sm" />}
              </div>
              <p className="text-sm text-white/60">{technician.title}</p>
              {technician.ratingAvg != null && (
                <div className="mt-1 flex items-center gap-1">
                  <Star size={13} className="fill-star text-star" />
                  <span className="text-sm font-semibold">
                    {technician.ratingAvg.toFixed(1)}
                  </span>
                  <span className="text-xs text-white/60">
                    ({technician.ratingCount})
                  </span>
                </div>
              )}
              {technician.isSenior && technician.seniorSince && (
                <p className="text-[11px] text-white/50 mt-0.5">
                  Senior since {formatDate(technician.seniorSince)}
                </p>
              )}
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            <StatBox
              icon={Briefcase}
              label="Completed"
              value={String(stats.jobsCompleted)}
            />
            <StatBox
              icon={ThumbsUp}
              label="Satisfaction"
              value={
                stats.satisfactionPct != null
                  ? `${stats.satisfactionPct}%`
                  : "—"
              }
            />
            <StatBox
              icon={Crown}
              label="Plan"
              value={technician.isSenior ? "Senior" : "Beginner"}
            />
          </div>
        </div>

        <div className="px-5 py-5 flex flex-col gap-5">
          {/* Feedback */}
          {success && (
            <p className="rounded-xl bg-success-light px-4 py-3 text-sm font-medium text-success">
              ✓ Profile updated successfully
            </p>
          )}
          {error && (
            <p className="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}

          {/* Senior Pro status card */}
          {technician.isSenior ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 mb-1">
                <SeniorBadge size="md" />
                <span className="text-sm font-semibold text-amber-800">
                  You are a Senior Pro technician
                </span>
              </div>
              <p className="text-xs text-amber-700">
                You appear at the top of search results and pay only 8%
                commission per job.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-center gap-2 mb-1">
                <Crown size={16} className="text-muted" />
                <p className="text-sm font-semibold text-ink">
                  Beginner plan — earn Senior Pro
                </p>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Collect great reviews from clients to automatically unlock the
                Senior Pro badge and lower commission rate.
              </p>
              <Link
                href="/plans"
                className="mt-2 block text-xs font-semibold text-brand-orange"
              >
                View promotion criteria →
              </Link>
            </div>
          )}

          {/* Security card */}
          <div className="rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck
                size={16}
                className={faceRegistered ? "text-success" : "text-muted"}
              />
              <p className="text-sm font-semibold text-ink">Account Security</p>
            </div>
            {faceRegistered ? (
              <p className="text-xs text-success font-medium">
                ✓ Face ID registered — your account is protected
              </p>
            ) : (
              <div>
                <p className="text-xs text-danger mb-2">
                  Face ID not set up — your account is not fully protected
                </p>
                <Link href="/face-setup">
                  <Button size="sm" variant="outline">
                    Set Up Face ID
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Portfolio shortcut */}
          <Link
            href="/t/portfolio"
            className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition-transform active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-orange-light">
              <ImageIcon size={18} className="text-brand-orange" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink">My Portfolio</p>
              <p className="text-xs text-muted">
                {portfolioCount === 0
                  ? "No items yet — add photos and videos of your work"
                  : `${portfolioCount} item${portfolioCount > 1 ? "s" : ""} uploaded`}
              </p>
            </div>
            <span className="text-xs text-brand-orange font-medium">
              {portfolioCount === 0 ? "Add" : "Manage"} →
            </span>
          </Link>

          {/* Documents status */}
          <div className="rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={16} className="text-muted" />
              <p className="text-sm font-semibold text-ink">
                Identity Documents
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">CIN / Passport</span>
                {technician.cinUrl ? (
                  <span className="text-xs font-semibold text-success">
                    ✓ Uploaded
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-danger">
                    Missing
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">Diploma / Certificate</span>
                {technician.diplomeUrl ? (
                  <span className="text-xs font-semibold text-success">
                    ✓ Uploaded
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-danger">
                    Missing
                  </span>
                )}
              </div>
            </div>
            {technician.verified ? (
              <p className="mt-3 text-xs text-success font-medium">
                ✓ Your account has been verified by admin
              </p>
            ) : (
              <p className="mt-3 text-xs text-amber-600">
                Verification pending — admin will review your documents
              </p>
            )}
          </div>

          {/* Edit form */}
          <div>
            <p className="font-heading text-sm font-semibold text-ink mb-3">
              Edit Details
            </p>
            <form action={updateProfileAction} className="flex flex-col gap-4">
              <Field
                label="Title"
                name="title"
                defaultValue={technician.title}
                required
              />
              <div>
                <label htmlFor="bio" className="text-sm font-medium text-ink">
                  Bio
                </label>
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
                <Field
                  label="Years exp."
                  name="yearsExperience"
                  type="number"
                  defaultValue={String(technician.yearsExperience)}
                />
                <Field
                  label="Starting price (DT)"
                  name="startingPrice"
                  type="number"
                  defaultValue={String(technician.startingPrice)}
                />
              </div>
              <Button type="submit" fullWidth size="lg">
                Save Changes
              </Button>
            </form>
          </div>

          {/* Services */}
          {categories.length > 0 && (
            <div>
              <p className="font-heading text-sm font-semibold text-ink mb-2">
                My Services
              </p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <span
                    key={cat.id}
                    className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink"
                  >
                    <CategoryIcon
                      icon={cat.icon}
                      color={cat.color}
                      size={12}
                      badgeSize={20}
                    />
                    {cat.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Logout */}
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-2xl border border-danger-light bg-danger-light px-4 py-3.5 text-sm font-semibold text-danger"
            >
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

function StatBox({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Briefcase;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl bg-white/10 px-3 py-2.5 text-center">
      <Icon size={14} className="text-white/60 mx-auto" />
      <p className="font-heading text-sm font-bold text-white">{value}</p>
      <p className="text-[10px] text-white/60">{label}</p>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium text-ink">
        {label}
      </label>
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