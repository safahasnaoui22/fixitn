"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Wrench, User as UserIcon, Upload,
  FileCheck, ShieldCheck, ExternalLink, Eye, EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { registerAction } from "./actions";
import type { Category } from "@/lib/types";

// Two documents are sent in ONE request. Hosting platforms (Vercel: 4.5 MB)
// reject bigger bodies, which used to blank the page. Keep each file small.
const MAX_DOC_BYTES = 1.8 * 1024 * 1024;

type DocState = { name: string | null; error: string | null };
const EMPTY_DOC: DocState = { name: null, error: null };

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
}

/** Validates a document and shrinks big photos so the upload stays small. */
async function prepareDocument(file: File): Promise<File> {
  if (file.type === "application/pdf") {
    if (file.size > MAX_DOC_BYTES) {
      throw new Error(
        "Ce PDF dépasse 1,8 Mo. Envoyez plutôt une photo (JPG ou PNG) ou un PDF plus léger."
      );
    }
    return file;
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Format non supporté. Utilisez JPG, PNG ou PDF.");
  }
  if (file.size <= MAX_DOC_BYTES) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Impossible de lire cette image. Essayez un autre fichier.");
  }

  const steps = [
    { max: 1800, quality: 0.8 },
    { max: 1400, quality: 0.7 },
    { max: 1100, quality: 0.6 },
  ];

  for (const { max, quality } of steps) {
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) break;
    ctx.fillStyle = "#ffffff"; // PNG transparency would turn black in a JPEG
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await canvasToBlob(canvas, quality);
    if (blob && blob.size <= MAX_DOC_BYTES) {
      bitmap.close();
      return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
        type: "image/jpeg",
      });
    }
  }

  bitmap.close();
  throw new Error("Image trop lourde. Prenez une photo de moindre qualité et réessayez.");
}

export function RegisterForm({ categories }: { categories: Category[] }) {
  const [role, setRole] = useState<"CLIENT" | "TECHNICIAN">("CLIENT");
  const [cin, setCin] = useState<DocState>(EMPTY_DOC);
  const [diplome, setDiplome] = useState<DocState>(EMPTY_DOC);
  const [agreed, setAgreed] = useState(false);
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set());
  const [showPass, setShowPass] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  function toggleCat(id: string) {
    setSelectedCats(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const termsHref = role === "TECHNICIAN" ? "/terms/technician" : "/terms/client";

  return (
    <form
      action={registerAction}
      encType="multipart/form-data"
      className="flex flex-col gap-5"
    >
      <input type="hidden" name="role" value={role} />
      <input type="hidden" name="agreed" value={agreed ? "true" : "false"} />
      {/* Pass selected category IDs as hidden inputs */}
      {Array.from(selectedCats).map(id => (
        <input key={id} type="hidden" name="categoryIds" value={id} />
      ))}

      {error && (
        <p className="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger">
          {safeDecode(error)}
        </p>
      )}

      {/* Role picker */}
      <div>
        <p className="text-sm font-medium text-ink mb-2">Je suis...</p>
        <div className="grid grid-cols-2 gap-3">
          {(["CLIENT", "TECHNICIAN"] as const).map(r => (
            <button
              key={r}
              type="button"
              onClick={() => { setRole(r); setAgreed(false); }}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 transition-colors ${
                role === r
                  ? "border-brand-orange bg-brand-orange-light"
                  : "border-line bg-surface"
              }`}
            >
              {r === "CLIENT"
                ? <UserIcon size={20} className={role === r ? "text-brand-orange" : "text-muted"} />
                : <Wrench size={20} className={role === r ? "text-brand-orange" : "text-muted"} />
              }
              <span className={`text-sm font-semibold ${role === r ? "text-brand-orange" : "text-ink"}`}>
                {r === "CLIENT" ? "Client" : "Technicien"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Common fields */}
      <Field label="Nom complet" name="fullName" placeholder="Ahmed Ben Salah" required />
      <Field label="Numéro de téléphone" name="phone" type="tel" placeholder="2XXXXXXX" required />

      <div>
        <label htmlFor="password" className="text-sm font-medium text-ink">
          Mot de passe
        </label>
        <div className="relative mt-1.5">
          <input
            id="password"
            name="password"
            type={showPass ? "text" : "password"}
            required
            placeholder="Min. 6 caractères"
            className="w-full rounded-xl border border-line px-4 py-3 pr-11 text-[15px] outline-none focus:border-brand-orange"
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
          >
            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <Field label="Ville" name="city" placeholder="Tunis" />

      {/* Technician-only */}
      {role === "TECHNICIAN" && (
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface-alt p-4">
          <p className="text-sm font-semibold text-ink">Détails technicien</p>

          <Field
            label="Titre professionnel"
            name="title"
            placeholder="Ex: Technicien Climatisation"
            required
          />

          <div>
            <label htmlFor="bio" className="text-sm font-medium text-ink">Bio</label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              placeholder="Présentez-vous aux clients..."
              className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-[15px] outline-none focus:border-brand-orange"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Années d'exp." name="yearsExperience" type="number" placeholder="5" />
            <Field label="Prix départ (DT)" name="startingPrice" type="number" placeholder="30" />
          </div>

          {/* Categories — simple safe list without CategoryIcon */}
          <div>
            <p className="text-sm font-medium text-ink mb-2">
              Services proposés <span className="text-danger">*</span>
            </p>
            {categories.length === 0 ? (
              <p className="text-xs text-muted">Aucune catégorie disponible.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {categories.map(cat => {
                  const selected = selectedCats.has(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCat(cat.id)}
                      className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left transition-colors ${
                        selected
                          ? "border-brand-orange bg-brand-orange-light"
                          : "border-line bg-surface"
                      }`}
                    >
                      <span
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ background: cat.color }}
                      />
                      <span className={`text-xs font-medium leading-tight ${
                        selected ? "text-brand-orange" : "text-ink"
                      }`}>
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {selectedCats.size === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                Sélectionnez au moins un service.
              </p>
            )}
          </div>

          {/* Documents */}
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-sm font-semibold text-ink">
                Documents d&apos;identité <span className="text-danger">*</span>
              </p>
              <p className="text-xs text-muted mt-0.5">
                Requis pour la vérification. Visible uniquement par l&apos;administration.
                Maximum 1,8 Mo par fichier (les grandes photos sont réduites automatiquement).
              </p>
            </div>
            <FileUpload
              name="cin"
              label="CIN ou Passeport"
              doc={cin}
              onChange={setCin}
              required
            />
            <FileUpload
              name="diplome"
              label="Diplôme ou Certificat professionnel"
              doc={diplome}
              onChange={setDiplome}
              required
            />
          </div>
        </div>
      )}

      {/* Terms */}
      <div className="rounded-2xl border border-line bg-surface p-4">
        <div className="flex items-start gap-3 mb-3">
          <ShieldCheck size={18} className="text-brand-orange shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-ink">Conditions d&apos;utilisation</p>
            <p className="text-xs text-muted mt-0.5">
              {role === "TECHNICIAN"
                ? "En créant un compte technicien, vous acceptez les frais de commission, les conditions d'approbation et les règles de la plateforme."
                : "En créant un compte client, vous acceptez de payer les frais de visite et de transport pour chaque prestation."}
            </p>
          </div>
        </div>

        <Link
          href={termsHref}
          target="_blank"
          className="flex items-center gap-1.5 mb-3 text-xs font-medium text-brand-orange"
        >
          <ExternalLink size={12} />
          Lire les conditions complètes
        </Link>

        <label className="flex items-start gap-3 cursor-pointer">
          <div className="relative mt-0.5 shrink-0">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="sr-only"
            />
            <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${
              agreed ? "border-brand-orange bg-brand-orange" : "border-line bg-surface"
            }`}>
              {agreed && (
                <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="2 6 5 9 10 3" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm text-ink leading-relaxed">
            J&apos;ai lu et j&apos;accepte les{" "}
            <Link href={termsHref} target="_blank" className="font-semibold text-brand-orange">
              Conditions d&apos;utilisation
            </Link>
          </span>
        </label>

        {!agreed && (
          <p className="mt-2 text-xs text-amber-600">
            Vous devez accepter les conditions avant de créer un compte.
          </p>
        )}
      </div>

      <Button type="submit" size="lg" fullWidth disabled={!agreed}>
        Créer mon compte
      </Button>

      <p className="text-center text-sm text-muted">
        Déjà inscrit ?{" "}
        <Link href="/login" className="font-semibold text-brand-orange">
          Se connecter
        </Link>
      </p>
    </form>
  );
}

/** decodeURIComponent throws on a malformed % sequence — never let that blank the page. */
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function Field({
  label, name, type = "text", placeholder, required,
}: {
  label: string; name: string; type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium text-ink">{label}</label>
      <input id={name} name={name} type={type} required={required} placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-[15px] outline-none focus:border-brand-orange" />
    </div>
  );
}

function FileUpload({
  name, label, doc, onChange, required,
}: {
  name: string; label: string; doc: DocState;
  onChange: (next: DocState) => void; required?: boolean;
}) {
  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget; // capture before the first await
    const file = input.files?.[0];
    if (!file) {
      onChange(EMPTY_DOC);
      return;
    }

    try {
      const ready = await prepareDocument(file);
      if (ready !== file) {
        // Swap the original photo for the shrunken one inside the real <input>
        const transfer = new DataTransfer();
        transfer.items.add(ready);
        input.files = transfer.files;
      }
      onChange({ name: ready.name, error: null });
    } catch (err) {
      input.value = "";
      onChange({
        name: null,
        error: err instanceof Error ? err.message : "Fichier invalide.",
      });
    }
  }

  return (
    <div>
      <label className="text-sm font-medium text-ink">{label}</label>
      <label className="mt-1.5 flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 hover:border-brand-orange transition-colors">
        <input
          type="file" name={name} required={required}
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="sr-only"
          onChange={handleChange}
        />
        {doc.name
          ? <><FileCheck size={18} className="text-success shrink-0" /><span className="truncate text-sm text-ink">{doc.name}</span></>
          : <><Upload size={18} className="text-muted shrink-0" /><span className="text-sm text-muted">Importer {label} (JPG, PNG, PDF)</span></>
        }
      </label>
      {doc.error && <p className="mt-1 text-xs text-danger">{doc.error}</p>}
    </div>
  );
}