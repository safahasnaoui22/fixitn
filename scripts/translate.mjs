// Usage:  npm run translate            → fills ONLY the keys missing in en.json / ar.json
//         npm run translate -- --force → re-translates everything
// You only write src/lib/i18n/messages/fr.json. This script asks Google Cloud
// Translation to produce en.json and ar.json. Key goes in .env (never in chat/git):
//   GOOGLE_TRANSLATE_API_KEY=xxxxx
import fs from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), "src/lib/i18n/messages");
const key = process.env.GOOGLE_TRANSLATE_API_KEY;
if (!key) {
  console.error("GOOGLE_TRANSLATE_API_KEY is missing in .env");
  process.exit(1);
}
const force = process.argv.includes("--force");
const read = (f) => (fs.existsSync(path.join(dir, f)) ? JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) : {});
const fr = read("fr.json");

// {name} placeholders must survive translation → wrap them so Google leaves them alone
const protect = (s) => s.replace(/\{(\w+)\}/g, '<span translate="no">{$1}</span>');
const restore = (s) => s.replace(/<span translate="no">(\{\w+\})<\/span>/g, "$1");
const decode = (s) =>
  s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

for (const target of ["en", "ar"]) {
  const out = read(`${target}.json`);
  const todo = Object.keys(fr).filter((k) => force || !out[k]);
  for (let i = 0; i < todo.length; i += 100) {
    const batch = todo.slice(i, i + 100);
    const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: batch.map((k) => protect(fr[k])), source: "fr", target, format: "html" }),
    });
    if (!res.ok) {
      console.error(target, "error", res.status, await res.text());
      process.exit(1);
    }
    const json = await res.json();
    json.data.translations.forEach((tr, j) => {
      out[batch[j]] = decode(restore(tr.translatedText));
    });
  }
  // drop keys that no longer exist in fr.json
  for (const k of Object.keys(out)) if (!(k in fr)) delete out[k];
  fs.writeFileSync(path.join(dir, `${target}.json`), JSON.stringify(out, null, 2) + "\n");
  console.log(`${target}.json: ${todo.length} translated`);
}
