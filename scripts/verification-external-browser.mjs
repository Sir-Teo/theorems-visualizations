// Fresh browser evidence for a collection that imports another collection's code.
// The base checker stays frozen while existing captures finish. This guard covers
// the complete fresh run, including its static loading and every screenshot.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { ROOT } from './lib.mjs';
import { externalContentHashes } from './verification-external-imports.mjs';

const args = process.argv.slice(2);
const targets = args.filter(arg => !arg.startsWith('--'));
const reportArgument = args.find(arg => arg.startsWith('--report='));
if (targets.length !== 1 || !/^[a-z]+$/.test(targets[0]) || !reportArgument
  || !args.includes('--modes') || !args.includes('--still') || args.some(arg => arg.startsWith('--resume'))) {
  throw Error('Use one collection, --modes --still, and a fresh --report=path; resume is intentionally unsupported.');
}
const col = targets[0], path = resolve(ROOT, reportArgument.slice('--report='.length));
if (existsSync(path)) throw Error('External-import evidence requires a fresh report path.');
const before = await externalContentHashes(col);
const child = spawn(process.execPath, ['scripts/check.mjs', ...args], { cwd: ROOT, stdio: 'inherit' });
const exitCode = await new Promise((resolveExit, reject) => { child.once('error', reject); child.once('exit', resolveExit); });
const after = await externalContentHashes(col);
const stable = JSON.stringify(before) === JSON.stringify(after);
const report = JSON.parse(readFileSync(path, 'utf8'));
if (!report.complete || report.results.some(result => !result.id.startsWith(col + '-'))) {
  throw Error('Fresh external-import capture did not complete the requested collection.');
}
report.externalImportGuard = {
  policy: 'literal-content-import-closure-v1', before, after, stable,
  wrapperSha256: createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex'),
};
for (const result of report.results) {
  result.externalContentHashes = before;
  if (!stable) result.errs.push('An imported collection helper changed during this fresh capture run.');
}
report.summary.failed = report.results.filter(result => result.errs.length).length;
writeFileSync(path, JSON.stringify(report, null, 2) + '\n');
console.log(`External content-import guard: ${stable ? 'stable' : 'changed'}; ${Object.keys(before).length} files.`);
process.exitCode = exitCode === 0 && stable ? 0 : 1;
