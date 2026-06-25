import Link from "next/link";
import { ArrowLeft, Bell } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listNotifications } from "@/lib/db/notifications";
import { EmptyState } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatRelativeTime } from "@/lib/utils";
import { markAllReadAction } from "./actions";

const TYPE_COLOR: Record<string, string> = {
  NEW_REQUEST: "bg-brand-orange",
  STATUS_UPDATE: "bg-success",
  NEW_MESSAGE: "bg-blue-500",
  NEW_REVIEW: "bg-brand-navy",
};

export default async function NotificationsPage() {
  const session = await requireUser();
  const notifications = await listNotifications(session.userId);
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="app-content no-scrollbar">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div className="flex items-center gap-3">
          <Link
            href={session.role === "TECHNICIAN" ? "/t/dashboard" : "/"}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-alt"
          >
            <ArrowLeft size={18} />
          </Link>
          <p className="font-heading text-lg font-semibold text-ink">Notifications</p>
        </div>

        {hasUnread && (
          <form action={markAllReadAction}>
            <Button type="submit" variant="ghost" size="sm" className="text-brand-orange">
              Mark all read
            </Button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="We'll let you know when something happens on your jobs."
        />
      ) : (
        <div className="flex flex-col divide-y divide-line">
          {notifications.map((notif) => (
            <Link
              key={notif.id}
              href={notif.requestId ? `/requests/${notif.requestId}` : "#"}
              className={`flex items-start gap-3 px-5 py-4 transition-colors hover:bg-surface-alt ${
                !notif.read ? "bg-brand-orange-light/40" : ""
              }`}
            >
              <div
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  TYPE_COLOR[notif.type] ?? "bg-muted"
                }`}
              >
                <Bell size={16} className="text-white" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{notif.title}</p>
                  <span className="shrink-0 text-[11px] text-muted">
                    {formatRelativeTime(notif.createdAt)}
                  </span>
                </div>
                {notif.body && (
                  <p className="mt-0.5 text-sm text-muted line-clamp-2">{notif.body}</p>
                )}
              </div>

              {!notif.read && (
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-orange" />
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}