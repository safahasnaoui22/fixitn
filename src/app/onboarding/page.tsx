import Link from "next/link";
import { redirect } from "next/navigation";
import { Wrench, ShieldCheck, Clock, Star } from "lucide-react";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

export default async function OnboardingPage() {
  const session = await getSession();
  if (session) redirect(session.role === "TECHNICIAN" ? "/t/dashboard" : "/");

  return (
    <div className="app-content">
      <div className="flex min-h-full flex-col">
        <div className="flex flex-1 flex-col justify-center bg-brand-navy px-8 py-12 text-white">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-orange">
            <Wrench size={32} />
          </div>
          <h1 className="font-heading mt-6 text-3xl font-bold leading-tight">
            Find a trusted technician, fast.
          </h1>
          <p className="mt-3 text-white/70">
            Book verified electricians, plumbers, AC techs and more — anywhere in Tunisia.
          </p>

          <div className="mt-10 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} className="text-brand-orange" />
              <span className="text-sm text-white/80">Verified, rated technicians</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-brand-orange" />
              <span className="text-sm text-white/80">Track your job in real time</span>
            </div>
            <div className="flex items-center gap-3">
              <Star size={20} className="text-brand-orange" />
              <span className="text-sm text-white/80">Rate and review after every job</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 px-6 py-6">
          <Link href="/register">
            <Button fullWidth size="lg">
              Get Started
            </Button>
          </Link>
          <Link href="/login">
            <Button fullWidth size="lg" variant="outline">
              I already have an account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}