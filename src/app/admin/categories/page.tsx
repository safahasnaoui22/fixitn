import Link from "next/link";
import {
  ChevronUp, ChevronDown, Trash2,
  Edit, Plus, Layers, Eye, EyeOff,
} from "lucide-react";
import { prisma } from "@/lib/db/client";
import { Button } from "@/components/ui/Button";
import { CategoryIcon } from "@/components/CategoryIcon";
import { formatDT } from "@/lib/utils";
import {
  createCategoryAction,
  updateCategoryAction,
  toggleCategoryActiveAction,
  updateVisitPriceAction,
  reorderCategoryAction,
  deleteCategoryAction,
} from "./actions";

const ICONS = [
  "Zap", "Droplets", "AirVent", "WashingMachine", "Refrigerator",
  "Tv", "Hammer", "KeyRound", "PaintRoller", "Sparkles",
  "SatelliteDish", "Sun", "Wrench", "Drill", "Flame", "Wind",
  "Snowflake", "Lightbulb", "Pipe", "Shield",
];

const COLORS = [
  "#F59E0B", "#0EA5E9", "#14B8A6", "#8B5CF6", "#3B82F6",
  "#F43F5E", "#92400E", "#475569", "#16A34A", "#06B6D4",
  "#6366F1", "#EAB308", "#F1591E", "#EC4899", "#10B981",
];

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; error?: string }>;
}) {
  const { edit, error } = await searchParams;

  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { technicians: true, requests: true } },
    },
    orderBy: { sortOrder: "asc" },
  });

  const editing = edit ? categories.find((c) => c.id === edit) : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">
          Categories
        </h1>
        <p className="text-sm text-muted mt-0.5">
          {categories.length} categories ·{" "}
          {categories.filter((c) => c.isActive).length} active
        </p>
      </div>

      {error && (
        <p className="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger">
          {decodeURIComponent(error)}
        </p>
      )}

      {/* Category table */}
      <div className="rounded-2xl border border-line bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt border-b border-line">
            <tr>
              {["Order", "Category", "Status", "Visit Price", "Techs", "Jobs", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {categories.map((cat, i) => (
              <tr
                key={cat.id}
                className={`transition-colors hover:bg-surface-alt ${
                  !cat.isActive ? "opacity-60" : ""
                }`}
              >
                <td className="px-4 py-3 text-muted text-xs">
                  {cat.sortOrder}
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CategoryIcon
                      icon={cat.icon}
                      color={cat.isActive ? cat.color : "#9ca3af"}
                      size={14}
                      badgeSize={30}
                    />
                    <div>
                      <p className="font-medium text-ink">{cat.name}</p>
                      <p className="text-[10px] text-muted font-mono">
                        {cat.slug}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <form action={toggleCategoryActiveAction.bind(null, cat.id, !cat.isActive)}>
                    <button
                      type="submit"
                      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                        cat.isActive
                          ? "bg-success-light text-success hover:bg-success hover:text-white"
                          : "bg-surface-alt text-muted hover:bg-success-light hover:text-success"
                      }`}
                    >
                      {cat.isActive ? (
                        <><Eye size={10} />Active</>
                      ) : (
                        <><EyeOff size={10} />Inactive</>
                      )}
                    </button>
                  </form>
                </td>

                <td className="px-4 py-3">
                  <form
                    action={updateVisitPriceAction.bind(null, cat.id)}
                    className="flex items-center gap-1"
                  >
                    <input
                      name="visitPrice"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={cat.visitPrice}
                      className="w-16 rounded-lg border border-line px-2 py-1 text-xs outline-none focus:border-brand-orange"
                    />
                    <span className="text-xs text-muted">DT</span>
                    <button
                      type="submit"
                      className="rounded-lg bg-surface-alt px-2 py-1 text-[10px] font-semibold text-muted hover:text-ink transition-colors"
                    >
                      Save
                    </button>
                  </form>
                </td>

                <td className="px-4 py-3 text-muted">
                  {cat._count.technicians}
                </td>
                <td className="px-4 py-3 text-muted">
                  {cat._count.requests}
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <form action={reorderCategoryAction.bind(null, cat.id, "up")}>
                      <button
                        type="submit"
                        disabled={i === 0}
                        className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-surface-alt disabled:opacity-30 transition-colors"
                      >
                        <ChevronUp size={14} />
                      </button>
                    </form>
                    <form action={reorderCategoryAction.bind(null, cat.id, "down")}>
                      <button
                        type="submit"
                        disabled={i === categories.length - 1}
                        className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-surface-alt disabled:opacity-30 transition-colors"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </form>
                    <Link
                      href={`/admin/categories?edit=${cat.id}`}
                      className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-surface-alt text-brand-orange transition-colors"
                    >
                      <Edit size={14} />
                    </Link>
                    <form action={deleteCategoryAction.bind(null, cat.id)}>
                      <button
                        type="submit"
                        className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-danger-light text-danger transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {categories.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Layers size={28} className="text-muted" />
            <p className="text-sm text-muted">No categories yet</p>
          </div>
        )}
      </div>

      {/* Add / Edit form */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <p className="font-heading text-base font-semibold text-ink mb-4">
          {editing ? (
            `Edit: ${editing.name}`
          ) : (
            <span className="flex items-center gap-2">
              <Plus size={16} />
              Add Category
            </span>
          )}
        </p>

        <form
          action={editing ? updateCategoryAction : createCategoryAction}
          className="flex flex-col gap-4"
        >
          {editing && <input type="hidden" name="id" value={editing.id} />}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-ink">Name</label>
              <input
                name="name"
                required
                defaultValue={editing?.name ?? ""}
                placeholder="e.g. Pool Cleaning"
                className="mt-1.5 w-full rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-ink">
                Icon (Lucide name)
              </label>
              <select
                name="icon"
                required
                defaultValue={editing?.icon ?? "Wrench"}
                className="mt-1.5 w-full rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-brand-orange bg-surface"
              >
                {ICONS.map((ico) => (
                  <option key={ico} value={ico}>
                    {ico}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-ink">Color</label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <label key={c} className="relative cursor-pointer">
                    <input
                      type="radio"
                      name="color"
                      value={c}
                      defaultChecked={
                        editing ? editing.color === c : c === "#F59E0B"
                      }
                      className="sr-only peer"
                    />
                    <div
                      className="h-7 w-7 rounded-full border-2 border-transparent peer-checked:border-ink transition-all"
                      style={{ backgroundColor: c }}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-ink">
                Visit price (DT)
              </label>
              <input
                name="visitPrice"
                type="number"
                min="0"
                step="1"
                defaultValue={editing?.visitPrice ?? 0}
                className="mt-1.5 w-full rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-brand-orange"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-ink">
              Description
            </label>
            <input
              name="description"
              defaultValue={editing?.description ?? ""}
              placeholder="Short description for clients"
              className="mt-1.5 w-full rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-brand-orange"
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" size="sm">
              {editing ? "Save Changes" : "Add Category"}
            </Button>
            {editing && (
              <Link href="/admin/categories">
                <Button type="button" variant="outline" size="sm">
                  Cancel
                </Button>
              </Link>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}