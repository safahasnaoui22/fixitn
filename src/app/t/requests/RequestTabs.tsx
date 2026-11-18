"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { StatusBadge, EmptyState } from "@/components/ui/Card";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Avatar } from "@/components/ui/Avatar";
import { formatRelativeTime } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ClipboardList } from "lucide-react";
import type { ServiceRequestWithRelations } from "@/lib/types";

type Tab = "pending" | "active" | "done";

const TAB_LABELS: Record<Tab, string> = {
  pending: "tech.requests.tabPending",
  active: "tech.requests.tabActive",
  done: "tech.requests.tabDone",
};

const TAB_EMPTY: Record<Tab, string> = {
  pending: "tech.requests.emptyPending",
  active: "tech.requests.emptyActive",
  done: "tech.requests.emptyDone",
};

const TAB_HINT: Record<Tab, string> = {
  pending: "tech.requests.hintPending",
  active: "tech.requests.hintActive",
  done: "tech.requests.hintDone",
};

export function RequestTabs({
  pending,
  active,
  done,
}: {
  pending: ServiceRequestWithRelations[];
  active: ServiceRequestWithRelations[];
  done: ServiceRequestWithRelations[];
}) {
  const { t, locale } = useI18n();
  const [tab, setTab] = useState<Tab>("pending");
  const lists: Record<Tab, ServiceRequestWithRelations[]> = { pending, active, done };
  const current = lists[tab];

  return (
    <div className="flex flex-col flex-1">
      {/* Tabs */}
      <div className="flex border-b border-line">
        {(["pending", "active", "done"] as Tab[]).map((tb) => {
          const count = lists[tb].length;
          return (
            <button
              key={tb}
              onClick={() => setTab(tb)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors",
                tab === tb
                  ? "border-brand-orange text-brand-orange"
                  : "border-transparent text-muted"
              )}
            >
              {t(TAB_LABELS[tb])}
              {count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    tab === tb
                      ? "bg-brand-orange text-white"
                      : "bg-surface-alt text-muted"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {current.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={t(TAB_EMPTY[tab])}
            description={t(TAB_HINT[tab])}
          />
        ) : (
          <div className="flex flex-col gap-3 p-5">
            {current.map((req) => (
              <Link
                key={req.id}
                href={`/requests/${req.id}`}
                className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 transition-transform active:scale-[0.98]"
              >
                <CategoryIcon
                  icon={req.categoryIcon}
                  color={req.categoryColor}
                  size={20}
                  badgeSize={44}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-heading text-sm font-semibold text-ink">
                    {req.categoryName}
                  </p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <Avatar src={req.clientAvatarUrl} name={req.clientFullName} size={16} />
                    <p className="truncate text-xs text-muted">{req.clientFullName}</p>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {formatRelativeTime(req.createdAt, t, locale)}
                  </p>
                </div>
                <StatusBadge status={req.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}