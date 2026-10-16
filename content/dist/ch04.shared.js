// Distributed Computing — Chapter 4 (mutual exclusion and shared objects): helpers shared by ch04.js, ch04-b.js, ch04-c.js and ch04-d.js.
// Re-exports the Chapter 3 helpers (seeded randomness, space-time drawing, ...).
// Everything here is a pure simulator, an exhaustive checker or a drawing routine: the pictures run the real algorithms.
export * from './ch03.shared.js';
import { mulberry32, clamp, range, PCOL } from './ch03.shared.js';

// ============================================================================= shared-memory programs and their exhaustive exploration
// A program is a list of instructions {t: pseudocode line, reg: 'R'|'T'|'C'|'E', f(S, i) → next pc (may mutate S)}; one scheduler step
// of process i executes the instruction at its pc atomically. A state is {pc: [...], sh: shared variables, lo: [local variables]}.

export const REGCOL = { R: 'faint', T: 'orange', C: 'accent', E: 'purple' };
export const REGNAME = { R: 'remainder', T: 'trying', C: 'critical', E: 'exit' };
export const cloneS = (S) => JSON.parse(JSON.stringify(S));
const keyS = (S) => JSON.stringify(S);

export function mkSpec({ id, n, prog, sh, lo, show, title }) {
  const spec = {
    id, n, prog, title, lines: prog.map((p) => p.t),
    init: () => ({ pc: Array(n).fill(0), sh: cloneS(typeof sh === 'function' ? sh() : sh || {}), lo: Array.from({ length: n }, () => cloneS(lo || {})) }),
    step(S, p) { S.pc[p] = prog[S.pc[p]].f(S, p); },
    reg: (S, p) => prog[S.pc[p]].reg,
    regs: (S) => S.pc.map((c) => prog[c].reg),
    show: show || (() => ''),
  };
  return spec;
}

/** No protocol at all: a process that wants in simply enters. */
export const noneSpec = (n = 3) => mkSpec({
  id: `none${n}`, n, title: 'no protocol',
  prog: [
    { t: 'remainder section', reg: 'R', f: () => 1 },
    { t: 'trying: (nothing to do)', reg: 'T', f: () => 2 },
    { t: 'critical section', reg: 'C', f: () => 3 },
    { t: 'exit: (nothing to do)', reg: 'E', f: () => 0 },
  ],
});

/** Look at a lock, then set it: two separate steps (the classic broken lock). */
export const ctsSpec = (n = 3) => mkSpec({
  id: `cts${n}`, n, title: 'look, then set a lock', sh: { lock: 0 }, show: (S) => `lock = ${S.sh.lock}`,
  prog: [
    { t: 'remainder section', reg: 'R', f: () => 1 },
    { t: 'wait until lock = 0', reg: 'T', f: (S) => (S.sh.lock === 0 ? 2 : 1) },
    { t: 'lock ← 1', reg: 'T', f: (S) => { S.sh.lock = 1; return 3; } },
    { t: 'critical section', reg: 'C', f: () => 4 },
    { t: 'lock ← 0', reg: 'E', f: (S) => { S.sh.lock = 0; return 0; } },
  ],
});

/** Atomic test-and-set (a read-modify-write step, stronger than a read or a write). */
export const tasSpec = (n = 3) => mkSpec({
  id: `tas${n}`, n, title: 'atomic test-and-set lock', sh: { lock: 0 }, show: (S) => `lock = ${S.sh.lock}`,
  prog: [
    { t: 'remainder section', reg: 'R', f: () => 1 },
    { t: 'while test-and-set(lock) = 1: spin', reg: 'T', f: (S) => { if (S.sh.lock === 0) { S.sh.lock = 1; return 2; } return 1; } },
    { t: 'critical section', reg: 'C', f: () => 3 },
    { t: 'lock ← 0', reg: 'E', f: (S) => { S.sh.lock = 0; return 0; } },
  ],
});

/** Peterson's algorithm for two processes, and three broken variants. */
export function petersonSpec(variant = 'ok') {
  const flag = { t: 'flag[i] ← true', reg: 'T' }, turn = { t: 'turn ← j', reg: 'T' };
  const R = { t: 'remainder section', reg: 'R', f: () => 1 }, CS = { t: 'critical section', reg: 'C' };
  const show = (S) => `flag = [${S.sh.f}], turn = ${S.sh.turn}`;
  const setF = (S, i) => { S.sh.f[i] = 1; };
  const unF = (S, i) => { S.sh.f[i] = 0; };
  let prog;
  if (variant === 'ok') prog = [R, { ...flag, f: (S, i) => { setF(S, i); return 2; } }, { ...turn, f: (S, i) => { S.sh.turn = 1 - i; return 3; } },
    { t: 'wait until ¬flag[j] or turn = i', reg: 'T', f: (S, i) => (!S.sh.f[1 - i] || S.sh.turn === i ? 4 : 3) }, { ...CS, f: () => 5 }, { t: 'flag[i] ← false', reg: 'E', f: (S, i) => { unF(S, i); return 0; } }];
  else if (variant === 'swap') prog = [R, { ...turn, f: (S, i) => { S.sh.turn = 1 - i; return 2; } }, { ...flag, f: (S, i) => { setF(S, i); return 3; } },
    { t: 'wait until ¬flag[j] or turn = i', reg: 'T', f: (S, i) => (!S.sh.f[1 - i] || S.sh.turn === i ? 4 : 3) }, { ...CS, f: () => 5 }, { t: 'flag[i] ← false', reg: 'E', f: (S, i) => { unF(S, i); return 0; } }];
  else if (variant === 'flags') prog = [R, { ...flag, f: (S, i) => { setF(S, i); return 2; } },
    { t: 'wait until ¬flag[j]', reg: 'T', f: (S, i) => (!S.sh.f[1 - i] ? 3 : 2) }, { ...CS, f: () => 4 }, { t: 'flag[i] ← false', reg: 'E', f: (S, i) => { unF(S, i); return 0; } }];
  else prog = [R, { ...turn, f: (S, i) => { S.sh.turn = 1 - i; return 2; } },
    { t: 'wait until turn = i', reg: 'T', f: (S, i) => (S.sh.turn === i ? 3 : 2) }, { ...CS, f: () => 4 }, { t: 'exit: (nothing to do)', reg: 'E', f: () => 0 }];
  return mkSpec({ id: `peterson-${variant}`, n: 2, prog, sh: { f: [0, 0], turn: 0 }, show });
}

/** Lamport's bakery algorithm for n processes. Variants: 'ok'; 'nochoose' (no choosing flags); 'strict' (ties are not broken by id). cap bounds the ticket numbers (exploration only). */
export function bakerySpec(n = 3, variant = 'ok', cap = Infinity) {
  const pairLess = (S, i, j) => (variant === 'strict' ? S.sh.num[i] < S.sh.num[j] : S.sh.num[i] < S.sh.num[j] || (S.sh.num[i] === S.sh.num[j] && i < j));
  const skip = (S, i) => { if (S.lo[i].j === i) S.lo[i].j++; };
  const waitChoose = variant !== 'nochoose';
  const prog = [
    { t: 'remainder section', reg: 'R', f: () => 1 },
    { t: waitChoose ? 'choosing[i] ← true' : '(no choosing flag)', reg: 'T', f: (S, i) => { if (waitChoose) S.sh.ch[i] = 1; S.lo[i].j = 0; S.lo[i].m = 0; return 2; } },
    { t: 'for each j: m ← max(m, number[j])   // one read per step', reg: 'T', f: (S, i) => { const L = S.lo[i]; L.m = Math.max(L.m, S.sh.num[L.j]); L.j++; return L.j >= n ? 3 : 2; } },
    { t: 'number[i] ← 1 + m', reg: 'T', f: (S, i) => { if (1 + S.lo[i].m > cap) { S.sh.over = 1; return 3; } S.sh.num[i] = 1 + S.lo[i].m; return 4; } },
    { t: waitChoose ? 'choosing[i] ← false' : '(no choosing flag)', reg: 'T', f: (S, i) => { if (waitChoose) S.sh.ch[i] = 0; S.lo[i].j = 0; return 5; } },
    { t: waitChoose ? 'for each j ≠ i: wait until ¬choosing[j]' : 'for each j ≠ i:', reg: 'T', f: (S, i) => { const L = S.lo[i]; skip(S, i); if (L.j >= n) return 7; return !waitChoose || !S.sh.ch[L.j] ? 6 : 5; } },
    { t: variant === 'strict' ? '   wait until number[j] = 0 or number[i] < number[j]' : '   wait until number[j] = 0 or (number[i], i) < (number[j], j)', reg: 'T', f: (S, i) => { const L = S.lo[i]; if (S.sh.num[L.j] === 0 || pairLess(S, i, L.j)) { L.j++; return 5; } return 6; } },
    { t: 'critical section', reg: 'C', f: () => 8 },
    { t: 'number[i] ← 0', reg: 'E', f: (S, i) => { S.sh.num[i] = 0; return 0; } },
  ];
  return mkSpec({ id: `bakery-${variant}-${n}-${cap}`, n, prog, sh: { ch: Array(n).fill(0), num: Array(n).fill(0) }, lo: { j: 0, m: 0 },
    show: (S) => `number = [${S.sh.num}]` + (waitChoose ? `, choosing = [${S.sh.ch}]` : '') });
}

/** Dijkstra's 1965 algorithm for n processes, and two naive flag protocols. kind: 'dijkstra' | 'flags' (raise a flag, wait for the others to be down) | 'look' (look, then raise the flag). */
export function flagSpec(n = 3, kind = 'dijkstra') {
  if (kind === 'dijkstra') {
    const prog = [
      { t: 'remainder section', reg: 'R', f: () => 1 },
      { t: 'b[i] ← false', reg: 'T', f: (S, i) => { S.sh.b[i] = 0; return 2; } },
      { t: 'L1: if k ≠ i then goto L2 else goto L4', reg: 'T', f: (S, i) => (S.sh.k !== i ? 3 : 5) },
      { t: 'L2: c[i] ← true', reg: 'T', f: (S, i) => { S.sh.c[i] = 1; return 4; } },
      { t: '    if b[k] then k ← i;  goto L1', reg: 'T', f: (S, i) => { if (S.sh.b[S.sh.k]) S.sh.k = i; return 2; } },
      { t: 'L4: c[i] ← false', reg: 'T', f: (S, i) => { S.sh.c[i] = 0; S.lo[i].j = 0; return 6; } },
      { t: '    for j ≠ i: if ¬c[j] then goto L1', reg: 'T', f: (S, i) => { const L = S.lo[i]; if (L.j === i) L.j++; if (L.j >= n) return 7; if (!S.sh.c[L.j]) return 2; L.j++; if (L.j === i) L.j++; return L.j >= n ? 7 : 6; } },
      { t: 'critical section', reg: 'C', f: () => 8 },
      { t: 'c[i] ← true', reg: 'E', f: (S, i) => { S.sh.c[i] = 1; return 9; } },
      { t: 'b[i] ← true', reg: 'E', f: (S, i) => { S.sh.b[i] = 1; return 0; } },
    ];
    return mkSpec({ id: `dijkstra-${n}`, n, prog, sh: { b: Array(n).fill(1), c: Array(n).fill(1), k: 0 }, lo: { j: 0 }, show: (S) => `b = [${S.sh.b}], c = [${S.sh.c}], k = ${S.sh.k}` });
  }
  const others = (S, i, a) => a.every((x, j) => j === i || !x);
  const prog = kind === 'flags' ? [
    { t: 'remainder section', reg: 'R', f: () => 1 },
    { t: 'flag[i] ← true', reg: 'T', f: (S, i) => { S.sh.f[i] = 1; return 2; } },
    { t: 'wait until every other flag is down', reg: 'T', f: (S, i) => (others(S, i, S.sh.f) ? 3 : 2) },
    { t: 'critical section', reg: 'C', f: () => 4 },
    { t: 'flag[i] ← false', reg: 'E', f: (S, i) => { S.sh.f[i] = 0; return 0; } },
  ] : [
    { t: 'remainder section', reg: 'R', f: () => 1 },
    { t: 'wait until every other flag is down', reg: 'T', f: (S, i) => (others(S, i, S.sh.f) ? 2 : 1) },
    { t: 'flag[i] ← true', reg: 'T', f: (S, i) => { S.sh.f[i] = 1; return 3; } },
    { t: 'critical section', reg: 'C', f: () => 4 },
    { t: 'flag[i] ← false', reg: 'E', f: (S, i) => { S.sh.f[i] = 0; return 0; } },
  ];
  return mkSpec({ id: `${kind}-${n}`, n, prog, sh: { f: Array(n).fill(0) }, show: (S) => `flag = [${S.sh.f}]` });
}

const nCrit = (spec, S) => S.pc.reduce((a, c) => a + (spec.prog[c].reg === 'C' ? 1 : 0), 0);

/**
 * Exhaustive breadth-first exploration of every interleaving. Reports the shortest schedule to a state with two processes in C (mutual exclusion fails),
 * to a deadlock (every process spins and none can change the state) and to a state in which a lone trying process, all others in the remainder, cannot enter.
 * cnt[a][b] counts reachable states by the pcs of processes 0 and 1 (n = 2 only use). Stops at `limit` states.
 */
export function explore(spec, { limit = 120000 } = {}) {
  const S0 = spec.init(), seen = new Map([[keyS(S0), 0]]), nodes = [S0], par = [-1], via = [-1];
  let bad = -1, dead = -1, solo = -1, soloP = -1;
  const cnt = Array.from({ length: spec.prog.length }, () => Array(spec.prog.length).fill(0));
  const pathTo = (h) => { const w = []; while (par[h] >= 0) { w.push(via[h]); h = par[h]; } return w.reverse(); };
  for (let h = 0; h < nodes.length; h++) {
    const S = nodes[h], k0 = keyS(S);
    if (spec.n >= 2) cnt[S.pc[0]][S.pc[1]]++;
    if (nCrit(spec, S) >= 2) { if (bad < 0) bad = h; continue; }
    if (S.sh.over) continue; // a ticket number passed the exploration bound: not expanded
    let noop = 0;
    for (let p = 0; p < spec.n; p++) {
      const T = cloneS(S); spec.step(T, p);
      const k = keyS(T);
      if (k === k0) { noop++; continue; }
      if (!seen.has(k) && nodes.length < limit) { seen.set(k, nodes.length); nodes.push(T); par.push(h); via.push(p); }
    }
    if (noop === spec.n && dead < 0) dead = h;
    if (solo < 0) {
      for (let p = 0; p < spec.n && solo < 0; p++) {
        if (spec.reg(S, p) !== 'T' || S.pc.some((c, q) => q !== p && spec.prog[c].reg !== 'R')) continue;
        const T = cloneS(S); let ok = false;
        for (let s = 0; s < 8 * spec.prog.length + 8; s++) { spec.step(T, p); if (spec.reg(T, p) === 'C' || T.sh.over) { ok = true; break; } }
        if (!ok) { solo = h; soloP = p; }
      }
    }
  }
  return { count: nodes.length, capped: nodes.length >= limit, bad, dead, solo, soloP, cnt, nodes, path: pathTo };
}

/**
 * Interactive scheduler for a shared-memory program: a schedule strip (one column per step, coloured by region), the pseudocode with each process's pc,
 * step / random / reset buttons, and a replay of the schedule the exhaustive explorer found. getSpec() returns the current program.
 */
export function mxSim(v, getSpec, o = {}) {
  const Z = { S: null, hist: [], spec: null, ex: null, seed: 1, cache: new Map(), nbtn: 3 };
  const nMax = o.nMax || 3, maxLines = o.maxLines || 9;
  const sT = v.stage({ x: [-1.4, 30], y: [-0.7, nMax - 0.3], axes: false, height: o.tHeight || 40 * nMax + 46, full: true, title: 'schedule: one column per scheduler step, coloured by region (a dot marks who moved)' });
  const sC = v.stage({ x: [0, 1], y: [0, maxLines], axes: false, height: Math.max(210, 25 * maxLines + 46), full: true, title: 'the program (each process shows where its pc is)' });
  const reset = () => { Z.spec = getSpec(); Z.S = Z.spec.init(); Z.hist = [{ p: -1, reg: Z.spec.regs(Z.S), bad: false }]; };
  Z.reset = reset;
  const act = (p) => {
    if (Z.spec !== getSpec()) reset();
    Z.spec.step(Z.S, p);
    Z.hist.push({ p, reg: Z.spec.regs(Z.S), bad: nCrit(Z.spec, Z.S) >= 2, S: Z.S.pc.slice() });
  };
  Z.act = act;
  Z.run = (ps) => { for (const p of ps) act(p); };
  Z.explore = () => { const sp = getSpec(); if (!Z.cache.has(sp.id)) Z.cache.set(sp.id, explore(o.exploreSpec ? o.exploreSpec(sp) : sp, { limit: o.limit || 120000 })); Z.ex = Z.cache.get(sp.id); return Z.ex; };
  Z.btn = [];
  for (let p = 0; p < nMax; p++) Z.btn.push(v.button(`step P${p}`, () => act(p)));
  v.button('20 random steps', () => { if (Z.spec !== getSpec()) reset(); const r = mulberry32(1000 + Z.seed++); for (let k = 0; k < 20; k++) act(Math.floor(r() * Z.spec.n)); });
  v.button('reset', () => reset());
  if (o.explorer !== false) {
    Z.exBtn = v.button('explore every schedule', () => { Z.explore(); });
    Z.replay = v.button('replay the shortest failing schedule', () => {
      const ex = Z.explore(), h = ex.bad >= 0 ? ex.bad : ex.dead >= 0 ? ex.dead : ex.solo;
      if (h < 0) return;
      reset(); let w = ex.path(h);
      if (ex.bad < 0 && ex.dead < 0 && ex.solo >= 0) w = w.concat(Array(8 * Z.spec.prog.length).fill(ex.soloP)); // the lone process spins
      if (ex.bad < 0 && ex.dead >= 0) w = w.concat(range(Z.spec.n * 2).map((k) => k % Z.spec.n));
      Z.run(w.slice(0, 200));
    });
  }
  reset();
  if (o.warm !== 0) { const r0 = mulberry32(5); for (let k = 0; k < (o.warm || 16); k++) act(Math.floor(r0() * Z.spec.n)); }
  v.render(() => {
    if (Z.spec !== getSpec()) { Z.spec = getSpec(); reset(); }
    const spec = Z.spec, n = spec.n, H = Z.hist, X1 = Math.max(30, H.length + 1);
    Z.btn.forEach((b, p) => { b.hidden = p >= n; });
    if (Z.replay) { Z.ex = Z.cache.get(spec.id) || null; Z.replay.hidden = !(Z.ex && (Z.ex.bad >= 0 || Z.ex.dead >= 0 || Z.ex.solo >= 0)); }
    sT.setView([-1.4, X1], [-0.7, nMax - 0.3]);
    const yOf = (i) => nMax - 1 - i;
    for (let i = 0; i < n; i++) {
      sT.text(`P${i}`, -0.3, yOf(i), { align: 'right', size: 14, color: 'ink' });
      sT.line(0, yOf(i), X1, yOf(i), { color: 'grid', width: 1 });
    }
    H.forEach((h, k) => {
      if (h.bad) sT.vband(k, k + 1, { color: 'red', alpha: 0.2 });
      for (let i = 0; i < n; i++) {
        const c = REGCOL[h.reg[i]];
        sT.rect(k + 0.06, yOf(i) - 0.3, k + 0.94, yOf(i) + 0.3, { fill: c, fillAlpha: h.reg[i] === 'R' ? 0.28 : 0.7, color: c, width: 0.8, radius: 2 });
        if (h.p === i) sT.dot(k + 0.5, yOf(i), { r: 2.6, color: 'ink' });
      }
    });
    const bad = H.findIndex((h) => h.bad);
    if (bad >= 0) sT.text('two processes in the critical section', bad + 1.2, nMax - 0.45, { align: 'left', color: 'red', size: 13, halo: true });
    // pseudocode panel
    sC.setView([0, 1], [0, maxLines]);
    const L = spec.lines.length;
    spec.lines.forEach((t, k) => {
      const y = maxLines - 0.5 - k;
      const here = range(n).filter((p) => Z.S.pc[p] === k);
      sC.rect(0.0, y - 0.42, 1, y + 0.42, { fill: 'grid', fillAlpha: here.length ? 0.2 : 0, stroke: false });
      sC.text(t, 0.17, y, { align: 'left', size: 14, color: spec.prog[k].reg === 'C' ? 'accent' : 'ink', math: false });
      here.forEach((p, idx) => sC.text(`P${p}`, 0.02 + idx * 0.055, y, { align: 'left', size: 13, color: REGCOL[spec.prog[k].reg] === 'faint' ? 'muted' : REGCOL[spec.prog[k].reg], plate: true }));
    });
    void L;
  });
  v.legend([['faint', 'remainder', { area: true }], ['orange', 'trying', { area: true }], ['accent', 'critical section', { area: true }], ['purple', 'exit', { area: true }]]);
  Z.status = () => {
    const spec = Z.spec, H = Z.hist, steps = H.length - 1;
    const crit = Z.S.pc.map((c, p) => (spec.prog[c].reg === 'C' ? p : -1)).filter((p) => p >= 0);
    const bad = H.filter((h) => h.bad).length;
    return `After ${steps} steps: ${spec.show(Z.S)}. In the critical section: ${crit.length ? crit.map((p) => 'P' + p).join(', ') : 'nobody'}. ${bad ? `**Mutual exclusion violated in ${bad} steps.**` : 'No violation so far.'}`;
  };
  Z.exText = () => {
    const ex = Z.cache.get(Z.spec.id);
    if (!ex) return 'Press “explore every schedule” to search all interleavings.';
    const bits = [`${ex.count}${ex.capped ? '+' : ''} reachable states`];
    bits.push(ex.bad >= 0 ? `**mutual exclusion fails** (shortest bad schedule: ${ex.path(ex.bad).length} steps)` : 'mutual exclusion holds in all of them');
    bits.push(ex.dead >= 0 ? `**deadlock** reachable after ${ex.path(ex.dead).length} steps` : 'no deadlock');
    if (ex.solo >= 0) bits.push(`**P${ex.soloP} can be stuck although nobody else wants in** (after ${ex.path(ex.solo).length} steps)`);
    return bits.join('; ') + '.';
  };
  return Z;
}

// ============================================================================= histories of register operations: linearizability and sequential consistency
// An operation is {p: process, reg: 'x', kind: 'w' | 'r', val, s: start, e: end}. Registers start at 0.

/**
 * Search for a legal sequential order of ops. mode 'lin': the order must respect real time (a op ending before b starts comes first);
 * mode 'sc': it must only respect each process's own order (by start time). Returns {ok, order: [indices]} (depth-first with memoisation, ≤ ~12 ops).
 */
export function checkHistory(ops, mode = 'lin') {
  const m = ops.length, regs = [...new Set(ops.map((o) => o.reg))];
  const pre = ops.map((b, j) => { let mask = 0; ops.forEach((a, i) => { if (i === j) return; const before = mode === 'lin' ? a.e < b.s : a.p === b.p && a.s < b.s; if (before) mask |= 1 << i; }); return mask; });
  const dead = new Set(), order = [];
  const dfs = (done, st) => {
    if (done === (1 << m) - 1) return true;
    const key = done + '|' + st.join(',');
    if (dead.has(key)) return false;
    for (let j = 0; j < m; j++) {
      if (done & (1 << j) || (pre[j] & ~done)) continue;
      const o = ops[j], ri = regs.indexOf(o.reg);
      if (o.kind === 'r' && st[ri] !== o.val) continue;
      const st2 = st.slice(); if (o.kind === 'w') st2[ri] = o.val;
      order.push(j);
      if (dfs(done | (1 << j), st2)) return true;
      order.pop();
    }
    dead.add(key); return false;
  };
  const ok = dfs(0, regs.map(() => 0));
  return { ok, order: ok ? order.slice() : [] };
}

/** Times for linearization points: increasing times t_k inside [s, e] of the k-th operation of `order` (greedy), or null if impossible. */
export function pointTimes(ops, order) {
  const t = []; let last = -Infinity;
  for (const j of order) { const x = Math.max(last + 0.02, ops[j].s); if (x > ops[j].e + 1e-9) return null; t.push(x); last = x; }
  return t;
}

export const opLabel = (o, withReg = true) => (o.kind === 'w' ? `w(${withReg ? o.reg + ',' : ''}${o.val})` : `r(${withReg ? o.reg : ''})→${o.val}`);

/** Draw operation intervals on process lanes. o: {names, color(i), height, hl: Set of op indices, dim, labelReg}. */
export function drawHistory(s, ops, nProc, T, o = {}) {
  for (let p = 0; p < nProc; p++) {
    const y = nProc - 1 - p;
    s.line(0, y, T, y, { color: 'grid', width: 1 });
    s.text(o.names ? o.names[p] : `P${p}`, -0.15, y, { align: 'right', size: 14, color: 'ink' });
  }
  ops.forEach((op, i) => {
    const y = nProc - 1 - op.p, h = 0.27, col = o.color ? o.color(i) : (op.kind === 'w' ? 'accent' : 'orange');
    s.rect(op.s, y - h, op.e, y + h, { fill: col, fillAlpha: o.hl && o.hl.has(i) ? 0.55 : 0.28, color: col, width: o.hl && o.hl.has(i) ? 2.4 : 1.4, radius: 4 });
    s.text(opLabel(op, o.labelReg !== false), op.s + 0.16, y, { align: 'left', size: 12.5, color: 'ink', math: false, halo: false });
  });
}

/** Draggable interval ends for up to `cap` operations; edit() returns the live ops array. Call once while building the viz. */
export function historyEditor(s, cap, state, o = {}) {
  const hs = [];
  for (let i = 0; i < cap; i++) {
    const a = s.handle(0, 0, { color: 'ink', r: 6, constrain: 'x' }), b = s.handle(0, 0, { color: 'ink', r: 6, constrain: 'x' });
    a.onDrag = () => { const op = state.ops[i]; if (op) { op.s = clamp(Math.round(a.x * 10) / 10, 0, op.e - 0.4); o.onChange && o.onChange(); } };
    b.onDrag = () => { const op = state.ops[i]; if (op) { op.e = clamp(Math.round(b.x * 10) / 10, op.s + 0.4, o.T || 10); o.onChange && o.onChange(); } };
    hs.push([a, b]);
  }
  const sync = () => hs.forEach(([a, b], i) => {
    const op = state.ops[i];
    a.visible = b.visible = !!op && !o.locked;
    if (op) { const y = state.nProc - 1 - op.p; a.set(op.s, y); b.set(op.e, y); }
  });
  return { sync, hs };
}


/** Operations whose removal makes a non-conforming history conform (the ones "responsible" for the failure). */
export function culprits(ops, mode) {
  const out = new Set();
  ops.forEach((_, i) => { if (checkHistory(ops.filter((__, j) => j !== i), mode).ok) out.add(i); });
  return out;
}

/**
 * The interactive history picture of items 4.8 and 4.9: presets {value, label, nProc, ops}, draggable interval ends, click an operation to cycle its value.
 * o.mode 'lin' shows linearization points and the sequential tape; 'sc' shows both verdicts and the sequentially consistent order.
 * Returns {st, res(), text()}; the caller supplies the readout.
 */
export function histViz(v, o) {
  const T = 10, st = { ops: [], nProc: 3 }, cl = (ops) => ops.map((x) => ({ ...x }));
  const load = (key) => { const P = o.presets.find((q) => q.value === key); st.ops = cl(P.ops); st.nProc = P.nProc; };
  const maxP = Math.max(...o.presets.map((q) => q.nProc));
  const pre = v.select('history', o.presets.map((q) => ({ value: q.value, label: q.label })), o.presets[0].value, { onChange: (x) => load(typeof x === 'string' ? x : pre.value) });
  load(o.presets[0].value);
  const s = v.stage({ x: [-0.9, T + 0.2], y: [-0.7, maxP - 0.3], axes: false, height: 66 * maxP + 56, full: true, title: o.title || 'a history: each operation is an interval from invocation to response (drag its ends; click it to change its value)' });
  const ed = historyEditor(s, 10, st, { T });
  s.onClick((x, y) => {
    st.ops.forEach((op) => { if (x >= op.s && x <= op.e && Math.abs(y - (st.nProc - 1 - op.p)) < 0.3) op.val = (op.val + 1) % 4; });
  });
  v.button('reset this history', () => load(pre.value));
  const tape = o.mode === 'lin' ? v.stage({ x: [0, 11], y: [0, 1], axes: false, height: 96, full: true, title: 'a sequential execution that explains it (the register after each operation)' }) : null;
  const R = { st, lin: null, sc: null, bad: new Set(), inv: null };
  v.render(() => {
    const ops = st.ops, np = st.nProc;
    s.setView([-0.9, T + 0.2], [-0.7, np - 0.3]);
    R.lin = checkHistory(ops, 'lin'); R.sc = checkHistory(ops, 'sc');
    const main = o.mode === 'lin' ? R.lin : R.sc;
    R.bad = main.ok ? new Set() : culprits(ops, o.mode === 'lin' ? 'lin' : 'sc');
    drawHistory(s, ops, np, T, { hl: R.bad, color: (i) => (R.bad.has(i) ? 'red' : ops[i].kind === 'w' ? 'accent' : 'orange') });
    R.inv = null;
    if (o.mode === 'lin' && R.lin.ok) {
      const ts = pointTimes(ops, R.lin.order);
      if (ts) {
        const pts = R.lin.order.map((j, k) => [ts[k], np - 1 - ops[j].p]);
        s.path(pts, { color: 'green', width: 1.6, dash: [5, 4], alpha: 0.8 });
        R.lin.order.forEach((j, k) => { s.dot(pts[k][0], pts[k][1], { r: 6, color: 'green' }); s.text(String(k + 1), pts[k][0], pts[k][1], { align: 'center', baseline: 'bottom', dy: -9, size: 12, color: 'green', halo: true }); });
      }
    }
    if (o.mode === 'sc' && R.sc.ok) {
      const pos = new Map(R.sc.order.map((j, k) => [j, k]));
      R.sc.order.forEach((j, k) => s.text(`#${k + 1}`, (ops[j].s + ops[j].e) / 2, np - 1 - ops[j].p, { align: 'center', baseline: 'bottom', dy: -17, size: 12, color: 'purple', halo: true }));
      if (!R.lin.ok) {
        for (const a of ops.keys()) for (const b of ops.keys()) if (!R.inv && ops[a].e < ops[b].s && pos.get(b) < pos.get(a)) R.inv = [a, b];
        if (R.inv) { const [a, b] = R.inv; s.arrow(ops[a].e, np - 1 - ops[a].p, ops[b].s, np - 1 - ops[b].p, { color: 'red', width: 2.2, dash: [6, 4] }); }
      }
    }
    s.corner(o.mode === 'lin' ? (R.lin.ok ? 'linearizable' : 'not linearizable') : `${R.lin.ok ? 'linearizable' : 'not linearizable'} · ${R.sc.ok ? 'sequentially consistent' : 'not sequentially consistent'}`, 'tr', { color: (o.mode === 'lin' ? R.lin.ok : R.sc.ok) ? 'green' : 'red', weight: 700, plate: true });
    ed.sync();
    if (tape) {
      const k = R.lin.ok ? R.lin.order.length : 0; let val = {};
      if (!R.lin.ok) tape.text('no sequential order is both legal for the register and consistent with real time', 5.5, 0.5, { align: 'center', size: 14, color: 'red' });
      else R.lin.order.forEach((j, q) => {
        const op = ops[j]; if (op.kind === 'w') val[op.reg] = op.val;
        const x0 = 0.2 + q * Math.min(1.9, 10.6 / k), w = Math.min(1.7, 10.6 / k - 0.2);
        tape.rect(x0, 0.15, x0 + w, 0.85, { fill: op.kind === 'w' ? 'accent' : 'orange', fillAlpha: 0.3, color: op.kind === 'w' ? 'accent' : 'orange', width: 1.4, radius: 4 });
        tape.text(opLabel(op, false), x0 + w / 2, 0.64, { align: 'center', size: 12.5, color: 'ink' });
        tape.text(`x = ${val.x ?? 0}${val.y !== undefined || ops.some((z) => z.reg === 'y') ? ', y = ' + (val.y ?? 0) : ''}`, x0 + w / 2, 0.3, { align: 'center', size: 11, color: 'muted' });
      });
    }
  });
  R.text = () => {
    const ops = st.ops, ord = (res) => res.order.map((j) => `P${ops[j].p}:${opLabel(ops[j], new Set(ops.map((z) => z.reg)).size > 1)}`).join(' → ');
    const L = R.lin, S = R.sc;
    if (o.mode === 'lin') return L.ok ? `**Linearizable.** One legal order inside the intervals: ${ord(L)}.` : `**Not linearizable.** No order of the ${ops.length} operations respects real time and gives every read the latest write. Operations whose removal would repair it: ${[...R.bad].map((i) => `P${ops[i].p}:${opLabel(ops[i], false)}`).join(', ') || 'none alone (several interact)'}.`;
    return `Linearizable: **${L.ok ? 'yes' : 'no'}**. Sequentially consistent: **${S.ok ? 'yes' : 'no'}**.${S.ok ? ` A program-order-respecting order: ${ord(S)}.` : ''}${R.inv ? ` In that order ${opLabel(ops[R.inv[1]], false)} on P${ops[R.inv[1]].p} comes before ${opLabel(ops[R.inv[0]], false)} on P${ops[R.inv[0]].p}, although the latter had already returned when the former began (red arrow): sequential consistency allows this, linearizability does not.` : ''}`;
  };
  return R;
}

export { PCOL };
