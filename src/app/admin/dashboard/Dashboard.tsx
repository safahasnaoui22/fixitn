"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  TrendingUp,
  Briefcase,
  Users,
  Wrench,
  DollarSign,
  BarChart2,
  UserCheck,
  Building2,
  Percent,
  ChevronDown,
  Bell,
} from "lucide-react";

import Link from "next/link";
import Navbar from "./Navbar";
import { formatDT, formatRelativeTime } from "@/lib/utils";

type DashboardData = {
  stats: {
    totalClients: number;
    totalTechnicians: number;
    totalJobs: number;
    platformEarnings: number;
    totalRevenue: number;
  };

  jobsOverview: {
    completed: number;
    inProgress: number;
    pending: number;
    terminated: number;
  };

  recentJobs: Array<{
    id: string;
    service: string;
    clientName: string;
    clientAvatar: string | null;
    technicianName: string;
    technicianAvatar: string | null;
    status: string;
    amount: number | null;
    createdAt: string;
  }>;

  topTechnicians: Array<{
    name: string;
    avatarUrl: string | null;
    title: string;
    jobs: number;
    rating: number | null;
    earnings: number;
  }>;

  recentPayments: Array<{
    id: string;
    technicianName: string;
    amount: number;
    platformFee: number;
    method: string;
    status: string;
    type: string;
    createdAt: string;
  }>;

  recentNotifications: Array<{
    title: string;
    type: string;
    userName: string;
    createdAt: string;
  }>;

  monthly: Array<{
    date: string;
    value: number;
    fee: number;
  }>;
};

const COLORS = [
  "#22c55e",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
];

const NOTIF_CONFIG: Record<
  string,
  {
    icon: string;
    bg: string;
  }
> = {
  NEW_REQUEST: {
    icon: "📋",
    bg: "#fef3c7",
  },

  STATUS_UPDATE: {
    icon: "🔄",
    bg: "#dbeafe",
  },

  NEW_MESSAGE: {
    icon: "💬",
    bg: "#dcfce7",
  },

  NEW_REVIEW: {
    icon: "⭐",
    bg: "#fef9c3",
  },
};

function getStatusDisplay(status: string): string {
  if (
    [
      "ACCEPTED",
      "ON_THE_WAY",
      "ARRIVED",
      "IN_PROGRESS",
    ].includes(status)
  ) {
    return "In Progress";
  }

  if (status === "COMPLETED") {
    return "Completed";
  }

  if (status === "PENDING") {
    return "Pending";
  }

  return "Cancelled";
}

function statusBadgeClass(status: string): string {
  const d = getStatusDisplay(status);

  if (d === "In Progress") {
    return "bg-blue-100 text-blue-700";
  }

  if (d === "Completed") {
    return "bg-green-100 text-green-700";
  }

  if (d === "Pending") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-gray-100 text-gray-600";
}

function methodBadge(method: string) {
  const styles: Record<string, string> = {
    D17: "bg-purple-100 text-purple-700",
    FLOUCI: "bg-amber-100 text-amber-700",
    BANK_TRANSFER: "bg-gray-100 text-gray-700",
    CASH: "bg-green-100 text-green-700",
  };

  return (
    styles[method] ??
    "bg-gray-100 text-gray-600"
  );
}

function Avatar({
  name,
  src,
  size = 32,
}: {
  name: string;
  src?: string | null;
  size?: number;
}) {
  const bg = [
    "#dbeafe",
    "#fef3c7",
    "#dcfce7",
    "#ede9fe",
    "#fee2e2",
  ];

  const i = name.charCodeAt(0) % bg.length;

  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold text-gray-700"
      style={{
        width: size,
        height: size,
        background: bg[i],
        fontSize: size * 0.35,
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({
  active,
  payload,
  label,
}: any) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-lg bg-brand-navy px-3 py-2 text-xs text-white shadow-lg">
        <div className="mb-1 text-white/60">
          {label}
        </div>

        <div className="font-bold">
          {formatDT(payload[0].value)}
        </div>
      </div>
    );
  }

  return null;
};

const DonutChart: React.FC<{
  completed: number;
  inProgress: number;
  pending: number;
  terminated: number;
}> = ({
  completed,
  inProgress,
  pending,
  terminated,
}) => {
  const total =
    completed +
      inProgress +
      pending +
      terminated || 1;

  const data = [
    {
      value: Math.round(
        (completed / total) * 100
      ),
      color: COLORS[0],
    },

    {
      value: Math.round(
        (inProgress / total) * 100
      ),
      color: COLORS[1],
    },

    {
      value: Math.round(
        (pending / total) * 100
      ),
      color: COLORS[2],
    },

    {
      value: Math.round(
        (terminated / total) * 100
      ),
      color: COLORS[3],
    },
  ];

  const R = 70;
  const sw = 28;
  const circ = 2 * Math.PI * R;

  let offset = 0;

  return (
    <svg
      width="155"
      height="155"
      viewBox="0 0 155 155"
      className="h-[135px] w-[135px] shrink-0 sm:h-[155px] sm:w-[155px]"
    >
      {data.map((seg, i) => {
        const da =
          (seg.value / 100) * circ;

        const do_ =
          -offset * (circ / 100);

        offset += seg.value;

        return (
          <circle
            key={i}
            cx="77.5"
            cy="77.5"
            r={R}
            fill="none"
            stroke={seg.color}
            strokeWidth={sw}
            strokeDasharray={`${da} ${circ}`}
            strokeDashoffset={do_}
            transform="rotate(-90 77.5 77.5)"
          />
        );
      })}

      <circle
        cx="77.5"
        cy="77.5"
        r={R - sw / 2 + 2}
        fill="white"
      />
    </svg>
  );
};

export const Dashboard: React.FC<{
  data: DashboardData;
}> = ({ data }) => {
  const [activeNav, setActiveNav] =
    useState("Dashboard");

  const {
    stats,
    jobsOverview,
    recentJobs,
    topTechnicians,
    recentPayments,
    recentNotifications,
    monthly,
  } = data;

  const total =
    jobsOverview.completed +
      jobsOverview.inProgress +
      jobsOverview.pending +
      jobsOverview.terminated || 1;

  const maxFee = Math.max(
    ...monthly.map((m) => m.value),
    1
  );

  return (
    <div className="flex min-w-0 flex-col gap-5">
      {/* Stat cards */}
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {[
          {
            icon: DollarSign,
            label: "Total Revenue",
            value: formatDT(stats.totalRevenue),
            color:
              "bg-orange-100 text-orange-600",
          },

          {
            icon: Briefcase,
            label: "Platform Earnings",
            value: formatDT(
              stats.platformEarnings
            ),
            color:
              "bg-green-100 text-green-600",
          },

          {
            icon: Wrench,
            label: "Technicians",
            value: stats.totalTechnicians,
            color:
              "bg-purple-100 text-purple-600",
          },

          {
            icon: Users,
            label: "Clients",
            value: stats.totalClients,
            color:
              "bg-blue-100 text-blue-600",
          },

          {
            icon: Briefcase,
            label: "Total Jobs",
            value: stats.totalJobs,
            color:
              "bg-amber-100 text-amber-600",
          },
        ].map((s, i) => (
          <div
            key={i}
            className="min-w-0 rounded-2xl border border-line bg-surface p-4"
          >
            <div
              className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl ${s.color}`}
            >
              <s.icon size={18} />
            </div>

            <p className="truncate font-heading text-xl font-bold text-ink">
              {s.value}
            </p>

            <p className="mt-0.5 truncate text-xs text-muted">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Revenue chart */}
        <div className="min-w-0 rounded-2xl border border-line bg-surface p-4 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="font-heading text-sm font-semibold text-ink">
              Revenue Overview
            </p>

            <Link
              href="/admin/revenue"
              className="shrink-0 text-xs font-medium text-brand-orange"
            >
              View full →
            </Link>
          </div>

          {monthly.length === 0 ? (
            <div className="flex h-36 items-center justify-center text-sm text-muted">
              No payment data yet
            </div>
          ) : (
            <div className="h-36 min-w-0 w-full">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <AreaChart
                  data={monthly}
                  margin={{
                    top: 4,
                    right: 4,
                    bottom: 0,
                    left: -20,
                  }}
                >
                  <defs>
                    <linearGradient
                      id="grad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#f97316"
                        stopOpacity={0.2}
                      />

                      <stop
                        offset="100%"
                        stopColor="#f97316"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f3f4f6"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="date"
                    tick={{
                      fontSize: 10,
                      fill: "#9ca3af",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{
                      fontSize: 10,
                      fill: "#9ca3af",
                    }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      v >= 1000
                        ? `${v / 1000}K`
                        : `${v}`
                    }
                  />

                  <Tooltip
                    content={<CustomTooltip />}
                  />

                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#f97316"
                    strokeWidth={2.5}
                    fill="url(#grad)"
                    dot={{
                      fill: "#f97316",
                      r: 3,
                      strokeWidth: 2,
                      stroke: "#fff",
                    }}
                    activeDot={{
                      r: 5,
                      fill: "#f97316",
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Jobs donut */}
        <div className="min-w-0 rounded-2xl border border-line bg-surface p-4">
          <p className="mb-3 font-heading text-sm font-semibold text-ink">
            Jobs Overview
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
            <div className="flex shrink-0 justify-center">
              <DonutChart
                completed={
                  jobsOverview.completed
                }
                inProgress={
                  jobsOverview.inProgress
                }
                pending={
                  jobsOverview.pending
                }
                terminated={
                  jobsOverview.terminated
                }
              />
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-2">
              {[
                {
                  label: "Completed",
                  value:
                    jobsOverview.completed,
                  color: COLORS[0],
                },

                {
                  label: "In Progress",
                  value:
                    jobsOverview.inProgress,
                  color: COLORS[1],
                },

                {
                  label: "Pending",
                  value:
                    jobsOverview.pending,
                  color: COLORS[2],
                },

                {
                  label: "Cancelled",
                  value:
                    jobsOverview.terminated,
                  color: COLORS[3],
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex min-w-0 items-center gap-1.5">
                    <div
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        background: item.color,
                      }}
                    />

                    <span className="truncate text-[10px] text-muted">
                      {item.label}
                    </span>
                  </div>

                  <span className="shrink-0 text-[10px] font-semibold text-ink">
                    {item.value} (
                    {Math.round(
                      (item.value / total) *
                        100
                    )}
                    %)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications + Recent Jobs row */}
      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Notifications */}
        <div className="min-w-0 rounded-2xl border border-line bg-surface p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="font-heading text-sm font-semibold text-ink">
              Notifications
            </p>

            <Link
              href="/notifications"
              className="shrink-0 text-xs font-medium text-brand-orange"
            >
              View all
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            {recentNotifications.length === 0 && (
              <p className="py-4 text-center text-xs text-muted">
                No notifications yet
              </p>
            )}

            {recentNotifications.map((n, i) => {
              const cfg =
                NOTIF_CONFIG[n.type] ?? {
                  icon: "🔔",
                  bg: "#f3f4f6",
                };

              return (
                <div
                  key={i}
                  className="flex min-w-0 items-center gap-2"
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm"
                    style={{
                      background: cfg.bg,
                    }}
                  >
                    {cfg.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-ink">
                      {n.title}
                    </p>

                    <p className="text-[10px] text-muted">
                      {formatRelativeTime(
                        n.createdAt
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="min-w-0 rounded-2xl border border-line bg-surface p-4 xl:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="font-heading text-sm font-semibold text-ink">
              Recent Jobs
            </p>

            <Link
              href="/admin/requests"
              className="shrink-0 text-xs font-medium text-brand-orange"
            >
              View all
            </Link>
          </div>

          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-[480px] text-xs">
              <thead>
                <tr className="border-b border-line">
                  {[
                    "Service",
                    "Client",
                    "Technician",
                    "Status",
                    "Amount",
                  ].map((h) => (
                    <th
                      key={h}
                      className="pb-2 pr-3 text-left font-semibold text-muted"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-line">
                {recentJobs.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-6 text-center text-muted"
                    >
                      No jobs yet
                    </td>
                  </tr>
                )}

                {recentJobs
                  .slice(0, 6)
                  .map((job) => (
                    <tr
                      key={job.id}
                      className="transition-colors hover:bg-surface-alt"
                    >
                      <td className="py-2 pr-3 font-medium text-ink">
                        {job.service}
                      </td>

                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-1.5">
                          <Avatar
                            name={job.clientName}
                            src={
                              job.clientAvatar
                            }
                            size={22}
                          />

                          <span className="max-w-[80px] truncate text-muted">
                            {job.clientName}
                          </span>
                        </div>
                      </td>

                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-1.5">
                          <Avatar
                            name={
                              job.technicianName
                            }
                            src={
                              job.technicianAvatar
                            }
                            size={22}
                          />

                          <span className="max-w-[80px] truncate text-muted">
                            {
                              job.technicianName
                            }
                          </span>
                        </div>
                      </td>

                      <td className="py-2 pr-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass(
                            job.status
                          )}`}
                        >
                          {getStatusDisplay(
                            job.status
                          )}
                        </span>
                      </td>

                      <td className="py-2 font-semibold text-ink">
                        {job.amount
                          ? formatDT(
                              job.amount
                            )
                          : "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top Technicians + Payments row */}
      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Top Technicians */}
        <div className="min-w-0 rounded-2xl border border-line bg-surface p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="font-heading text-sm font-semibold text-ink">
              Top Technicians
            </p>

            <Link
              href="/admin/technicians"
              className="shrink-0 text-xs font-medium text-brand-orange"
            >
              View all
            </Link>
          </div>

          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-[320px] text-xs">
              <thead>
                <tr className="border-b border-line">
                  {[
                    "Technician",
                    "Jobs",
                    "Rating",
                    "Earnings",
                  ].map((h) => (
                    <th
                      key={h}
                      className="pb-2 pr-3 text-left font-semibold text-muted"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-line">
                {topTechnicians.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-6 text-center text-muted"
                    >
                      No data yet
                    </td>
                  </tr>
                )}

                {topTechnicians.map(
                  (tech) => (
                    <tr
                      key={tech.name}
                      className="transition-colors hover:bg-surface-alt"
                    >
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2">
                          <Avatar
                            name={tech.name}
                            src={
                              tech.avatarUrl
                            }
                            size={26}
                          />

                          <div className="min-w-0">
                            <p className="max-w-[100px] truncate font-medium text-ink">
                              {tech.name}
                            </p>

                            <p className="truncate text-[10px] text-muted">
                              {tech.title}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-2 pr-3 font-semibold text-ink">
                        {tech.jobs}
                      </td>

                      <td className="py-2 pr-3 text-muted">
                        {tech.rating !=
                        null
                          ? `⭐ ${tech.rating.toFixed(
                              1
                            )}`
                          : "—"}
                      </td>

                      <td className="whitespace-nowrap py-2 font-semibold text-ink">
                        {formatDT(
                          tech.earnings
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="min-w-0 rounded-2xl border border-line bg-surface p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="font-heading text-sm font-semibold text-ink">
              Recent Payments
            </p>

            <Link
              href="/admin/payments"
              className="shrink-0 text-xs font-medium text-brand-orange"
            >
              View all
            </Link>
          </div>

          <div className="flex min-w-0 flex-col divide-y divide-line">
            {recentPayments.length === 0 && (
              <p className="py-6 text-center text-xs text-muted">
                No payments yet
              </p>
            )}

            {recentPayments.map((p) => {
              const isCredit =
                p.type === "PAYOUT";

              return (
                <div
                  key={p.id}
                  className="flex min-w-0 items-center gap-3 py-2.5"
                >
                  <Avatar
                    name={p.technicianName}
                    size={32}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-ink">
                      {p.technicianName}
                    </p>

                    <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
                      <span
                        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${methodBadge(
                          p.method
                        )}`}
                      >
                        {p.method}
                      </span>

                      <span className="truncate text-[10px] text-muted">
                        {p.type}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p
                      className={`text-xs font-bold ${
                        isCredit
                          ? "text-success"
                          : "text-danger"
                      }`}
                    >
                      {isCredit ? "+" : "-"}
                      {formatDT(p.amount)}
                    </p>

                    <p className="text-[10px] text-muted">
                      {formatDT(
                        p.platformFee
                      )}{" "}
                      fee
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Platform Summary */}
      <div className="min-w-0 rounded-2xl border border-line bg-surface p-4">
        <p className="mb-3 font-heading text-sm font-semibold text-ink">
          Platform Summary
        </p>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {[
            {
              label: "Platform Earnings",
              value: formatDT(
                stats.platformEarnings
              ),
              icon: DollarSign,
            },

            {
              label: "Technicians",
              value: stats.totalTechnicians,
              icon: Wrench,
            },

            {
              label: "Clients",
              value: stats.totalClients,
              icon: UserCheck,
            },

            {
              label: "Completed Jobs",
              value:
                jobsOverview.completed,
              icon: BarChart2,
            },

            {
              label: "Active Jobs",
              value:
                jobsOverview.inProgress,
              icon: Building2,
            },

            {
              label: "Pending Jobs",
              value:
                jobsOverview.pending,
              icon: Percent,
            },
          ].map((item, i) => (
            <div
              key={i}
              className="min-w-0 rounded-xl bg-surface-alt px-3 py-3 text-center"
            >
              <item.icon
                size={14}
                className="mx-auto mb-1 text-muted"
              />

              <p className="truncate font-heading text-base font-bold text-ink">
                {item.value}
              </p>

              <p className="truncate text-[10px] leading-tight text-muted">
                {item.label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <Link
            href="/admin/revenue"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-surface-alt py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-line"
          >
            <BarChart2 size={16} />
            View Detailed Reports
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;