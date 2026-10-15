// Steps kit — a step-through player for algorithms, proofs and constructions. Reference: docs/kits.md.
//
//   const S = v.steps({ frames: [...] | () => [...], code: ['line 1', …], speed: 2, autoplay: false, loop: false });
//   v.render(() => { const f = S.frame; … });      // redrawn on every step
//
// Adds ⏮ ◀ ▶/⏸ ▶| buttons, a scrubber and a "frame k / n" counter to the controls row. A frame may carry
// `line` (1-based, number or array) to highlight in the pseudocode panel, `note` (rich text, TeX allowed),
// `vars` ({name: value} shown as chips) and `hold` (dwell multiplier while playing).
import { richHTML, katexHTML } from '../core.js';

const CSS = `
.ctl-steps { gap: 6px; flex: 1 1 300px; max-width: 640px; flex-wrap: wrap; min-width: 0; }
.ctl-steps input[type=range] { flex: 1 1 90px; min-width: 50px; margin: 0 4px; }
.ctl-steps .steps-count { font-family: var(--font-mono); font-size: 12px; color: var(--ink-2); white-space: nowrap; font-variant-numeric: tabular-nums; min-width: 6.6em; text-align: right; }
.ctl-steps .btn-icon { width: 32px; height: 32px; }
.ctl-steps .btn-icon:disabled { opacity: .38; cursor: default; border-color: var(--line-2); color: var(--ink); }
.steps-code { order: 50; flex: 0 1 auto; align-self: stretch; position: relative; min-width: 0; max-width: 100%; background: var(--panel); border: 1px solid var(--line); border-radius: 11px; overflow: auto; padding: 8px 0; font: 12.3px/1.62 var(--font-mono); color: var(--ink-2); }
.steps-code.below { flex-basis: 100%; }
.steps-code .steps-title { font: 600 11px/1 var(--font-ui); letter-spacing: .06em; text-transform: uppercase; color: var(--ink-3); padding: 2px 14px 7px; }
.steps-code .ln { display: flex; gap: 10px; padding: 0 14px 0 0; white-space: pre; border-left: 3px solid transparent; transition: background .12s; }
.steps-code .ln .no { flex: none; width: 2.1em; text-align: right; color: var(--ink-3); user-select: none; }
.steps-code .ln.on { background: color-mix(in srgb, var(--c-accent) 15%, transparent); border-left-color: var(--c-accent); color: var(--ink); }
.steps-code .ln.on .no { color: var(--c-accent); }
.steps-code .kw { font-weight: 600; color: var(--ink); }
.steps-code .cm { color: var(--ink-3); font-style: italic; }
.steps-code .katex { font-size: 1.06em; }
.steps-note { font-size: 14.5px; line-height: 1.5; color: var(--ink); padding: 7px 12px; min-height: 2.6em; border-left: 3px solid var(--c-accent); border-radius: 0 9px 9px 0; background: color-mix(in srgb, var(--c-accent) 6%, transparent); }
.steps-note p { margin: 0; }
.steps-note .katex { font-size: 1.04em; }
.steps-vars { display: flex; flex-wrap: wrap; gap: 4px 8px; margin-top: 4px; }
.steps-vars span { font: 12px/1.5 var(--font-mono); color: var(--ink-2); background: var(--panel); border: 1px solid var(--line); border-radius: 6px; padding: 0 6px; }
.steps-vars b { color: var(--ink); font-weight: 600; }
`;
function injectCSS() {
  if (typeof document === 'undefined' || document.getElementById('viz-kit-steps-css')) return;
  const st = document.createElement('style'); st.id = 'viz-kit-steps-css'; st.textContent = CSS; document.head.append(st);
}
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ESC[c]);
// structural keywords are always bold; connective words (to, in, and, not, of, …) only on lines that also contain a structural one,
// so prose steps like "add the edge to the tree" stay plain. spec.keywords: false turns bolding off.
const KW_STRONG = /\b(for|each|while|if|then|else|elif|return|do|downto|repeat|until|break|continue|function|procedure|let|def)\b/;
const KW = /\b(for|each|while|if|then|else|elif|return|do|to|downto|in|and|or|not|repeat|until|break|continue|function|procedure|let|def|of|with|nil|null|true|false)\b/g;
/** One pseudocode line → HTML: $TeX$, keywords in bold, comments (// or ▷) muted. */
function codeHTML(line, keywords = true) {
  const kwOn = keywords !== false && KW_STRONG.test(String(line).replace(/\$[^$]+\$/g, '').split(/\/\/|▷|#\s/)[0]);
  const parts = String(line).split(/(\$[^$]+\$)/);
  let html = '', comment = false;
  for (const p of parts) {
    if (/^\$[^$]+\$$/.test(p)) { html += katexHTML(p.slice(1, -1)); continue; }
    let t = p; const m = comment ? -1 : t.search(/\/\/|▷|#\s/);
    let tail = '';
    if (m >= 0) { tail = t.slice(m); t = t.slice(0, m); }
    html += comment ? `<span class="cm">${esc(t)}</span>` : kwOn ? esc(t).replace(KW, '<span class="kw">$1</span>') : esc(t);
    if (tail) { html += `<span class="cm">${esc(tail)}</span>`; comment = true; }
  }
  return html || ' ';
}
const ICON = {
  first: '<path d="M5 5.5v13" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M13 5.5L6.5 12l6.5 6.5z M20 5.5L13.5 12l6.5 6.5z" fill="currentColor"/>',
  back: '<path d="M6 5.5v13" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M18 5.5L8.5 12l9.5 6.5z" fill="currentColor"/>',
  play: '<path d="M8 5l11 7-11 7z" fill="currentColor"/>',
  pause: '<rect x="6.5" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="13.5" y="5" width="4" height="14" rx="1" fill="currentColor"/>',
  next: '<path d="M6 5.5L15.5 12 6 18.5z" fill="currentColor"/><path d="M18 5.5v13" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
};
const svg = (k) => `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">${ICON[k]}</svg>`;
const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const lines = (f) => { const l = f && (f.lines ?? f.line); return new Set(l == null ? [] : Array.isArray(l) ? l : [l]); };

export default function steps(api, rt, spec = {}) {
  injectCSS();
  const o = { speed: 1.5, autoplay: false, loop: false, start: 0, codePos: 'side', transition: 0, ...spec };
  const source = o.frames;
  let frames = [], i = 0, prevI = 0, playing = false, timer = 0, t0 = 0, raf = 0;
  const load = (f) => { const a = typeof f === 'function' ? f() : f; frames = Array.isArray(a) ? a : []; };
  load(source);

  // ---- controls
  const box = el('div', 'ctl ctl-steps');
  box.setAttribute('role', 'group'); box.setAttribute('aria-label', o.label || 'Step through');
  const mk = (k, label, fn) => { const b = el('button', 'btn btn-icon', svg(k)); b.type = 'button'; b.title = label; b.setAttribute('aria-label', label); b.addEventListener('click', fn); box.append(b); return b; };
  const bFirst = mk('first', 'First step', () => S.first());
  const bBack = mk('back', 'Previous step', () => S.back());
  const bPlay = mk('play', 'Play', () => S.toggle());
  const bNext = mk('next', 'Next step', () => S.next());
  const range = el('input'); range.type = 'range'; range.min = 0; range.step = 1; range.setAttribute('aria-label', 'Step');
  range.addEventListener('input', () => S.set(+range.value));
  const count = el('span', 'steps-count'); count.setAttribute('aria-live', 'polite');
  box.append(range, count);
  box.addEventListener('keydown', (e) => {
    if (e.target === range) return;
    const k = { ArrowLeft: () => S.back(), ArrowRight: () => S.next(), Home: () => S.first(), End: () => S.last() }[e.key];
    if (k) { k(); e.preventDefault(); }
  });
  rt.controlsEl.prepend(box);

  // ---- pseudocode panel (beside the stages, wraps below on narrow screens) and note
  let codeEl = null, lineEls = [];
  const fillCode = (code, title) => {
    codeEl.innerHTML = '';
    if (title) codeEl.append(el('div', 'steps-title', esc(title)));
    lineEls = code.map((ln, k) => { const d = el('div', 'ln', `<span class="no">${k + 1}</span><span>${codeHTML(ln, spec.keywords)}</span>`); codeEl.append(d); return d; });
    codeEl.style.minHeight = Math.min(code.length * 20 + 18 + (title ? 18 : 0), 320) + 'px';
  };
  if (o.code && o.code.length) {
    codeEl = el('div', 'steps-code' + (o.codePos === 'below' ? ' below' : ''));
    codeEl.setAttribute('aria-label', 'Pseudocode');
    fillCode(o.code, o.codeTitle);
    if (o.codeWidth) codeEl.style.width = o.codeWidth + 'px';
    rt.stagesEl.append(codeEl);
  }
  const hasNote = o.note !== false && (o.note === true || frames.some((f) => f && (f.note != null || f.vars)) || typeof source === 'function');
  let noteEl = null;
  if (hasNote) { noteEl = el('div', 'steps-note'); noteEl.setAttribute('aria-live', 'polite'); rt.stagesEl.after(noteEl); }

  // ---- state + UI sync
  const sync = () => {
    const n = frames.length, f = frames[i];
    range.max = Math.max(0, n - 1); range.value = i; range.disabled = n < 2;
    count.textContent = n ? `${o.counter || 'step'} ${i + 1} / ${n}` : '—';
    bFirst.disabled = bBack.disabled = i <= 0; bNext.disabled = i >= n - 1 && !o.loop;
    bPlay.innerHTML = svg(playing ? 'pause' : 'play'); bPlay.title = playing ? 'Pause' : 'Play'; bPlay.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    bPlay.disabled = n < 2;
    if (codeEl) {
      const on = lines(f); lineEls.forEach((d, k) => d.classList.toggle('on', on.has(k + 1)));
      const first = lineEls[Math.min(...[...on].map((x) => x - 1).filter((x) => x >= 0 && x < lineEls.length))];
      if (first && codeEl.scrollHeight > codeEl.clientHeight + 4) { const top = first.offsetTop, bot = top + first.offsetHeight; if (top < codeEl.scrollTop || bot > codeEl.scrollTop + codeEl.clientHeight) codeEl.scrollTop = top - codeEl.clientHeight / 3; }
    }
    if (noteEl) {
      const note = f ? (typeof f.note === 'function' ? f.note(f) : f.note) : '';
      let html = note != null && note !== '' ? richHTML(String(note)) : '';
      if (f && f.vars) html += `<div class="steps-vars">${Object.entries(f.vars).map(([k, v]) => `<span><b>${esc(k)}</b> = ${esc(typeof v === 'number' && !Number.isInteger(v) ? v.toFixed(2) : v)}</span>`).join('')}</div>`;
      if (noteEl._src !== html) { noteEl.innerHTML = html || '&nbsp;'; noteEl._src = html; }
    }
  };
  const still = () => typeof window !== 'undefined' && window.__vizStill;
  const tweenLoop = () => {
    raf = 0; if (rt.dead) return;
    rt.invalidate();
    if (S.tween < 1) raf = requestAnimationFrame(tweenLoop);
  };
  const go = (k, user) => {
    const n = frames.length; if (!n) { i = 0; sync(); rt.invalidate(); return; }
    k = o.loop ? ((k % n) + n) % n : Math.max(0, Math.min(n - 1, k));
    if (k !== i) { prevI = i; i = k; t0 = performance.now(); if (o.transition > 0 && !still() && !raf) raf = requestAnimationFrame(tweenLoop); }
    sync(); rt.invalidate(); S.onChange?.(frames[i], i);
    if (user && playing) schedule();
  };
  const schedule = () => {
    clearTimeout(timer); if (!playing) return;
    const hold = frames[i]?.hold ?? 1;
    timer = setTimeout(tick, (1000 / Math.max(0.05, S.speed)) * hold);
  };
  const tick = () => {
    timer = 0; if (!playing || rt.dead) return;
    if (rt.visible === false) { schedule(); return; }
    if (i >= frames.length - 1) { if (o.loop) go(0); else { S.pause(); return; } } else go(i + 1);
    if (!o.loop && i >= frames.length - 1) { S.pause(); return; }
    schedule();
  };

  const S = {
    el: box, codeEl, noteEl, onChange: o.onChange || null, speed: o.speed,
    /** Current frame object ({} when there are no frames). */
    get frame() { return frames[i] ?? {}; },
    /** Frame shown before the current one (for transitions). */
    get prev() { return frames[prevI] ?? frames[i] ?? {}; },
    get i() { return i; }, get n() { return frames.length; }, get frames() { return frames; },
    get playing() { return playing; },
    get atEnd() { return i >= frames.length - 1; },
    /** 0 → 1 over `transition` seconds after each step (1 when transitions are off or paused). */
    get tween() { if (!(o.transition > 0) || still()) return 1; const u = Math.min(1, (performance.now() - t0) / (o.transition * 1000)); return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; },
    set(k) { go(k, true); return S; },
    next() { go(i + 1, true); return S; },
    back() { go(i - 1, true); return S; },
    first() { go(0, true); return S; },
    last() { go(frames.length - 1, true); return S; },
    play() { if (frames.length < 2) return S; if (i >= frames.length - 1 && !o.loop) go(0); playing = true; sync(); schedule(); return S; },
    pause() { playing = false; clearTimeout(timer); timer = 0; sync(); return S; },
    toggle() { return playing ? S.pause() : S.play(); },
    /** Replace the pseudocode lines (and title) shown in the code panel. */
    setCode(code, title = o.codeTitle) { if (codeEl) { o.codeTitle = title; fillCode(code || [], title); sync(); } return S; },
    /** Replace the frames (or re-run the frames function); at: 'start' (default) | 'end' | 'keep' | index. */
    reset(newFrames, opts = {}) {
      if (newFrames && !Array.isArray(newFrames) && typeof newFrames === 'object' && typeof newFrames !== 'function') { opts = newFrames; newFrames = undefined; }
      load(newFrames ?? source); const at = opts.at ?? 'start', n = frames.length;
      const k = at === 'end' ? n - 1 : at === 'keep' ? Math.min(i, n - 1) : typeof at === 'number' ? at : 0;
      i = -1; prevI = 0; go(Math.max(0, k)); if (prevI < 0) prevI = 0; if (playing) schedule();
      return S;
    },
  };
  // initial frame: o.start (0 | 'end' | index); o.still overrides it for screenshots
  const st0 = still() && o.still != null ? o.still : o.start;
  i = Math.max(0, Math.min(frames.length - 1, st0 === 'end' ? frames.length - 1 : st0 | 0)); prevI = i; t0 = 0;
  sync();
  const onPause = () => { S.pause(); t0 = 0; rt.invalidate(); };
  window.addEventListener('vizpause', onPause);
  rt.cleanups.push(() => { window.removeEventListener('vizpause', onPause); clearTimeout(timer); cancelAnimationFrame(raf); playing = false; });
  if (o.autoplay && !reduced() && !still()) S.play();
  rt.invalidate();
  return S;
}
