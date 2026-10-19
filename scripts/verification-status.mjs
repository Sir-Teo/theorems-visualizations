// Reproducible inventory of unresolved source checks. Runtime tests never clear it.
// node scripts/verification-status.mjs [--write | --check]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadAll, ROOT } from './lib.mjs';

const { items, problems } = await loadAll();
if (problems.some(p => p.level === 'error')) throw new Error('Content could not be completely loaded; source inventory was not rewritten. Run the static check and resolve import/schema errors first.');
const queue = items.filter(it => it.verify === true).map(it => ({
  id: it.id, file: it.file, name: it.name, refs: it.refs || [],
})).sort((a, b) => a.id.localeCompare(b.id, 'en'));
const originalAnalysis = new Set(['pma', 'rca', 'fa']);
const countBy = fn => Object.fromEntries([...new Set(queue.map(fn))].sort().map(k => [k, queue.filter(it => fn(it) === k).length]));
const data = { schemaVersion: 1, meaning: 'Unresolved source, attribution, numbering or hypothesis checks; browser passes do not establish source verification.',
  writtenItems: items.length, remaining: queue.length,
  originalAnalysis: queue.filter(it => originalAnalysis.has(it.id.split('-')[0])).length,
  byCollection: countBy(it => it.id.split('-')[0]), queue,
};
const path = join(ROOT, 'docs/verification/open-source-reviews.json');
const json = JSON.stringify(data, null, 2) + '\n';
if (process.argv.includes('--write')) { mkdirSync(join(ROOT, 'docs/verification'), { recursive: true }); writeFileSync(path, json); }
if (process.argv.includes('--check')) {
  if (readFileSync(path, 'utf8') !== json) throw new Error('Source queue differs from content flags. Review the changes, record evidence, then regenerate with --write.');
}
console.log(`${data.remaining} unresolved source checks (${data.originalAnalysis} in the original analysis collections), ${data.writtenItems} written items`);
