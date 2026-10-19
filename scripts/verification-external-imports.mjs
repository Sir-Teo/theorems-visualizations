// External content inputs omitted by the checker's collection-local fingerprint.
// This reads source only: modules are never imported or evaluated.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DEFAULT_ROOT = fileURLToPath(new URL('..', import.meta.url));
const identifierStart = c => !!c && /[A-Za-z_$]/.test(c);
const identifierPart = c => !!c && /[A-Za-z0-9_$]/.test(c);

// A bounded JavaScript lexer for module specifiers. In particular, prose in
// String.raw templates, comments and regexes must not become dependency edges.
function tokens(source) {
  const out = []; let i = 0;
  const emit = (kind, start, end, extra = {}) => {
    const token = { kind, text: source.slice(start, end), start, end, ...extra };
    out.push(token); return token;
  };
  function scan(inTemplateExpression = false) {
    let previous = null, braces = 0; const parens = [];
    const regexMayStart = () => !previous || previous.controlEnd
      || (previous.kind === 'id' && /^(return|throw|case|yield|await|else|do|in|of|instanceof)$/.test(previous.text))
      || (previous.kind === 'punct' && /^[([{:;,=!?&|+\-*\/%^~<>]$/.test(previous.text));
    while (i < source.length) {
      const c = source[i], start = i;
      if (/\s/.test(c)) { i++; continue; }
      if (source.startsWith('//', i)) { i = source.indexOf('\n', i + 2); if (i < 0) i = source.length; continue; }
      if (source.startsWith('/*', i)) { const end = source.indexOf('*/', i + 2); if (end < 0) throw Error('Unterminated comment'); i = end + 2; continue; }
      if (c === '}' && inTemplateExpression && braces === 0) { i++; return; }
      if (c === '"' || c === "'") {
        const quote = source[i++]; let closed = false;
        while (i < source.length) {
          if (source[i] === '\\') { i += 2; continue; }
          if (source[i++] === quote) { closed = true; break; }
        }
        if (!closed) throw Error('Unterminated string');
        previous = emit('literal', start, i); continue;
      }
      if (c === '`') {
        i++; let interpolated = false, closed = false;
        while (i < source.length) {
          if (source[i] === '\\') { i += 2; continue; }
          if (source.startsWith('${', i)) { interpolated = true; i += 2; scan(true); continue; }
          if (source[i++] === '`') { closed = true; break; }
        }
        if (!closed) throw Error('Unterminated template');
        previous = emit('literal', start, i, { interpolated }); continue;
      }
      if (c === '/' && regexMayStart()) {
        i++; let inClass = false, closed = false;
        while (i < source.length) {
          const r = source[i++];
          if (r === '\\') { i++; continue; }
          if (r === '[') inClass = true;
          else if (r === ']') inClass = false;
          else if (r === '/' && !inClass) { closed = true; break; }
          else if (r === '\n' || r === '\r') break;
        }
        if (!closed) throw Error('Unsupported or unterminated regex literal');
        while (identifierPart(source[i])) i++;
        previous = emit('regex', start, i); continue;
      }
      if (identifierStart(c)) {
        while (identifierPart(source[++i])) {}
        previous = emit('id', start, i); continue;
      }
      i++;
      if (c === '{') braces++;
      else if (c === '}') braces--;
      if (c === '(') parens.push(previous?.kind === 'id' && /^(if|while|for|with|switch|catch)$/.test(previous.text));
      previous = emit('punct', start, i, c === ')' ? { controlEnd: parens.pop() === true } : {});
    }
    if (inTemplateExpression) throw Error('Unterminated template expression');
  }
  scan();
  // Template-expression tokens are discovered before their enclosing template.
  return out.sort((a, b) => a.start - b.start);
}

function literalValue(token) {
  if (token?.kind !== 'literal' || token.interpolated) return null;
  const raw = token.text; let value = '';
  for (let i = 1; i < raw.length - 1; i++) {
    let c = raw[i];
    if (c !== '\\') { value += c; continue; }
    c = raw[++i];
    if (c === '\n') continue;
    if (c === '\r') { if (raw[i + 1] === '\n') i++; continue; }
    if (c === 'x' || c === 'u') {
      const braced = c === 'u' && raw[i + 1] === '{';
      const start = i + (braced ? 2 : 1), end = braced ? raw.indexOf('}', start) : start + (c === 'x' ? 2 : 4);
      const hex = raw.slice(start, end);
      if (end < start || !/^[0-9a-f]+$/i.test(hex) || (!braced && hex.length !== (c === 'x' ? 2 : 4))) throw Error('Unsupported module-path escape');
      value += String.fromCodePoint(parseInt(hex, 16)); i = braced ? end : end - 1;
    } else {
      if (/[1-9]/.test(c) || (c === '0' && /\d/.test(raw[i + 1] || ''))) throw Error('Unsupported octal module-path escape');
      value += ({ b: '\b', f: '\f', n: '\n', r: '\r', t: '\t', v: '\v', 0: '\0' })[c] ?? c;
    }
  }
  return value;
}

function imports(source) {
  const ts = tokens(source), paths = [], unsupported = [];
  const add = (token, origin) => {
    const value = literalValue(token);
    if (value === null) unsupported.push({ start: origin.start, reason: 'Nonliteral module path' });
    else paths.push({ value, start: origin.start });
  };
  for (let i = 0; i < ts.length; i++) {
    const token = ts[i];
    if (token.kind !== 'id' || !['import', 'export'].includes(token.text) || ts[i - 1]?.text === '.') continue;
    const next = ts[i + 1];
    if (token.text === 'import') {
      if (next?.text === '.') continue; // import.meta
      if (next?.text === '(') {
        const arg = ts[i + 2], after = ts[i + 3];
        if (arg?.kind === 'literal' && !arg.interpolated && [')', ','].includes(after?.text)) add(arg, token);
        else unsupported.push({ start: token.start, reason: 'Nonliteral dynamic import (requires an explicit dependency)' });
        continue;
      }
      if (next?.kind === 'literal') { add(next, token); continue; }
      for (let j = i + 1; j < ts.length && ts[j].text !== ';'; j++) {
        if (ts[j].text === 'from' && ts[j + 1]?.kind === 'literal') { add(ts[j + 1], token); break; }
      }
    } else if (next?.text === '*' || next?.text === '{') {
      let j = i + 2;
      if (next.text === '{') { let depth = 1; while (j < ts.length && depth) { if (ts[j].text === '{') depth++; else if (ts[j].text === '}') depth--; j++; } }
      else { if (ts[j]?.text === 'as') j += 2; }
      if (ts[j]?.text === 'from') add(ts[j + 1], token);
    }
  }
  return { paths, unsupported };
}

/**
 * Return sorted repo-relative file -> SHA256 for content dependencies outside
 * the checker's collection-local hash. All collection .js files are roots,
 * matching check.mjs. Imported nested files/resources also need this guard.
 * Static imports, re-exports, and literal dynamic imports are followed; modules
 * are not evaluated. Assets under assets/js/viz are already in the common hash.
 * Nonliteral dynamic imports and other unsupported paths throw with locations,
 * so an incomplete closure cannot silently certify a supplemental browser run.
 */
export function externalContentHashes(col, { root = DEFAULT_ROOT } = {}) {
  if (!/^[a-z][a-z0-9]*$/.test(col)) throw Error(`Invalid collection: ${col}`);
  root = resolve(root);
  const dir = join(root, 'content', col);
  const roots = readdirSync(dir).filter(name => name.endsWith('.js')).sort().map(name => join(dir, name));
  const localFingerprintFiles = new Set(roots), seen = new Set(), hashes = new Map(), issues = [];
  const rel = path => relative(root, path).split(sep).join('/');
  const issue = (file, source, start, reason) => {
    const prefix = source.slice(0, start), line = prefix.split('\n').length;
    issues.push(`${rel(file)}:${line}:${start - prefix.lastIndexOf('\n')}: ${reason}`);
  };
  function visit(file) {
    if (seen.has(file)) return;
    seen.add(file);
    const name = rel(file), bytes = readFileSync(file);
    if (!localFingerprintFiles.has(file)) hashes.set(name, createHash('sha256').update(bytes).digest('hex'));
    if (!/\.[cm]?js$/.test(file)) return;
    const source = bytes.toString('utf8'); let parsed;
    try { parsed = imports(source); } catch (error) { issues.push(`${name}: ${error.message}`); return; }
    for (const problem of parsed.unsupported) issue(file, source, problem.start, problem.reason);
    for (const dependency of parsed.paths) {
      const specifier = dependency.value; let target;
      try {
        if (specifier.startsWith('./') || specifier.startsWith('../')) target = fileURLToPath(new URL(specifier, pathToFileURL(file)));
        else if (specifier.startsWith('/content/') || specifier.startsWith('/assets/js/viz/')) target = fileURLToPath(new URL('.' + specifier, pathToFileURL(root + sep)));
        else throw Error(`Unsupported module path ${JSON.stringify(specifier)}`);
        const targetName = rel(target);
        if (targetName.startsWith('assets/js/viz/')) continue;
        if (!targetName.startsWith('content/')) throw Error(`Module path leaves content: ${JSON.stringify(specifier)}`);
        visit(target);
      } catch (error) { issue(file, source, dependency.start, error.message); }
    }
  }
  for (const file of roots) visit(file);
  if (issues.length) throw Error(`Cannot determine external content closure:\n${[...new Set(issues)].sort().join('\n')}`);
  return Object.fromEntries([...hashes].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
}
