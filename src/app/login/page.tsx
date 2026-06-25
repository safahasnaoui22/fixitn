import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, createSession, verifyPassword } from "@/lib/auth";
import { findUserByPhone } from "@/lib/db/users";
import { Button } from "@/components/ui/Button";

async function loginAction(formData: FormData): Promise<void> {
  "use server";
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!phone || !password) {
    redirect(`/login?error=${encodeURIComponent("Enter your phone and password.")}`);
  }

  const user = await findUserByPhone(phone);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    redirect(`/login?error=${encodeURIComponent("Incorrect phone or password.")}`);
  }

  await createSession({ userId: user.id, role: user.role, fullName: user.fullName });
  redirect(user.role === "TECHNICIAN" ? "/t/dashboard" : "/");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session) redirect(session.role === "TECHNICIAN" ? "/t/dashboard" : "/");
  const { error } = await searchParams;

  return (
    <div className="app-content px-6 py-8">
      <Link href="/onboarding" className="text-sm text-muted">
        &larr; Back
      </Link>
      <h1 className="font-heading mt-6 text-2xl font-bold text-ink">Welcome back</h1>
      <p className="mt-1 text-sm text-muted">Log in to continue to FixiTN</p>

      <form action={loginAction} className="mt-8 flex flex-col gap-4">
        {error && <p className="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger">{error}</p>}
        <div>
          <label htmlFor="phone" className="text-sm font-medium text-ink">
            Phone number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            placeholder="2XXXXXXX"
            className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-[15px] outline-none focus:border-brand-orange"
          />
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-medium text-ink">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
            className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-[15px] outline-none focus:border-brand-orange"
          />
        </div>
        <Button type="submit" size="lg" fullWidth className="mt-2">
          Log In
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-brand-orange">
          Sign up
        </Link>
      </p>
    </div>
  );
}