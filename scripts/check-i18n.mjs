// node scripts/check-i18n.mjs  → every key must exist in fr, en AND ar; placeholders must match.
import fs from "node:fs";
import path from "node:path";
const dir = path.join(process.cwd(), "src/lib/i18n/messages");
const base = Object.fromEntries(["fr", "en", "ar"].map((l) => [l, JSON.parse(fs.readFileSync(path.join(dir, `${l}.json`), "utf8"))]));
const areas = fs.readdirSync(path.join(dir, "areas")).filter((f) => f.endsWith(".json"));
const all = { fr: { ...base.fr }, en: { ...base.en }, ar: { ...base.ar } };
let bad = 0;
const seen = {};
for (const f of areas) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, "areas", f), "utf8"));
  for (const l of ["fr", "en", "ar"]) {
    for (const [k, v] of Object.entries(j[l] ?? {})) {
      if (seen[l + k] && seen[l + k] !== f) { console.log(`DUPLICATE ${k} in ${seen[l + k]} and ${f}`); bad++; }
      seen[l + k] = f;
      all[l][k] = v;
    }
  }
}
const keys = new Set([...Object.keys(all.fr), ...Object.keys(all.en), ...Object.keys(all.ar)]);
const ph = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
for (const k of keys) {
  for (const l of ["fr", "en", "ar"]) {
    if (!all[l][k] && all[l][k] !== "") { console.log(`MISSING ${l}: ${k}`); bad++; }
  }
  if (all.fr[k] && all.en[k] && all.ar[k] && !(ph(all.fr[k]) === ph(all.en[k]) && ph(all.fr[k]) === ph(all.ar[k]))) {
    console.log(`PLACEHOLDER MISMATCH: ${k}`); bad++;
  }
}
console.log(`${keys.size} keys, ${bad} problem(s)`);
// Optional: --used  → keys referenced in code via t("...") that don't exist anywhere
if (process.argv.includes("--used")) {
  const used = new Set();
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== "generated" && e.name !== "node_modules") walk(p); }
    else if (/\.(ts|tsx)$/.test(e.name)) { const s = fs.readFileSync(p, "utf8");
      for (const m of s.matchAll(/\bt\(\s*["'`]([a-zA-Z0-9_.\-]+)["'`]/g)) used.add(m[1] + "  @ " + p); } } };
  walk("src");
  for (const u of used) { const [k, where] = u.split("  @ "); if (!(k in all.fr) && !k.endsWith(".")) { console.log(`UNDEFINED KEY ${k}  (${where})`); bad++; } }
  console.log(`after --used: ${bad} problem(s)`);
}
process.exit(bad ? 1 : 0);
