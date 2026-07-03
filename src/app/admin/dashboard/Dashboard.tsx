"use client";

import React, { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Search, Bell, ChevronDown, TrendingUp,
  Star, BarChart2, Users, Wrench, DollarSign, Briefcase, Percent,
  UserCheck, Building2, Menu,
} from "lucide-react";
import Link from "next/link";
import Navbar from "./Navbar";
import styles from "./dashboard.module.css";
import { formatDT, formatRelativeTime, initials } from "@/lib/utils";

type DashboardData = {
  stats: { totalClients: number; totalTechnicians: number; totalJobs: number; platformEarnings: number; totalRevenue: number };
  jobsOverview: { completed: number; pending: number; inProgress: number; terminated: number };
  recentJobs: Array<{ id: string; service: string; clientName: string; clientAvatar: string | null; technicianName: string; technicianAvatar: string | null; status: string; amount: number | null; createdAt: string }>;
  topTechnicians: Array<{ name: string; avatarUrl: string | null; title: string; jobs: number; rating: number | null; earnings: number }>;
  recentPayments: Array<{ id: string; technicianName: string; amount: number; platformFee: number; method: string; status: string; type: string; createdAt: string }>;
  recentNotifications: Array<{ title: string; type: string; userName: string; createdAt: string }>;
  monthly: Array<{ date: string; value: number; fee: number }>;
};

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"];

const NOTIF_CONFIG: Record<string, { icon: string; bg: string }> = {
  NEW_REQUEST: { icon: "📋", bg: "#fef3c7" },
  STATUS_UPDATE: { icon: "🔄", bg: "#dbeafe" },
  NEW_MESSAGE: { icon: "💬", bg: "#dcfce7" },
  NEW_REVIEW: { icon: "⭐", bg: "#fef9c3" },
};

function getStatusDisplay(status: string): string {
  if (["ACCEPTED", "ON_THE_WAY", "ARRIVED", "IN_PROGRESS"].includes(status)) return "In Progress";
  if (status === "COMPLETED") return "Completed";
  if (status === "PENDING") return "Pending";
  if (["CANCELLED", "DECLINED"].includes(status)) return "Cancelled";
  return status;
}

function getStatusClass(status: string, styles: Record<string, string>): string {
  const display = getStatusDisplay(status);
  if (display === "In Progress") return styles.badgeInProgress;
  if (display === "Completed") return styles.badgeCompleted;
  if (display === "Pending") return styles.badgePending;
  return styles.badgeCancelled;
}

const DonutChart: React.FC<{ completed: number; inProgress: number; pending: number; terminated: number }> = (
  { completed, inProgress, pending, terminated }
) => {
  const total = completed + inProgress + pending + terminated || 1;
  const data = [
    { value: Math.round((completed / total) * 100), color: COLORS[0] },
    { value: Math.round((inProgress / total) * 100), color: COLORS[1] },
    { value: Math.round((pending / total) * 100), color: COLORS[2] },
    { value: Math.round((terminated / total) * 100), color: COLORS[3] },
  ];

  const radius = 70;
  const strokeWidth = 28;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg width="155" height="155" viewBox="0 0 155 155" className={styles.donutSvg}>
      {data.map((seg, i) => {
        const dashArray = (seg.value / 100) * circumference;
        const dashOffset = -offset * (circumference / 100);
        offset += seg.value;
        return (
          <circle key={i} cx="77.5" cy="77.5" r={radius} fill="none"
            stroke={seg.color} strokeWidth={strokeWidth}
            strokeDasharray={`${dashArray} ${circumference}`}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 77.5 77.5)"
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        );
      })}
      <circle cx="77.5" cy="77.5" r={radius - strokeWidth / 2 + 2} fill="white" />
    </svg>
  );
};

const PayMethodBadge: React.FC<{ method: string }> = ({ method }) => {
  if (method === "D17") return <span className={`${styles.pmBadge} ${styles.pmD17}`}>D17</span>;
  if (method === "FLOUCI") return <span className={`${styles.pmBadge} ${styles.pmFlouci}`}>Flouci</span>;
  if (method === "BANK_TRANSFER") return <span className={`${styles.pmBadge} ${styles.pmVirement}`}>🏛 Virement</span>;
  return <span className={`${styles.pmBadge} ${styles.pmVirement}`}>{method}</span>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: "#1a1d2e", color: "#fff", borderRadius: 8, padding: "6px 12px", fontSize: 12 }}>
        <div style={{ color: "#9ca3af", marginBottom: 2 }}>{label}</div>
        <div style={{ fontWeight: 700 }}>{payload[0].value.toLocaleString()} DT</div>
      </div>
    );
  }
  return null;
};

function AvatarCell({ name, avatarUrl, size = 28 }: { name: string; avatarUrl: string | null; size?: number }) {
  const bg = ["#dbeafe", "#fef3c7", "#dcfce7", "#ede9fe", "#fee2e2"];
  const colorIdx = name.charCodeAt(0) % bg.length;
  return (
    <div
      className={styles.avatar}
      style={{ width: size, height: size, background: bg[colorIdx], color: "#374151", flexShrink: 0, fontSize: size * 0.35 }}
    >
      {avatarUrl
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={avatarUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
        : initials(name)
      }
    </div>
  );
}

const Dashboard: React.FC<{ data: DashboardData }> = ({ data }) => {
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { stats, jobsOverview, recentJobs, topTechnicians, recentPayments, recentNotifications, monthly } = data;
  const total = jobsOverview.completed + jobsOverview.inProgress + jobsOverview.pending + jobsOverview.terminated || 1;

  return (
    <div className={styles.dashboardLayout}>
      {/* Backdrop shown behind the sidebar when open on mobile/tablet */}
      {sidebarOpen && (
        <div className={styles.sidebarBackdrop} onClick={() => setSidebarOpen(false)} />
      )}

      <Navbar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={styles.mainContent}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button
              className={styles.hamburger}
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <h1 className={styles.topbarTitle}>Dashboard Overview</h1>
          </div>
          <div className={styles.topbarRight}>
            <div className={styles.searchBox}>
              <Search size={14} className={styles.searchIcon} />
              <input type="text" placeholder="Search anything..." className={styles.searchInput} />
            </div>
            <Link href="/notifications" className={styles.notifBtn}>
              <Bell size={16} />
            </Link>
            <div className={styles.adminProfile}>
              <div className={styles.adminAvatar} style={{ background: "#dbeafe", color: "#1d4ed8" }}>AD</div>
              <div className={styles.adminInfo}>
                <span className={styles.adminName}>Admin</span>
                <span className={styles.adminRole}>Super Admin</span>
              </div>
              <ChevronDown size={13} color="#9ca3af" />
            </div>
          </div>
        </header>

        <main className={styles.dashboardPage}>

          {/* Stat Cards */}
          <div className={styles.statCards}>
            <div className={styles.statCard}>
              <div className={`${styles.statIconWrap} ${styles.statIconOrange}`}><DollarSign size={20} color="#fff" /></div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>Total Revenue</div>
                <div className={styles.statValue}>{formatDT(stats.totalRevenue)}</div>
                <div className={styles.statChange}>
                  <TrendingUp size={12} className={styles.statChangeUp} />
                  <span className={styles.statChangeUp}>Gross job value</span>
                </div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={`${styles.statIconWrap} ${styles.statIconGreen}`}><Briefcase size={20} color="#fff" /></div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>Platform Earnings</div>
                <div className={styles.statValue}>{formatDT(stats.platformEarnings)}</div>
                <div className={styles.statChange}>
                  <TrendingUp size={12} className={styles.statChangeUp} />
                  <span className={styles.statChangeUp}>Commission collected</span>
                </div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={`${styles.statIconWrap} ${styles.statIconPurple}`}><Wrench size={20} color="#fff" /></div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>Total Technicians</div>
                <div className={styles.statValue}>{stats.totalTechnicians.toLocaleString()}</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={`${styles.statIconWrap} ${styles.statIconBlue}`}><Users size={20} color="#fff" /></div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>Total Clients</div>
                <div className={styles.statValue}>{stats.totalClients.toLocaleString()}</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={`${styles.statIconWrap} ${styles.statIconYellow}`}><Briefcase size={20} color="#fff" /></div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>Total Jobs</div>
                <div className={styles.statValue}>{stats.totalJobs.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className={styles.chartsRow}>
            {/* Revenue Chart */}
            <div className={`${styles.card} ${styles.revenueCard}`}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Revenue Overview</span>
                <Link href="/admin/revenue" className={styles.viewAll}>View full →</Link>
              </div>
              <div className={styles.chartArea}>
                {monthly.length === 0 ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#9ca3af", fontSize: 13 }}>
                    No payment data yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthly} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f97316" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#f97316" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                        tickFormatter={(v) => v >= 1000 ? `${v / 1000}K` : `${v}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2.5}
                        fill="url(#revenueGrad)"
                        dot={{ fill: "#f97316", r: 4, strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 6, fill: "#f97316" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Jobs Overview Donut */}
            <div className={`${styles.card} ${styles.jobsCard}`}>
              <div className={styles.cardHeader}><span className={styles.cardTitle}>Jobs Overview</span></div>
              <div className={styles.donutWrap}>
                <DonutChart
                  completed={jobsOverview.completed}
                  inProgress={jobsOverview.inProgress}
                  pending={jobsOverview.pending}
                  terminated={jobsOverview.terminated}
                />
                <div className={styles.donutLegend}>
                  {[
                    { label: "Completed", value: `${jobsOverview.completed} (${Math.round((jobsOverview.completed / total) * 100)}%)`, color: COLORS[0] },
                    { label: "In Progress", value: `${jobsOverview.inProgress} (${Math.round((jobsOverview.inProgress / total) * 100)}%)`, color: COLORS[1] },
                    { label: "Pending", value: `${jobsOverview.pending} (${Math.round((jobsOverview.pending / total) * 100)}%)`, color: COLORS[2] },
                    { label: "Cancelled", value: `${jobsOverview.terminated} (${Math.round((jobsOverview.terminated / total) * 100)}%)`, color: COLORS[3] },
                  ].map((item) => (
                    <div key={item.label} className={styles.legendItem}>
                      <div className={styles.legendLeft}>
                        <span className={styles.legendDot} style={{ background: item.color }} />
                        <span className={styles.legendLabel}>{item.label}</span>
                      </div>
                      <span className={styles.legendValue}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Notifications */}
            <div className={`${styles.card} ${styles.notifCard}`}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Recent Notifications</span>
                <Link href="/notifications" className={styles.viewAll}>View All</Link>
              </div>
              <div className={styles.notifList}>
                {recentNotifications.length === 0 && (
                  <p style={{ color: "#9ca3af", fontSize: 13, padding: "8px 0" }}>No notifications yet</p>
                )}
                {recentNotifications.map((n, i) => {
                  const cfg = NOTIF_CONFIG[n.type] ?? { icon: "🔔", bg: "#f3f4f6" };
                  return (
                    <div key={i} className={styles.notifItem}>
                      <div className={styles.notifIconWrap} style={{ background: cfg.bg }}>{cfg.icon}</div>
                      <span className={styles.notifText}>{n.title}</span>
                      <span className={styles.notifTime}>{formatRelativeTime(n.createdAt)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tables Row */}
          <div className={styles.tablesRow}>
            {/* Recent Jobs */}
            <div className={`${styles.card} ${styles.tableCard}`}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Recent Jobs</span>
                <Link href="/admin/requests" className={styles.viewAll}>View All</Link>
              </div>
              <div className={styles.tableScroll}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Job ID</th><th>Service</th><th>Client</th>
                      <th>Technician</th><th>Status</th><th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentJobs.length === 0 && (
                      <tr><td colSpan={6} style={{ textAlign: "center", color: "#9ca3af", padding: 16 }}>No jobs yet</td></tr>
                    )}
                    {recentJobs.map((job) => (
                      <tr key={job.id}>
                        <td><Link href={`/admin/requests`} className={styles.jobId}>{job.id}</Link></td>
                        <td>{job.service}</td>
                        <td>
                          <div className={styles.personCell}>
                            <AvatarCell name={job.clientName} avatarUrl={job.clientAvatar} />
                            <span>{job.clientName}</span>
                          </div>
                        </td>
                        <td>
                          <div className={styles.personCell}>
                            <AvatarCell name={job.technicianName} avatarUrl={job.technicianAvatar} />
                            <span>{job.technicianName}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`${styles.badge} ${getStatusClass(job.status, styles)}`}>
                            {getStatusDisplay(job.status)}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{job.amount ? formatDT(job.amount) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Technicians */}
            <div className={`${styles.card} ${styles.techCard}`}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Top Technicians</span>
                <Link href="/admin/technicians" className={styles.viewAll}>View All</Link>
              </div>
              <div className={styles.tableScroll}>
                <table className={styles.techTable}>
                  <thead>
                    <tr><th>Technician</th><th>Jobs</th><th>Rating</th><th>Earnings</th></tr>
                  </thead>
                  <tbody>
                    {topTechnicians.length === 0 && (
                      <tr><td colSpan={4} style={{ textAlign: "center", color: "#9ca3af", padding: 16 }}>No data yet</td></tr>
                    )}
                    {topTechnicians.map((tech) => (
                      <tr key={tech.name}>
                        <td>
                          <div className={styles.personCell}>
                            <AvatarCell name={tech.name} avatarUrl={tech.avatarUrl} />
                            <div>
                              <div className={styles.techName}>{tech.name}</div>
                              <div className={styles.techRole}>{tech.title}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{tech.jobs}</td>
                        <td>
                          {tech.rating != null ? (
                            <div className={styles.ratingCell}>
                              <Star size={12} fill="#f59e0b" className={styles.starIcon} />
                              {tech.rating.toFixed(1)}
                            </div>
                          ) : "—"}
                        </td>
                        <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{formatDT(tech.earnings)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className={styles.bottomRow}>
            {/* Payments */}
            <div className={`${styles.card} ${styles.paymentsCard}`}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Recent Payments</span>
                <Link href="/admin/payments" className={styles.viewAll}>View All</Link>
              </div>
              <div className={styles.tableScroll}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>ID</th><th>Technician</th><th>Amount</th>
                      <th>Platform Fee</th><th>Method</th><th>Status</th><th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign: "center", color: "#9ca3af", padding: 16 }}>No payments yet</td></tr>
                    )}
                    {recentPayments.map((p) => (
                      <tr key={p.id}>
                        <td><span className={styles.jobId}>{p.id}</span></td>
                        <td>
                          <div className={styles.personCell}>
                            <AvatarCell name={p.technicianName} avatarUrl={null} />
                            <span>{p.technicianName}</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{formatDT(p.amount)}</td>
                        <td style={{ fontWeight: 600, color: "#ef4444" }}>{formatDT(p.platformFee)}</td>
                        <td><PayMethodBadge method={p.method} /></td>
                        <td>
                          <span className={`${styles.badge} ${p.status === "PAID" ? styles.badgePaid : p.status === "PENDING" ? styles.badgePending : styles.badgeCancelled}`}>
                            {p.status}
                          </span>
                        </td>
                        <td style={{ color: "#6b7280" }}>{p.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Platform Summary */}
            <div className={`${styles.card} ${styles.summaryCard}`}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Platform Summary</span>
              </div>
              <div className={styles.summaryList}>
                {[
                  { label: "Platform Earnings", value: formatDT(stats.platformEarnings), icon: <DollarSign size={13} /> },
                  { label: "Total Technicians", value: stats.totalTechnicians, icon: <Wrench size={13} /> },
                  { label: "Total Clients", value: stats.totalClients, icon: <UserCheck size={13} /> },
                  { label: "Completed Jobs", value: jobsOverview.completed, icon: <BarChart2 size={13} /> },
                  { label: "Active Jobs", value: jobsOverview.inProgress, icon: <Building2 size={13} /> },
                  { label: "Pending Jobs", value: jobsOverview.pending, icon: <Percent size={13} /> },
                ].map((item, i) => (
                  <div key={i} className={styles.summaryItem}>
                    <div className={styles.summaryLeft}>
                      <span className={styles.summaryIcon}>{item.icon}</span>
                      {item.label}
                    </div>
                    <span className={styles.summaryValue}>{item.value}</span>
                  </div>
                ))}
              </div>
              <Link href="/admin/revenue" className={styles.detailedReportsBtn}>
                <BarChart2 size={14} />
                View Detailed Reports
              </Link>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default Dashboard;