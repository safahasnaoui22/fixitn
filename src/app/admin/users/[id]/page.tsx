import { ModifiedBy } from "@/components/ModifiedBy";
import { getLastChanges } from "@/lib/db/audit";
import { requirePermission } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  Scan,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import { getAdminUserDetail } from "@/lib/db/admin";
import { hasFaceDescriptor, listUserDevices } from "@/lib/db/face";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { deleteUserAction, resetFaceAction } from "../../actions";
import type { JobStatus } from "@/lib/constants";
import { getT, getLocale } from "@/lib/i18n/server";

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  const t = await getT();
  const locale = await getLocale();
  const session = await requirePermission("users");
  const isAdmin = session.role === "ADMIN";
  const { id } = await params;
  const { success } = await searchParams;

  const user = await getAdminUserDetail(id);
  const lastChange = (await getLastChanges("user", [id])).get(id);
  if (!user) notFound();

  const [faceRegistered, devices] = await Promise.all([
    hasFaceDescriptor(id),
    listUserDevices(id),
  ]);

  const ROLE_STYLE: Record<string, string> = {
    TECHNICIAN: "bg-brand-orange-light text-brand-orange-dark",
    ADMIN: "bg-brand-navy text-white",
    CLIENT: "bg-surface-alt text-muted",
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/users"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface border border-line"
        >
          <ArrowLeft size={18} className="rtl:rotate-180" />
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink">
            {t("admin.userDetail.title")}
          </h1>
          <p className="text-xs text-muted font-mono">{id.slice(0, 20)}...</p>
          <ModifiedBy change={lastChange} />
        </div>
      </div>

      {/* Success feedback */}
      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-success-light px-4 py-3">
          <CheckCircle2 size={16} className="text-success shrink-0" />
          <p className="text-sm font-medium text-success">
            {success === "face-reset"
              ? t("admin.userDetail.faceReset")
              : t("admin.userDetail.actionDone")}
          </p>
        </div>
      )}

      {/* Profile card */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-center gap-4 mb-5">
          <Avatar src={user.avatarUrl} name={user.fullName} size={64} />
          <div className="min-w-0 flex-1">
            <p className="font-heading text-lg font-bold text-ink truncate">
              {user.fullName}
            </p>
            <span
              className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                ROLE_STYLE[user.role] ?? "bg-surface-alt text-muted"
              }`}
            >
              {t(`role.${user.role}`)}
            </span>
          </div>
          {user.role === "TECHNICIAN" && (
            <Link
              href={`/admin/technicians`}
              className="shrink-0 text-xs font-semibold text-brand-orange hover:underline"
            >
              {t("admin.userDetail.viewTech")} <span className="inline-block rtl:rotate-180">→</span>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InfoRow
            icon={Phone}
            label={t("admin.userDetail.phone")}
            value={user.phone}
            ltr
          />
          {user.email && (
            <InfoRow
              icon={Phone}
              label={t("admin.userDetail.email")}
              value={user.email}
              ltr
            />
          )}
          {user.city && (
            <InfoRow
              icon={MapPin}
              label={t("admin.userDetail.city")}
              value={user.city}
            />
          )}
          <InfoRow
            icon={Calendar}
            label={t("admin.userDetail.joined")}
            value={formatDate(user.createdAt, locale)}
          />
        </div>
      </div>

      {/* Recent requests */}
      {user.recentRequests.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="font-heading text-base font-semibold text-ink">
              {t("admin.userDetail.recentRequests")}
            </p>
            <Link
              href={`/admin/requests`}
              className="text-xs font-semibold text-brand-orange hover:underline"
            >
              {t("admin.userDetail.viewAll")} <span className="inline-block rtl:rotate-180">→</span>
            </Link>
          </div>
          <div className="rounded-2xl border border-line bg-surface divide-y divide-line overflow-hidden">
            {user.recentRequests.map((req) => (
              <Link
                key={req.id}
                href={`/admin/requests/${req.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-surface-alt transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-ink">
                    {req.categoryName}
                  </p>
                  <p className="text-xs text-muted">
                    {formatDate(req.createdAt, locale)}
                  </p>
                </div>
                <StatusBadge status={req.status as JobStatus} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {user.recentRequests.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface py-8 text-center">
          <ClipboardList size={24} className="text-muted" />
          <p className="text-sm text-muted">{t("admin.userDetail.noRequests")}</p>
        </div>
      )}

      {/* Face ID & devices */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-center gap-2 mb-4">
          <Scan
            size={18}
            className={faceRegistered ? "text-success" : "text-muted"}
          />
          <p className="font-heading text-base font-semibold text-ink">
            {t("admin.userDetail.faceTitle")}
          </p>
        </div>

        {/* Face status */}
        <div className="flex items-center gap-2 mb-4">
          {faceRegistered ? (
            <>
              <ShieldCheck size={15} className="text-success shrink-0" />
              <p className="text-sm font-medium text-success">
                {t("admin.userDetail.faceOk")}
              </p>
            </>
          ) : (
            <>
              <AlertTriangle size={15} className="text-amber-500 shrink-0" />
              <p className="text-sm font-medium text-amber-600">
                {t("admin.userDetail.faceNone")}
              </p>
            </>
          )}
        </div>

        {/* Known devices list */}
        {devices.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              {t("admin.userDetail.knownDevices", { count: devices.length })}
            </p>
            <div className="flex flex-col gap-2">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="rounded-xl border border-line bg-surface-alt px-3 py-2.5"
                >
                  <p className="text-xs font-medium text-ink truncate">
                    {device.userAgent
                      ? device.userAgent.slice(0, 60) + (device.userAgent.length > 60 ? "…" : "")
                      : t("admin.userDetail.unknownDevice")}
                  </p>
                  <p className="text-[10px] text-muted mt-0.5">
                    {t("admin.userDetail.deviceSeen", {
                      seen: formatRelativeTime(device.lastSeenAt, t, locale),
                      added: formatDate(device.createdAt, locale),
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reset face */}
        {faceRegistered && (
          <div className="flex flex-col gap-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
              <p className="text-xs text-amber-700 leading-relaxed">
                {t("admin.userDetail.resetWarn")}
              </p>
            </div>
            <form action={resetFaceAction.bind(null, id)}>
              <Button type="submit" variant="danger" size="sm">
                <AlertTriangle size={15} />
                {t("admin.userDetail.resetBtn")}
              </Button>
            </form>
          </div>
        )}

        {devices.length === 0 && !faceRegistered && (
          <p className="text-xs text-muted">
            {t("admin.userDetail.noDevices")}
          </p>
        )}
      </div>

      {/* Danger zone (admin only) */}
      {isAdmin && (
      <div className="rounded-2xl border border-danger-light bg-danger-light/30 p-5">
        <p className="font-heading text-sm font-semibold text-danger mb-1">
          {t("admin.userDetail.danger")}
        </p>
        <p className="text-xs text-danger/70 mb-4 leading-relaxed">
          {t("admin.userDetail.dangerText")}
        </p>
        <form action={deleteUserAction.bind(null, id)}>
          <Button type="submit" variant="danger" size="sm">
            <Trash2 size={15} />
            {t("admin.userDetail.deleteBtn")}
          </Button>
        </form>
      </div>
      )}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  ltr,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div className="rounded-xl bg-surface-alt px-3 py-2.5">
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon size={11} className="text-muted" />
        <p className="text-[10px] text-muted">{label}</p>
      </div>
      <p className="text-sm font-medium text-ink break-all text-start" dir={ltr ? "ltr" : undefined}>{value}</p>
    </div>
  );
}