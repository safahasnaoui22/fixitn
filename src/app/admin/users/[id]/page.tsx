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

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  const { id } = await params;
  const { success } = await searchParams;

  const user = await getAdminUserDetail(id);
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
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink">
            User Detail
          </h1>
          <p className="text-xs text-muted font-mono">{id.slice(0, 20)}...</p>
        </div>
      </div>

      {/* Success feedback */}
      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-success-light px-4 py-3">
          <CheckCircle2 size={16} className="text-success shrink-0" />
          <p className="text-sm font-medium text-success">
            {success === "face-reset"
              ? "Face ID and all known devices have been cleared. The user must re-verify on next login."
              : "Action completed successfully."}
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
              {user.role}
            </span>
          </div>
          {user.role === "TECHNICIAN" && (
            <Link
              href={`/admin/technicians`}
              className="shrink-0 text-xs font-semibold text-brand-orange hover:underline"
            >
              View technician profile →
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InfoRow
            icon={Phone}
            label="Phone"
            value={user.phone}
          />
          {user.email && (
            <InfoRow
              icon={Phone}
              label="Email"
              value={user.email}
            />
          )}
          {user.city && (
            <InfoRow
              icon={MapPin}
              label="City"
              value={user.city}
            />
          )}
          <InfoRow
            icon={Calendar}
            label="Joined"
            value={formatDate(user.createdAt)}
          />
        </div>
      </div>

      {/* Recent requests */}
      {user.recentRequests.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="font-heading text-base font-semibold text-ink">
              Recent Requests
            </p>
            <Link
              href={`/admin/requests`}
              className="text-xs font-semibold text-brand-orange hover:underline"
            >
              View all →
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
                    {formatDate(req.createdAt)}
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
          <p className="text-sm text-muted">No requests yet</p>
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
            Face ID &amp; Devices
          </p>
        </div>

        {/* Face status */}
        <div className="flex items-center gap-2 mb-4">
          {faceRegistered ? (
            <>
              <ShieldCheck size={15} className="text-success shrink-0" />
              <p className="text-sm font-medium text-success">
                Face ID registered — account is protected
              </p>
            </>
          ) : (
            <>
              <AlertTriangle size={15} className="text-amber-500 shrink-0" />
              <p className="text-sm font-medium text-amber-600">
                Face ID not registered — user will be prompted on next login
              </p>
            </>
          )}
        </div>

        {/* Known devices list */}
        {devices.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Known devices ({devices.length})
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
                      : "Unknown device"}
                  </p>
                  <p className="text-[10px] text-muted mt-0.5">
                    Last seen {formatRelativeTime(device.lastSeenAt)} ·
                    Added {formatDate(device.createdAt)}
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
                Resetting Face ID clears the stored face descriptor and all
                known devices. The user will be required to re-register their
                face on next login. Only do this if the user has genuinely
                lost access to their account.
              </p>
            </div>
            <form action={resetFaceAction.bind(null, id)}>
              <Button type="submit" variant="danger" size="sm">
                <AlertTriangle size={15} />
                Reset Face ID &amp; All Devices
              </Button>
            </form>
          </div>
        )}

        {devices.length === 0 && !faceRegistered && (
          <p className="text-xs text-muted">
            No known devices registered for this account.
          </p>
        )}
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-danger-light bg-danger-light/30 p-5">
        <p className="font-heading text-sm font-semibold text-danger mb-1">
          Danger Zone
        </p>
        <p className="text-xs text-danger/70 mb-4 leading-relaxed">
          Deleting this user is permanent and cannot be undone. All their
          data — requests, messages, reviews, notifications — will be removed
          from the platform.
        </p>
        <form action={deleteUserAction.bind(null, id)}>
          <Button type="submit" variant="danger" size="sm">
            <Trash2 size={15} />
            Delete User Permanently
          </Button>
        </form>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-surface-alt px-3 py-2.5">
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon size={11} className="text-muted" />
        <p className="text-[10px] text-muted">{label}</p>
      </div>
      <p className="text-sm font-medium text-ink break-all">{value}</p>
    </div>
  );
}