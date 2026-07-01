"use client";

import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  Search,
  Bell,
  Plus,
  ChevronDown,
  Calendar,
  TrendingUp,
  Star,
  BarChart2,
  Users,
  Wrench,
  DollarSign,
  Briefcase,
  UserCheck,
  Building2,
  Percent,
} from "lucide-react";
import Navbar from "./Navbar";
import styles from "./dashboard.module.css";

/* ── Data ── */
const revenueData = [
  { date: "16 May", value: 2100 },
  { date: "17 May", value: 1800 },
  { date: "18 May", value: 2600 },
  { date: "19 May", value: 2200 },
  { date: "20 May", value: 3100 },
  { date: "21 May", value: 2400 },
  { date: "22 May", value: 3000 },
];

const recentJobs = [
  {
    id: "#J5902",
    service: "AC Repair",
    serviceIcon: "❄️",
    client: "Safa Dkhili",
    technician: "Ahmed Ben Salah",
    status: "In Progress",
    amount: "80 DT",
    date: "Today, 10:30 AM",
    clientInitials: "SD",
    techInitials: "AB",
    clientColor: "#dbeafe",
    techColor: "#dcfce7",
  },
  {
    id: "#J5901",
    service: "Plumbing",
    serviceIcon: "🔧",
    client: "Yassine Trabelsi",
    technician: "Yassine Kriaa",
    status: "Pending",
    amount: "60 DT",
    date: "Today, 09:15 AM",
    clientInitials: "YT",
    techInitials: "YK",
    clientColor: "#fef3c7",
    techColor: "#fef3c7",
  },
  {
    id: "#J5900",
    service: "Washing Machine",
    serviceIcon: "🫧",
    client: "Mohamed Ali",
    technician: "Walid Mhiri",
    status: "Completed",
    amount: "70 DT",
    date: "Today, 08:45 AM",
    clientInitials: "MA",
    techInitials: "WM",
    clientColor: "#dcfce7",
    techColor: "#ede9fe",
  },
  {
    id: "#J5899",
    service: "Electrical",
    serviceIcon: "⚡",
    client: "Khaled Mzoughi",
    technician: "Mohamed Ali",
    status: "In Progress",
    amount: "120 DT",
    date: "Today, 08:20 AM",
    clientInitials: "KM",
    techInitials: "MA",
    clientColor: "#fef9c3",
    techColor: "#dcfce7",
  },
  {
    id: "#J5898",
    service: "TV Repair",
    serviceIcon: "📺",
    client: "Ines Ben Saad",
    technician: "Ahmed Ben Salah",
    status: "Pending",
    amount: "50 DT",
    date: "Today, 07:50 AM",
    clientInitials: "IB",
    techInitials: "AB",
    clientColor: "#fee2e2",
    techColor: "#dcfce7",
  },
];

const topTechnicians = [
  {
    name: "Ahmed Ben Salah",
    role: "AC Technician",
    jobs: 128,
    rating: 4.9,
    earnings: "1,245 DT",
    initials: "AB",
    color: "#dbeafe",
  },
  {
    name: "Yassine Kriaa",
    role: "Plumber",
    jobs: 96,
    rating: 4.8,
    earnings: "1,012 DT",
    initials: "YK",
    color: "#fef3c7",
  },
  {
    name: "Mohamed Ali",
    role: "Electrician",
    jobs: 85,
    rating: 4.7,
    earnings: "856 DT",
    initials: "MA",
    color: "#dcfce7",
  },
  {
    name: "Walid Mhiri",
    role: "Refrigeration",
    jobs: 74,
    rating: 4.6,
    earnings: "742 DT",
    initials: "WM",
    color: "#ede9fe",
  },
  {
    name: "Hichem Ayari",
    role: "Multi Services",
    jobs: 68,
    rating: 4.5,
    earnings: "612 DT",
    initials: "HA",
    color: "#fce7f3",
  },
];

const paymentsData = [
  {
    id: "#P8861",
    technician: "Ahmed Ben Salah",
    amount: "128.500 DT",
    fee: "12.850 DT",
    method: "D17",
    status: "Paid",
    date: "22 May 2024 – 11:20 AM",
    type: "Payout",
    txId: "D17-8945612",
    initials: "AB",
    color: "#dbeafe",
  },
  {
    id: "#P8860",
    technician: "Yassine Kriaa",
    amount: "86.000 DT",
    fee: "8.600 DT",
    method: "Flouci",
    status: "Paid",
    date: "22 May 2024 – 10:45 AM",
    type: "Payout",
    txId: "FLC-7893512",
    initials: "YK",
    color: "#fef3c7",
  },
  {
    id: "#P8859",
    technician: "Mohamed Ali",
    amount: "74.000 DT",
    fee: "7.400 DT",
    method: "Virement",
    status: "Paid",
    date: "22 May 2024 – 09:30 AM",
    type: "Payout",
    txId: "VIR-4569871",
    initials: "MA",
    color: "#dcfce7",
  },
  {
    id: "#P8858",
    technician: "Safa Dkhili (Client)",
    amount: "120.000 DT",
    fee: "12.000 DT",
    method: "D17",
    status: "Completed",
    date: "22 May 2024 – 09:15 AM",
    type: "Payment",
    txId: "D17-8521479",
    initials: "SD",
    color: "#fee2e2",
  },
];

const notifications = [
  {
    text: "New technician registered",
    time: "2 mins ago",
    icon: "👤",
    bg: "#dbeafe",
  },
  { text: "New job request", time: "5 mins ago", icon: "📋", bg: "#fef3c7" },
  { text: "Payment received", time: "15 mins ago", icon: "💳", bg: "#dcfce7" },
  { text: "New review received", time: "1 hour ago", icon: "⭐", bg: "#fef9c3" },
  {
    text: "Payout completed",
    time: "2 hours ago",
    icon: "✅",
    bg: "#ede9fe",
  },
];

/* ── Helpers ── */
const getStatusClass = (status: string) => {
  switch (status) {
    case "In Progress":
      return styles.badgeInProgress;
    case "Pending":
      return styles.badgePending;
    case "Completed":
      return styles.badgeCompleted;
    case "Cancelled":
      return styles.badgeCancelled;
    case "Paid":
      return styles.badgePaid;
    default:
      return styles.badgePending;
  }
};

/* ── Donut SVG ── */
const DonutChart: React.FC = () => {
  const data = [
    { value: 55, color: "#22c55e" },
    { value: 19, color: "#3b82f6" },
    { value: 15, color: "#f59e0b" },
    { value: 11, color: "#ef4444" },
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
          <circle
            key={i}
            cx="77.5"
            cy="77.5"
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
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

/* ── Payment Method Badge ── */
const PayMethodBadge: React.FC<{ method: string }> = ({ method }) => {
  if (method === "D17") {
    return (
      <span className={`${styles.pmBadge} ${styles.pmD17}`}>D17</span>
    );
  }
  if (method === "Flouci") {
    return (
      <span className={`${styles.pmBadge} ${styles.pmFlouci}`}>Flouci</span>
    );
  }
  return (
    <span className={`${styles.pmBadge} ${styles.pmVirement}`}>
      🏛 Virement Bancaire
    </span>
  );
};

/* ── Custom Tooltip ── */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "#1a1d2e",
          color: "#fff",
          borderRadius: 8,
          padding: "6px 12px",
          fontSize: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{ color: "#9ca3af", marginBottom: 2 }}>{label}</div>
        <div style={{ fontWeight: 700 }}>{payload[0].value.toLocaleString()} DT</div>
      </div>
    );
  }
  return null;
};

/* ── Main Dashboard ── */
const Dashboard: React.FC = () => {
  const [activeNav, setActiveNav] = useState("Dashboard");

  return (
    <div className={styles.dashboardLayout}>
      {/* Sidebar */}
      <Navbar activeItem={activeNav} onSelect={setActiveNav} />

      {/* Main area */}
      <div className={styles.mainContent}>
        {/* Top bar */}
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button className={styles.hamburger}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M2 4.5h14M2 9h14M2 13.5h14"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <h1 className={styles.topbarTitle}>Dashboard Overview</h1>
          </div>

          <div className={styles.topbarRight}>
            {/* Search */}
            <div className={styles.searchBox}>
              <Search size={14} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search anything..."
                className={styles.searchInput}
              />
            </div>

            {/* Bell */}
            <button className={styles.notifBtn}>
              <Bell size={16} />
              <span className={styles.notifBadge}>8</span>
            </button>

            {/* Quick Action */}
            <button className={styles.quickActionBtn}>
              <Plus size={14} />
              Quick Action
            </button>

            {/* Admin profile */}
            <div className={styles.adminProfile}>
              <div
                className={styles.adminAvatar}
                style={{ background: "#dbeafe", color: "#1d4ed8" }}
              >
                AD
              </div>
              <div className={styles.adminInfo}>
                <span className={styles.adminName}>Admin</span>
                <span className={styles.adminRole}>Super Admin</span>
              </div>
              <ChevronDown size={13} color="#9ca3af" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className={styles.dashboardPage}>
          {/* Date Range */}
          <div className={styles.dateRangeRow}>
            <button className={styles.dateRangePicker}>
              <Calendar size={13} />
              22 May 2024 – 28 May 2024
              <ChevronDown size={13} />
            </button>
          </div>

          {/* ── STAT CARDS ── */}
          <div className={styles.statCards}>
            {/* Total Revenue */}
            <div className={styles.statCard}>
              <div className={`${styles.statIconWrap} ${styles.statIconOrange}`}>
                <DollarSign size={20} color="#fff" />
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>Total Revenue</div>
                <div className={styles.statValue}>17,430 DT</div>
                <div className={styles.statChange}>
                  <TrendingUp size={12} className={styles.statChangeUp} />
                  <span className={styles.statChangeUp}>28.5%</span>
                  <span className={styles.statChangeSub}>vs last 7 days</span>
                </div>
              </div>
            </div>

            {/* Platform Earnings */}
            <div className={styles.statCard}>
              <div className={`${styles.statIconWrap} ${styles.statIconGreen}`}>
                <Briefcase size={20} color="#fff" />
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>Platform Earnings</div>
                <div className={styles.statValue}>2,614 DT</div>
                <div className={styles.statChange}>
                  <TrendingUp size={12} className={styles.statChangeUp} />
                  <span className={styles.statChangeUp}>19.3%</span>
                  <span className={styles.statChangeSub}>vs last 7 days</span>
                </div>
              </div>
            </div>

            {/* Total Technicians */}
            <div className={styles.statCard}>
              <div className={`${styles.statIconWrap} ${styles.statIconPurple}`}>
                <Wrench size={20} color="#fff" />
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>Total Technicians</div>
                <div className={styles.statValue}>1,248</div>
                <div className={styles.statChange}>
                  <TrendingUp size={12} className={styles.statChangeUp} />
                  <span className={styles.statChangeUp}>15.4%</span>
                  <span className={styles.statChangeSub}>vs last 7 days</span>
                </div>
              </div>
            </div>

            {/* Total Clients */}
            <div className={styles.statCard}>
              <div className={`${styles.statIconWrap} ${styles.statIconBlue}`}>
                <Users size={20} color="#fff" />
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>Total Clients</div>
                <div className={styles.statValue}>3,562</div>
                <div className={styles.statChange}>
                  <TrendingUp size={12} className={styles.statChangeUp} />
                  <span className={styles.statChangeUp}>20.7%</span>
                  <span className={styles.statChangeSub}>vs last 7 days</span>
                </div>
              </div>
            </div>

            {/* Total Jobs */}
            <div className={styles.statCard}>
              <div className={`${styles.statIconWrap} ${styles.statIconYellow}`}>
                <Briefcase size={20} color="#fff" />
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>Total Jobs</div>
                <div className={styles.statValue}>5,894</div>
                <div className={styles.statChange}>
                  <TrendingUp size={12} className={styles.statChangeUp} />
                  <span className={styles.statChangeUp}>18.2%</span>
                  <span className={styles.statChangeSub}>vs last 7 days</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── CHARTS ROW ── */}
          <div className={styles.chartsRow}>
            {/* Revenue Chart */}
            <div className={`${styles.card} ${styles.revenueCard}`}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Revenue Overview</span>
                <button className={styles.chartDropdown}>
                  Last 7 Days
                  <ChevronDown size={13} />
                </button>
              </div>
              <div className={styles.chartArea}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={revenueData}
                    margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                  >
                    <defs>
                      <linearGradient
                        id="revenueGrad"
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
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) =>
                        v >= 1000 ? `${v / 1000}K` : `${v}`
                      }
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#f97316"
                      strokeWidth={2.5}
                      fill="url(#revenueGrad)"
                      dot={{
                        fill: "#f97316",
                        r: 4,
                        strokeWidth: 2,
                        stroke: "#fff",
                      }}
                      activeDot={{ r: 6, fill: "#f97316" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Jobs Overview */}
            <div className={`${styles.card} ${styles.jobsCard}`}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Jobs Overview</span>
              </div>
              <div className={styles.donutWrap}>
                <DonutChart />
                <div className={styles.donutLegend}>
                  {[
                    { label: "Completed", value: "3,245 (55%)", color: "#22c55e" },
                    { label: "In Progress", value: "1,152 (19%)", color: "#3b82f6" },
                    { label: "Pending", value: "874 (15%)", color: "#f59e0b" },
                    { label: "Cancelled", value: "623 (11%)", color: "#ef4444" },
                  ].map((item) => (
                    <div key={item.label} className={styles.legendItem}>
                      <div className={styles.legendLeft}>
                        <span
                          className={styles.legendDot}
                          style={{ background: item.color }}
                        />
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
                <button className={styles.viewAll}>View All</button>
              </div>
              <div className={styles.notifList}>
                {notifications.map((n, i) => (
                  <div key={i} className={styles.notifItem}>
                    <div
                      className={styles.notifIconWrap}
                      style={{ background: n.bg }}
                    >
                      {n.icon}
                    </div>
                    <span className={styles.notifText}>{n.text}</span>
                    <span className={styles.notifTime}>{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── TABLES ROW ── */}
          <div className={styles.tablesRow}>
            {/* Recent Jobs */}
            <div className={`${styles.card} ${styles.tableCard}`}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Recent Jobs</span>
                <button className={styles.viewAll}>View All</button>
              </div>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Job ID</th>
                    <th>Service</th>
                    <th>Client</th>
                    <th>Technician</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentJobs.map((job) => (
                    <tr key={job.id}>
                      <td>
                        <span className={styles.jobId}>{job.id}</span>
                      </td>
                      <td>
                        <div className={styles.serviceCell}>
                          <span className={styles.serviceIcon}>
                            {job.serviceIcon}
                          </span>
                          <span>{job.service}</span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.personCell}>
                          <div
                            className={styles.avatar}
                            style={{
                              background: job.clientColor,
                              color: "#374151",
                            }}
                          >
                            {job.clientInitials}
                          </div>
                          <span>{job.client}</span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.personCell}>
                          <div
                            className={styles.avatar}
                            style={{
                              background: job.clientColor,
                              color: "#374151",
                            }}
                          >
                            {job.techInitials}
                          </div>
                          <span>{job.technician}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`${styles.badge} ${getStatusClass(
                            job.status
                          )}`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{job.amount}</td>
                      <td style={{ color: "#9ca3af", whiteSpace: "nowrap" }}>
                        {job.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Top Technicians */}
            <div className={`${styles.card} ${styles.techCard}`}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Top Technicians</span>
                <button className={styles.viewAll}>View All</button>
              </div>
              <table className={styles.techTable}>
                <thead>
                  <tr>
                    <th>Technician</th>
                    <th>Jobs</th>
                    <th>Rating</th>
                    <th>Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {topTechnicians.map((tech) => (
                    <tr key={tech.name}>
                      <td>
                        <div className={styles.personCell}>
                          <div
                            className={styles.avatar}
                            style={{
                              background: tech.color,
                              color: "#374151",
                            }}
                          >
                            {tech.initials}
                          </div>
                          <div>
                            <div className={styles.techName}>{tech.name}</div>
                            <div className={styles.techRole}>{tech.role}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{tech.jobs}</td>
                      <td>
                        <div className={styles.ratingCell}>
                          <Star
                            size={12}
                            fill="#f59e0b"
                            className={styles.starIcon}
                          />
                          {tech.rating}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                        {tech.earnings}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── BOTTOM ROW ── */}
          <div className={styles.bottomRow}>
            {/* Payments & Payouts */}
            <div className={`${styles.card} ${styles.paymentsCard}`}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Payments & Payouts</span>
                <button className={styles.viewAll}>View All</button>
              </div>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Technician</th>
                    <th>Amount</th>
                    <th>Platform Fee (10%)</th>
                    <th>Payment Method</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Transaction ID</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsData.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <span className={styles.jobId}>{p.id}</span>
                      </td>
                      <td>
                        <div className={styles.personCell}>
                          <div
                            className={styles.avatar}
                            style={{
                              background: p.color,
                              color: "#374151",
                            }}
                          >
                            {p.initials}
                          </div>
                          <span>{p.technician}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{p.amount}</td>
                      <td style={{ fontWeight: 600, color: "#ef4444" }}>
                        {p.fee}
                      </td>
                      <td>
                        <PayMethodBadge method={p.method} />
                      </td>
                      <td>
                        <span
                          className={`${styles.badge} ${getStatusClass(
                            p.status
                          )}`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td
                        style={{
                          color: "#9ca3af",
                          fontSize: 11,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.date}
                      </td>
                      <td style={{ color: "#6b7280" }}>{p.type}</td>
                      <td
                        style={{
                          color: "#9ca3af",
                          fontSize: 11,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.txId}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Platform Summary + Payment Methods */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              {/* Payment Methods */}
              <div className={styles.card} style={{ padding: "0 0 10px" }}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardTitle}>Payment Methods</span>
                  <button className={styles.viewAll}>Manage</button>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0,
                    padding: "0 14px",
                  }}
                >
                  {[
                    {
                      name: "D17 (Digital)",
                      balance: "1,245,500 DT",
                      bg: "#7c3aed",
                      label: "D17",
                    },
                    {
                      name: "Flouci",
                      balance: "1,012,300 DT",
                      bg: "#f59e0b",
                      label: "Flouci",
                    },
                    {
                      name: "Virement Bancaire",
                      balance: "356,800 DT",
                      bg: "#e5e7eb",
                      label: "🏛",
                      dark: false,
                    },
                  ].map((pm, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "9px 0",
                        borderBottom:
                          i < 2 ? "1px solid #f3f4f6" : "none",
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: pm.bg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: pm.dark === false ? 18 : 11,
                          fontWeight: 800,
                          color:
                            pm.dark === false ? "#374151" : "#fff",
                          flexShrink: 0,
                        }}
                      >
                        {pm.label}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#111827",
                          }}
                        >
                          {pm.name}
                        </div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>
                          Balance: {pm.balance}
                        </div>
                      </div>
                      <span
                        className={`${styles.badge} ${styles.badgeCompleted}`}
                        style={{ fontSize: 10.5 }}
                      >
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Platform Summary */}
              <div className={`${styles.card} ${styles.summaryCard}`}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardTitle}>Platform Summary</span>
                </div>
                <div className={styles.summaryList}>
                  {[
                    {
                      label: "Commission Rate",
                      value: "10%",
                      icon: <Percent size={13} />,
                    },
                    {
                      label: "Total Commission",
                      value: "1,743 DT",
                      icon: <DollarSign size={13} />,
                    },
                    {
                      label: "Active Technicians",
                      value: "1,102",
                      icon: <Wrench size={13} />,
                    },
                    {
                      label: "New Technicians (7 days)",
                      value: "54",
                      icon: <UserCheck size={13} />,
                    },
                    {
                      label: "Active Jobs",
                      value: "2,026",
                      icon: <Building2 size={13} />,
                    },
                    {
                      label: "Completed Jobs",
                      value: "3,245",
                      icon: <BarChart2 size={13} />,
                    },
                  ].map((item, i) => (
                    <div key={i} className={styles.summaryItem}>
                      <div className={styles.summaryLeft}>
                        <span className={styles.summaryIcon}>
                          {item.icon}
                        </span>
                        {item.label}
                      </div>
                      <span className={styles.summaryValue}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
                <button className={styles.detailedReportsBtn}>
                  <BarChart2 size={14} />
                  View Detailed Reports
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;