import Link from "next/link";
import { ShieldCheck, UserPlus } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { PERMISSIONS } from "@/lib/permissions";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { getT } from "@/lib/i18n/server";
import { updatePermissionsAction } from "./actions";

export default async function TeamAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireRole("ADMIN");
  const t = await getT();
  const { saved } = await searchParams;

  const team = await prisma.user.findMany({
    where: { role: "SOUS_ADMIN" },
    orderBy: { createdAt: "asc" },
    select: { id: true, fullName: true, phone: true, avatarUrl: true, permissions: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink">{t("adminOps.team.title")}</h1>
          <p className="mt-0.5 text-sm text-muted">
            {t("adminOps.team.subtitle")}
          </p>
        </div>
        <Link href="/admin/create-account">
          <Button size="sm">
            <UserPlus size={14} /> {t("adminOps.team.newSous")}
          </Button>
        </Link>
      </div>

      {saved && (
        <p className="rounded-xl bg-success-light px-4 py-3 text-sm font-medium text-success">
          {t("adminOps.team.saved")}
        </p>
      )}

      <p className="rounded-xl border border-line bg-surface px-4 py-3 text-xs text-muted">
        <ShieldCheck size={13} className="me-1 inline text-brand-orange" />
        {t("adminOps.team.adminOnly")}
      </p>

      {team.length === 0 && (
        <p className="text-sm text-muted">
          {t("adminOps.team.empty")}
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {team.map((member) => (
          <form
            key={member.id}
            action={updatePermissionsAction.bind(null, member.id)}
            className="rounded-2xl border border-line bg-surface p-4"
          >
            <div className="flex items-center gap-3">
              <Avatar src={member.avatarUrl} name={member.fullName} size={44} />
              <div className="min-w-0">
                <p className="truncate font-heading text-sm font-semibold text-ink">
                  {member.fullName}
                </p>
                <p dir="ltr" className="text-xs text-muted text-start">{member.phone}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {PERMISSIONS.map((p) => (
                <label
                  key={p.key}
                  className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-line px-3 py-2.5 has-[:checked]:border-brand-orange has-[:checked]:bg-brand-orange-light"
                >
                  <input
                    type="checkbox"
                    name="permissions"
                    value={p.key}
                    defaultChecked={member.permissions.includes(p.key)}
                    className="mt-0.5 h-4 w-4 accent-[#f1591e]"
                  />
                  <span>
                    <span className="block text-sm font-medium text-ink">{t(`adminOps.team.perm.${p.key}.label`)}</span>
                    <span className="block text-[11px] text-muted">{t(`adminOps.team.perm.${p.key}.hint`)}</span>
                  </span>
                </label>
              ))}
            </div>

            <Button type="submit" size="sm" className="mt-4">
              {t("adminOps.team.save")}
            </Button>
          </form>
        ))}
      </div>
    </div>
  );
}
