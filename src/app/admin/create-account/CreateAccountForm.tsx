"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CategoryIcon } from "@/components/CategoryIcon";
import { cn } from "@/lib/utils";
import { adminCreateAccountAction } from "./actions";
import type { Category, Plan } from "@/lib/types";
import { useT } from "@/lib/i18n/I18nProvider";

const ROLES = [
  { value: "CLIENT" },
  { value: "TECHNICIAN" },
  { value: "SOUS_ADMIN" },
  { value: "ADMIN" },
];

export function CreateAccountForm({
  categories,
  plans,
}: {
  categories: Category[];
  plans: Plan[];
}) {
  const t = useT();
  const [role, setRole] = useState("CLIENT");

  return (
    <form
      action={adminCreateAccountAction}
      encType="multipart/form-data"
      className="flex flex-col gap-4"
    >
      {/* Role selector */}
      <div>
        <label className="text-sm font-medium text-ink">{t("admin.createAccount.role")}</label>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          {ROLES.map((r) => (
            <label
              key={r.value}
              className={cn(
                "relative flex cursor-pointer items-center gap-2 rounded-xl border-2 px-3 py-2.5 transition-colors",
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
                className="pointer-events-none absolute h-0 w-0 opacity-0"
              />
              <span
                className={cn(
                  "text-sm font-semibold",
                  role === r.value ? "text-brand-orange" : "text-ink"
                )}
              >
                {t(`role.${r.value}`)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Common fields */}
      <Field label={t("common.fullName")} name="fullName" placeholder={t("admin.createAccount.fullNamePlaceholder")} required />
      <Field label={t("admin.createAccount.phoneNumber")} name="phone" type="tel" placeholder="2XXXXXXX" required ltr />
      <Field
        label={t("admin.createAccount.password")}
        name="password"
        type="password"
        placeholder={t("admin.createAccount.passwordPlaceholder")}
        required
        ltr
      />
      <Field label={t("common.city")} name="city" placeholder={t("admin.createAccount.cityPlaceholder")} />

      {/* Plan selector (all roles except CLIENT) */}
      {role !== "CLIENT" && (
        <div>
          <label className="text-sm font-medium text-ink">{t("admin.createAccount.plan")}</label>
          <select
            name="planId"
            className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-brand-orange bg-surface"
          >
            <option value="">{t("admin.createAccount.planDefault")}</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {t("admin.createAccount.planOption", { name: p.name, pct: Math.round(p.commissionRate * 100) })}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Technician-only fields */}
      {role === "TECHNICIAN" && (
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface-alt p-4">
          <p className="text-sm font-semibold text-ink">{t("admin.createAccount.techDetails")}</p>

          <Field
            label={t("admin.createAccount.proTitle")}
            name="title"
            placeholder={t("admin.createAccount.proTitlePlaceholder")}
          />

          <div className="grid grid-cols-2 gap-3">
            <Field
              label={t("admin.createAccount.years")}
              name="yearsExperience"
              type="number"
              placeholder="5"
            />
            <Field
              label={t("admin.createAccount.startingPrice")}
              name="startingPrice"
              type="number"
              placeholder="30"
            />
          </div>

          {/* Categories */}
          <div>
            <p className="text-sm font-medium text-ink mb-2">
              {t("admin.createAccount.serviceCategories")}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <label
                  key={cat.id}
                  className="relative flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-line bg-surface p-2 text-center has-[:checked]:border-brand-orange has-[:checked]:bg-brand-orange-light"
                >
                  <input
                    type="checkbox"
                    name="categoryIds"
                    value={cat.id}
                    className="pointer-events-none absolute h-0 w-0 opacity-0"
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
              {t("admin.createAccount.documents")}
            </p>
            <div>
              <label className="text-xs text-muted">{t("admin.createAccount.cin")}</label>
              <input
                type="file"
                name="cin"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="mt-1 w-full rounded-xl border border-line px-4 py-2.5 text-sm file:me-3 file:rounded-lg file:border-0 file:bg-brand-orange-light file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-orange-dark outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted">{t("admin.createAccount.diploma")}</label>
              <input
                type="file"
                name="diplome"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="mt-1 w-full rounded-xl border border-line px-4 py-2.5 text-sm file:me-3 file:rounded-lg file:border-0 file:bg-brand-orange-light file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-orange-dark outline-none"
              />
            </div>
            <p className="text-xs text-muted">
              {t("admin.createAccount.docsLater")}
            </p>
          </div>
        </div>
      )}

      <Button type="submit" fullWidth size="lg" className="mt-2">
        <span>{t("admin.createAccount.submit")}</span>
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
  ltr,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  ltr?: boolean;
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
        dir={ltr ? "ltr" : undefined}
        className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-[15px] text-start outline-none focus:border-brand-orange"
      />
    </div>
  );
}