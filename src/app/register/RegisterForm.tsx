"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Wrench, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CategoryIcon } from "@/components/CategoryIcon";
import { cn } from "@/lib/utils";
import { registerAction } from "./actions";
import type { Category } from "@/lib/types";

export function RegisterForm({ categories }: { categories: Category[] }) {
  const [role, setRole] = useState<"CLIENT" | "TECHNICIAN">("CLIENT");
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <form action={registerAction} className="flex flex-col gap-5">
      <input type="hidden" name="role" value={role} />

      {error && <p className="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger">{error}</p>}

      <div>
        <p className="text-sm font-medium text-ink">I am a...</p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole("CLIENT")}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 transition-colors",
              role === "CLIENT" ? "border-brand-orange bg-brand-orange-light" : "border-line"
            )}
          >
            <UserIcon size={20} className={role === "CLIENT" ? "text-brand-orange" : "text-muted"} />
            <span className={cn("text-sm font-semibold", role === "CLIENT" ? "text-brand-orange" : "text-ink")}>
              Client
            </span>
          </button>
          <button
            type="button"
            onClick={() => setRole("TECHNICIAN")}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 transition-colors",
              role === "TECHNICIAN" ? "border-brand-orange bg-brand-orange-light" : "border-line"
            )}
          >
            <Wrench size={20} className={role === "TECHNICIAN" ? "text-brand-orange" : "text-muted"} />
            <span className={cn("text-sm font-semibold", role === "TECHNICIAN" ? "text-brand-orange" : "text-ink")}>
              Technician
            </span>
          </button>
        </div>
      </div>

      <Field label="Full name" name="fullName" placeholder="Sarra Bouazizi" required />
      <Field label="Phone number" name="phone" type="tel" placeholder="2XXXXXXX" required />
      <Field label="Password" name="password" type="password" placeholder="••••••••" required />
      <Field label="City" name="city" placeholder="Tunis" />

      {role === "TECHNICIAN" && (
        <div className="flex flex-col gap-5 rounded-2xl border border-line bg-surface-alt p-4">
          <p className="text-sm font-semibold text-ink">Technician details</p>
          <Field label="Title" name="title" placeholder="e.g. AC Technician" required />

          <div>
            <label htmlFor="bio" className="text-sm font-medium text-ink">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              placeholder="A short intro for clients..."
              className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-[15px] outline-none focus:border-brand-orange"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Years of experience" name="yearsExperience" type="number" placeholder="5" />
            <Field label="Starting price (DT)" name="startingPrice" type="number" placeholder="30" />
          </div>

          <div>
            <p className="text-sm font-medium text-ink">Services you offer</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <label
                  key={cat.id}
                  className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-line bg-surface p-2 text-center has-[:checked]:border-brand-orange has-[:checked]:bg-brand-orange-light"
                >
                  <input type="checkbox" name="categoryIds" value={cat.id} className="sr-only" />
                  <CategoryIcon icon={cat.icon} color={cat.color} size={16} badgeSize={32} />
                  <span className="text-[10px] font-medium leading-tight text-ink">{cat.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      <Button type="submit" size="lg" fullWidth className="mt-2">
        Create Account
      </Button>

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-orange">
          Log in
        </Link>
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-[15px] outline-none focus:border-brand-orange"
      />
    </div>
  );
}