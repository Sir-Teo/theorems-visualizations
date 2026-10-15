// Turn duplicate syllabus entries into cross-listings of the owning collection's item.
//   node scripts/crosslist.mjs toc-8.2=logic-6.2 mfd-12.8=mech-13.1 … [--dry]
// Each `dup=owner` rewrites dup's entry in content/<col>/syllabus.js to `{ num, alias: 'owner', name }`.
// The number stays reserved (ids are append-only), references to dup resolve to owner at build time,
// and dup's chapter page lists the owner's card under "Cross-listed".
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, ID_RE } from './lib.mjs';

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const pairs = args.filter((a) => a.includes('=')).map((a) => a.split('='));
if (!pairs.length) { console.error('usage: node scripts/crosslist.mjs dup=owner … [--dry]'); process.exit(1); }

/** Index just past the `}` that closes the object literal opening at s[i] === '{' (skips strings and comments). */
function closeOf(s, i) {
  let depth = 0;
  for (let k = i; k < s.length; k++) {
    const c = s[k];
    if (c === '/' && s[k + 1] === '/') { k = s.indexOf('\n', k); if (k < 0) return -1; continue; }
    if (c === '/' && s[k + 1] === '*') { k = s.indexOf('*/', k) + 1; continue; }
    if (c === "'" || c === '"' || c === '`') { for (k++; k < s.length && s[k] !== c; k++) if (s[k] === '\\') k++; continue; }
    if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return k + 1;
  }
  return -1;
}

const files = new Map();
let bad = 0;
for (const [dup, owner] of pairs) {
  if (!ID_RE.test(dup) || !ID_RE.test(owner)) { console.log(`✗ ${dup}=${owner}: malformed id`); bad++; continue; }
  const [col, num] = [dup.slice(0, dup.indexOf('-')), dup.slice(dup.indexOf('-') + 1)];
  if (owner.startsWith(col + '-')) { console.log(`✗ ${dup}=${owner}: same collection`); bad++; continue; }
  const f = join(ROOT, 'content', col, 'syllabus.js');
  if (!existsSync(f)) { console.log(`✗ ${dup}: no ${col}/syllabus.js`); bad++; continue; }
  if (!files.has(f)) files.set(f, readFileSync(f, 'utf8'));
  let s = files.get(f);
  const m = new RegExp(`\\{\\s*num:\\s*(['"])${num.replace(/\./g, '\\.')}\\1`).exec(s);
  if (!m) { console.log(`✗ ${dup}: entry not found`); bad++; continue; }
  const end = closeOf(s, m.index);
  const body = s.slice(m.index, end);
  if (/\balias:/.test(body)) { console.log(`· ${dup}: already cross-listed`); continue; }
  const name = /\bname:\s*((['"`])(?:\\.|(?!\2)[^\\])*\2)/.exec(body)?.[1] ?? "''";
  const repl = `{ num: '${num}', alias: '${owner}', name: ${name} }`;
  s = s.slice(0, m.index) + repl + s.slice(end);
  files.set(f, s);
  console.log(`✓ ${dup} → ${owner}  ${name}`);
}
if (!dry) for (const [f, s] of files) writeFileSync(f, s);
console.log(dry ? '(dry run: nothing written)' : `${files.size} file(s) updated`);
process.exit(bad ? 1 : 0);
