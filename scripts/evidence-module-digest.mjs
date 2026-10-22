// Parse local static ESM dependencies; never link or evaluate an authored module.
import vm from 'node:vm';
import { readFile, realpath } from 'node:fs/promises';
import { resolve, relative, dirname, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { canonicalEvidence } from '../assets/js/evidence-model.js';
const [root, entry] = process.argv.slice(2), hashes = {};
try {
  if (!root || !entry) throw new Error('Root and implementation entry are required');
  const realRoot = await realpath(root);
  async function visit(path) {
    const actual = await realpath(resolve(root, path));
    const key = relative(realRoot, actual).replaceAll('\\', '/');
    if (key.startsWith('../') || isAbsolute(key) || !/\.(?:m?js)$/.test(key)) throw new Error('Evidence implementation must use local JavaScript modules');
    if (Object.hasOwn(hashes, key)) return;
    const source = await readFile(actual, 'utf8');
    hashes[key] = createHash('sha256').update(source).digest('hex');
    if (/\bimport(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*\(/.test(source)) throw new Error('Dynamic implementation imports need an explicit evidence binding contract: ' + key);
    const module = new vm.SourceTextModule(source, { identifier: actual });
    for (const specifier of module.dependencySpecifiers) {
      if (!specifier.startsWith('.')) throw new Error('Nonlocal implementation import is not bound: ' + key);
      await visit(relative(root, resolve(dirname(actual), specifier)));
    }
  }
  await visit(entry);
  console.log(createHash('sha256').update(canonicalEvidence(hashes)).digest('hex'));
} catch (error) { console.error(error.message); process.exitCode = 1; }
