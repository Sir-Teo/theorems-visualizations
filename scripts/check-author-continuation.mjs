// Verify this integration snapshot without applying it to another checkout.
import {readFile, realpath} from 'node:fs/promises';
import {resolve, dirname, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const insist = (ok, why) => { if (!ok) throw new Error(why); };
try {
  insist(process.argv.length === 2, 'Run without arguments in the integration snapshot. This checker never applies changes.');
  const manifest = JSON.parse(await readFile(resolve(root, 'docs/integration/universal-author-continuation.json'), 'utf8'));
  insist(manifest.schemaVersion === 1 && /^[a-f0-9]{40}$/.test(manifest.predecessor), 'Invalid predecessor');
  const paths = new Set();
  for (const entry of manifest.files) {
    insist(typeof entry.path === 'string' && !/[\\\x00-\x1f]/.test(entry.path) && !entry.path.startsWith('/') &&
      entry.path.split('/').every(p => p && !['.', '..', '.git'].includes(p)) && !paths.has(entry.path), 'Unsafe or duplicate delta path');
    paths.add(entry.path);
    insist(['add', 'replace'].includes(entry.operation) && /^[a-f0-9]{64}$/.test(entry.afterSha256), 'Invalid delta entry');
    const file = await realpath(resolve(root, entry.path));
    insist(file.startsWith(root + sep), 'Delta path escapes checkout');
    insist(hash(await readFile(file)) === entry.afterSha256, 'Current file differs from integration snapshot: ' + entry.path);
    const exists = execFileSync('git', ['ls-tree', '--name-only', manifest.predecessor, '--', entry.path], {cwd: root, encoding: 'utf8'}).trim();
    if (entry.operation === 'add') insist(!exists && entry.beforeSha256 === null, 'Addition already existed: ' + entry.path);
    else {
      insist(exists === entry.path && /^[a-f0-9]{64}$/.test(entry.beforeSha256), 'Invalid replacement preimage');
      const before = execFileSync('git', ['show', manifest.predecessor + ':' + entry.path], {cwd: root, maxBuffer: 64 * 1024 * 1024});
      insist(hash(before) === entry.beforeSha256, 'Predecessor bytes differ: ' + entry.path);
    }
  }
  insist(paths.size > 0, 'Empty integration snapshot');
  console.log(JSON.stringify({predecessor: manifest.predecessor, verifiedFiles: paths.size, scope: 'Exact source snapshot and predecessor bytes only; no destination writes, merge or deployment.'}, null, 2));
} catch (error) { console.error(error.message); process.exitCode = 1; }
