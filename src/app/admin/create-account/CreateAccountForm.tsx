"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CategoryIcon } from "@/components/CategoryIcon";
import { cn } from "@/lib/utils";
import { adminCreateAccountAction } from "./actions";
import type { Category, Plan } from "@/lib/types";

const ROLES = [
  { value: "CLIENT", label: "Client" },
  { value: "TECHNICIAN", label: "Technician" },
  { value: "SOUS_ADMIN", label: "Sous-Admin" },
  { value: "ADMIN", label: "Admin" },
];

export function CreateAccountForm({
  categories,
  plans,
}: {
  categories: Category[];
  plans: Plan[];
}) {
  const [role, setRole] = useState("CLIENT");

  return (
    <form
      action={adminCreateAccountAction}
      encType="multipart/form-data"
      className="flex flex-col gap-4"
    >
      {/* Role selector */}
      <div>
        <label className="text-sm font-medium text-ink">Role</label>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          {ROLES.map((r) => (
            <label
              key={r.value}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-xl border-2 px-3 py-2.5 transition-colors",
                role === r.value
                  ? "border-brand-orange bg-brand-orange-light"
                  : "border-line"
              )}
            >
              <input
                type="radio"
                name="role"
                value={r.value}
                checked={role === r.value}
                onChange={() => setRole(r.value)}
                className="sr-only"
              />
              <span
                className={cn(
                  "text-sm font-semibold",
                  role === r.value ? "text-brand-orange" : "text-ink"
                )}
              >
                {r.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Common fields */}
      <Field label="Full name" name="fullName" placeholder="Ahmed Ben Salah" required />
      <Field label="Phone number" name="phone" type="tel" placeholder="2XXXXXXX" required />
      <Field
        label="Password"
        name="password"
        type="password"
        placeholder="Min 6 characters"
        required
      />
      <Field label="City" name="city" placeholder="Tunis" />

      {/* Plan selector (all roles except CLIENT) */}
      {role !== "CLIENT" && (
        <div>
          <label className="text-sm font-medium text-ink">Plan</label>
          <select
            name="planId"
            className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-brand-orange bg-surface"
          >
            <option value="">— Default (Beginner) —</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({Math.round(p.commissionRate * 100)}% commission)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Technician-only fields */}
      {role === "TECHNICIAN" && (
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface-alt p-4">
          <p className="text-sm font-semibold text-ink">Technician details</p>

          <Field
            label="Professional title"
            name="title"
            placeholder="e.g. AC Technician"
          />

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

          {/* Categories */}
          <div>
            <p className="text-sm font-medium text-ink mb-2">
              Service categories
            </p>
            <div className="grid grid-cols-3 gap-2">
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
          </div>

          {/* Optional documents */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-ink">
              Documents (optional)
            </p>
            <div>
              <label className="text-xs text-muted">CIN / Passport</label>
              <input
                type="file"
                name="cin"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="mt-1 w-full rounded-xl border border-line px-4 py-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-orange-light file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-orange-dark outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted">Diploma / Certificate</label>
              <input
                type="file"
                name="diplome"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="mt-1 w-full rounded-xl border border-line px-4 py-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-orange-light file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-orange-dark outline-none"
              />
            </div>
            <p className="text-xs text-muted">
              Documents can be uploaded later by the technician from their
              profile.
            </p>
          </div>
        </div>
      )}

      <Button type="submit" fullWidth size="lg" className="mt-2">
        <span>Create Account</span>
      </Button>
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