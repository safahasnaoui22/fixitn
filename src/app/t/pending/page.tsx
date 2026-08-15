import Link from "next/link";
import { Clock, LogOut, MessageCircle } from "lucide-react";
import { getSession, destroySession } from "@/lib/auth";
import { redirect } from "next/navigation";

async function logoutAction() {
  "use server";
  await destroySession();
  redirect("/login");
}

export default async function TechPendingPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="app-content flex flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center gap-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
          <Clock size={40} className="text-amber-500" />
        </div>

        <div>
          <h1 className="font-heading text-2xl font-bold text-ink">
            Account Pending Approval
          </h1>
          <p className="mt-2 text-[15px] text-muted leading-relaxed max-w-xs">
            Welcome, {session.fullName}! Your technician account is currently
            under review. Our team will verify your documents and approve your
            account within 24–48 hours.
          </p>
        </div>

        <div className="w-full rounded-2xl border border-line bg-surface p-4 text-left flex flex-col gap-3">
          <p className="text-sm font-semibold text-ink">What happens next?</p>
          {[
            "Our admin team reviews your CIN and diploma documents",
            "You receive a notification once your account is approved",
            "You can then start receiving job requests from clients",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-orange-light text-[11px] font-bold text-brand-orange mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-muted">{step}</p>
            </div>
          ))}
        </div>

        
         <a href="mailto:support@fixitn.tn?subject=Account Approval Inquiry"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-surface py-4 text-sm font-semibold text-ink"
        >
          <MessageCircle size={18} className="text-muted" />
          Contact Support
        </a>

        <form action={logoutAction} className="w-full">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-danger-light bg-danger-light py-4 text-sm font-semibold text-danger"
          >
            <LogOut size={18} />
            Log Out
          </button>
        </form>
      </div>
    </div>
  );
}