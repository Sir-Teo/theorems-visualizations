// One bounded human-initiated lookup. No crawl, scheduler, or mutation of accepted evidence.
import {writeFile, mkdir, lstat} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {captureRecord} from '../program/federation.mjs';
try {
  const [provider, id, flag, output] = process.argv.slice(2);
  if (process.argv.length !== 6 || flag !== '--out' || !output) throw new Error('Use PROVIDER EXACT_ID --out NEW_FILE.json');
  const path = resolve(output);
  if (await lstat(path).catch(e => { if (e.code === 'ENOENT') return null; throw e; })) throw new Error('Choose a new output file; retained evidence is never replaced');
  const result = await captureRecord(provider, id);
  await mkdir(dirname(path), {recursive: true});
  await writeFile(path, JSON.stringify(result, null, 2) + '\n', {flag: 'wx'});
  console.log(JSON.stringify({output: path, status: 'candidate-only', scope: result.scope}));
} catch (error) { console.error(error.message); process.exitCode = 1; }
