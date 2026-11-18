import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { buildReport, toCsv, PERIODS, type GroupKey, type PeriodKey } from "@/lib/db/reports";

export async function GET(req: NextRequest) {
  const session = await getSession();
  const t = await getT();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: t("adminOps.reports.forbidden") }, { status: 403 });
  }
  const sp = req.nextUrl.searchParams;
  const period = (sp.get("period") as PeriodKey) in PERIODS ? (sp.get("period") as PeriodKey) : "30d";
  const group: GroupKey = sp.get("group") === "month" ? "month" : "week";
  const kind = sp.get("kind") === "region" ? "region" : "timeline";

  const data = await buildReport(period, group);
  const csv =
    kind === "region"
      ? toCsv(
          [t("adminOps.reports.region"), t("adminOps.reports.requests"), t("adminOps.reports.completed"), t("adminOps.reports.csv.revenueDt"), t("adminOps.reports.csv.platformDt")],
          data.regions.map((r) => [r.region, r.requests, r.completed, r.revenue, r.platform])
        )
      : toCsv(
          [group === "week" ? t("adminOps.reports.csv.weekStart") : t("adminOps.reports.csv.month"), t("adminOps.reports.requests"), t("adminOps.reports.completed"), t("adminOps.reports.csv.cancelled"), t("adminOps.reports.csv.revenueDt"), t("adminOps.reports.csv.platformDt")],
          data.timeline.map((b) => [b.label, b.requests, b.completed, b.cancelled, b.revenue, b.platform])
        );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="fixili-${kind}-${period}-${group}.csv"`,
    },
  });
}
