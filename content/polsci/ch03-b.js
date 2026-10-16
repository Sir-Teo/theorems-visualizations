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
  ],
};
