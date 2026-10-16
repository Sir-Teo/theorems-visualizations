// Political Science & Social Choice — Chapter 3 (part b): Muller–Satterthwaite to the papers of Arrow and May
import { CC, LET, sum, range, perms, rkStr, txt, chip, rr, FONT, kendall } from './ch01.shared.js';
import { arrowPx, pill, fmtK } from './ch02.shared.js';
import {
  R3, PAIRS3, pairName, popc, profilesOf, above, patternOf, relFromScores, relOfRanking, isWeakOrder, groupsOf,
  relFromTriple, tripleOf, WEAK3, ALLOW, drawBallot, drawRel, relText, tag,
} from './ch03.shared.js';

// ---------- local helpers
const pct = (a, d = 0) => `${(100 * a).toFixed(d)}%`;
function hl(v, c, x0, x1, Y, col, dash, w = 1.2) {
  c.save(); c.strokeStyle = v.color(col); c.lineWidth = w; if (dash) c.setLineDash(dash);
  c.beginPath(); c.moveTo(x0, Math.round(Y) + 0.5); c.lineTo(x1, Math.round(Y) + 0.5); c.stroke(); c.restore();
}
/** A ranking as a row of small chips. */
function chipRow(v, c, X, Y, r, rad = 6.5, gap = 15) { r.forEach((cand, k) => chip(v, c, X + k * gap, Y, cand, { r: rad })); }
function chipCol(v, c, X, Y, r, rad = 6.5, gap = 15) { r.forEach((cand, k) => chip(v, c, X, Y + k * gap, cand, { r: rad })); }
const lowerSet = (r, x) => r.slice(r.indexOf(x) + 1);
/** In every voter's ranking, x keeps everything it beat in P (x weakly rises relative to every rival). */
const xRises = (P, Q, x) => P.every((r, i) => { const L2 = new Set(lowerSet(Q[i], x)); return lowerSet(r, x).every((y) => L2.has(y)); });

export default {
  collection: 'polsci',
  chapter: 3,
  items: [
    // ───────────────────────────────────────────────────────────── 3.8
    {
      num: '3.8',
      kind: 'Theorem',
      name: 'Muller–Satterthwaite theorem',
      statement: String.raw`Let a resolute social choice function $F$ pick one winner from every profile of strict rankings of at least three alternatives. Suppose $F$ is
(a) **unanimous**: if every voter ranks $x$ first, $F$ chooses $x$ (equivalently here, weakly Paretian or onto);
(b) **strongly monotonic** (Maskin monotonic, Muller and Satterthwaite’s *strong positive association*): if $F(P) = x$ and $P'$ is a profile in which, for every voter, every alternative ranked below $x$ in $P$ is still ranked below $x$, then $F(P') = x$.
Then $F$ is a dictatorship. With two alternatives the conclusion fails — majority rule is unanimous and monotonic.`,
      idea: String.raw`Strong monotonicity is what strategy-proofness amounts to: if moving $x$ up in some voter’s ranking could change the winner, that voter would gain by switching between the two reports. Monotonicity also gives independence: the winner between $x$ and $y$ cannot depend on how voters rank anything else, once both are pushed to the top. That turns $F$ into an Arrovian social welfare function — rank $x$ above $y$ when $F$ picks $x$ after both are moved to the top of every ballot — which satisfies Pareto and IIA, so Arrow’s theorem (polsci-3.3) makes it dictatorial. Gibbard–Satterthwaite (polsci-3.6) follows by showing strategy-proofness implies (a) and (b).`,
      caption: String.raw`Left: a choice rule for two voters — each cell is a profile (voter 1’s ranking by row, voter 2’s by column) coloured by the winner. **Click a cell** to select it; click it again to change its winner. Gold dots mark the profiles that monotonicity forces to the same winner (the winner keeps or improves its position for both voters), red where the rule disobeys. Cells outlined red violate unanimity. Right: a backtracking search through every choice rule with the conditions you keep on, for 2 or 3 voters and 2 or 3 alternatives. With three alternatives only the dictatorships survive; with two, majority rule appears.`,
      deps: ['polsci-3.6', 'polsci-3.3'],
      see: ['polsci-3.6'],
      refs: ['T&P ch. 7', 'Muller & Satterthwaite (1977), J. Economic Theory 14: 412–418'],
      tags: ['monotonicity', 'strategy-proofness', 'dictatorship'],
      credit: 'Eitan Muller & Mark A. Satterthwaite, 1977',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Muller%E2%80%93Satterthwaite_theorem' },
      viz(v) {
        const Gd = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, minWidth: 360, title: 'a rule for two voters · click a cell, click again to change it' });
        const Sr = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, minWidth: 330, title: 'exhaustive search over choice rules' });
        const PROF = []; for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) PROF.push([R3[i], R3[j]]);
        const first = (s) => { let w = 0; for (let c = 1; c < s.length; c++) if (s[c] > s[w] + 1e-9) w = c; return w; };
        const PRE = {
          plurality: { label: 'plurality', f: (P) => Math.min(P[0][0], P[1][0]) },
          borda: { label: 'Borda', f: (P) => { const s = [0, 0, 0]; P.forEach((r) => r.forEach((c, k) => { s[c] += 2 - k; })); return first(s); } },
          veto: { label: 'veto', f: (P) => [0, 1, 2].find((x) => P.every((r) => r[2] !== x)) ?? 0 },
          d1: { label: 'dictator: voter 1', f: (P) => P[0][0] },
          d2: { label: 'dictator: voter 2', f: (P) => P[1][0] },
        };
        const pre = v.select('rule', Object.entries(PRE).map(([value, r]) => ({ value, label: r.label })), 'borda', { onChange: () => load() });
        const uT = v.toggle('unanimity', true);
        const mT = v.toggle('monotonicity', true);
        const nS = v.select('search: voters', [{ value: 2, label: '2' }, { value: 3, label: '3' }], 2);
        const aS = v.select('alternatives', [{ value: 2, label: '2' }, { value: 3, label: '3' }], 3);
        let F = [], sel = -1, custom = false, geo = null;
        function load() { F = PROF.map((P) => PRE[pre.value].f(P)); custom = false; sel = -1; }
        load();
        const forced = (k) => PROF.map((Q, j) => (j !== k && xRises(PROF[k], Q, F[k]) ? j : -1)).filter((j) => j >= 0);
        const analyse = () => {
          const unan = PROF.map((P, k) => (P[0][0] === P[1][0] && F[k] !== P[0][0] ? k : -1)).filter((k) => k >= 0);
          const mono = []; PROF.forEach((P, k) => forced(k).forEach((j) => { if (F[j] !== F[k]) mono.push([k, j]); }));
          return { unan, mono, dict: [0, 1].filter((i) => PROF.every((P, k) => F[k] === P[i][0])) };
        };
        Gd.onClick((x, y) => {
          if (!geo) return; const px = Gd.X(x), py = Gd.Y(y), j = Math.floor((px - geo.X0) / geo.s), i = Math.floor((py - geo.Y0) / geo.s);
          if (i < 0 || i > 5 || j < 0 || j > 5) return; const k = i * 6 + j;
          if (sel === k) { F[k] = (F[k] + 1) % 3; custom = true; } else sel = k;
        });
        // ---- backtracking search
        const cache = new Map();
        function search(n, m, unan, mono) {
          const key = `${n}${m}${unan}${mono}`; if (cache.has(key)) return cache.get(key);
          const R = perms(m), profs = profilesOf(n, R), N = profs.length, t0 = Date.now();
          const unanF = profs.map((p) => (p.every((r) => r[0] === p[0][0]) ? p[0][0] : -1));
          if (!mono) {
            const free = unanF.filter((x) => (unan ? x < 0 : true)).length;
            const out = { count: Math.pow(m, free), exact: true, free, N, sols: [], ms: 0, profs, R };
            cache.set(key, out); return out;
          }
          const imp = profs.map((P) => range(m).map((x) => profs.map((Q, j) => (Q !== P && xRises(P, Q, x) ? j : -1)).filter((j) => j >= 0)));
          const G = Array(N).fill(-1); let count = 0, nodes = 0; const sols = [];
          const assign = (i, x, trail) => {
            const st = [[i, x]];
            while (st.length) {
              const [a, y] = st.pop(); if (G[a] === y) continue; if (G[a] !== -1) return false;
              G[a] = y; trail.push(a);
              for (const b of imp[a][y]) { if (G[b] === -1) st.push([b, y]); else if (G[b] !== y) return false; }
            }
            return true;
          };
          let ok = true;
          if (unan) { const tr = []; for (let i = 0; i < N && ok; i++) if (unanF[i] >= 0) ok = assign(i, unanF[i], tr); }
          const go = () => {
            nodes++; const i = G.indexOf(-1);
            if (i < 0) { count++; if (sols.length < 8) sols.push(G.slice()); return; }
            for (let x = 0; x < m; x++) { const tr = []; if (assign(i, x, tr)) go(); for (const a of tr) G[a] = -1; }
          };
          if (ok) go();
          const out = { count, nodes, sols, N, ms: Date.now() - t0, profs, R };
          cache.set(key, out); return out;
        }
        const classify = (sol, S, n, m) => {
          for (let i = 0; i < n; i++) if (S.profs.every((p, k) => sol[k] === p[i][0])) return { label: `dictator: voter ${i + 1}`, col: 'red' };
          if (new Set(sol).size === 1) return { label: `constant: always ${LET[sol[0]]}`, col: 'muted' };
          if (m === 2 && S.profs.every((p, k) => sol[k] === (p.filter((r) => r[0] === 0).length * 2 > n ? 0 : 1))) return { label: 'majority', col: 'green' };
          if (new Set(sol).size < m) return { label: `never picks ${range(m).filter((x) => !sol.includes(x)).map((x) => LET[x]).join(', ')}`, col: 'ink' };
          return { label: 'other', col: 'ink' };
        };
        v.render(() => {
          const A = analyse(), c = Gd.ctx, W = Gd.width, H = Gd.height;
          const s = Math.min(46, (W - 110) / 6, (H - 150) / 6), X0 = Math.max(70, (W - 6 * s) / 2 + 10), Y0 = 70;
          geo = { X0, Y0, s };
          for (let k = 0; k < 6; k++) { chipRow(v, c, X0 - 52, Y0 + (k + 0.5) * s, R3[k], 6, 15); chipCol(v, c, X0 + (k + 0.5) * s, Y0 - 50, R3[k], 6, 14); }
          txt(v, c, 'voter 1 ↓', X0 - 34, Y0 - 60, { size: 10.5, weight: 700, color: 'muted' });
          txt(v, c, 'voter 2 →', X0 + 6 * s + 4, Y0 - 36, { size: 10.5, weight: 700, color: 'muted', align: 'left' });
          const fz = sel >= 0 ? forced(sel) : [];
          PROF.forEach((P, k) => {
            const i = Math.floor(k / 6), j = k % 6, X = X0 + j * s, Y = Y0 + i * s, w = F[k];
            c.fillStyle = v.color(CC[w], k === sel ? 0.7 : 0.38); c.fillRect(X + 1, Y + 1, s - 2, s - 2);
            txt(v, c, LET[w], X + s / 2, Y + s / 2, { size: Math.min(15, s * 0.36), weight: 750, color: 'ink' });
            if (A.unan.includes(k)) { c.strokeStyle = v.color('red'); c.lineWidth = 2.4; c.strokeRect(X + 2.5, Y + 2.5, s - 5, s - 5); }
            if (fz.includes(k)) { c.beginPath(); c.arc(X + s - 8, Y + 8, 4.2, 0, 2 * Math.PI); c.fillStyle = v.color(F[k] === F[sel] ? 'gold' : 'red'); c.fill(); }
          });
          if (sel >= 0) { const i = Math.floor(sel / 6), j = sel % 6; c.strokeStyle = v.color('ink'); c.lineWidth = 2.6; c.strokeRect(X0 + j * s + 1, Y0 + i * s + 1, s - 2, s - 2); }
          else if (A.mono.length) {
            const [k1, k2] = A.mono[0], p = [X0 + (k1 % 6 + 0.5) * s, Y0 + (Math.floor(k1 / 6) + 0.5) * s], q = [X0 + (k2 % 6 + 0.5) * s, Y0 + (Math.floor(k2 / 6) + 0.5) * s];
            for (const [X, Y] of [p, q]) { c.save(); c.strokeStyle = v.color('red'); c.lineWidth = 2.6; c.setLineDash([5, 3]); c.strokeRect(X - s / 2 + 2, Y - s / 2 + 2, s - 4, s - 4); c.restore(); }
            arrowPx(v, c, p[0], p[1] + s * 0.28, q[0], q[1] + s * 0.28, { color: 'red', width: 2.4, t0: 4, t1: 4, head: 9, bend: Math.max(16, Math.hypot(p[0] - q[0], p[1] - q[1]) * 0.35) });
          }
          const yb = Y0 + 6 * s + 18;
          tag(v, c, A.unan.length === 0, A.unan.length ? `unanimity: ${A.unan.length} cells wrong` : 'unanimous', 14, yb);
          tag(v, c, A.mono.length === 0, A.mono.length ? `monotonicity: ${A.mono.length} violations` : 'monotonic', 14, yb + 28);
          txt(v, c, A.dict.length ? `dictator: voter ${A.dict[0] + 1}` : custom ? 'your rule' : PRE[pre.value].label, W - 12, yb + 14, { size: 12, weight: 750, color: A.dict.length ? 'red' : 'ink', align: 'right' });
          // ---- search panel
          const d = Sr.ctx, SW = Sr.width, SH = Sr.height, n = nS.value, m = aS.value, S = search(n, m, uT.value, mT.value);
          txt(v, d, `${n} voters · ${m} alternatives · ${S.N} profiles`, 14, 18, { size: 11.5, weight: 650, color: 'muted', align: 'left' });
          txt(v, d, `rules searched: ${m}^${S.N} = ${m ** S.N > 1e15 ? `${(S.N * Math.log10(m)).toFixed(0)}-digit number` : fmtK(m ** S.N)}`, 14, 38, { size: 11.5, weight: 600, align: 'left' });
          const conds = [uT.value && 'unanimous', mT.value && 'monotonic'].filter(Boolean).join(' and ') || 'any rule';
          txt(v, d, `${conds}:`, 14, 66, { size: 12, weight: 650, align: 'left' });
          const big = S.count > 1e15 ? `${m}^${S.free} ≈ 10^${(S.free * Math.log10(m)).toFixed(0)}` : fmtK(S.count);
          txt(v, d, big, 14, 96, { size: 28, weight: 800, color: mT.value && uT.value && m === 3 ? 'red' : 'ink', align: 'left' });
          txt(v, d, mT.value ? `rules (${S.nodes} search nodes, ${S.ms} ms)` : 'rules (counted, not listed)', 14, 122, { size: 10.5, color: 'muted', align: 'left' });
          if (S.sols.length) {
            const cols = 2, cw = (SW - 24) / cols, R = S.R, rowsN = R.length, colsN = R.length ** (n - 1);
            const cs = Math.max(2, Math.min(13, (cw - 20) / colsN, 80 / rowsN));
            S.sols.slice(0, 6).forEach((sol, k) => {
              const X0b = 12 + (k % cols) * cw, Y0b = 142 + Math.floor(k / cols) * (rowsN * cs + 34);
              if (Y0b + rowsN * cs + 20 > SH) return;
              const cl = classify(sol, S, n, m);
              txt(v, d, cl.label, X0b, Y0b, { size: 10.5, weight: 700, color: cl.col, align: 'left' });
              sol.forEach((w, q) => { const i = Math.floor(q / colsN), j = q % colsN; d.fillStyle = v.color(CC[w], 0.75); d.fillRect(X0b + j * cs, Y0b + 10 + i * cs, cs - (cs > 3 ? 1 : 0), cs - (cs > 3 ? 1 : 0)); });
            });
          } else if (!mT.value) {
            txt(v, d, 'without monotonicity there are far too many', 14, 160, { size: 11.5, weight: 600, color: 'muted', align: 'left' });
            txt(v, d, 'rules to list — plurality, Borda and veto among them', 14, 178, { size: 11.5, weight: 600, color: 'muted', align: 'left' });
          }
        });
        v.legend([['blue', 'A wins', { dot: true }], ['orange', 'B wins', { dot: true }], ['purple', 'C wins', { dot: true }], ['gold', 'forced by monotonicity', { dot: true }], ['red', 'violation']]);
        v.readout(() => {
          const A = analyse(), S = search(nS.value, aS.value, uT.value, mT.value);
          let s1;
          if (A.mono.length) {
            const [k1, k2] = A.mono[0], w = F[k1];
            s1 = `Monotonicity fails: at (${rkStr(PROF[k1][0], '')}, ${rkStr(PROF[k1][1], '')}) ${LET[w]} wins; at (${rkStr(PROF[k2][0], '')}, ${rkStr(PROF[k2][1], '')}) ${LET[w]} has lost no ground against anyone, yet ${LET[F[k2]]} wins (red arrow) — a voter could exploit the switch.`;
          } else if (A.unan.length) s1 = `Unanimity fails in ${A.unan.length} cells.`;
          else s1 = A.dict.length ? `This rule is unanimous and monotonic — and it is the dictatorship of voter ${A.dict[0] + 1}.` : 'Unanimous and monotonic.';
          const sols = S.sols.map((sol) => classify(sol, S, nS.value, aS.value).label);
          const s2 = mT.value ? ` Search (${nS.value} voters, ${aS.value} alternatives): **${fmtK(S.count)}** rule${S.count === 1 ? '' : 's'} ${uT.value ? 'unanimous and ' : ''}monotonic${S.count && S.count <= 8 ? `: ${sols.join('; ')}` : ''}.` : '';
          return s1 + s2;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 3.9
    {
      num: '3.9',
      kind: 'Theorem',
      name: 'Approval voting is strategy-proof for dichotomous voters',
      statement: String.raw`Under approval voting each voter approves any set of candidates and the candidate with the most approvals wins (ties broken by a fixed order). A voter is **dichotomous** if she splits the candidates into liked and disliked ones and is indifferent within each group; her **sincere** ballot approves exactly the liked candidates. If every voter is dichotomous, the sincere ballot is a dominant strategy: whatever the others do, no other ballot gives her a winner she likes better. With three or more preference levels this fails: a voter with a middle candidate has two sincere ballots (approve the top, or the top and the middle), and which one is better depends on how the others vote.`,
      idea: String.raw`Compare any ballot $B$ with the sincere ballot $S$ (the liked set). Switching from $S$ to $B$ can only *lower* the scores of liked candidates (fewer approvals) and *raise* the scores of disliked ones. So if the sincere outcome is a liked candidate, nothing can improve on it; if it is disliked, every liked candidate falls further behind the winner under $B$, so no liked candidate can win under $B$ either — the tie-break order is the same in both. That argument breaks as soon as there is a middle candidate $m$: approving $m$ may help $m$ beat a disliked frontrunner (good) or let $m$ overtake the favourite (bad). Approval voting thus escapes Gibbard–Satterthwaite (polsci-3.6) exactly on the restricted domain of dichotomous preferences.`,
      caption: String.raw`Five voters, four candidates. In the table, a green disc is a liked candidate, gold a middle one, faint a disliked one; ticks show the ballots cast (others approve what they like). **Click a disc** to change that voter’s opinion; click a row number to choose whose ballot to explore. Right: the chosen voter’s 16 possible ballots, each with the winner it produces, tinted by how much she likes that winner; the outlined ballots are sincere, and ★ marks the best ones. With dichotomous voters the sincere ballot always carries a ★ — an exhaustive check over all electorates of three voters confirms it. Switch on *middle level* to see the sincere ballots stop being dominant.`,
      deps: ['polsci-1.8', 'polsci-3.6'],
      see: ['polsci-1.8'],
      refs: ['T&P ch. 1', 'Brams & Fishburn (1978), Approval voting, American Political Science Review 72: 831–847'],
      tags: ['approval voting', 'strategy-proofness', 'dichotomous preferences'],
      credit: 'Steven J. Brams & Peter C. Fishburn, 1978',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Approval_voting' },
      viz(v) {
        const T = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, minWidth: 330, title: 'opinions and ballots · click a disc or a row number' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, minWidth: 380, weight: 1.2, title: 'every ballot the chosen voter could cast' });
        const m = 4, n = 5;
        const DI = [[2, 2, 0, 0], [0, 0, 2, 0], [0, 2, 2, 0], [2, 0, 0, 2], [0, 0, 0, 2]];
        const TRI = [[2, 1, 0, 0], [0, 0, 2, 1], [0, 2, 1, 0], [2, 0, 1, 2], [1, 0, 0, 2]];
        let U = DI.map((r) => r.slice()), sel = 0, geo = null;
        const tri = v.toggle('middle level', false, { onChange: (val) => { U = (val ? TRI : DI).map((r) => r.slice()); } });
        v.button('Shuffle opinions', () => { const r = v.rng(Math.floor(Math.random() * 1e6)); U = U.map(() => { let row; do { row = range(m).map(() => (tri.value ? Math.floor(r() * 3) : r() < 0.4 ? 2 : 0)); } while (row.every((x) => x === row[0])); return row; }); });
        const sincere = (u) => u.reduce((s, x, c) => s | (x === 2 ? 1 << c : 0), 0);
        const winner = (masks) => { const s = Array(m).fill(0); masks.forEach((mk) => { for (let c = 0; c < m; c++) if (mk & (1 << c)) s[c]++; }); let w = 0; for (let c = 1; c < m; c++) if (s[c] > s[w]) w = c; return { w, s }; };
        T.onClick((x, y) => {
          if (!geo) return; const px = T.X(x), py = T.Y(y), i = Math.floor((py - geo.Y0) / geo.rh);
          if (i < 0 || i >= n) return;
          if (px < geo.X0 - 10) { sel = i; return; }
          const c = Math.floor((px - geo.X0) / geo.cw); if (c < 0 || c >= m) return;
          const cur = U[i][c]; U[i][c] = tri.value ? (cur + 2) % 3 : 2 - cur; sel = i;
        });
        // exhaustive check: 3 voters, 3 candidates
        let exh = {};
        const exhaust = (mode) => {
          if (exh[mode]) return exh[mode];
          const k = 3, win3 = (masks) => { const s = [0, 0, 0]; masks.forEach((mk) => { for (let c = 0; c < 3; c++) if (mk & (1 << c)) s[c]++; }); let w = 0; for (let c = 1; c < 3; c++) if (s[c] > s[w]) w = c; return w; };
          let cases = 0, gains = 0, topBad = 0, twoBad = 0;
          if (mode === 'di') {
            const types = [1, 2, 3, 4, 5, 6];
            for (const a of types) for (const b of types) for (const c of types) {
              const P = [a, b, c];
              for (let i = 0; i < k; i++) {
                cases++; const ut = (w) => ((P[i] >> w) & 1);
                const base = ut(win3(P));
                for (let mk = 0; mk < 8; mk++) { const Q = P.slice(); Q[i] = mk; if (ut(win3(Q)) > base) { gains++; break; } }
              }
            }
          } else {
            for (const a of R3) for (const b of R3) for (const c of R3) {
              const P = [a, b, c], cast = P.map((r) => 1 << r[0]);
              for (let i = 0; i < k; i++) {
                cases++; const ut = (w) => 2 - P[i].indexOf(w);
                const best = Math.max(...range(8).map((mk) => { const Q = cast.slice(); Q[i] = mk; return ut(win3(Q)); }));
                const top = cast.slice(); top[i] = 1 << P[i][0]; const two = cast.slice(); two[i] = (1 << P[i][0]) | (1 << P[i][1]);
                if (ut(win3(top)) < best) topBad++; if (ut(win3(two)) < best) twoBad++;
              }
            }
          }
          exh[mode] = { cases, gains, topBad, twoBad }; return exh[mode];
        };
        const model = () => {
          const cast = U.map(sincere), Wd = winner(cast), u = U[sel];
          const opts = range(16).map((mk) => { const Q = cast.slice(); Q[sel] = mk; const r = winner(Q); return { mk, w: r.w, ut: u[r.w] }; });
          const best = Math.max(...opts.map((o) => o.ut));
          const sinc = tri.value ? [sincere(u), sincere(u) | u.reduce((s, x, c) => s | (x === 1 ? 1 << c : 0), 0)] : [sincere(u)];
          return { cast, Wd, opts, best, sinc: [...new Set(sinc)] };
        };
        const LV = (x) => (x === 2 ? 'green' : x === 1 ? 'gold' : 'faint');
        v.render(() => {
          const M = model(), c = T.ctx, W = T.width, H = T.height;
          const X0 = 70, cw = Math.min(58, (W - 100) / m), rh = Math.min(40, (H - 120) / n), Y0 = 44;
          geo = { X0, cw, rh, Y0 };
          range(m).forEach((cand) => chip(v, c, X0 + (cand + 0.5) * cw, 22, cand, { r: 11 }));
          U.forEach((row, i) => {
            const Y = Y0 + (i + 0.5) * rh;
            if (i === sel) { rr(c, 8, Y - rh / 2 + 2, W - 16, rh - 4, 8); c.fillStyle = v.color('accent', 0.1); c.fill(); }
            txt(v, c, `voter ${i + 1}`, 40, Y, { size: 11, weight: i === sel ? 800 : 600, color: i === sel ? 'accent' : 'muted' });
            row.forEach((x, cand) => {
              const X = X0 + (cand + 0.5) * cw;
              c.beginPath(); c.arc(X, Y, 11, 0, 2 * Math.PI); c.fillStyle = v.color(LV(x), x === 0 ? 0.35 : 0.6); c.fill();
              if (M.cast[i] & (1 << cand)) txt(v, c, '✓', X, Y + 1, { size: 13, weight: 800, color: 'ink' });
            });
          });
          // approval totals
          const yT = Y0 + n * rh + 18;
          txt(v, c, 'approvals', 40, yT + 12, { size: 10.5, weight: 650, color: 'muted' });
          const mx = Math.max(...M.Wd.s, 1);
          range(m).forEach((cand) => {
            const X = X0 + (cand + 0.5) * cw, h = (M.Wd.s[cand] / mx) * 40;
            rr(c, X - 10, yT + 40 - h, 20, Math.max(2, h), 3); c.fillStyle = v.color(CC[cand], cand === M.Wd.w ? 0.85 : 0.35); c.fill();
            txt(v, c, String(M.Wd.s[cand]), X, yT + 50, { size: 11, weight: 700 });
          });
          txt(v, c, `winner: ${LET[M.Wd.w]}`, W - 14, yT + 12, { size: 12, weight: 750, color: 'ink', align: 'right' });
          // ---- ballots of the chosen voter
          const d = B.ctx, BW = B.width, BH = B.height, cols = 4, cwB = (BW - 20) / cols, chB = Math.min(64, (BH - 50) / 4);
          txt(v, d, `voter ${sel + 1}: ${tri.value ? 'two sincere ballots (outlined)' : 'one sincere ballot (outlined)'}`, 12, 14, { size: 11, weight: 650, color: 'muted', align: 'left' });
          M.opts.forEach((o, k) => {
            const X = 10 + (k % cols) * cwB, Y = 28 + Math.floor(k / cols) * chB, isS = M.sinc.includes(o.mk), isB = o.ut === M.best;
            rr(d, X + 3, Y + 3, cwB - 6, chB - 6, 8); d.fillStyle = v.color(LV(o.ut), o.ut === 0 ? 0.12 : 0.22); d.fill();
            d.strokeStyle = v.color(isS ? 'accent' : 'faint'); d.lineWidth = isS ? 2.6 : 1; d.stroke();
            range(m).forEach((cand) => { const bx = X + 16 + cand * 15, by = Y + 17; d.fillStyle = v.color(o.mk & (1 << cand) ? CC[cand] : 'faint', o.mk & (1 << cand) ? 0.85 : 0.25); d.fillRect(bx - 5.5, by - 5.5, 11, 11); });
            if (isB) txt(v, d, '★', X + cwB - 15, Y + 16, { size: 13, weight: 800, color: 'gold' });
            txt(v, d, '→', X + 15, Y + chB - 21, { size: 11, weight: 700, color: 'muted' });
            chip(v, d, X + 32, Y + chB - 21, o.w, { r: 8.5 });
            txt(v, d, o.ut === 2 ? 'liked' : o.ut === 1 ? 'middle' : 'disliked', X + 45, Y + chB - 21, { size: 9.5, weight: 650, color: o.ut === 0 ? 'muted' : 'ink', align: 'left' });
          });
        });
        v.legend([['green', 'liked', { dot: true }], ['gold', 'middle', { dot: true }], ['faint', 'disliked', { dot: true }], ['accent', 'sincere ballot'], ['gold', '★ best response']]);
        v.readout(() => {
          const M = model(), sBest = M.sinc.map((mk) => M.opts[mk].ut === M.best);
          const E = exhaust(tri.value ? 'tri' : 'di');
          if (!tri.value) return `Voter ${sel + 1}’s sincere ballot ${sBest[0] ? 'is a best response' : 'is NOT a best response — impossible'}: its winner is ${M.opts[M.sinc[0]].ut === 2 ? 'liked' : 'disliked'}, and no ballot does better. Exhaustive check, 3 dichotomous voters and 3 candidates: **${E.gains}** of ${E.cases} voter-situations allow a gain over the sincere ballot.`;
          return `Voter ${sel + 1}: approving only liked candidates is ${sBest[0] ? '' : 'not '}optimal here; also approving the middle one is ${sBest[sBest.length - 1] ? '' : 'not '}optimal. Exhaustive check with a middle level (3 voters, 3 candidates, the others approving only their favourite): “approve the top” is beaten in **${E.topBad}** of ${E.cases} situations and “approve the top two” in **${E.twoBad}** — neither sincere ballot is dominant.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 3.10
    {
      num: '3.10',
      kind: 'Theorem',
      name: 'Young’s characterization of the Borda count',
      statement: String.raw`Consider choice correspondences, which map each finite electorate of ranked ballots over a fixed set of alternatives to a non-empty set of winners (ties allowed). The **Borda count** is the only one that is
(a) **neutral** (relabelling alternatives relabels the winners) and anonymous;
(b) **consistent** (Young’s reinforcement): if two disjoint electorates $E_1$, $E_2$ have winner sets $W_1$, $W_2$ with $W_1 \cap W_2 \neq \emptyset$, then $E_1 + E_2$ has winner set exactly $W_1 \cap W_2$;
(c) **faithful**: a single voter’s electorate elects her top choice alone;
(d) **cancellative**: if for every pair $x, y$ as many voters prefer $x$ to $y$ as $y$ to $x$, all alternatives tie.
Every positional scoring rule satisfies (a)–(b) (Smith, Young), and among them only Borda satisfies (d).`,
      idea: String.raw`Consistency for scores is automatic: totals add across electorates, so the common winners of two electorates have the highest combined score. Young showed that neutrality plus consistency (plus a mild continuity) force a *composite* scoring rule; cancellation then pins down the scores. A pair of opposite ballots $x \succ y \succ z$ and $z \succ y \succ x$ cancels every pairwise comparison, and under weights $(1, s, 0)$ it gives $x$ and $z$ one point each but $y$ a score of $2s$ — a three-way tie only at $s = \tfrac12$, the Borda weights. Condorcet methods such as Copeland and Kemeny’s rule are cancellative but not consistent, which is why no Condorcet method is a scoring rule (polsci-2.10, Saari’s geometric view of the same fact).`,
      caption: String.raw`Left: build a cancelling electorate from blocks — a ballot together with its reverse — by clicking the + and − buttons; every pairwise contest is then a tie. The bars show the scores under positional weights $(1, s, 0)$; drag $s$: only $s = \tfrac12$ (Borda) ties all three. Right: two electorates and their union under the chosen rule. For rules that are not consistent the page searches random pairs and shows one where the two electorates agree on a winner but the union does not elect it. The table checks the four axioms for each rule, by exhaustive or random search.`,
      deps: ['polsci-2.10', 'polsci-1.5', 'polsci-1.10'],
      see: ['polsci-3.11'],
      refs: ['Saari', 'Young (1974), An axiomatization of Borda’s rule, J. Economic Theory 9: 43–52'],
      tags: ['Borda', 'consistency', 'axioms'],
      credit: 'H. Peyton Young, 1974',
      viz(v) {
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, minWidth: 340, title: 'a cancelling electorate · click + / −' });
        const Cn = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, minWidth: 380, weight: 1.15, title: 'consistency: two electorates and their union' });
        const Tb = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 190, full: true, title: 'Young’s axioms, checked' });
        const sS = v.slider('second-place weight $s$', 0, 1, 0.3, { step: 0.01 });
        const R = R3, rid = (sStr) => R.findIndex((r) => rkStr(r, '') === sStr);
        const BLOCKS = [['ABC', 'CBA'], ['ACB', 'BCA'], ['BAC', 'CAB']].map((b) => b.map(rid));
        let bc = [2, 1, 0], bGeo = [];
        A.onClick((x, y) => { const px = A.X(x), py = A.Y(y); for (const g of bGeo) if (Math.abs(py - g.Y) < 12) { if (Math.abs(px - g.plus) < 12) bc[g.k] = Math.min(4, bc[g.k] + 1); if (Math.abs(px - g.minus) < 12) bc[g.k] = Math.max(0, bc[g.k] - 1); } });
        // correspondences on counts over the six rankings
        const posW = (cnt, s) => { const sc = [0, 0, 0]; R.forEach((r, k) => { sc[r[0]] += cnt[k]; sc[r[1]] += s * cnt[k]; }); return sc; };
        const top = (sc) => { const mx = Math.max(...sc); return [0, 1, 2].filter((x) => Math.abs(sc[x] - mx) < 1e-9); };
        const Nmat = (cnt) => { const N = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; R.forEach((r, k) => { for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) N[r[i]][r[j]] += cnt[k]; }); return N; };
        const RULES = {
          borda: { label: 'Borda', W: (cnt) => top(posW(cnt, 0.5)) },
          plurality: { label: 'plurality', W: (cnt) => top(posW(cnt, 0)) },
          anti: { label: 'anti-plurality', W: (cnt) => top(posW(cnt, 1)) },
          copeland: { label: 'Copeland', W: (cnt) => { const N = Nmat(cnt); return top([0, 1, 2].map((x) => sum([0, 1, 2].map((y) => (y === x ? 0 : N[x][y] > N[y][x] ? 1 : N[x][y] === N[y][x] ? 0.5 : 0))))); } },
          kemeny: { label: 'Kemeny', W: (cnt) => { const N = Nmat(cnt), K = R.map((r) => N[r[1]][r[0]] + N[r[2]][r[0]] + N[r[2]][r[1]]), mn = Math.min(...K); return [...new Set(R.filter((_, k) => K[k] === mn).map((r) => r[0]))].sort(); } },
          irv: { label: 'IRV', W: (cnt) => {
            const t = [0, 0, 0]; R.forEach((r, k) => { t[r[0]] += cnt[k]; }); const n = sum(t), mx = Math.max(...t);
            if (mx * 2 > n) return [t.indexOf(mx)];
            const mn = Math.min(...t), lo = [0, 1, 2].filter((x) => t[x] === mn);
            if (lo.length > 1) return lo.length === 3 ? [0, 1, 2] : [0, 1, 2].filter((x) => !lo.includes(x));
            const [a, b] = [0, 1, 2].filter((x) => x !== lo[0]); let va = 0, vb = 0;
            R.forEach((r, k) => { const f = r.find((x) => x !== lo[0]); if (f === a) va += cnt[k]; else vb += cnt[k]; });
            return va > vb ? [a] : vb > va ? [b] : [a, b];
          } },
        };
        const rS = v.select('rule (right)', Object.entries(RULES).map(([value, r]) => ({ value, label: r.label })), 'copeland');
        const eq = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
        const inter = (a, b) => a.filter((x) => b.includes(x));
        const cache = new Map();
        function consistencySearch(id, seed = 1) {
          const key = id + seed; if (cache.has(key)) return cache.get(key);
          const r = v.rng(97 + seed), W = RULES[id].W;
          for (let t = 0; t < 6000; t++) {
            const mk = () => { const c = [0, 0, 0, 0, 0, 0]; const nb = 2 + Math.floor(r() * 2); for (let b = 0; b < nb; b++) c[Math.floor(r() * 6)] += 1 + Math.floor(r() * 4); return c; };
            const e1 = mk(), e2 = mk(), w1 = W(e1), w2 = W(e2), I = inter(w1, w2);
            if (!I.length) continue;
            const w12 = W(e1.map((x, i) => x + e2[i]));
            if (!eq(w12, I)) { const out = { e1, e2, w1, w2, w12, I, t: t + 1 }; cache.set(key, out); return out; }
          }
          cache.set(key, null); return null;
        }
        let seed = 1;
        v.button('Search again', () => { seed++; });
        // axiom table (computed once)
        let table = null;
        const axioms = () => {
          if (table) return table;
          const cancelSets = []; for (let a = 0; a <= 3; a++) for (let b = 0; b <= 3; b++) for (let c = 0; c <= 3; c++) { if (a + b + c === 0) continue; const cnt = [0, 0, 0, 0, 0, 0]; [a, b, c].forEach((q, k) => BLOCKS[k].forEach((x) => { cnt[x] += q; })); cancelSets.push(cnt); }
          table = Object.entries(RULES).map(([id, rl]) => ({
            id, label: rl.label,
            faithful: R.every((r, k) => { const cnt = [0, 0, 0, 0, 0, 0]; cnt[k] = 1; return eq(rl.W(cnt), [r[0]]); }),
            cancel: cancelSets.every((cnt) => rl.W(cnt).length === 3),
            consistent: !consistencySearch(id, 1),
          }));
          return table;
        };
        v.render(() => {
          // ---- cancelling electorate
          const c = A.ctx, W = A.width, H = A.height, s = sS.value;
          const cnt = [0, 0, 0, 0, 0, 0]; BLOCKS.forEach((b, k) => b.forEach((x) => { cnt[x] += bc[k]; }));
          bGeo = [];
          BLOCKS.forEach((b, k) => {
            const Y = 24 + k * 32;
            txt(v, c, '−', 18, Y, { size: 16, weight: 800, color: bc[k] ? 'red' : 'faint' });
            txt(v, c, String(bc[k]), 36, Y, { size: 12.5, weight: 750 });
            txt(v, c, '+', 54, Y, { size: 16, weight: 800, color: bc[k] < 4 ? 'green' : 'faint' });
            bGeo.push({ k, Y, minus: 18, plus: 54 });
            b.forEach((x, j) => { chipRow(v, c, 80 + j * 66, Y, R[x], 7, 16); if (j < b.length - 1) txt(v, c, '+', 80 + j * 66 + 48, Y, { size: 12, color: 'muted' }); });
            txt(v, c, 'a ballot and its reverse', W - 10, Y, { size: 9.5, weight: 600, color: 'muted', align: 'right' });
          });
          const N = Nmat(cnt), n = sum(cnt);
          txt(v, c, `${n} voters · pairwise: ${PAIRS3.map(([x, y]) => `${LET[x]}–${LET[y]} ${N[x][y]}:${N[y][x]}`).join(', ')}`, W / 2, 124, { size: 10.5, weight: 650, color: 'muted' });
          const sc = posW(cnt, s), mx = Math.max(...sc, 1), y0 = 150, y1 = H - 24;
          [0, 1, 2].forEach((x) => {
            const X = W / 2 + (x - 1) * 80, h = (sc[x] / mx) * (y1 - y0 - 30);
            rr(c, X - 18, y1 - h, 36, Math.max(2, h), 4); c.fillStyle = v.color(CC[x], 0.55); c.fill();
            txt(v, c, v.fix(sc[x], 2), X, y1 - h - 8, { size: 11, weight: 700, halo: true });
            chip(v, c, X, y1 + 11, x, { r: 9 });
          });
          const tie = Math.max(...sc) - Math.min(...sc) < 1e-9;
          txt(v, c, tie ? 'all tie ✓' : `winner: ${top(sc).map((x) => LET[x]).join(', ')}`, W - 12, y0 + 6, { size: 12, weight: 750, color: tie ? 'green' : 'red', align: 'right' });
          txt(v, c, `weights (1, ${v.fix(s, 2)}, 0)`, 12, y0 + 6, { size: 11, weight: 650, color: 'muted', align: 'left' });
          // ---- consistency
          const d = Cn.ctx, CW = Cn.width, CH = Cn.height, rl = RULES[rS.value], ex = consistencySearch(rS.value, seed);
          if (!ex) {
            txt(v, d, `${rl.label} is consistent:`, CW / 2, CH / 2 - 20, { size: 13, weight: 750, color: 'green' });
            txt(v, d, 'no violation in 6000 random pairs of electorates —', CW / 2, CH / 2 + 2, { size: 11.5, color: 'muted' });
            txt(v, d, rS.value === 'irv' ? '' : 'scores add up across electorates', CW / 2, CH / 2 + 20, { size: 11.5, color: 'muted' });
          } else {
            const cols = [[ex.e1, ex.w1, 'electorate 1'], [ex.e2, ex.w2, 'electorate 2'], [ex.e1.map((x, i) => x + ex.e2[i]), ex.w12, 'union']];
            const cw = (CW - 20) / 3;
            cols.forEach(([e, w, lab], k) => {
              const X0 = 10 + k * cw;
              txt(v, d, lab, X0 + cw / 2, 16, { size: 11, weight: 700, color: k === 2 ? 'red' : 'muted' });
              let Y = 40;
              e.forEach((q, i) => { if (!q) return; chipRow(v, d, X0 + 14, Y, R[i], 6.5, 15); txt(v, d, `× ${q}`, X0 + 62, Y, { size: 11, weight: 650, align: 'left' }); Y += 20; });
              const yw = CH - 70;
              txt(v, d, 'winners', X0 + cw / 2, yw, { size: 10.5, weight: 600, color: 'muted' });
              w.forEach((x, j) => chip(v, d, X0 + cw / 2 + (j - (w.length - 1) / 2) * 26, yw + 24, x, { r: 10, ring: ex.I.includes(x) ? 'gold' : null }));
            });
            txt(v, d, `both elect ${ex.I.map((x) => LET[x]).join(', ')} — the union should too, but ${rl.label} elects ${ex.w12.map((x) => LET[x]).join(', ')}`, CW / 2, CH - 14, { size: 11, weight: 700, color: 'red' });
          }
          // ---- table
          const e = Tb.ctx, TW = Tb.width, rows = axioms(), colsT = ['neutral', 'faithful', 'consistent', 'cancellative'];
          const cw2 = Math.min(150, (TW - 140) / 4), rh = Math.min(24, (Tb.height - 34) / rows.length);
          colsT.forEach((h, j) => txt(v, e, h, 140 + (j + 0.5) * cw2, 14, { size: 11, weight: 700, color: 'muted' }));
          rows.forEach((r, i) => {
            const Y = 34 + i * rh, all = r.faithful && r.cancel && r.consistent;
            if (all) { rr(e, 8, Y - rh / 2 + 1, 140 + 4 * cw2, rh - 2, 6); e.fillStyle = v.color('green', 0.12); e.fill(); }
            txt(v, e, r.label, 128, Y, { size: 11.5, weight: all ? 800 : 650, align: 'right', color: r.id === rS.value ? 'accent' : 'ink' });
            [true, r.faithful, r.consistent, r.cancel].forEach((ok, j) => txt(v, e, ok ? '✓' : '✗', 140 + (j + 0.5) * cw2, Y, { size: 13, weight: 800, color: ok ? 'green' : 'red' }));
          });
        });
        v.legend([['gold', 'common winner of both electorates', { dot: true }], ['green', 'axiom holds'], ['red', 'axiom fails']]);
        v.readout(() => {
          const rows = axioms(), only = rows.filter((r) => r.faithful && r.cancel && r.consistent).map((r) => r.label);
          const s = sS.value;
          return `At $s = ${v.fix(s, 2)}$ the cancelling electorate ${Math.abs(s - 0.5) < 0.005 ? 'ties all three — Borda is cancellative' : 'does not tie: a ballot and its reverse give the middle candidate $2s$ points against 1 for the others'}. Rules passing all four axioms: **${only.join(', ')}** — Young’s theorem. ${rows.filter((r) => r.cancel && !r.consistent).map((r) => r.label).join(' and ')} cancel but are not consistent.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 3.11
    {
      num: '3.11',
      kind: 'Theorem',
      name: 'Kemeny as maximum likelihood (Young–Condorcet)',
      statement: String.raw`Suppose there is a true ranking $t$ of the candidates, and each voter independently judges every pair correctly with probability $p > \tfrac12$, conditioned on the judgments forming a ranking (Condorcet’s model; equivalently the Mallows model $P(r \mid t) \propto \varphi^{d(r, t)}$ with $\varphi = (1-p)/p$, where $d$ is the Kendall distance). Then the likelihood of a profile $r_1, \dots, r_n$ is
$$L(t) = \prod_{i} P(r_i \mid t) = Z^{-n}\, \varphi^{\sum_i d(r_i, t)},$$
so the maximum-likelihood estimate of $t$ is exactly the ranking minimizing $\sum_i d(r_i, t)$: **the Kemeny ranking**. The equivalence depends on the noise model; under other models of judgment errors the most likely ranking can differ from the Kemeny ranking.`,
      idea: String.raw`Condorcet (polsci-5.10) wanted the most probable ranking given the votes, but his analysis of cyclic majorities was obscure. Young (1988) observed that the probability of a ballot depends only on how many pairs it gets wrong, and that the normalizing constant $Z = \sum_r \varphi^{d(r, t)}$ is the same for every $t$ by symmetry. Taking logarithms, $\log L(t) = \text{const} - \log(p/(1-p)) \cdot K(t)$ with $K$ the Kemeny score (polsci-1.11), a strictly decreasing function when $p > \tfrac12$. So Kemeny’s rule is not just a compromise ranking but an optimal statistical estimator; it also explains why it is a Condorcet method — majority pairs are the most likely correct ones when they are consistent.`,
      caption: String.raw`A true ranking $A \succ B \succ C \succ D$ and $n$ voters who see it through noise of accuracy $p$. Top: for each of the 24 possible rankings, the bar is its Kemeny excess $K(t) - \min K$ and the dot is its log-likelihood deficit $\log L_{\max} - \log L(t)$, scaled by $\log(p/(1-p))$ and computed directly from the noise model. Under Condorcet’s model every dot sits exactly on its bar, so the most likely ranking (green) is the Kemeny ranking. Switch to *Thurstone* noise (each voter sees the candidates’ positions with Gaussian error) and the dots leave the bars. Bottom right: how often each estimate recovers the truth and how often they agree, over many simulated samples. *Resample* draws a new electorate.`,
      deps: ['polsci-1.11', 'stat-3.5'],
      see: ['polsci-5.10', 'polsci-3.10'],
      refs: ['T&P ch. 7', 'Young (1988), Condorcet’s theory of voting, American Political Science Review 82: 1231–1244'],
      tags: ['Kemeny', 'maximum likelihood', 'Mallows model'],
      credit: 'Marquis de Condorcet, 1785; H. Peyton Young, 1988',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Kemeny%E2%80%93Young_method' },
      viz(v) {
        const Bs = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 240, full: true, title: 'every candidate truth: Kemeny excess (bars) and likelihood deficit (dots)' });
        const Ss = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 260, minWidth: 300, title: 'the sampled ballots' });
        const Rc = v.stage({ x: [1, 41], y: [0, 1.05], axes: 'box', gutter: true, height: 260, minWidth: 360, xlabel: 'voters n', ylabel: 'share of samples', title: 'recovery of the truth (simulated)' });
        const pS = v.slider('accuracy $p$', 0.55, 0.95, 0.7, { step: 0.01 });
        const nS = v.slider('voters $n$', 1, 41, 9, { int: true });
        const nm = v.select('noise', [{ value: 'cond', label: 'Condorcet (pairwise)' }, { value: 'thur', label: 'Thurstone (positions)' }], 'cond');
        let seed = 3;
        v.button('Resample', () => { seed++; });
        const R = perms(4), NR = R.length, T = 0; // truth = R[0] = A B C D
        const d = R.map((r) => R.map((q) => kendall(r, q)));
        // relabel: ballot r seen relative to truth t → index of the permutation "r expressed in t's order"
        const rel = R.map((t) => R.map((r) => { const pos = []; t.forEach((c, k) => { pos[c] = k; }); const q = r.map((c) => pos[c]); return R.findIndex((x) => x.every((y, k) => y === q[k])); }));
        const sigma = (p) => { let lo = 0.01, hi = 50; const Phi = (z) => 0.5 * (1 + v.M.erf(z / Math.SQRT2)); for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2; if (Phi(1 / (mid * Math.SQRT2)) > p) lo = mid; else hi = mid; } return (lo + hi) / 2; };
        const qCache = new Map();
        /** P(relative permutation) under the model, for truth = identity. */
        function Q(model, p) {
          const key = model + p.toFixed(2); if (qCache.has(key)) return qCache.get(key);
          let out;
          if (model === 'cond') { const phi = (1 - p) / p, w = R.map((_, k) => Math.pow(phi, d[0][k])), Z = sum(w); out = w.map((x) => x / Z); }
          else {
            const s = sigma(p), r = v.rng(4242), cnt = Array(NR).fill(0.5), M = 40000;
            for (let k = 0; k < M; k++) { const val = [3, 2, 1, 0].map((mu) => mu + s * r.normal()); const ord = [0, 1, 2, 3].sort((a, b) => val[b] - val[a]); cnt[R.findIndex((x) => x.every((y, i) => y === ord[i]))]++; }
            const Z = sum(cnt); out = cnt.map((x) => x / Z);
          }
          qCache.set(key, out); return out;
        }
        const sampleBallots = (r, n, q) => { const cdf = v.M.cumsum(q); return range(n).map(() => { const u = r(); let k = cdf.findIndex((x) => x >= u); if (k < 0) k = NR - 1; return k; }); };
        const analyse = (ballots, q) => {
          const K = R.map((_, t) => sum(ballots.map((b) => d[t][b])));
          const LL = R.map((_, t) => sum(ballots.map((b) => Math.log(q[rel[t][b]]))));
          const kMin = Math.min(...K), lMax = Math.max(...LL);
          return { K, LL, kMin, lMax, kem: K.indexOf(kMin), mle: LL.indexOf(lMax), kemSet: R.map((_, t) => t).filter((t) => K[t] === kMin) };
        };
        const recCache = new Map();
        function recovery(model, p) {
          const key = model + p.toFixed(2); if (recCache.has(key)) return recCache.get(key);
          const q = Q(model, p), r = v.rng(99), NS = [1, 3, 5, 9, 15, 25, 41], Tn = 160;
          const out = NS.map((n) => { let kOk = 0, mOk = 0, agree = 0; for (let t = 0; t < Tn; t++) { const A = analyse(sampleBallots(r, n, q), q); if (A.kemSet.length === 1 && A.kem === T) kOk++; if (A.mle === T) mOk++; if (A.kemSet.includes(A.mle)) agree++; } return { n, k: kOk / Tn, m: mOk / Tn, a: agree / Tn }; });
          recCache.set(key, out); return out;
        }
        const current = () => { const q = Q(nm.value, pS.value), ballots = sampleBallots(v.rng(seed * 31 + nS.value), nS.value, q); return { q, ballots, A: analyse(ballots, q) }; };
        v.render(() => {
          const { ballots, A } = current(), c = Bs.ctx, W = Bs.width, H = Bs.height, p = pS.value, lam = Math.log(p / (1 - p));
          const x0 = 40, x1 = W - 10, y0 = 16, y1 = H - 40, bw = (x1 - x0) / NR;
          const ex = A.K.map((k) => k - A.kMin), lx = A.LL.map((l) => (A.lMax - l) / lam), ymax = Math.max(4, ...ex, ...lx) * 1.08;
          const Y = (val) => y1 - (val / ymax) * (y1 - y0);
          const step = ymax > 40 ? 10 : ymax > 16 ? 5 : ymax > 8 ? 2 : 1;
          for (let yv = 0; yv <= ymax; yv += step) { hl(v, c, x0 - 4, x1, Y(yv), 'grid'); txt(v, c, String(yv), x0 - 8, Y(yv), { size: 9.5, color: 'muted', align: 'right', weight: 500 }); }
          R.forEach((r, t) => {
            const X = x0 + t * bw, isK = A.kemSet.includes(t), isM = t === A.mle;
            rr(c, X + bw * 0.16, Y(ex[t]), bw * 0.68, Math.max(1.5, y1 - Y(ex[t])), 2.5); c.fillStyle = v.color(isK ? 'accent' : CC[r[0]], isK ? 0.75 : 0.3); c.fill();
            c.beginPath(); c.arc(X + bw / 2, Y(lx[t]), 4, 0, 2 * Math.PI); c.fillStyle = v.color(isM ? 'green' : 'ink'); c.fill();
            txt(v, c, rkStr(r, ''), X + bw / 2, y1 + 11, { size: 9, weight: t === T || isM ? 800 : 500, color: t === T ? 'gold' : isM ? 'green' : 'muted' });
          });
          txt(v, c, 'truth', x0 + bw / 2, y1 + 25, { size: 9.5, weight: 700, color: 'gold' });
          hl(v, c, x0 - 4, x1, y1, 'muted');
          // sampled ballots
          const e = Ss.ctx, SW = Ss.width, cntB = new Map(); ballots.forEach((b) => cntB.set(b, (cntB.get(b) || 0) + 1));
          const rows = [...cntB.entries()].sort((a, b) => b[1] - a[1]), rh = Math.min(22, (Ss.height - 60) / Math.max(rows.length, 1));
          rows.slice(0, Math.floor((Ss.height - 60) / rh)).forEach(([b, k], i) => {
            const Yb = 16 + i * rh; chipRow(v, e, 20, Yb, R[b], Math.min(7, rh * 0.32), Math.min(16, rh * 0.75));
            rr(e, 90, Yb - rh * 0.3, (k / nS.value) * (SW - 150), rh * 0.6, 3); e.fillStyle = v.color('accent', 0.4); e.fill();
            txt(v, e, `${k} · d = ${d[T][b]}`, 96 + (k / nS.value) * (SW - 150), Yb, { size: 10, weight: 650, align: 'left', halo: true });
          });
          txt(v, e, `Kemeny: ${A.kemSet.map((t) => rkStr(R[t], '')).join(', ')}   MLE: ${rkStr(R[A.mle], '')}`, SW / 2, Ss.height - 14, { size: 11, weight: 750, color: A.kemSet.includes(A.mle) ? 'green' : 'red' });
          // recovery chart
          const rec = recovery(nm.value, pS.value);
          [['k', 'accent', 'Kemeny = truth'], ['m', 'green', 'MLE = truth'], ['a', 'gold', 'Kemeny = MLE']].forEach(([key, col]) => {
            const pts = rec.map((o) => [o.n, o[key]]); Rc.path(pts, { color: col, width: key === 'a' ? 2 : 2.4, dash: key === 'a' ? [5, 4] : null }); pts.forEach(([x, y]) => Rc.dot(x, y, { r: 3, color: col }));
          });
          Rc.vline(nS.value, { color: 'faint', dash: true });
        });
        v.legend([['accent', 'Kemeny excess (bars) / Kemeny = truth'], ['green', 'most likely ranking (dot) / MLE = truth'], ['gold', 'Kemeny = MLE'], ['ink', 'likelihood deficit', { dot: true }]]);
        v.readout(() => {
          const { A } = current(), rec = recovery(nm.value, pS.value), last = rec[rec.length - 1], same = A.kemSet.includes(A.mle);
          const maxDev = Math.max(...A.K.map((k, t) => Math.abs((k - A.kMin) - (A.lMax - A.LL[t]) / Math.log(pS.value / (1 - pS.value)))));
          return `This sample: the most likely truth is ${rkStr(R[A.mle])} and the Kemeny ranking ${A.kemSet.map((t) => rkStr(R[t])).join(' / ')} — ${same ? '**the same**' : '**different**'}${nm.value === 'cond' ? ` (largest gap between bar and dot: ${v.fix(maxDev, 6)})` : ''}. Over simulated samples of 41 voters, Kemeny recovers the truth ${pct(last.k)} of the time and agrees with the MLE in ${pct(last.a)}${nm.value === 'cond' ? ' — always, as Young’s theorem says.' : ' — not always, because Thurstone noise is not Condorcet’s model.'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.12
    {
      num: '3.12',
      kind: 'Theorem',
      name: 'List–Pettit impossibility for judgment aggregation',
      statement: String.raw`A group of $n \ge 2$ individuals each accepts or rejects every proposition on an agenda containing $p$, $q$, $p \wedge q$ and their negations, with complete and consistent individual judgments. An **aggregation function** turns every such profile into collective judgments. List and Pettit proved that no aggregation function satisfies all of
(a) **universal domain** (it accepts every profile of consistent, complete judgment sets);
(b) **collective rationality** (the collective judgments are always complete and consistent);
(c) **anonymity** (permuting the individuals changes nothing);
(d) **systematicity** (the collective verdict on each proposition depends only on the pattern of individual verdicts on it, by the same rule for every proposition).
Dropping anonymity leaves the dictatorships; dropping systematicity allows the premise-based procedure.`,
      idea: String.raw`Systematicity makes the rule a single function $f$ from voting patterns to verdicts; completeness on a proposition and its negation forces $f$ to be self-dual, and anonymity makes it depend only on the number of acceptances. The doctrinal paradox (polsci-2.12) then sinks every such $f$: arrange the individuals so that $p$, $q$ and $\neg(p \wedge q)$ each receive the same number of acceptances (for three judges: 2, 2, 2), so $f$ treats them alike and must accept all three or reject all three — and accepting all three is inconsistent, rejecting all three accepts $\neg p$, $\neg q$ and $p \wedge q$, also inconsistent. With an even number of judges self-duality already fails on a tie. It is the judgment-aggregation analogue of Arrow’s theorem (polsci-3.3), with systematicity playing the role of IIA and neutrality together.`,
      caption: String.raw`Left: each judge’s view of $p$ and $q$ (**click to flip**); $p \wedge q$ follows. The bottom row is the collective verdict of the chosen rule, and the tags say which conditions the rule meets on **all** profiles. Right: every systematic, complete rule — a verdict for each pattern of acceptances, the same for all propositions — checked on every profile; ✗ cards are inconsistent somewhere (click one to load the profile that breaks it), and the only consistent ones are dictatorships. Anonymous rules carry a ring: none survives. With four judges even completeness fails for the anonymous rules.`,
      deps: ['polsci-2.12', 'polsci-3.3'],
      see: ['polsci-2.12'],
      refs: ['T&P ch. 7', 'List & Pettit (2002), Aggregating sets of judgments: an impossibility result, Economics and Philosophy 18: 89–110'],
      tags: ['judgment aggregation', 'discursive dilemma', 'impossibility'],
      credit: 'Christian List & Philip Pettit, 2002',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Discursive_dilemma' },
      viz(v) {
        const Tb = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, minWidth: 330, title: 'judges and propositions · click p or q' });
        const Gs = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, minWidth: 380, weight: 1.2, title: 'every systematic complete rule, checked on every profile' });
        let n = 3, J = [[1, 1], [1, 0], [0, 1]], custom = null, geo = null, cards = [];
        const nS = v.select('judges', [{ value: 3, label: '3' }, { value: 4, label: '4' }], 3, { onChange: (k) => { n = k; J = range(n).map((i) => J[i] || [1, 0]); custom = null; if (rS.value === 'sys') rS.set('prop'); } });
        const rS = v.select('rule', [{ value: 'prop', label: 'proposition-wise majority' }, { value: 'premise', label: 'premise-based' }, { value: 'dict', label: 'dictator (judge 1)' }, { value: 'unan', label: 'unanimity' }, { value: 'sys', label: 'picked card' }], 'prop');
        const judg = (pq) => [pq[0], pq[1], pq[0] & pq[1]];
        const maj = (vals) => { const a = vals.filter((x) => x === 1).length, r = vals.length - a; return a * 2 > vals.length ? 1 : r * 2 > vals.length ? 0 : null; };
        const pat = (Jx, k) => Jx.reduce((m, pq, i) => m | (judg(pq)[k] << i), 0);
        const rule = (Jx, id = rS.value) => {
          const cols = [0, 1, 2].map((k) => Jx.map((pq) => judg(pq)[k]));
          if (id === 'prop') return cols.map(maj);
          if (id === 'premise') { const P = maj(cols[0]), Q = maj(cols[1]); return [P, Q, P === 1 && Q === 1 ? 1 : P === 0 || Q === 0 ? 0 : null]; }
          if (id === 'dict') return judg(Jx[0]);
          if (id === 'unan') return cols.map((c) => (c.every((x) => x === 1) ? 1 : c.every((x) => x === 0) ? 0 : null));
          if (id === 'sys' && custom) return [0, 1, 2].map((k) => custom.f[pat(Jx, k)]);
          return cols.map(maj);
        };
        const consistent = (o) => [[0, 0], [0, 1], [1, 0], [1, 1]].some(([P, Q]) => [P, Q, P & Q].every((x, k) => o[k] === null || o[k] === x));
        const profilesJ = (nn) => { const out = [], T = [[1, 1], [1, 0], [0, 1], [0, 0]], rec = (cur) => { if (cur.length === nn) { out.push(cur.slice()); return; } for (const t of T) { cur.push(t); rec(cur); cur.pop(); } }; rec([]); return out; };
        const cache = new Map();
        function audit(id) {
          const key = id + n + (id === 'sys' && custom ? custom.key : ''); if (cache.has(key)) return cache.get(key);
          const PR = profilesJ(n); let complete = true, cons = true, anon = true, sys = true, wit = {};
          const seen = new Map();
          for (const Jx of PR) {
            const o = rule(Jx, id);
            if (complete && o.some((x) => x === null)) { complete = false; wit.complete = Jx; }
            if (cons && !consistent(o)) { cons = false; wit.cons = Jx; }
            const srt = Jx.slice().sort((a, b) => b[0] * 2 + b[1] - (a[0] * 2 + a[1]));
            if (anon && rule(srt, id).some((x, k) => x !== o[k])) { anon = false; wit.anon = Jx; }
            if (sys) for (let k = 0; k < 3; k++) { const p = pat(Jx, k); if (!seen.has(p)) seen.set(p, [o[k], k, Jx]); else if (seen.get(p)[0] !== o[k]) { sys = false; wit.sys = { p, a: seen.get(p), b: [o[k], k, Jx] }; break; } }
          }
          const out = { complete, cons, anon, sys, wit }; cache.set(key, out); return out;
        }
        // all systematic complete (self-dual) rules
        const galCache = new Map();
        function gallery(nn) {
          if (galCache.has(nn)) return galCache.get(nn);
          const NP = 1 << nn, full = NP - 1, half = range(NP).filter((p) => !(p & (1 << (nn - 1)))), PR = profilesJ(nn), out = [];
          for (let code = 0; code < 1 << half.length; code++) {
            const f = Array(NP).fill(0); half.forEach((p, k) => { f[p] = (code >> k) & 1; f[full ^ p] = 1 - f[p]; });
            let bad = null; for (const Jx of PR) { const o = [0, 1, 2].map((k) => f[pat(Jx, k)]); if (!consistent(o)) { bad = Jx; break; } }
            const dict = range(nn).find((i) => range(NP).every((p) => f[p] === ((p >> i) & 1)));
            const anonR = range(NP).every((p) => range(NP).every((q) => popc(p) !== popc(q) || f[p] === f[q]));
            const isMaj = range(NP).every((p) => f[p] === (popc(p) * 2 > nn ? 1 : 0));
            out.push({ f, key: f.join(''), bad, dict, anon: anonR, label: dict !== undefined ? `dictator ${dict + 1}` : isMaj ? 'majority' : anonR ? 'anonymous' : '' });
          }
          galCache.set(nn, out); return out;
        }
        Tb.onClick((x, y) => { if (!geo) return; const px = Tb.X(x), py = Tb.Y(y), i = Math.floor((py - geo.Y0) / geo.rh), k = Math.floor((px - geo.X0) / geo.cw); if (i >= 0 && i < n && (k === 0 || k === 1)) J[i][k] = 1 - J[i][k]; });
        Gs.onClick((x, y) => { const px = Gs.X(x), py = Gs.Y(y); const hit = cards.find((cd) => px >= cd.b[0] && px <= cd.b[2] && py >= cd.b[1] && py <= cd.b[3]); if (hit) { custom = hit.r; if (hit.r.bad) J = hit.r.bad.map((q) => q.slice()); rS.set('sys'); } });
        const YN = (x) => (x === 1 ? ['yes', 'green'] : x === 0 ? ['no', 'red'] : ['—', 'muted']);
        v.render(() => {
          const c = Tb.ctx, W = Tb.width, H = Tb.height, o = rule(J), Au = audit(rS.value);
          const X0 = 96, cw = Math.min(80, (W - 110) / 3), rh = Math.min(30, (H - 170) / (n + 1)), Y0 = 34;
          geo = { X0, cw, rh, Y0 };
          ['p', 'q', 'p ∧ q'].forEach((h, k) => txt(v, c, h, X0 + (k + 0.5) * cw, 18, { size: 13, weight: 750, color: k === 2 ? 'muted' : 'ink' }));
          J.forEach((pq, i) => {
            const Y = Y0 + i * rh, jj = judg(pq);
            txt(v, c, `judge ${i + 1}`, X0 - 12, Y + rh / 2, { size: 11.5, weight: 650, color: 'muted', align: 'right' });
            jj.forEach((val, k) => { const [t, col] = YN(val); rr(c, X0 + k * cw + 3, Y + 2, cw - 6, rh - 4, 6); c.fillStyle = v.color(col, k === 2 ? 0.1 : 0.22); c.fill(); txt(v, c, t, X0 + (k + 0.5) * cw, Y + rh / 2, { size: 12, weight: 700, color: k === 2 ? 'muted' : col }); });
          });
          const Yc = Y0 + n * rh + 10;
          hl(v, c, 10, W - 10, Yc - 4, 'ink', null, 1.4);
          txt(v, c, 'group', X0 - 12, Yc + rh / 2, { size: 12, weight: 800, align: 'right' });
          o.forEach((val, k) => { const [t, col] = YN(val); rr(c, X0 + k * cw + 3, Yc + 2, cw - 6, rh - 4, 6); c.fillStyle = v.color(col, 0.4); c.fill(); txt(v, c, t, X0 + (k + 0.5) * cw, Yc + rh / 2, { size: 12.5, weight: 800, color: 'ink' }); });
          const okNow = consistent(o) && o.every((x) => x !== null);
          txt(v, c, o.some((x) => x === null) ? 'incomplete' : consistent(o) ? 'consistent' : 'inconsistent!', W - 12, Yc + rh + 16, { size: 12, weight: 750, color: okNow ? 'green' : 'red', align: 'right' });
          let ty = Yc + rh + 44;
          [['complete', Au.complete], ['consistent', Au.cons], ['anonymous', Au.anon], ['systematic', Au.sys]].forEach(([lab, ok], k) => { const X = 12 + (k % 2) * (W / 2 - 6); tag(v, c, ok, lab, X, ty + Math.floor(k / 2) * 28, { size: 11 }); });
          txt(v, c, 'on all profiles', W - 12, ty + 56, { size: 10, color: 'muted', align: 'right' });
          // ---- gallery
          const d = Gs.ctx, GW = Gs.width, GH = Gs.height, Gl = gallery(n);
          cards = [];
          const good = Gl.filter((r) => !r.bad);
          if (n === 3) {
            const cols = 4, cwg = (GW - 16) / cols, chg = Math.min(66, (GH - 40) / 4);
            Gl.forEach((r, k) => {
              const X = 8 + (k % cols) * cwg, Y = 8 + Math.floor(k / cols) * chg, isSel = custom && custom.key === r.key && rS.value === 'sys';
              cards.push({ b: [X, Y, X + cwg - 6, Y + chg - 6], r });
              rr(d, X, Y, cwg - 6, chg - 6, 7); d.fillStyle = v.color(r.bad ? 'red' : 'green', isSel ? 0.25 : 0.1); d.fill();
              d.strokeStyle = v.color(isSel ? 'ink' : r.anon ? 'gold' : r.bad ? 'red' : 'green', r.anon || isSel ? 1 : 0.5); d.lineWidth = r.anon || isSel ? 2.4 : 1; d.stroke();
              const cs = Math.min(12, (cwg - 22) / 8);
              for (let p = 0; p < 8; p++) { d.fillStyle = v.color(r.f[p] ? 'green' : 'red', 0.7); d.fillRect(X + 8 + p * cs, Y + 8, cs - 1.5, cs - 1.5); }
              txt(v, d, r.bad ? '✗ inconsistent' : '✓ consistent', X + 8, Y + chg - 30, { size: 10, weight: 700, color: r.bad ? 'red' : 'green', align: 'left' });
              if (r.label) txt(v, d, r.label, X + 8, Y + chg - 16, { size: 10, weight: 650, color: 'ink', align: 'left' });
            });
            txt(v, d, 'squares: verdict for each pattern ∅ {1} {2} {1,2} {3} {1,3} {2,3} {1,2,3} of judges accepting', GW / 2, GH - 10, { size: 9.5, color: 'muted' });
          } else {
            const cols = 16, cs = Math.min(17, (GW - 30) / cols, (GH - 90) / 16);
            Gl.forEach((r, k) => { const X = 14 + (k % cols) * cs, Y = 14 + Math.floor(k / cols) * cs; cards.push({ b: [X, Y, X + cs, Y + cs], r }); d.fillStyle = v.color(r.bad ? 'red' : 'green', r.bad ? 0.35 : 0.9); d.fillRect(X, Y, cs - 2, cs - 2); });
            const tx = 22 + cols * cs;
            txt(v, d, `${Gl.length} self-dual systematic rules`, tx, 26, { size: 11.5, weight: 650, align: 'left' });
            txt(v, d, `${good.length} consistent:`, tx, 48, { size: 11.5, weight: 750, color: 'green', align: 'left' });
            good.forEach((r, k) => txt(v, d, r.label || 'other', tx + 10, 68 + k * 18, { size: 11, weight: 650, align: 'left' }));
            txt(v, d, 'no anonymous rule is complete:', tx, 160, { size: 11, weight: 650, color: 'muted', align: 'left' });
            txt(v, d, 'a 2–2 split has no self-dual verdict', tx, 176, { size: 11, weight: 650, color: 'muted', align: 'left' });
          }
        });
        v.legend([['green', 'accept / consistent', { dot: true }], ['red', 'reject / inconsistent', { dot: true }], ['gold', 'anonymous rule (ring)']]);
        v.readout(() => {
          const Au = audit(rS.value), Gl = gallery(n), good = Gl.filter((r) => !r.bad), anonGood = good.filter((r) => r.anon).length;
          const names = { prop: 'Proposition-wise majority', premise: 'The premise-based procedure', dict: 'The dictatorship', unan: 'Unanimity', sys: 'The picked rule' };
          const fails = [!Au.complete && 'complete', !Au.cons && 'consistent', !Au.anon && 'anonymous', !Au.sys && 'systematic'].filter(Boolean);
          return `${names[rS.value]} is ${fails.length ? `**not ${fails.join(', not ')}**` : 'complete, consistent, anonymous and systematic?!'} (checked on all ${4 ** n} profiles of ${n} judges). Exhaustive search: of the ${Gl.length} systematic complete rules, **${good.length}** are always consistent — ${good.map((r) => r.label || 'other').join(', ')} — and ${anonGood} of them anonymous: List and Pettit’s theorem.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 3.13
    {
      num: '3.13',
      kind: 'Paper',
      name: 'A Difficulty in the Concept of Social Welfare',
      paper: { authors: 'Kenneth J. Arrow', year: 1950, title: 'A Difficulty in the Concept of Social Welfare', venue: 'Journal of Political Economy 58 (4): 328–346', doi: '10.1086/256963' },
      introduces: ['polsci-3.2', 'polsci-3.3'],
      statement: String.raw`Arrow asks whether a **social welfare function** can turn the orderings $R_1, \dots, R_n$ of individuals into a social ordering $R$ (complete and transitive: Axioms I and II) subject to five conditions: (1) it is defined for every admissible profile, and with three alternatives all orderings are admissible; (2) **positive association** — if $x$ rises or does not fall in every individual ordering, a social preference for $x$ over $y$ survives; (3) **independence of irrelevant alternatives** — the social choice from a set depends only on individual orderings of that set; (4) **non-imposition** (citizens’ sovereignty) — for every pair there is some profile in which society prefers $y$ to $x$; (5) **non-dictatorship**. For clarity he proves the **Possibility Theorem** for two individuals and three alternatives, noting that it holds for any number of individuals: *every social welfare function satisfying Conditions 2 and 3 and yielding a social ordering is either imposed or dictatorial.* Neither majority voting nor any scheme of proportional representation escapes it.`,
      idea: String.raw`Condorcet’s paradox (polsci-5.10, polsci-2.1) showed that majority voting can fail to produce an ordering, and welfare economists (Bergson, Samuelson) had assumed a social welfare function ranking social states existed. Arrow, working at RAND and the Cowles Commission, turned the question into axioms and showed the difficulty is general. His proof is a chain of profiles: Conditions 2 and 4 give unanimity (Consequence 1); a voter who prevails against opposition prevails always (Consequence 2); and if individual 1 prevailed against individual 2 on one pair, a chain of five profiles would spread this to every pair and make 1 a dictator — so opposed preferences must produce social indifference (Consequence 3). One more profile then makes $x$ both preferred and indifferent to $z$. The paper (and the 1951 monograph *Social Choice and Individual Values*) introduced the axiomatic method into social choice — the conditions now called Arrow’s conditions (polsci-3.2) and the impossibility theorem (polsci-3.3) — and founded the modern field; Arrow received the Nobel Memorial Prize in 1972 partly for it.`,
      caption: String.raw`Arrow’s own setting: two individuals and three alternatives $x, y, z$. Each cell of the grid is a profile — individual 1’s ordering by row, individual 2’s by column — showing the social ordering your rule assigns. **Click a cell** to select it, click again to cycle through the 13 orderings. The checklist tests Arrow’s conditions on all 36 profiles (click a failed one to see the offending cells). Step through Arrow’s proof: each step highlights the profile Arrow uses — the same orderings as in his text — and compares what the proof deduces with what your rule does. Below the checklist, the exhaustive search over all 531,441 rules satisfying IIA (by Condition 3 a rule is three pairwise tables) reproduces the theorem’s conclusion; the paper’s numbers are not numerical data, so the comparison is with its logic.`,
      deps: ['polsci-2.1', 'micro-4.3', 'polsci-5.10'],
      refs: [],
      tags: ['Arrow', 'paper', 'impossibility'],
      credit: 'Kenneth J. Arrow, 1950',
      links: { doi: 'https://doi.org/10.1086/256963' },
      viz(v) {
        const Gd = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 430, minWidth: 380, title: 'social ordering for each pair of individual orderings' });
        const Ck = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 430, minWidth: 330, title: 'Arrow’s conditions on all 36 profiles' });
        const XYZ = 'xyz';
        const PROF = []; for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) PROF.push([R3[i], R3[j]]);
        const PRE = {
          borda: { label: 'rank-order (Borda)', f: (P) => { const s = [0, 0, 0]; P.forEach((r) => r.forEach((c, k) => { s[c] += 2 - k; })); return tripleOf(relFromScores(s)); } },
          d1: { label: 'individual 1 dictates', f: (P) => tripleOf(relOfRanking(P[0])) },
          d2: { label: 'individual 2 dictates', f: (P) => tripleOf(relOfRanking(P[1])) },
          una: { label: 'unanimity, else indifferent', f: (P) => PAIRS3.map(([x, y]) => (P.every((r) => above(r, x, y)) ? 1 : P.every((r) => above(r, y, x)) ? -1 : 0)) },
          inv: { label: 'reverse of 1', f: (P) => tripleOf(relOfRanking(P[0].slice().reverse())) },
          imp: { label: 'imposed x > y > z', f: () => [1, 1, 1] },
        };
        const pre = v.select('rule', Object.entries(PRE).map(([value, r]) => ({ value, label: r.label })), 'borda', { onChange: () => load() });
        let F = [], sel = -1, custom = false, geo = null, condSel = null, rowsGeo = [];
        function load() { F = PROF.map((P) => PRE[pre.value].f(P)); custom = false; sel = -1; }
        load();
        const S = (k) => relFromTriple(F[k]);
        const kOf = (i, j) => i * 6 + j;
        Gd.onClick((x, y) => {
          if (!geo) return; const px = Gd.X(x), py = Gd.Y(y), j = Math.floor((px - geo.X0) / geo.s), i = Math.floor((py - geo.Y0) / geo.s);
          if (i < 0 || i > 5 || j < 0 || j > 5) return; const k = kOf(i, j);
          if (sel === k) { const w = WEAK3.findIndex((t) => t.every((q, m) => q === F[k][m])); F[k] = WEAK3[(w + 1) % WEAK3.length].slice(); custom = true; } else sel = k;
        });
        Ck.onClick((x, y) => { const py = Ck.Y(y); const r = rowsGeo.find((g) => Math.abs(py - g.Y) < 11); if (r) condSel = r.id; });
        // ---- Arrow's conditions on the current table
        const check = () => {
          const out = {};
          const bad = PROF.map((_, k) => k).filter((k) => !isWeakOrder(S(k)));
          out.ord = { ok: !bad.length, cells: bad.slice(0, 3) };
          // Condition 2: x rises (others' relative order unchanged) and x P y before => x P y after
          let c2 = null;
          for (let a = 0; a < 36 && !c2; a++) for (let b = 0; b < 36 && !c2; b++) {
            if (a === b) continue;
            for (let x = 0; x < 3 && !c2; x++) {
              const ok = PROF[a].every((r, i) => { const q = PROF[b][i], r2 = r.filter((c) => c !== x), q2 = q.filter((c) => c !== x); return r2[0] === q2[0] && q.indexOf(x) <= r.indexOf(x); });
              if (!ok) continue;
              for (let y = 0; y < 3; y++) if (y !== x && S(a)[x][y] === 1 && S(b)[x][y] !== 1) { c2 = { cells: [a, b], x, y }; break; }
            }
          }
          out.c2 = { ok: !c2, ...(c2 || {}) };
          // Condition 3: IIA
          let c3 = null;
          for (const [x, y] of PAIRS3) { const m = new Map(); for (let k = 0; k < 36 && !c3; k++) { const p = patternOf(PROF[k], x, y), r = S(k)[x][y]; if (!m.has(p)) m.set(p, k); else if (S(m.get(p))[x][y] !== r) c3 = { cells: [m.get(p), k], x, y }; } if (c3) break; }
          out.c3 = { ok: !c3, ...(c3 || {}) };
          // Condition 4: non-imposition
          let c4 = null;
          for (let x = 0; x < 3 && !c4; x++) for (let y = 0; y < 3 && !c4; y++) if (x !== y && !PROF.some((_, k) => S(k)[y][x] === 1)) c4 = { x, y, cells: [] };
          out.c4 = { ok: !c4, ...(c4 || {}) };
          // Condition 5: dictator
          const dict = [0, 1].filter((i) => PROF.every((P, k) => PAIRS3.every(([x, y]) => (above(P[i], x, y) ? S(k)[x][y] === 1 : S(k)[y][x] === 1))));
          out.c5 = { ok: !dict.length, dict, cells: [] };
          // Pareto (Consequence 1)
          let par = null;
          for (let k = 0; k < 36 && !par; k++) for (const [x, y] of PAIRS3) { const P = PROF[k]; if (P.every((r) => above(r, x, y)) && S(k)[x][y] !== 1) { par = { cells: [k], x, y }; break; } if (P.every((r) => above(r, y, x)) && S(k)[y][x] !== 1) { par = { cells: [k], x: y, y: x }; break; } }
          out.par = { ok: !par, ...(par || {}) };
          return out;
        };
        // ---- exhaustive search over IIA rules (pair tables over the 4 patterns of two individuals)
        let funnel = null;
        const runFunnel = () => {
          if (funnel) return funnel;
          const vals = [1, 0, -1], T = []; for (let code = 0; code < 81; code++) { const f = []; let t = code; for (let p = 0; p < 4; p++) { f.push(vals[t % 3]); t = Math.floor(t / 3); } T.push(f); }
          const PP = PROF.map((P) => PAIRS3.map(([x, y]) => patternOf(P, x, y)));
          const rules = [];
          for (const fa of T) for (const fb of T) {
            const al = [7, 7, 7, 7]; let dead = false;
            for (const q of PP) { al[q[2]] &= ALLOW[fa[q[0]] + 1][fb[q[1]] + 1]; if (!al[q[2]]) { dead = true; break; } }
            if (dead) continue;
            const opts = al.map((m) => vals.filter((c) => m & (1 << (c + 1))));
            for (const c0 of opts[0]) for (const c1 of opts[1]) for (const c2 of opts[2]) for (const c3 of opts[3]) rules.push([fa, fb, [c0, c1, c2, c3]]);
          }
          const mono = (f) => { for (let p = 0; p < 4; p++) for (let q = 0; q < 4; q++) if ((p & q) === p && p !== q) { if (f[p] === 1 && f[q] !== 1) return false; if (f[q] === -1 && f[p] !== -1) return false; } return true; };
          const nonImp = (f) => f.includes(1) && f.includes(-1);
          const dictOf = (R) => [0, 1].find((i) => R.every((f) => [0, 1, 2, 3].every((p) => f[p] === ((p >> i) & 1 ? 1 : -1))));
          const r2 = rules.filter((R) => R.every(mono)), r4 = r2.filter((R) => R.every(nonImp)), r5 = r4.filter((R) => dictOf(R) === undefined);
          funnel = { total: 81 ** 3, trans: rules.length, c2: r2.length, c4: r4.length, c5: r5.length, dicts: r4.map(dictOf).filter((d) => d !== undefined).map((d) => d + 1) };
          return funnel;
        };
        // ---- Arrow's chain of profiles (R3 order: xyz, xzy, yxz, yzx, zxy, zyx)
        const X = 0, Y = 1, Z = 2, P = 'P', I = 'I';
        const frames = [
          { cell: [0, 2], claims: [[X, Z, P, 'both prefer x to z: Consequence 1']], note: String.raw`**Consequence 1** (from Conditions 2–4): if both individuals prefer $x'$ to $y'$, so does society. Here both rank $x$ above $z$.` },
          { cell: [0, 3], claims: [[X, Y, P, 'assumption (1): 1 prevails on x vs y']], note: String.raw`To prove **Consequence 3** Arrow supposes the contrary: (1) whenever $xP_1y$ and $yP_2x$, $xPy$ — individual 1 prevails against 2 on $x$ vs $y$. Profile: $R_1 = x, y, z$; $R_2 = y, z, x$.` },
          { cell: [0, 3], claims: [[Y, Z, P, 'both prefer y to z: Consequence 1'], [X, Z, P, 'transitivity, so (2): xP₁z & zP₂x ⇒ xPz']], note: String.raw`Same profile: $yPz$ by Consequence 1, so $xPz$ by transitivity. Since only the $x$-vs-$z$ opinions matter (Condition 3): **(2)** whenever $xP_1z$ and $zP_2x$, $xPz$.` },
          { cell: [2, 5], claims: [[Y, X, P, 'Consequence 1'], [X, Z, P, 'by (2)'], [Y, Z, P, 'so (3): yP₁z & zP₂y ⇒ yPz']], note: String.raw`$R_1 = y, x, z$; $R_2 = z, y, x$. $yPx$ by Consequence 1, $xPz$ by (2), hence **(3)** whenever $yP_1z$ and $zP_2y$, $yPz$.` },
          { cell: [3, 4], claims: [[Z, X, P, 'Consequence 1'], [Y, Z, P, 'by (3)'], [Y, X, P, 'so (4): yP₁x & xP₂y ⇒ yPx']], note: String.raw`$R_1 = y, z, x$; $R_2 = z, x, y$. $zPx$ by Consequence 1 and $yPz$ by (3), so **(4)** whenever $yP_1x$ and $xP_2y$, $yPx$.` },
          { cell: [5, 1], claims: [[Z, Y, P, 'Consequence 1'], [Y, X, P, 'by (4)'], [Z, X, P, 'so (5): zP₁x & xP₂z ⇒ zPx']], note: String.raw`$R_1 = z, y, x$; $R_2 = x, z, y$. $zPy$ and $yPx$ give **(5)** whenever $zP_1x$ and $xP_2z$, $zPx$.` },
          { cell: [4, 0], claims: [[Z, X, P, 'by (5)'], [X, Y, P, 'Consequence 1'], [Z, Y, P, 'so (6): zP₁y & yP₂z ⇒ zPy']], note: String.raw`$R_1 = z, x, y$; $R_2 = x, y, z$. By (5) and Consequence 1, **(6)** whenever $zP_1y$ and $yP_2z$, $zPy$. Together with (1)–(5), individual 1 prevails against opposition on every pair.` },
          { cell: null, claims: [], note: String.raw`By **Consequence 2** a voter who prevails against opposition also prevails when the other agrees or is indifferent, so (1) would make individual 1 a **dictator**, which Condition 5 forbids. Hence (1) is false: **Consequence 3** — when the two have exactly opposed interests on a pair, society is indifferent.` },
          { cell: [0, 4], claims: [[X, Y, P, '(7): both prefer x to y'], [Y, Z, I, '(8): opposed on y vs z ⇒ yIz'], [X, Z, P, 'so xPz by transitivity'], [X, Z, I, 'but opposed on x vs z ⇒ xIz']], note: String.raw`**The contradiction.** $R_1 = x, y, z$; $R_2 = z, x, y$. By Consequence 1 $xPy$ (7); by Consequence 3 $yIz$ (8), so $xPz$ — yet the two are opposed on $x$ vs $z$, so Consequence 3 also demands $xIz$. No social welfare function satisfies Conditions 1–5.` },
        ];
        const St = v.steps({ frames, speed: 0.6, still: 2 });
        const holds = (k, [a, b, kind]) => (kind === P ? S(k)[a][b] === 1 : S(k)[a][b] === 0);
        v.render(() => {
          const K = check(), c = Gd.ctx, W = Gd.width, H = Gd.height, fr = St.frame;
          const s = Math.min(52, (W - 100) / 6, (H - 86) / 6), X0 = Math.max(76, (W - 6 * s) / 2 + 18), Y0 = 64;
          geo = { X0, Y0, s };
          for (let k = 0; k < 6; k++) {
            R3[k].forEach((cc, q) => chip(v, c, X0 - 54 + q * 15, Y0 + (k + 0.5) * s, cc, { r: 6.5, label: XYZ[cc] }));
            R3[k].forEach((cc, q) => chip(v, c, X0 + (k + 0.5) * s, Y0 - 46 + q * 14, cc, { r: 6.5, label: XYZ[cc] }));
          }
          txt(v, c, '1 ↓', X0 - 34, Y0 - 58, { size: 10.5, weight: 700, color: 'muted' });
          txt(v, c, '2 →', X0 + 6 * s + 6, Y0 - 32, { size: 10.5, weight: 700, color: 'muted', align: 'left' });
          const sh = condSel && !K[condSel].ok ? K[condSel].cells || [] : [];
          PROF.forEach((Pp, k) => {
            const i = Math.floor(k / 6), j = k % 6, Xc = X0 + j * s, Yc = Y0 + i * s, Sk = S(k), G = groupsOf(Sk);
            c.fillStyle = v.color(G ? 'muted' : 'red', G ? 0.05 : 0.15); c.fillRect(Xc + 1, Yc + 1, s - 2, s - 2);
            c.strokeStyle = v.color('faint'); c.lineWidth = 1; c.strokeRect(Xc + 0.5, Yc + 0.5, s - 1, s - 1);
            if (G) {
              const gap = Math.min(13, (s - 12) / Math.max(1, G.length - 1)), top = Yc + s / 2 - ((G.length - 1) * gap) / 2;
              G.forEach((grp, q) => grp.forEach((cc, t) => chip(v, c, Xc + s / 2 + (t - (grp.length - 1) / 2) * 13, top + q * gap, cc, { r: 5.5, label: XYZ[cc] })));
            } else txt(v, c, 'no order', Xc + s / 2, Yc + s / 2, { size: 9, weight: 700, color: 'red' });
            if (sh.includes(k)) { c.save(); c.strokeStyle = v.color('red'); c.lineWidth = 2.6; c.setLineDash([4, 3]); c.strokeRect(Xc + 2, Yc + 2, s - 4, s - 4); c.restore(); }
          });
          if (sel >= 0) { const i = Math.floor(sel / 6), j = sel % 6; c.strokeStyle = v.color('ink'); c.lineWidth = 2.4; c.strokeRect(X0 + j * s + 1, Y0 + i * s + 1, s - 2, s - 2); }
          if (fr.cell) { const [i, j] = fr.cell; c.strokeStyle = v.color('gold'); c.lineWidth = 3.4; c.strokeRect(X0 + j * s - 1, Y0 + i * s - 1, s + 2, s + 2); }
          txt(v, c, custom ? 'your rule' : PRE[pre.value].label, X0 + 3 * s, Y0 + 6 * s + 18, { size: 12, weight: 750 });
          // ---- conditions
          const d = Ck.ctx, CW = Ck.width;
          rowsGeo = [];
          const rows = [['ord', 'Axioms I–II: an ordering'], ['c2', 'Condition 2: positive association'], ['c3', 'Condition 3: IIA'], ['c4', 'Condition 4: not imposed'], ['c5', 'Condition 5: no dictator'], ['par', 'Consequence 1: Pareto']];
          rows.forEach(([id, lab2], k) => { const Yr = 18 + k * 25; rowsGeo.push({ id, Y: Yr }); tag(v, d, K[id].ok, lab2, 10, Yr, { size: 10.5, sel: condSel === id && !K[id].ok }); });
          // step claims
          let Yy = 18 + 6 * 25 + 10;
          hl(v, d, 8, CW - 8, Yy - 8, 'grid');
          if (fr.cell) {
            const k = kOf(...fr.cell);
            txt(v, d, `Arrow’s profile: R₁ = ${R3[fr.cell[0]].map((q) => XYZ[q]).join(', ')}   R₂ = ${R3[fr.cell[1]].map((q) => XYZ[q]).join(', ')}`, 10, Yy + 4, { size: 10.5, weight: 700, color: 'gold', align: 'left' });
            fr.claims.forEach((cl, q) => tag(v, d, holds(k, cl), `${XYZ[cl[0]]} ${cl[2]} ${XYZ[cl[1]]} — ${cl[3]}`, 10, Yy + 26 + q * 23, { size: 9.5 }));
          } else txt(v, d, 'no profile: a step of pure logic', 10, Yy + 4, { size: 10.5, weight: 600, color: 'muted', align: 'left' });
          // funnel
          const Fn = runFunnel(), yF = Ck.height - 118;
          hl(v, d, 8, CW - 8, yF - 10, 'grid');
          txt(v, d, 'all IIA rules for 2 individuals, searched:', 10, yF + 2, { size: 10.5, weight: 650, color: 'muted', align: 'left' });
          [['IIA rules', Fn.total], ['+ Axioms I–II', Fn.trans], ['+ Condition 2', Fn.c2], ['+ Condition 4', Fn.c4], ['+ Condition 5', Fn.c5]].forEach(([l, nn], q) => {
            const Yq = yF + 22 + q * 18, w = (Math.log10(nn + 1) / Math.log10(Fn.total + 1)) * (CW - 190);
            txt(v, d, l, 104, Yq, { size: 10, weight: 650, align: 'right' });
            rr(d, 112, Yq - 6, Math.max(2, w), 12, 3); d.fillStyle = v.color(q === 4 ? 'red' : q === 3 ? 'purple' : 'accent', 0.5); d.fill();
            txt(v, d, fmtK(nn) + (q === 3 ? ` (dictators: ${Fn.dicts.join(', ')})` : ''), 118 + Math.max(2, w), Yq, { size: 10, weight: 800, align: 'left', color: nn ? 'ink' : 'red' });
          });
        });
        v.legend([['gold', 'the profile of the current proof step'], ['red', 'offending profiles / not an ordering'], ['green', 'condition holds', { dot: true }]]);
        v.readout(() => {
          const K = check(), Fn = runFunnel(), fr = St.frame;
          const failed = [['ord', 'Axioms I–II'], ['c2', 'Condition 2'], ['c3', 'Condition 3'], ['c4', 'Condition 4'], ['c5', 'Condition 5']].filter(([id]) => !K[id].ok).map(([, l]) => l);
          const st = fr.cell ? ` At this step your rule ${fr.claims.every((cl) => holds(kOf(...fr.cell), cl)) ? 'agrees with every deduction' : 'departs from the deduction — so it must break one of Conditions 1–5'}.` : '';
          return `Your rule breaks ${failed.length ? `**${failed.join(', ')}**` : 'nothing?!'}.${st} Exhaustive check of the theorem: of ${fmtK(Fn.total)} IIA rules for two individuals, ${Fn.trans} give an ordering, ${Fn.c2} of those satisfy positive association, ${Fn.c4} are also non-imposed — individuals ${Fn.dicts.join(' and ')} as dictators — and **${Fn.c5}** survive non-dictatorship, as Arrow proved.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 3.14
    {
      num: '3.14',
      kind: 'Paper',
      name: 'Conditions for Simple Majority Decision',
      paper: { authors: 'Kenneth O. May', year: 1952, title: 'A Set of Independent Necessary and Sufficient Conditions for Simple Majority Decision', venue: 'Econometrica 20 (4): 680–684', doi: '10.2307/1907651' },
      introduces: ['polsci-3.1'],
      statement: String.raw`May models a choice between two alternatives $x$ and $y$: individual $i$ reports $D_i = 1$, $0$ or $-1$ (prefers $x$, indifferent, prefers $y$), and a **group decision function** gives $D = f(D_1, \dots, D_n)$. He proves that $f$ is **simple majority decision** — $D = 1, 0, -1$ according as $N(1) >, =, < N(-1)$ — if and only if it is (I) **decisive** (defined and single-valued for every pattern), (II) **egalitarian** (symmetric in the individuals), (III) **neutral** ($f(-D) = -f(D)$), and (IV) **positively responsive** (if $D$ is a tie or $x$, a change of one individual toward $x$ makes it $x$). He also shows the four conditions are independent: each can fail while the other three hold. Since group choice among many alternatives can be built from pairwise choices, May remarks that his theorem characterizes majority decision between every pair.`,
      idea: String.raw`Arrow (polsci-3.13) had just shown that no social welfare function on three or more alternatives meets his conditions; May asked what is special about majority rule on two. His proof is three lines: egalitarianism makes $D$ a function of the counts; neutrality makes a tie of counts a tie of outcome (the pattern and its negation have the same counts); positive responsiveness then gives $x$ whenever $N(1) - N(-1) \ge 1$, by induction, and neutrality gives $y$ for the rest. Independence is shown by four rules, each failing exactly one condition: adopting both alternatives on a tie (not decisive), counting one individual twice (not egalitarian), requiring a two-thirds majority for $x$ (not neutral), and unanimity (not positively responsive). May’s theorem (polsci-3.1) became the standard justification of majority rule; his remark that pairwise choices determine choices from larger sets drew Arrow’s rejoinder that this needs transitivity — which majority rule lacks (polsci-2.1).`,
      caption: String.raw`The table is a group decision function for two individuals: rows are individual 1’s vote, columns individual 2’s, and each cell the group outcome — $x$, tie, $y$, or *both* (May’s non-decisive output, $x$ and $y$ both adopted). **Click a cell** to cycle it. With three individuals the 27 patterns appear as three tables, one for each vote of individual 3. The four checks mark the cells that break each condition. Load May’s four independence examples from *rule*. The bar chart is an exhaustive census of all $4^9 = 262{,}144$ such functions for two individuals: only simple majority meets all four conditions, and each “three out of four” class is non-empty — May’s independence result, recomputed.`,
      deps: ['polsci-1.1'],
      refs: [],
      tags: ['May', 'paper', 'majority rule'],
      credit: 'Kenneth O. May, 1952',
      links: { doi: 'https://doi.org/10.2307/1907651' },
      viz(v) {
        const Tb = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, minWidth: 360, title: 'group decision function · click a cell' });
        const Ck = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, minWidth: 360, title: 'May’s conditions · census of all rules for two individuals' });
        const RULES = {
          majority: { label: 'simple majority', f: (D) => Math.sign(sum(D)) },
          both: { label: 'both on ties (not I)', f: (D) => (sum(D) === 0 ? 2 : Math.sign(sum(D))) },
          twice: { label: 'individual 1 twice (not II)', f: (D) => Math.sign(sum(D) + D[0]) },
          twothirds: { label: 'two-thirds for x (not III)', f: (D) => { const a = D.filter((x) => x === 1).length, b = D.filter((x) => x === -1).length; return a > 2 * b ? 1 : a === 2 * b ? 0 : -1; } },
          unanimity: { label: 'unanimity (not IV)', f: (D) => (D.every((x) => x === 1) ? 1 : D.every((x) => x === -1) ? -1 : 0) },
        };
        let n = 2, F = new Map(), custom = false, cellsGeo = [];
        const nS = v.select('individuals', [{ value: 2, label: '2' }, { value: 3, label: '3' }], 2, { onChange: (k) => { n = k; load(); } });
        const rS = v.select('rule', Object.entries(RULES).map(([value, r]) => ({ value, label: r.label })), 'majority', { onChange: () => load() });
        const pats = () => { const out = [], rec = (cur) => { if (cur.length === n) { out.push(cur.slice()); return; } for (const x of [1, 0, -1]) { cur.push(x); rec(cur); cur.pop(); } }; rec([]); return out; };
        function load() { F = new Map(); for (const D of pats()) F.set(D.join(','), RULES[rS.value].f(D)); custom = false; }
        load();
        const neg = (val) => (val === 2 ? 2 : -val);
        const setOf = (val) => (val === 2 ? [1, -1] : [val]);
        function analyse(G = F, nn = n) {
          const P = [...G.keys()].map((k) => k.split(',').map(Number)), get = (D) => G.get(D.join(','));
          const bad = { I: [], II: [], III: [], IV: [] };
          for (const D of P) {
            const f = get(D);
            if (f === 2) bad.I.push([D]);
            const srt = D.slice().sort((a, b) => b - a); if (get(srt) !== f) bad.II.push([D, srt]);
            if (get(D.map((x) => -x)) !== neg(f)) bad.III.push([D, D.map((x) => -x)]);
            if (setOf(f).some((x) => x >= 0)) for (let i = 0; i < nn; i++) for (const up of [0, 1]) { if (up <= D[i]) continue; const D2 = D.slice(); D2[i] = up; if (get(D2) !== 1) bad.IV.push([D, D2]); }
          }
          return bad;
        }
        // census: all 4^9 rules for two individuals
        let census = null;
        const runCensus = () => {
          if (census) return census;
          const P2 = []; for (const a of [1, 0, -1]) for (const b of [1, 0, -1]) P2.push([a, b]);
          const idx = (D) => (1 - D[0]) * 3 + (1 - D[1]);
          const bins = Array(16).fill(0), vals = [1, 0, -1, 2], f = Array(9).fill(0);
          for (let code = 0; code < 1 << 18; code++) {
            let t = code; for (let q = 0; q < 9; q++) { f[q] = vals[t & 3]; t >>= 2; }
            let I = 1, II = 1, III = 1, IV = 1;
            for (let q = 0; q < 9; q++) {
              const D = P2[q], val = f[q];
              if (val === 2) I = 0;
              if (II && f[idx([D[1], D[0]])] !== val) II = 0;
              if (III && f[idx([-D[0], -D[1]])] !== (val === 2 ? 2 : -val)) III = 0;
              if (IV && (val !== -1)) for (let i = 0; i < 2; i++) for (const up of [0, 1]) { if (up <= D[i]) continue; const D2 = D.slice(); D2[i] = up; if (f[idx(D2)] !== 1) IV = 0; }
            }
            bins[I | (II << 1) | (III << 2) | (IV << 3)]++;
          }
          census = { bins, total: 1 << 18 }; return census;
        };
        Tb.onClick((x, y) => { const px = Tb.X(x), py = Tb.Y(y); const g = cellsGeo.find((q) => px >= q[0] && px <= q[2] && py >= q[1] && py <= q[3]); if (g) { const cur = F.get(g[4]); F.set(g[4], cur === 1 ? 0 : cur === 0 ? -1 : cur === -1 ? 2 : 1); custom = true; } });
        const VT = (val) => (val === 1 ? ['x', 'blue'] : val === -1 ? ['y', 'orange'] : val === 0 ? ['tie', 'gray'] : ['both', 'purple']);
        const DL = (x) => (x === 1 ? 'x' : x === -1 ? 'y' : '0');
        v.render(() => {
          const A = analyse(), c = Tb.ctx, W = Tb.width, H = Tb.height;
          cellsGeo = [];
          const blocks = n === 2 ? [null] : [1, 0, -1], bw = (W - 20) / blocks.length, s = Math.min(n === 2 ? 64 : 36, (bw - 40) / 3, (H - 120) / 3);
          const markCells = new Set(); Object.values(A).forEach((list) => list.slice(0, 40).forEach((pr) => markCells.add(pr[0].join(','))));
          blocks.forEach((d3, b) => {
            const X0 = 10 + b * bw + (bw - 3 * s) / 2 + 12, Y0 = 56;
            if (d3 !== null) txt(v, c, `individual 3 votes ${DL(d3)}`, X0 + 1.5 * s, 18, { size: 10.5, weight: 700, color: 'muted' });
            [1, 0, -1].forEach((d1, i) => {
              txt(v, c, DL(d1), X0 - 12, Y0 + (i + 0.5) * s, { size: 11, weight: 700, color: 'muted' });
              [1, 0, -1].forEach((d2, j) => {
                if (i === 0) txt(v, c, DL(d2), X0 + (j + 0.5) * s, Y0 - 10, { size: 11, weight: 700, color: 'muted' });
                const D = d3 === null ? [d1, d2] : [d1, d2, d3], key = D.join(','), val = F.get(key), [t, col] = VT(val);
                const Xc = X0 + j * s, Yc = Y0 + i * s;
                cellsGeo.push([Xc, Yc, Xc + s, Yc + s, key]);
                rr(c, Xc + 2, Yc + 2, s - 4, s - 4, 5); c.fillStyle = v.color(col, val === 0 ? 0.16 : 0.42); c.fill();
                if (markCells.has(key)) { c.strokeStyle = v.color('red'); c.lineWidth = 2.2; c.stroke(); }
                txt(v, c, t, Xc + s / 2, Yc + s / 2, { size: Math.min(14, s * 0.32), weight: 750, color: val === 0 ? 'muted' : 'ink' });
              });
            });
            if (b === 0) { txt(v, c, '1 ↓', X0 - 14, Y0 - 26, { size: 10, weight: 700, color: 'muted' }); txt(v, c, '2 →', X0 + 3 * s + 4, Y0 - 10, { size: 10, weight: 700, color: 'muted', align: 'left' }); }
          });
          let ty = H - 50;
          [['I', 'decisive'], ['II', 'egalitarian'], ['III', 'neutral'], ['IV', 'pos. responsive']].forEach(([k, lab], q) => tag(v, c, A[k].length === 0, `${k} ${lab}`, 12 + (q % 2) * (W / 2 - 4), ty + Math.floor(q / 2) * 26, { size: 10.5 }));
          // ---- census
          const d = Ck.ctx, CW = Ck.width, CH = Ck.height, Cs = runCensus();
          const show = [[15, 'all four: majority', 'green'], [14, 'all but I (decisive)', 'purple'], [13, 'all but II (egalitarian)', 'accent'], [11, 'all but III (neutral)', 'teal'], [7, 'all but IV (responsive)', 'orange'], [0, 'none of the four', 'gray']];
          txt(v, d, `${fmtK(Cs.total)} rules for two individuals (4 outcomes × 9 patterns)`, 12, 16, { size: 11, weight: 650, color: 'muted', align: 'left' });
          const mx = Math.log10(Math.max(...show.map(([b]) => Cs.bins[b])) + 1), x0 = 168, rh = Math.min(30, (CH - 70) / show.length);
          show.forEach(([b, lab, col], q) => {
            const Yq = 42 + q * rh, nn = Cs.bins[b], w = (Math.log10(nn + 1) / mx) * (CW - x0 - 70);
            txt(v, d, lab, x0 - 8, Yq, { size: 10.5, weight: 650, align: 'right' });
            rr(d, x0, Yq - 8, Math.max(3, w), 16, 4); d.fillStyle = v.color(col, 0.5); d.fill();
            txt(v, d, fmtK(nn), x0 + Math.max(3, w) + 6, Yq, { size: 11.5, weight: 800, align: 'left' });
          });
          txt(v, d, 'log scale · each “all but one” class is non-empty: independence', CW / 2, CH - 14, { size: 10, color: 'muted' });
        });
        v.legend([['blue', 'x', { dot: true }], ['orange', 'y', { dot: true }], ['gray', 'tie', { dot: true }], ['purple', 'both adopted', { dot: true }], ['red', 'cell breaks a condition']]);
        v.readout(() => {
          const A = analyse(), Cs = runCensus(), failing = Object.keys(A).filter((k) => A[k].length);
          let ex = '';
          if (A.II.length) { const [D, D2] = A.II[0]; ex = ` E.g. II: (${D.map(DL).join(', ')}) and (${D2.map(DL).join(', ')}) are the same votes by different people but get different outcomes.`; }
          else if (A.IV.length) { const [D, D2] = A.IV[0]; ex = ` E.g. IV: from (${D.map(DL).join(', ')}) one individual moves toward x, giving (${D2.map(DL).join(', ')}), which is not x.`; }
          else if (A.III.length) { const [D, D2] = A.III[0]; ex = ` E.g. III: (${D.map(DL).join(', ')}) and its mirror (${D2.map(DL).join(', ')}) are not mirrored.`; }
          return `${custom ? 'Your rule' : RULES[rS.value].label} ${failing.length ? `fails condition${failing.length > 1 ? 's' : ''} **${failing.join(', ')}**` : 'satisfies all four conditions — and it is simple majority, as May’s theorem says'}.${ex} Census: **${Cs.bins[15]}** of ${fmtK(Cs.total)} rules satisfy I–IV; ${fmtK(Cs.bins[14])}, ${fmtK(Cs.bins[13])}, ${fmtK(Cs.bins[11])} and ${fmtK(Cs.bins[7])} satisfy all but I, II, III and IV respectively.`;
        });
      },
    },
  ],
};
