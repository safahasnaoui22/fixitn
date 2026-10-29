
import Link from "next/link";
import { ArrowLeft, Bell } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listNotifications } from "@/lib/db/notifications";
import { ClientBottomNav } from "@/components/ClientBottomNav";
import { TechBottomNav } from "@/components/TechBottomNav";
import { EmptyState } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatRelativeTime } from "@/lib/utils";
import { markAllReadAction } from "./actions";

const TYPE_COLOR: Record<string, string> = {
  NEW_REQUEST: "bg-[#f97316]",
  STATUS_UPDATE: "bg-[#16a34a]",
  NEW_MESSAGE: "bg-[#2563eb]",
  NEW_REVIEW: "bg-[#29466f]",
};

export default async function NotificationsPage() {
  const session = await requireUser();
  const notifications = await listNotifications(session.userId);
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <>
    <div
      className="app-content no-scrollbar min-h-full text-[#f1f5f9]"
      style={{ backgroundColor: "#081426", color: "#f1f5f9" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between border-b border-[#2a3b56] px-5 py-4"
        style={{ backgroundColor: "#0b1930" }}
      >
        <div className="flex items-center gap-3">
          <Link
            href={session.role === "TECHNICIAN" ? "/t/dashboard" : "/"}
            aria-label="Go back"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-[#223858]"
            style={{ backgroundColor: "#172947" }}
          >
            <ArrowLeft size={18} />
          </Link>

          <p className="font-heading text-lg font-semibold text-white">
            Notifications
          </p>
        </div>

        {hasUnread && (
          <form action={markAllReadAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="!text-orange-400"
            >
              Mark all read
            </Button>
          </form>
        )}
      </div>

      {/* Empty state */}
      {notifications.length === 0 ? (
        <div className="text-white">
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            description="We'll let you know when something happens on your jobs."
          />
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-[#2a3b56]">
          {notifications.map((notif) => (
            <Link
              key={notif.id}
              href={notif.requestId ? `/requests/${notif.requestId}` : "#"}
              className="flex items-start gap-3 border-b border-[#2a3b56] px-5 py-4 transition-colors hover:!bg-[#172947]"
              style={{
                backgroundColor: notif.read ? "#0c1a30" : "#142541",
              }}
            >
              {/* Notification icon */}
              <div
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  TYPE_COLOR[notif.type] ?? "bg-[#64748b]"
                }`}
              >
                <Bell size={16} className="text-white" />
              </div>

              {/* Notification content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold !text-white">
                    {notif.title}
                  </p>

                  <span className="shrink-0 text-[11px] !text-[#b8c7dc]">
                    {formatRelativeTime(notif.createdAt)}
                  </span>
                </div>

                {notif.body && (
                  <p className="mt-0.5 line-clamp-2 text-sm !text-[#d0dbea]">
                    {notif.body}
                  </p>
                )}
              </div>

              {/* Unread indicator */}
              {!notif.read && (
                <div
                  aria-label="Unread"
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#f97316]"
                />
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
    {session.role === "TECHNICIAN" && <TechBottomNav />}
    {session.role === "CLIENT" && <ClientBottomNav />}
    </>
  );
}
