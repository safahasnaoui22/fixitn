// node scripts/find-hardcoded.mjs <file-or-dir> [...]   → lists user-facing text that is NOT going through t()
// Heuristic worklist (some false positives: ignore code identifiers / class names / enum values).
import fs from "node:fs";
import path from "node:path";

const LETTER = /[A-Za-zÀ-ɏ؀-ۿ]/;
const roots = process.argv.slice(2);
const files = [];
const walk = (p) => {
  const st = fs.statSync(p);
  if (st.isDirectory()) {
    for (const e of fs.readdirSync(p)) {
      if (["node_modules", "generated", ".next", "i18n"].includes(e)) continue;
      walk(path.join(p, e));
    }
  } else if (/\.(tsx|ts)$/.test(p)) files.push(p);
};
roots.forEach(walk);

let total = 0;
for (const f of files) {
  const src = fs.readFileSync(f, "utf8");
  // blank out comments but keep line numbers
  const noComments = src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:"'`\\])\/\/[^\n]*/g, (m, a) => a + " ".repeat(m.length - a.length));
  const lines = noComments.split("\n");
  const hits = [];
  lines.forEach((line, i) => {
    const L = line.trim();
    if (!L) return;
    if (/^(import|export \* from|export \{.*\} from)\b/.test(L)) return;
    if (/console\.(log|error|warn|info)/.test(L)) return;
    if (/^["']use (client|server)["']/.test(L)) return;
    // 1. attributes with literal text
    for (const m of line.matchAll(/\b(placeholder|title|alt|aria-label|aria-description|label|description|helperText|content|subtitle|heading|emptyText|tooltip)=("([^"{}]*)"|'([^']*)')/g)) {
      const v = m[3] ?? m[4];
      if (v && LETTER.test(v) && !/^[a-z0-9_\-:/.#]+$/.test(v)) hits.push([i + 1, `attr ${m[1]}="${v}"`]);
      else if (v && /\s/.test(v) && LETTER.test(v)) hits.push([i + 1, `attr ${m[1]}="${v}"`]);
    }
    // 2. JSX text on the same line:  >Some text<
    for (const m of line.matchAll(/>([^<>{}=;]*[A-Za-zÀ-ɏ؀-ۿ][^<>{}=;]*)</g)) {
      const v = m[1].trim();
      if (v && !/^[A-Z_]+$/.test(v) && !/^&\w+;$/.test(v)) hits.push([i + 1, `jsx "${v}"`]);
    }
    // 3. JSX text alone on a line (multi-line JSX)
    if (!/[<>{}=;()\[\]]/.test(L) && !/(,|&&|\|\||:|\?)$/.test(L) && !/^[\w$.]+\??:\s/.test(L) && !/^[\w$.]+\s*(\?\?|\+|-)/.test(L) && LETTER.test(L) && /^[^/*`'"$]/.test(L) && !/^(return|const|let|var|if|else|case|default|break|import|export|type|interface|function|async|await)\b/.test(L) && !/^[a-zA-Z_$][\w$]*[,:]?$/.test(L)) {
      if (/\s/.test(L) || /[À-ɏ؀-ۿ!?.…]/.test(L)) hits.push([i + 1, `jsx-line "${L}"`]);
    }
    // 4. string literals that look like sentences/labels (contain a space + letters, or capitalised word) in code
    for (const m of line.matchAll(/(["'`])((?:(?!\1)[^\\\n]|\\.)*?)\1/g)) {
      const v = m[2];
      if (!LETTER.test(v)) continue;
      if (/\bclassName\b|\bclass=/.test(line.slice(0, m.index + 1)) && !/\s[A-Z][a-z]+\s/.test(v)) continue;
      if (/(rgba?\(|hsla?\(|gradient|solid|clamp\(|\bpx\b|\d(px|rem|em|vh|vw|%)\b|#[0-9a-fA-F]{3,8}|cubic-bezier|ease)/.test(v)) continue;
      if (/^(use |@\/|\.\/|\.\.\/|https?:|\/|#|[a-z0-9_\-:.\/]+$)/.test(v)) continue; // paths, ids, css-ish
      if (/(^|\s)(flex|grid|px-|py-|mt-|mb-|text-|bg-|border|rounded|w-|h-|gap-|items-|justify-|font-|absolute|relative|hover:|dark:)/.test(v)) continue;
      if (/\$\{/.test(v) && !/[A-Za-zÀ-ɏ؀-ۿ]{3,}\s+[A-Za-zÀ-ɏ؀-ۿ]{2,}/.test(v.replace(/\$\{[^}]*\}/g, ""))) continue;
      const looksHuman = /[؀-ۿ]/.test(v) || /[À-ɏ]/.test(v) || /\s/.test(v) && /[A-Za-z]{2,}/.test(v) || /^[A-Z][a-z]{2,}[.!?]?$/.test(v);
      if (looksHuman && !/^[A-Z0-9_ ]+$/.test(v)) hits.push([i + 1, `str ${m[1]}${v}${m[1]}`]);
    }
  });
  if (hits.length) {
    console.log(`\n${f}`);
    const seen = new Set();
    for (const [n, h] of hits) { const k = n + h; if (seen.has(k)) continue; seen.add(k); console.log(`  ${n}: ${h}`); total++; }
  }
}
console.log(`\n${total} candidate(s)`);
