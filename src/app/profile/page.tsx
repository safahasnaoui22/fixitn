import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, User, Phone, MapPin, Edit, ShieldCheck } from "lucide-react";
import { requireUser, destroySession } from "@/lib/auth";
import { findUserById } from "@/lib/db/users";
import { Avatar } from "@/components/ui/Avatar";
import { ClientBottomNav } from "@/components/ClientBottomNav";
import { hasFaceDescriptor } from "@/lib/db/face";

async function logoutAction() {
  "use server";
  await destroySession();
  redirect("/login");
}

export default async function ClientProfilePage() {
  const session = await requireUser();
  if (session.role === "TECHNICIAN") redirect("/t/profile");

  const user = await findUserById(session.userId);
  if (!user) redirect("/login");

  const faceRegistered = await hasFaceDescriptor(session.userId);

  return (
    <>
      <div className="app-content no-scrollbar">
        {/* Header */}
        <div className="bg-brand-navy px-5 pb-8 pt-6 text-white">
          <p className="font-heading text-lg font-bold mb-5">Mon Profil</p>
          <div className="flex items-center gap-4">
            <Avatar src={user.avatarUrl} name={user.fullName} size={64} />
            <div>
              <p className="font-heading text-lg font-semibold">{user.fullName}</p>
              <p className="text-sm text-white/60">Client</p>
              {user.city && (
                <p className="text-xs text-white/50 flex items-center gap-1 mt-0.5">
                  <MapPin size={11} /> {user.city}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">

          {/* Info card */}
          <div className="rounded-2xl border border-line bg-surface divide-y divide-line">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <User size={16} className="text-muted shrink-0" />
              <div>
                <p className="text-[10px] text-muted">Nom complet</p>
                <p className="text-sm font-medium text-ink">{user.fullName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <Phone size={16} className="text-muted shrink-0" />
              <div>
                <p className="text-[10px] text-muted">Téléphone</p>
                <p className="text-sm font-medium text-ink">{user.phone}</p>
              </div>
            </div>
            {user.city && (
              <div className="flex items-center gap-3 px-4 py-3.5">
                <MapPin size={16} className="text-muted shrink-0" />
                <div>
                  <p className="text-[10px] text-muted">Ville</p>
                  <p className="text-sm font-medium text-ink">{user.city}</p>
                </div>
              </div>
            )}
          </div>

          {/* Face ID status */}
          <div className="rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck
                size={16}
                className={faceRegistered ? "text-success" : "text-muted"}
              />
              <p className="text-sm font-semibold text-ink">Sécurité Face ID</p>
            </div>
            {faceRegistered ? (
              <p className="text-xs text-success font-medium">
                ✓ Face ID activé — votre compte est protégé
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-danger">
                  Face ID non configuré — votre compte n'est pas protégé
                </p>
                <Link href="/face-setup">
                  <span className="text-xs font-semibold text-brand-orange">
                    Configurer maintenant →
                  </span>
                </Link>
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="rounded-2xl border border-line bg-surface divide-y divide-line">
            <Link href="/requests"
              className="flex items-center justify-between px-4 py-3.5 hover:bg-surface-alt transition-colors">
              <span className="text-sm font-medium text-ink">Mes réservations</span>
              <span className="text-muted">›</span>
            </Link>
            <Link href="/notifications"
              className="flex items-center justify-between px-4 py-3.5 hover:bg-surface-alt transition-colors">
              <span className="text-sm font-medium text-ink">Notifications</span>
              <span className="text-muted">›</span>
            </Link>
            <Link href="/plans"
              className="flex items-center justify-between px-4 py-3.5 hover:bg-surface-alt transition-colors">
              <span className="text-sm font-medium text-ink">Plans & Tarifs</span>
              <span className="text-muted">›</span>
            </Link>
          </div>

          {/* LOGOUT */}
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-2xl border border-danger-light bg-danger-light px-4 py-3.5 text-sm font-semibold text-danger transition-colors hover:bg-danger hover:text-white"
            >
              <LogOut size={18} />
              Se déconnecter
            </button>
          </form>
        </div>
      </div>
      <ClientBottomNav />
    </>
  );
}