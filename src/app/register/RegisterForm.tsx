"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Wrench, User as UserIcon, Upload,
  FileCheck, ShieldCheck, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CategoryIcon } from "@/components/CategoryIcon";
import { cn } from "@/lib/utils";
import { registerAction } from "./actions";
import type { Category } from "@/lib/types";

export function RegisterForm({ categories }: { categories: Category[] }) {
  const [role, setRole] = useState<"CLIENT" | "TECHNICIAN">("CLIENT");
  const [cinName, setCinName] = useState<string | null>(null);
  const [diplomeName, setDiplomeName] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const termsHref =
    role === "TECHNICIAN" ? "/terms/technician" : "/terms/client";

  const termsLabel =
    role === "TECHNICIAN"
      ? "Technician Terms & Conditions"
      : "Client Terms & Conditions";

  return (
    <form
      action={registerAction}
      encType="multipart/form-data"
      className="flex flex-col gap-5"
    >
      {/* Hidden fields */}
      <input type="hidden" name="role" value={role} />
      <input type="hidden" name="agreed" value={agreed ? "true" : "false"} />

      {error && (
        <p className="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      {/* Role picker */}
      <div>
        <p className="text-sm font-medium text-ink">I am a...</p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {(["CLIENT", "TECHNICIAN"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => { setRole(r); setAgreed(false); }}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 transition-colors",
                role === r
                  ? "border-brand-orange bg-brand-orange-light"
                  : "border-line"
              )}
            >
              {r === "CLIENT" ? (
                <UserIcon
                  size={20}
                  className={role === r ? "text-brand-orange" : "text-muted"}
                />
              ) : (
                <Wrench
                  size={20}
                  className={role === r ? "text-brand-orange" : "text-muted"}
                />
              )}
              <span
                className={cn(
                  "text-sm font-semibold",
                  role === r ? "text-brand-orange" : "text-ink"
                )}
              >
                {r === "CLIENT" ? "Client" : "Technician"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Common fields */}
      <Field
        label="Full name"
        name="fullName"
        placeholder="Sarra Bouazizi"
        required
      />
      <Field
        label="Phone number"
        name="phone"
        type="tel"
        placeholder="2XXXXXXX"
        required
      />
      <Field
        label="Password"
        name="password"
        type="password"
        placeholder="Min 6 characters"
        required
      />
      <Field label="City" name="city" placeholder="Tunis" />

      {/* Technician-only fields */}
      {role === "TECHNICIAN" && (
        <div className="flex flex-col gap-5 rounded-2xl border border-line bg-surface-alt p-4">
          <p className="text-sm font-semibold text-ink">
            Technician details
          </p>

          <Field
            label="Professional title"
            name="title"
            placeholder="e.g. AC Technician"
            required
          />

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
            <Field
              label="Years of experience"
              name="yearsExperience"
              type="number"
              placeholder="5"
            />
            <Field
              label="Starting price (DT)"
              name="startingPrice"
              type="number"
              placeholder="30"
            />
          </div>

          {/* Service categories */}
          <div>
            <p className="text-sm font-medium text-ink">
              Services you offer{" "}
              <span className="text-danger">*</span>
            </p>
            {categories.length === 0 ? (
              <p className="mt-2 text-xs text-muted">
                No categories available. Contact support.
              </p>
            ) : (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <label
                    key={cat.id}
                    className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-line bg-surface p-2 text-center has-[:checked]:border-brand-orange has-[:checked]:bg-brand-orange-light"
                  >
                    <input
                      type="checkbox"
                      name="categoryIds"
                      value={cat.id}
                      className="sr-only"
                    />
                    <CategoryIcon
                      icon={cat.icon}
                      color={cat.color}
                      size={16}
                      badgeSize={32}
                    />
                    <span className="text-[10px] font-medium leading-tight text-ink">
                      {cat.name}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Identity documents */}
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-sm font-semibold text-ink">
                Identity documents{" "}
                <span className="text-danger">*</span>
              </p>
              <p className="text-xs text-muted mt-0.5">
                Required for verification. Visible to admins only.
              </p>
            </div>

            <FileUpload
              name="cin"
              label="CIN or Passport"
              fileName={cinName}
              onFileChange={setCinName}
              required
            />
            <FileUpload
              name="diplome"
              label="Diploma or Professional Certificate"
              fileName={diplomeName}
              onFileChange={setDiplomeName}
              required
            />
          </div>
        </div>
      )}

      {/* Contract / Terms agreement */}
      <div className="rounded-2xl border border-line bg-surface p-4">
        <div className="flex items-start gap-3 mb-3">
          <ShieldCheck size={18} className="text-brand-orange shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-ink">
              Terms & Conditions
            </p>
            <p className="text-xs text-muted mt-0.5">
              {role === "TECHNICIAN"
                ? "By creating a technician account, you agree to operate as an independent contractor, maintain professional standards, and comply with FixiTN commission and approval policies."
                : "By creating a client account, you agree to use the platform respectfully, provide accurate information, and pay for services rendered including visit and transport fees."}
            </p>
          </div>
        </div>

        {/* Link to full terms */}
        <Link
          href={termsHref}
          target="_blank"
          className="flex items-center gap-1.5 mb-3 text-xs font-medium text-brand-orange hover:underline"
        >
          <ExternalLink size={12} />
          Read full {termsLabel}
        </Link>

        {/* Checkbox */}
        <label className="flex items-start gap-3 cursor-pointer">
          <div className="relative mt-0.5">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="sr-only peer"
            />
            <div
              className={cn(
                "h-5 w-5 rounded-md border-2 transition-colors flex items-center justify-center",
                agreed
                  ? "border-brand-orange bg-brand-orange"
                  : "border-line bg-surface"
              )}
            >
              {agreed && (
                <svg
                  viewBox="0 0 12 12"
                  className="h-3 w-3 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="2 6 5 9 10 3" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm text-ink leading-relaxed">
            I have read and agree to the{" "}
            <Link
              href={termsHref}
              target="_blank"
              className="font-semibold text-brand-orange hover:underline"
            >
              {termsLabel}
            </Link>
            {role === "TECHNICIAN" && (
              <span className="text-muted">
                {" "}including the commission, transport fee, and account
                approval policies.
              </span>
            )}
          </span>
        </label>

        {/* Not agreed warning */}
        {!agreed && (
          <p className="mt-2 text-xs text-amber-600">
            You must agree to the terms before creating an account.
          </p>
        )}
      </div>

      <Button
        type="submit"
        size="lg"
        fullWidth
        disabled={!agreed}
        className="mt-2"
      >
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

// ── Helpers ────────────────────────────────────────────────────────────

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

function FileUpload({
  name,
  label,
  fileName,
  onFileChange,
  required,
}: {
  name: string;
  label: string;
  fileName: string | null;
  onFileChange: (name: string | null) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-ink">{label}</label>
      <label className="mt-1.5 flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 hover:border-brand-orange transition-colors">
        <input
          type="file"
          name={name}
          required={required}
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="sr-only"
          onChange={(e) => onFileChange(e.target.files?.[0]?.name ?? null)}
        />
        {fileName ? (
          <>
            <FileCheck size={18} className="text-success shrink-0" />
            <span className="truncate text-sm text-ink">{fileName}</span>
          </>
        ) : (
          <>
            <Upload size={18} className="text-muted shrink-0" />
            <span className="text-sm text-muted">
              Upload {label} (JPG, PNG, PDF)
            </span>
          </>
        )}
      </label>
    </div>
  );
}