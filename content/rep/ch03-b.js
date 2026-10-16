// Representation Theory — Chapter 3: Characters (part 2: 3.9–3.16). Shared machinery: ch03.shared.js.
import { TAU, ecol, nm, matN, mm, polygon, cadd, csub, cmul, cconj, cabs, csc, ctex, ctext, cm, cmm, ctr, cdet, cscale, tableOf, ip, tableDefect, colDot, multiplicities, cubeData, actOn, orbitCount, irrepMats, cexp } from './ch03.shared.js';

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const plain = (L) => L.replace(/\^\{(\d+)\}/g, (_, d) => [...d].map((c) => SUP[c]).join('')).replace(/\\,/g, '');
const byClass = (G) => G.classes.flatMap((c) => c.els);
const rowTex = (r) => r.tex;
/** Plain text names of the irreducibles for canvas labels. */
const rowName = (r) => ({ '\\mathbf 1': '1', '\\varepsilon': 'ε', '\\chi_\\omega': 'ω', '\\chi_{\\bar\\omega}': 'ω̄' }[r.tex] || r.tex.replace(/\\chi_?/, 'χ').replace(/[{}\\]/g, '').replace(/^A_1$/, 'A1').replace(/_/g, ''));

export default {
  collection: 'rep',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9',
      kind: 'Theorem',
      name: 'Decomposition of the regular representation',
      statement: String.raw`The regular representation $\mathbb C[G]$ of a finite group $G$ has character $\chi_{\mathrm{reg}}(e)=|G|$ and $\chi_{\mathrm{reg}}(g)=0$ for $g\neq e$. Every irreducible representation $W_i$ occurs in it exactly $\dim W_i$ times: $\mathbb C[G]\cong\bigoplus_iW_i^{\,\dim W_i}$. Taking dimensions, $|G|=\sum_i(\dim W_i)^2$.`,
      idea: String.raw`The matrix of $g$ in the basis of group elements permutes the basis ($x\mapsto gx$), so its trace counts fixed points; but $gx=x$ forces $g=e$. By 3.6 the multiplicity of $W_i$ is $\langle\chi_{\mathrm{reg}},\chi_i\rangle=\frac1{|G|}\,|G|\,\overline{\chi_i(e)}=\dim W_i$. Counting dimensions on both sides gives $\sum d_i^2=|G|$.`,
      caption: String.raw`For the chosen group the left panel stacks, for each irreducible $W_i$, a block $m_i$ wide and $d_i=\dim W_i$ tall (its $m_i$ copies of a $d_i$-dimensional space); the total area is $\dim\mathbb C[G]=|G|$. In "regular" mode the characters of the action $x\mapsto gx$ are counted fixed point by fixed point and the blocks come out as $d_i\times d_i$ squares. Switch to the action by conjugation $x\mapsto gxg^{-1}$ (also a permutation representation of degree $|G|$, with $\chi(g)=|C_G(g)|$): the total area is still $|G|$, but the blocks are no longer squares.`,
      deps: ['rep-3.6', 'rep-1.2'],
      refs: ['Serre §2.4'],
      tags: ['regular representation', 'sum of squares'],
      credit: 'Frobenius, 1897; Burnside, 1898 (independently)',
      verify: true,
      viz(v) {
        const KEYS = ['S3', 'D4', 'Q8', 'A4', 'D5', 'S4'];
        const gsel = v.select('group', KEYS.map((k) => ({ value: k, label: `$${tableOf(k).G.tex}$` })), 'S3');
        const act = v.select('action on $G$', [{ value: 'reg', label: 'left multiplication (regular)' }, { value: 'conj', label: 'conjugation' }], 'reg');
        const A = v.stage({ x: [-0.3, 9], y: [-0.3, 5], equal: true, axes: false, height: 330, weight: 1.15, title: 'blocks: $m_i$ copies of $W_i$' });
        const B = v.stage({ x: [-0.6, 6], y: [-0.5, 5], axes: 'box', gutter: true, height: 330, weight: 1, title: 'multiplicity $m_i$ (bar) and degree $d_i$ (ring)', xlabel: 'irreducible' });
        const calc = () => {
          const T = tableOf(gsel.value), G = T.G;
          const perm = (g) => G.perms ? null : null;
          void perm;
          const fix = G.classes.map((c) => {
            let f = 0; const g = c.rep;
            for (let x = 0; x < G.n; x++) f += (act.value === 'reg' ? G.mul[g][x] : G.mul[G.mul[g][x]][G.inv[g]]) === x ? 1 : 0;
            return [f, 0];
          });
          const m = multiplicities(G, T.rows, fix).map((z) => z[0]);
          return { T, G, fix, m };
        };
        v.render(() => {
          const { T, G, m } = calc();
          const wide = m.reduce((s, x) => s + x, 0) + 0.25 * m.length, tall = Math.max(...T.rows.map((r) => r.d), ...m);
          A.setView([-0.3, Math.max(wide, 6) + 0.3], [-0.3, Math.max(tall, 3) + 0.4]);
          let x = 0;
          T.rows.forEach((r, i) => {
            const w = m[i], h = r.d;
            if (w > 1e-9) {
              A.rect(x, 0, x + w, h, { fill: ecol(i), fillAlpha: 0.32, color: ecol(i), width: 2 });
              for (let k = 1; k < w - 1e-9; k++) A.line(x + k, 0, x + k, h, { color: ecol(i), width: 0.8, alpha: 0.6 });
              for (let k = 1; k < h; k++) A.line(x, k, x + w, k, { color: ecol(i), width: 0.8, alpha: 0.6 });
              A.tex(`${nm(w * h, 0)}`, x + w / 2, h / 2, { size: 14, color: 'ink' });
              A.tex(rowTex(r), x + w / 2, h + 0.25, { size: 12, color: ecol(i) });
            }
            x += w + 0.25;
          });
          B.setView([-0.6, T.rows.length - 0.4], [-0.5, Math.max(3, ...m, ...T.rows.map((r) => r.d)) + 1]);
          B.setTicks(T.rows.map((r, i) => [i, rowName(r)]), null);
          B.bars(m, { x0: 0, dx: 1, color: (_, i) => ecol(i) });
          T.rows.forEach((r, i) => B.dot(i, r.d, { r: 9, hollow: true, color: 'ink' }));
          B.hline(0, { color: 'ink', width: 1 });
        });
        v.readout(() => {
          const { T, G, fix, m } = calc();
          const area = m.reduce((s, x, i) => s + x * T.rows[i].d, 0), sq = T.rows.reduce((s, r) => s + r.d * r.d, 0);
          const same = m.every((x, i) => Math.abs(x - T.rows[i].d) < 1e-9);
          return `$\\chi(${G.classes.map((c) => G.L[c.rep]).join('),\\chi(')})=(${fix.map((z) => nm(z[0], 0)).join(',\\ ')})$ — ${act.value === 'reg' ? '$|G|$ at $e$, $0$ elsewhere' : 'the centraliser orders'}. $\\sum m_id_i=${nm(area, 0)}=|G|=${G.n}$.\n${act.value === 'reg' ? `$m_i=d_i$ for every $i$: ${same ? 'yes' : 'no'}; $\\sum d_i^2=${sq}=|G|$.` : `Here $m_i\\ne d_i$ in general (squares broken); still $\\sum d_i^2=${sq}=|G|$ for the table itself.`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10',
      kind: 'Theorem',
      name: 'Number of irreducibles equals number of conjugacy classes',
      statement: String.raw`The number of isomorphism classes of irreducible complex representations of a finite group $G$ equals the number of conjugacy classes of $G$. Equivalently the irreducible characters form an orthonormal **basis** of the space of class functions, and the character table is a square matrix.`,
      idea: String.raw`The irreducible characters are orthonormal (3.5), hence independent, so their number is at most the number of classes. To see that they span, take a class function $f$ orthogonal to all of them and form $T=\sum_gf(g)\rho(g)$ for an irreducible $\rho$: it commutes with the group, so it is a scalar $\lambda$ by Schur’s lemma, with $\lambda\dim\rho=\sum f(g)\chi_\rho(g)=|G|\langle f,\overline{\chi_\rho}\rangle=0$. Hence $T=0$ for every irreducible, and by decomposing $\mathbb C[G]$ (3.9) $f=0$.`,
      caption: String.raw`Left: the elements of the group on a circle, grouped and coloured by conjugacy class (found here by conjugating every element by every other). Click an element to see its class: orange chords go to all $hgh^{-1}$. Right: the character table of the same group, one row per irreducible and one column per class; the table is a square. The readout confirms that the rows found are orthonormal and that their degrees satisfy $\sum d_i^2=|G|$, so none is missing.`,
      deps: ['rep-3.9'],
      refs: ['Serre §2.5'],
      tags: ['conjugacy classes', 'character table'],
      credit: 'Frobenius, 1896',
      viz(v) {
        const KEYS = ['Z4', 'S3', 'D4', 'Q8', 'D5', 'D6', 'A4', 'S4', 'A5', 'S5'];
        let sel = 1;
        const gsel = v.select('group', KEYS.map((k) => ({ value: k, label: `$${tableOf(k).G.tex}$` })), 'S3', { onChange: () => { sel = 1; } });
        const A = v.stage({ x: [-1.45, 1.45], y: [-1.45, 1.45], equal: true, axes: false, height: 380, weight: 0.95, title: 'elements, coloured by class' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, weight: 1.1, title: 'the character table' });
        const T = v.table(B, { rows: 3, cols: 3, square: false, maxCell: 60, cellAspect: 1.15, size: 13, labelSize: 12.5, margin: 8 });
        const pos = (G, k) => { const idx = byClass(G).indexOf(k), a = (TAU * idx) / G.n; return [1.2 * Math.sin(a), 1.2 * Math.cos(a)]; };
        A.onClick((x, y) => {
          const { G } = tableOf(gsel.value); let best = sel, bd = 1e9;
          for (let k = 0; k < G.n; k++) { const p = pos(G, k), d = Math.hypot(x - p[0], y - p[1]); if (d < bd) { bd = d; best = k; } }
          sel = best;
        });
        v.render(() => {
          const { G, rows } = tableOf(gsel.value), k = G.classes.length, r = G.n > 30 ? 3.5 : G.n > 12 ? 6 : 9;
          const conj = new Set(G.perms ? G.mul.map((_, h) => G.mul[G.mul[h][sel]][G.inv[h]]) : []);
          conj.forEach((g) => { if (g !== sel) A.segment(pos(G, sel), pos(G, g), { color: 'orange', width: G.n > 30 ? 1 : 1.8, alpha: 0.8 }); });
          G.cls.forEach((ci, g) => { const [x, y] = pos(G, g); A.dot(x, y, { r, color: ecol(ci), fill: ecol(ci), label: G.n <= 12 ? `$${G.L[g]}$` : undefined, tex: true, labelPos: 'n' }); });
          const [sx, sy] = pos(G, sel); A.dot(sx, sy, { r: r + 5, hollow: true, color: 'gold' });
          T.draw({
            rows: rows.length, cols: k, colLabels: (j) => `$${G.L[G.classes[j].rep]}$`, rowLabels: (i) => `$${rows[i].tex}$`, cornerLabel: `${k}×${rows.length}`,
            value: (i, j) => ctext(rows[i].vals[j]).replace(/^-0$/, '0'), fill: (i, j) => [ecol(j), 0.16], size: k > 5 ? 11.5 : 13,
            sub: (i, j) => (i === 0 ? `×${G.classes[j].size}` : ''), subSize: 9.5,
          });
        });
        v.readout(() => {
          const { G, rows } = tableOf(gsel.value), k = G.classes.length;
          const def = tableDefect(G, rows), sq = rows.reduce((s, r) => s + r.d * r.d, 0), cl = G.classes[G.cls[sel]];
          return `$|G|=${G.n}$ has **${k}** conjugacy classes (sizes $${G.classes.map((c) => c.size).join(',\\ ')}$, adding to ${G.classes.reduce((s, c) => s + c.size, 0)}) and **${rows.length}** irreducibles (degrees $${rows.map((r) => r.d).join(',\\ ')}$).\nRows orthonormal: max deviation ${def < 1e-9 ? '0' : nm(def, 3)}; $\\sum d_i^2=${sq}${sq === G.n ? '=|G|$, so the list is complete' : '\\ne|G|$ — a row is missing'}. Selected $${G.L[sel]}$ lies in a class of size ${cl.size}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11',
      kind: 'Theorem',
      name: 'Column orthogonality',
      statement: String.raw`Let $\chi_1,\dots,\chi_r$ be the irreducible characters of a finite group $G$ and $g,h\in G$. Then
$$\sum_{i=1}^r\chi_i(g)\overline{\chi_i(h)}=\begin{cases}|C_G(g)|&\text{if $g$ and $h$ are conjugate},\\0&\text{otherwise,}\end{cases}$$
where $C_G(g)$ is the centraliser of $g$. In words, the columns of the character table, taken over the same classes as the rows, are orthogonal, and the squared length of the column of $g$ is $|G|/|\text{class of }g|$.`,
      idea: String.raw`By 3.10 the table $X=(\chi_i(C_j))$ is square, and 3.5 says $X D X^*=I$ with $D=\operatorname{diag}(|C_j|/|G|)$. A square matrix with a right inverse is invertible, so $X^*XD$ is also $I$, i.e. $\sum_i\overline{\chi_i(C_k)}\chi_i(C_j)\,|C_j|/|G|=\delta_{jk}$. Multiplying by $|G|/|C_j|=|C_G(g_j)|$ gives the statement. It is exactly here that the squareness (3.10) is used.`,
      caption: String.raw`The table shows the dot product of columns $a$ and $b$ of the character table (sum over the irreducibles). Cells that agree with the theorem (the centraliser order on the diagonal, $0$ off it) are green. Click a cell to see the two columns as bars over the irreducibles. Use the slider to delete one row of the table: the columns then no longer have the right lengths, which shows that all irreducibles are needed.`,
      deps: ['rep-3.10'],
      refs: ['Serre §2.5'],
      tags: ['orthogonality', 'centraliser'],
      credit: 'Frobenius, 1896',
      viz(v) {
        const KEYS = ['S3', 'D4', 'Q8', 'A4', 'S4', 'S5'];
        let sel = [0, 1];
        const gsel = v.select('group', KEYS.map((k) => ({ value: k, label: `$${tableOf(k).G.tex}$` })), 'S4', { onChange: () => { sel = [0, 1]; } });
        const omit = v.slider('delete row number (0 = none)', 0, 7, 0, { int: true });
        const A = v.stage({ x: [-0.6, 7], y: [-4, 6.5], axes: 'box', gutter: true, height: 340, weight: 1, title: 'two columns of the table', xlabel: 'irreducible' });
        const S = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 1.15, title: 'dot products of columns' });
        const T = v.table(S, { rows: 3, cols: 3, maxCell: 60, size: 13, labelSize: 12.5, margin: 8 });
        S.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i >= 0 && c.j >= 0) sel = [c.i, c.j]; });
        const calc = () => {
          const { G, rows: all } = tableOf(gsel.value), o = omit.value, rows = all.filter((_, i) => i + 1 !== o);
          const M = G.classes.map((_, a) => G.classes.map((_, b) => colDot(rows, a, b)));
          return { G, rows, all, M };
        };
        v.render(() => {
          const { G, rows, M } = calc(), k = G.classes.length;
          if (sel[0] >= k || sel[1] >= k) sel = [0, 1];
          const exp = (a, b) => (a === b ? G.classes[a].cent : 0);
          T.draw({
            rows: k, cols: k, rowLabels: (i) => `$${G.L[G.classes[i].rep]}$`, colLabels: (j) => `$${G.L[G.classes[j].rep]}$`, size: k > 5 ? 11.5 : 13,
            value: (i, j) => ctext(M[i][j]).replace(/^-0$/, '0'), fill: (i, j) => [cabs(csub(M[i][j], [exp(i, j), 0])) < 1e-9 ? 'green' : 'red', 0.26], highlight: [[sel[0], sel[1], 'accent']],
            sub: (i, j) => (i === j ? `|C|=${G.classes[i].cent}` : ''), subSize: 9,
          });
          A.setView([-0.6, Math.max(rows.length, 3) - 0.4], [-7, 7]);
          A.setTicks(rows.map((r, i) => [i, rowName(r)]), null);
          const colA = rows.map((r) => r.vals[sel[0]][0]), colB = rows.map((r) => r.vals[sel[1]][0]);
          colA.forEach((x, i) => A.rect(i - 0.32, 0, i - 0.02, x, { fill: 'accent', fillAlpha: 0.3, color: 'accent', width: 1.4 }));
          colB.forEach((x, i) => A.rect(i + 0.02, 0, i + 0.32, x, { fill: 'orange', fillAlpha: 0.3, color: 'orange', width: 1.4 }));
          A.hline(0, { color: 'ink', width: 1 });
        });
        v.legend([['accent', 'column of the first class'], ['orange', 'column of the second class']]);
        v.readout(() => {
          const { G, rows, all, M } = calc(), a = sel[0], b = sel[1];
          let dev = 0; M.forEach((r, i) => r.forEach((z, j) => { dev = Math.max(dev, cabs(csub(z, [i === j ? G.classes[i].cent : 0, 0]))); }));
          return `Columns of $${G.L[G.classes[a].rep]}$ and $${G.L[G.classes[b].rep]}$: $\\sum_i\\chi_i\\overline{\\chi_i}=${ctex(M[a][b], 3)}$; theorem: $${a === b ? `|C_G(${G.L[G.classes[a].rep]})|=${G.classes[a].cent}` : '0'}$. ${rows.length === all.length ? 'All rows present' : `Row ${omit.value} deleted`}: largest deviation over the whole table ${dev < 1e-9 ? '**0**' : `**${nm(dev, 3)}**`}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.12
    {
      num: '3.12',
      kind: 'Theorem',
      name: 'Projection onto isotypic components',
      statement: String.raw`Let $V$ be a complex representation of a finite group $G$ and $\chi_i$ an irreducible character of degree $d_i$. The operator
$$P_i=\frac{d_i}{|G|}\sum_{g\in G}\overline{\chi_i(g)}\,\rho(g)$$
is the projection of $V$ onto its $\chi_i$-isotypic component $V_i$ (the sum of all subrepresentations isomorphic to the $i$-th irreducible), along the sum of the other isotypic components. The $P_i$ commute with $G$, $P_iP_j=\delta_{ij}P_i$ and $\sum_iP_i=\mathrm{id}$, so $V=\bigoplus_iV_i$.`,
      idea: String.raw`$P_i$ commutes with every $\rho(h)$ because $\overline{\chi_i}$ is a class function (3.2), so on each irreducible constituent it is a scalar by Schur’s lemma. That scalar is $\frac{d_i}{|G|}\sum_g\overline{\chi_i(g)}\chi_j(g)/d_j\cdot d_j/d_j=\delta_{ij}$ by orthogonality (3.5), so $P_i$ is $1$ on constituents of type $i$ and $0$ on the others. $\sum_iP_i=\mathrm{id}$ follows from column orthogonality (3.11) applied to the identity column: $\sum_id_i\chi_i(g)=|G|\delta_{g,e}$.`,
      caption: String.raw`$D_6$ acts on the six vertices of a hexagon, and so on functions on them by $(g\cdot f)(x)=f(g^{-1}x)$. Drag the blue handles to choose $f$. The panels show the projections $P_if$ onto the isotypic components, as discs on the hexagon (blue positive, red negative, area proportional to the value); only the types that occur are drawn at full strength. They sum to $f$. The readout verifies that each $P_i$ is idempotent and that the pieces are mutually orthogonal.`,
      deps: ['rep-3.10', 'rep-2.8'],
      refs: ['Serre §2.6', 'Fulton–Harris §2.4'],
      tags: ['isotypic component', 'projection'],
      credit: 'Frobenius, 1897 (the projection formula appears in the course of the decomposition of the regular representation)',
      verify: true,
      viz(v) {
        const T = tableOf('D6'), G = T.G, hex = polygon(6);
        const A = v.stage({ x: [-0.5, 6.5], y: [-4.2, 4.2], axes: 'box', gutter: true, height: 300, weight: 0.9, title: 'a function $f$ on the vertices', xlabel: 'vertex' });
        const hs = Array.from({ length: 6 }, (_, k) => A.handle(k, [1.5, -0.5, 2, 0.5, -1.5, 1][k], { color: 'accent', r: 8, constrain: { x: [k, k], y: [-4, 4] } }));
        v.button('random', () => { const r = v.rng(Math.floor(Math.random() * 1e6)); hs.forEach((h, k) => h.set(k, Math.round(r.uniform(-3, 3) * 2) / 2)); });
        v.button('one vertex', () => hs.forEach((h, k) => h.set(k, k === 0 ? 3 : 0)));
        v.button('alternating', () => hs.forEach((h, k) => h.set(k, k % 2 ? -2 : 2)));
        v.button('rotating wave', () => hs.forEach((h, k) => h.set(k, 3 * Math.cos((TAU * k) / 6 + 0.4))));
        const B = v.stage({ x: [0, 4.8], y: [0, 2.6], equal: true, axes: false, height: 300, weight: 1.5, title: 'projections $P_if$' });
        const act = (g, f) => { const out = Array(6).fill(0); G.perms[g].forEach((to, k) => { out[to] = f[k]; }); return out; };
        const proj = (f) => T.rows.map((r) => {
          const out = Array(6).fill(0);
          G.perms.forEach((_, g) => { const w = (r.d / G.n) * r.vals[G.cls[g]][0], a = act(g, f); a.forEach((x, k) => { out[k] += w * x; }); });
          return out;
        });
        const F = () => hs.map((h) => h.y);
        v.render(() => {
          const f = F(), P = proj(f), all = [f, ...P];
          A.setView([-0.5, 5.5], [-4.2, 4.2]);
          A.setTicks([0, 1, 2, 3, 4, 5].map((k) => [k, `${'ABCDEF'[k]}`]), null);
          f.forEach((x, k) => A.rect(k - 0.28, 0, k + 0.28, x, { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 1.2 }));
          A.hline(0, { color: 'ink', width: 1 });
          const M = Math.max(1e-9, ...f.map(Math.abs), 1);
          const names = ['$f$', ...T.rows.map((r) => `$P_{${r.tex}}f$`)];
          all.forEach((vals, p) => {
            const col = p % 4, rowi = p < 4 ? 1 : 0, cx = 0.6 + col * 1.2 + (p >= 4 ? 0 : 0), cy = 0.65 + rowi * 1.3;
            const norm = Math.hypot(...vals), dim = p > 0 && norm < 1e-9;
            B.poly(hex.map(([x, y]) => [cx + 0.42 * x, cy + 0.42 * y]), { color: dim ? 'faint' : 'muted', width: 1.2, fill: false });
            hex.forEach(([x, y], k) => {
              const val = vals[k], rad = 0.25 * Math.sqrt(Math.abs(val) / M), px = cx + 0.42 * x, py = cy + 0.42 * y;
              if (Math.abs(val) > 1e-9) B.circle(px, py, rad, { fill: val > 0 ? 'accent' : 'red', fillAlpha: 0.6, color: val > 0 ? 'accent' : 'red', width: 1 });
              else B.dot(px, py, { r: 2, color: 'faint', fill: 'faint' });
            });
            B.tex(names[p].replace(/\$/g, ''), cx, cy + 0.66, { size: 13, color: p === 0 ? 'ink' : dim ? 'faint' : ecol(p - 1) });
          });
        });
        v.readout(() => {
          const f = F(), P = proj(f);
          const sum = f.map((_, k) => P.reduce((s, p) => s + p[k], 0)), err = Math.max(...sum.map((x, k) => Math.abs(x - f[k])));
          const idem = Math.max(...P.map((p, i) => { const q = proj(p)[i]; return Math.max(...q.map((x, k) => Math.abs(x - p[k]))); }));
          const orth = Math.max(0, ...P.flatMap((p, i) => P.map((q, j) => (i === j ? 0 : Math.abs(p.reduce((s, x, k) => s + x * q[k], 0))))));
          const norms = P.map((p, i) => ({ i, n: p.reduce((s, x) => s + x * x, 0) })).filter((o) => o.n > 1e-9);
          const nf = f.reduce((s, x) => s + x * x, 0);
          return `Present types: ${norms.map((o) => `$${T.rows[o.i].tex}$ ($\\|P f\\|^2=${nm(o.n, 2)}$)`).join(', ') || 'none ($f=0$)'}. $\\max|\\sum_iP_if-f|=${err < 1e-9 ? '0' : nm(err, 3)}$; $\\max|P_i^2f-P_if|=${idem < 1e-9 ? '0' : nm(idem, 3)}$; largest overlap $|\\langle P_if,P_jf\\rangle|=${orth < 1e-9 ? '0' : nm(orth, 3)}$. Pythagoras: $\\sum\\|P_if\\|^2=${nm(norms.reduce((s, o) => s + o.n, 0), 2)}=\\|f\\|^2=${nm(nf, 2)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.13
    {
      num: '3.13',
      kind: 'Theorem',
      name: 'Orthogonality of matrix coefficients',
      statement: String.raw`Let $\rho\colon G\to U(d)$ and $\rho'\colon G\to U(d')$ be unitary irreducible representations of a finite group, with matrix entries $\rho_{ij}(g)$, $\rho'_{kl}(g)$. Then
$$\frac1{|G|}\sum_{g\in G}\rho_{ij}(g)\overline{\rho'_{kl}(g)}=\begin{cases}\dfrac1d\,\delta_{ik}\delta_{jl}&\text{if }\rho=\rho',\\[4pt]0&\text{if }\rho\not\cong\rho'.\end{cases}$$
So the matrix entries of the irreducibles, taken one per isomorphism class, are $\sum d_i^2=|G|$ pairwise orthogonal functions on $G$.`,
      idea: String.raw`For any matrix $X$ the average $\frac1{|G|}\sum_g\rho(g)X\rho'(g)^{-1}$ intertwines $\rho'$ and $\rho$, so by Schur’s lemma (2.5, 2.7) it is $0$ when $\rho\not\cong\rho'$ and $\frac{\operatorname{tr}X}d\,I$ when $\rho=\rho'$. Take $X=E_{jl}$ and read the $(i,k)$ entry; unitarity gives $\rho'(g)^{-1}=\overline{\rho'(g)}^{\mathsf T}$. Taking the diagonal entries and summing gives 3.5. Unitarity (2.1) is essential: in a non-unitary basis the formula fails.`,
      caption: String.raw`The table is the Gram matrix of all matrix coefficients of the irreducible representations of the chosen group ($|G|$ functions in all): the entries $\rho_{ij}$ of the two-dimensional irreducible, written $V_{ij}$, and the one-dimensional characters. Green cells agree with the theorem: $1$ on the diagonal for the one-dimensional ones, $\tfrac12$ for the entries of a 2-dimensional unitary one, and $0$ elsewhere. Click a cell to see the two functions on the group. Now drag the shear slider, which rewrites the 2-dimensional representation in a non-orthonormal basis: the representation is still irreducible, but the orthogonality fails.`,
      deps: ['rep-3.5'],
      refs: ['Serre §2.2'],
      tags: ['matrix coefficients', 'Schur orthogonality'],
      credit: 'Schur, 1905',
      verify: true,
      viz(v) {
        const KEYS = ['S3', 'D4'];
        let sel = [0, 1];
        const gsel = v.select('group', KEYS.map((k) => ({ value: k, label: `$${tableOf(k).G.tex}$` })), 'S3', { onChange: () => { sel = [0, 1]; } });
        const sh = v.slider('shear of the 2-dimensional basis', 0, 1.5, 0, { step: 0.05 });
        const A = v.stage({ x: [-0.5, 8], y: [-1.5, 1.5], axes: 'box', gutter: true, height: 320, weight: 1, title: 'two coefficient functions on $G$', xlabel: 'element' });
        const S = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, weight: 1.2, title: 'Gram matrix of the matrix coefficients' });
        const T = v.table(S, { rows: 3, cols: 3, maxCell: 54, size: 11.5, labelSize: 11.5, margin: 8 });
        S.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i >= 0 && c.j >= 0) sel = [c.i, c.j]; });
        const funcs = () => {
          const key = gsel.value, { G } = tableOf(key), irr = irrepMats(key), s = sh.value, list = [];
          irr.forEach((r) => {
            let mats = r.mats;
            if (r.d === 2 && s > 0) { const Q = [[1, s], [0, 1]], Qi = [[1, -s], [0, 1]]; mats = mats.map((M) => cmm(cm(Q), cmm(M, cm(Qi)))); }
            for (let i = 0; i < r.d; i++) for (let j = 0; j < r.d; j++) list.push({ d: r.d, tex: r.d === 1 ? r.tex : `${r.tex}_{${i + 1}${j + 1}}`, vals: G.perms ? mats.map((M) => M[i][j]) : mats.map((M) => M[i][j]), irr: r.tex });
          });
          const gram = list.map((a) => list.map((b) => { let t = [0, 0]; a.vals.forEach((z, g) => { t = cadd(t, cmul(z, cconj(b.vals[g]))); }); return csc(t, 1 / G.n); }));
          return { G, list, gram };
        };
        v.render(() => {
          const { G, list, gram } = funcs(), n = list.length;
          if (sel[0] >= n || sel[1] >= n) sel = [0, 1];
          const exp = (i, j) => (i === j ? 1 / list[i].d : 0);
          T.draw({
            rows: n, cols: n, rowLabels: (i) => `$${list[i].tex}$`, colLabels: (j) => `$${list[j].tex}$`, size: 11.5,
            value: (i, j) => ctext(gram[i][j]).replace(/^-0$/, '0'), fill: (i, j) => [cabs(csub(gram[i][j], [exp(i, j), 0])) < 1e-9 ? 'green' : 'red', 0.26], highlight: [[sel[0], sel[1], 'accent']],
          });
          A.setView([-0.5, G.n - 0.5], [-1.5, 1.5]);
          A.setTicks(G.perms.map((_, g) => [g, plain(G.L[g])]), null);
          list[sel[0]].vals.forEach((z, g) => A.rect(g - 0.32, 0, g - 0.02, z[0], { fill: 'accent', fillAlpha: 0.3, color: 'accent', width: 1.4 }));
          list[sel[1]].vals.forEach((z, g) => A.rect(g + 0.02, 0, g + 0.32, z[0], { fill: 'orange', fillAlpha: 0.3, color: 'orange', width: 1.4 }));
          A.hline(0, { color: 'ink', width: 1 });
        });
        v.readout(() => {
          const { list, gram } = funcs(), [a, b] = sel;
          let dev = 0; gram.forEach((r, i) => r.forEach((z, j) => { dev = Math.max(dev, cabs(csub(z, [i === j ? 1 / list[i].d : 0, 0]))); }));
          return `$\\langle ${list[a].tex},${list[b].tex}\\rangle=${ctex(gram[a][b], 3)}$; theorem: $${a === b ? `1/${list[a].d}` : '0'}$. Largest deviation over the whole table: ${dev < 1e-9 ? '**0**' : `**${nm(dev, 3)}**`}${sh.value > 0 ? ' (non-unitary basis for the 2-dimensional representation)' : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.14
    {
      num: '3.14',
      kind: 'Definition',
      name: 'Character tables',
      statement: String.raw`The **character table** of a finite group $G$ is the square matrix $\big(\chi_i(C_j)\big)$ whose rows are the irreducible characters $\chi_1=\mathbf 1,\chi_2,\dots,\chi_r$ and whose columns are the conjugacy classes $C_1=\{e\},C_2,\dots,C_r$ (so $r$ is both the number of classes and of irreducibles, 3.10). Its first column lists the degrees $d_i=\chi_i(e)$, with $\sum d_i^2=|G|$, and the class sizes $|C_j|$ are recorded with it, since they are the weights of the orthogonality relations.`,
      idea: String.raw`A table is not just a list of numbers: its rows are orthonormal for the weights $|C_j|/|G|$ (3.5) and its columns are orthogonal with squared length $|C_G(g_j)|$ (3.11). These two sets of relations are strong enough to determine the table from a few of its rows: for instance, when a single row is missing, column orthogonality with the identity column gives $d_r\overline{\chi_r(C_j)}=-\sum_{i<r}d_i\overline{\chi_i(C_j)}$, and $d_r^2=|G|-\sum_{i<r}d_i^2$.`,
      caption: String.raw`Build the table row by row with the buttons: each new row is checked against the earlier ones (green when it has norm $1$ and is orthogonal to them). The top row records the class sizes. Reveal all but one row (the slider) and press "deduce the last row": its degree comes from $\sum d_i^2=|G|$, and its other entries from column orthogonality with the identity column. The deduced row is drawn in orange and compared with the true one. With two or more rows hidden, this simple deduction no longer determines anything.`,
      deps: ['rep-3.10'],
      refs: ['Fulton–Harris §2.3'],
      see: ['qchem-8.4'],
      tags: ['character table'],
      viz(v) {
        const KEYS = ['S3', 'D4', 'Q8', 'D5', 'A4', 'S4', 'D6'];
        let given = 1, deduced = false;
        const gsel = v.select('group', KEYS.map((k) => ({ value: k, label: `$${tableOf(k).G.tex}$` })), 'S3', { onChange: () => { given = 1; deduced = false; } });
        v.button('add next row', () => { const n = tableOf(gsel.value).rows.length; given = Math.min(n, given + 1); deduced = false; });
        v.button('reset', () => { given = 1; deduced = false; });
        v.button('deduce the last row', () => { deduced = true; });
        const S = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, weight: 1 });
        const T = v.table(S, { rows: 3, cols: 3, square: false, maxCell: 62, cellAspect: 1.2, size: 13, labelSize: 12.5, margin: 8 });
        const calc = () => {
          const { G, rows } = tableOf(gsel.value), n = rows.length, gv = Math.min(given, n);
          const known = rows.slice(0, gv);
          let ded = null, why = '';
          if (deduced) {
            if (gv === n) why = 'The table is already complete.';
            else if (gv === n - 1) {
              const dd = G.n - known.reduce((s, r) => s + r.d * r.d, 0), d = Math.round(Math.sqrt(dd));
              ded = G.classes.map((_, j) => (j === 0 ? [d, 0] : csc(cconj(known.reduce((s, r) => cadd(s, csc(cconj(r.vals[j]), r.d)), [0, 0])), -1 / d)));
              why = `$d^2=${G.n}-${known.map((r) => r.d * r.d).join('-')}=${dd}$, so $d=${d}$.`;
            } else why = `${n - gv} rows are missing: the identity column alone cannot fix them.`;
          }
          return { G, rows, n, gv, known, ded, why };
        };
        v.render(() => {
          const { G, rows, n, gv, ded } = calc(), k = G.classes.length;
          const norm = (i) => { const a = rows[i]; let ok = cabs(csub(ip(G, a.vals, a.vals), [1, 0])) < 1e-9; for (let j = 0; j < i; j++) ok = ok && cabs(ip(G, a.vals, rows[j].vals)) < 1e-9; return ok; };
          const showRows = n + 1; // row 0: class sizes
          T.draw({
            rows: showRows, cols: k, colLabels: (j) => `$${G.L[G.classes[j].rep]}$`, rowLabels: (i) => (i === 0 ? 'size' : `$${rows[i - 1].tex}$`), cornerLabel: '',
            value: (i, j) => {
              if (i === 0) return String(G.classes[j].size);
              const r = i - 1;
              if (r < gv) return ctext(rows[r].vals[j]).replace(/^-0$/, '0');
              if (ded && r === n - 1) return ctext(ded[j]).replace(/^-0$/, '0');
              return '?';
            },
            fill: (i, j) => {
              if (i === 0) return ['muted', 0.12];
              const r = i - 1;
              if (r < gv) return [norm(r) ? 'green' : 'red', 0.2];
              if (ded && r === n - 1) return ['orange', 0.3];
              return null;
            },
            size: k > 5 ? 11.5 : 13,
          });
        });
        v.readout(() => {
          const { G, rows, n, gv, known, ded, why } = calc();
          let out = `${gv} of ${n} rows shown. $\\sum_{i\\le${gv}}d_i^2=${known.reduce((s, r) => s + r.d * r.d, 0)}$ out of $|G|=${G.n}$.`;
          if (ded) {
            const last = rows[n - 1];
            const err = Math.max(...ded.map((z, j) => cabs(csub(z, last.vals[j]))));
            out += ` ${why} Deduced row vs. the true row: largest difference ${err < 1e-9 ? '**0** — it is exactly the missing irreducible' : nm(err, 3)}.`;
          } else if (why) out += ' ' + why;
          return out;
        });
      },
    },
    // ------------------------------------------------------------------ 3.15
    {
      num: '3.15',
      kind: 'Proposition',
      name: 'Burnside’s lemma: counting orbits',
      statement: String.raw`Let a finite group $G$ act on a finite set $X$. The number of orbits is
$$|X/G|=\frac1{|G|}\sum_{g\in G}|X^g|,\qquad X^g=\{x\in X:\ gx=x\},$$
the average number of fixed points. In terms of the permutation representation $\mathbb C[X]$ with character $\chi_{\mathrm{perm}}(g)=|X^g|$, this is $\langle\chi_{\mathrm{perm}},\mathbf 1\rangle$, the multiplicity of the trivial representation.`,
      idea: String.raw`The invariant vectors of $\mathbb C[X]$ are the functions constant on orbits, so they have dimension $|X/G|$; this is also the multiplicity of the trivial representation, which 3.6 computes as $\frac1{|G|}\sum_g\chi_{\mathrm{perm}}(g)$. Combinatorially, count the pairs $(g,x)$ with $gx=x$ in two ways, using that the stabiliser of $x$ has $|G|/|Gx|$ elements, so each orbit contributes $|G|$.`,
      caption: String.raw`Colour the beads of a necklace (rotations only, or rotations and reflections) or the six faces of a cube (rotations) with $k$ colours. The bars give, for every symmetry $g$, the number of colourings it fixes, found by testing every colouring. Their average (dashed line) is the Burnside count. A brute-force grouping of all $k^n$ colourings into orbits gives the same number; for necklaces one representative of each orbit is drawn on the right.`,
      deps: ['rep-3.6', 'rep-1.2'],
      refs: ['Serre §2.3'],
      see: ['comb-10.3'],
      tags: ['orbit counting', 'combinatorics'],
      credit: 'Cauchy, 1845; Frobenius, 1887; Burnside, 1897 (the lemma is not Burnside’s own)',
      verify: true,
      viz(v) {
        const cube = cubeData(), faceP = cube.G.perms.map((_, g) => actOn(cube, cube.rot[g], cube.sets.faces.pts));
        const mode = v.select('what to colour', [{ value: 'neck', label: 'necklace (rotations)' }, { value: 'brace', label: 'bracelet (rotations, reflections)' }, { value: 'cube', label: 'cube faces (rotations)' }], 'neck');
        const nb = v.slider('beads $n$', 3, 8, 6, { int: true });
        const kc = v.slider('colours $k$', 2, 4, 2, { int: true });
        const A = v.stage({ x: [-0.6, 16], y: [0, 40], axes: 'box', gutter: true, height: 330, weight: 1.1, title: 'colourings fixed by each symmetry', xlabel: 'symmetry' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1, title: 'one colouring from each orbit' });
        const cache = new Map();
        const setup = () => {
          const m = mode.value, n = m === 'cube' ? 6 : nb.value, k = kc.value, id = `${m}${n}${k}`;
          if (cache.has(id)) return cache.get(id);
          let perms, labels;
          if (m === 'cube') { perms = faceP; labels = cube.G.L.map((_, g) => String(g)); }
          else {
            perms = []; labels = [];
            for (let a = 0; a < n; a++) { perms.push(Array.from({ length: n }, (_, i) => (i + a) % n)); labels.push(a === 0 ? 'e' : `r${a}`); }
            if (m === 'brace') for (let a = 0; a < n; a++) { perms.push(Array.from({ length: n }, (_, i) => (((a - i) % n) + n) % n)); labels.push(`s${a}`); }
          }
          const total = k ** n, fixCount = Array(perms.length).fill(0);
          const colour = (c) => { const out = Array(n); for (let i = 0; i < n; i++) { out[i] = c % k; c = Math.floor(c / k); } return out; };
          for (let c = 0; c < total; c++) {
            const col = colour(c);
            perms.forEach((p, g) => { let ok = true; for (let i = 0; i < n && ok; i++) if (col[p[i]] !== col[i]) ok = false; if (ok) fixCount[g]++; });
          }
          // orbits of colourings by union–find on colourings
          const enc = (col) => col.reduce((s, x, i) => s + x * k ** i, 0);
          const maps = perms.map((p) => Array.from({ length: total }, (_, c) => { const col = colour(c), out = Array(n); for (let i = 0; i < n; i++) out[p[i]] = col[i]; return enc(out); }));
          const orbits = orbitCount(maps, total);
          const res = { n, k, perms, labels, fixCount, orbits, total, colour };
          cache.set(id, res); if (cache.size > 12) cache.delete(cache.keys().next().value);
          return res;
        };
        v.render(() => {
          const { n, k, fixCount, orbits, total, colour, perms } = setup(), mean = fixCount.reduce((s, x) => s + x, 0) / perms.length;
          const mx = Math.max(...fixCount) * 1.1;
          A.setView([-0.6, perms.length - 0.4], [0, mx]);
          A.setTicks(perms.length <= 16 ? perms.map((_, g) => [g, mode.value === 'cube' ? '' : setup().labels[g]]) : [], null);
          A.bars(fixCount, { x0: 0, dx: 1, color: (_, g) => (mode.value === 'cube' ? ecol(Math.min(...[0]) + g) : g < n ? 'accent' : 'orange') });
          A.hline(mean, { color: 'green', width: 2.4, dash: [7, 4] });
          A.text(`average ${nm(mean, 2)}`, perms.length - 0.6, mean + mx * 0.03, { align: 'right', baseline: 'bottom', size: 12, color: 'green' });
          // gallery
          if (mode.value === 'cube') {
            B.text(`${orbits.length} orbits of ${total} colourings`, 0.5, 0.55, { align: 'center', size: 20, color: 'ink', weight: 700 });
            B.text('(each drawn orbit-size is |G| / |stabiliser|)', 0.5, 0.42, { align: 'center', size: 12, color: 'muted' });
            const sizes = new Map(); orbits.forEach((o) => sizes.set(o.length, (sizes.get(o.length) || 0) + 1));
            B.text([...sizes.entries()].sort((a, b) => a[0] - b[0]).map(([s, c]) => `${c}×size ${s}`).join(', '), 0.5, 0.3, { align: 'center', size: 12, color: 'muted' });
          } else {
            const shown = orbits.slice(0, 48), cols = 8, rowsN = Math.ceil(shown.length / cols), cw = 1 / cols, ch = 1 / Math.max(rowsN, 5);
            const palette = ['accent', 'orange', 'green', 'purple'];
            shown.forEach((o, idx) => {
              const col = colour(o[0]), cx = (idx % cols + 0.5) * cw, cy = 1 - (Math.floor(idx / cols) + 0.5) * ch, R = Math.min(cw, ch) * 0.34;
              for (let i = 0; i < n; i++) {
                const a = (TAU * i) / n + Math.PI / 2;
                B.dot(cx + R * Math.cos(a) * (cw > ch ? ch / cw : 1) * 0 + R * Math.cos(a) * 0.9, cy + R * Math.sin(a) * 0.9, { r: n > 6 ? 4 : 5, color: palette[col[i]], fill: palette[col[i]] });
              }
            });
            if (orbits.length > 48) B.text(`… and ${orbits.length - 48} more`, 0.5, 0.02, { align: 'center', size: 12, color: 'muted' });
          }
        });
        v.readout(() => {
          const { n, k, fixCount, orbits, total, perms } = setup(), sum = fixCount.reduce((s, x) => s + x, 0);
          const cyc = mode.value === 'cube' ? '' : ` (a rotation with $c$ cycles fixes $k^c$ colourings)`;
          return `$\\frac1{|G|}\\sum_g|X^g|=\\frac{${sum}}{${perms.length}}=${nm(sum / perms.length, 3)}$ with $|X|=${k}^{${n}}=${total}$${cyc}; brute-force orbit count: **${orbits.length}** — ${Math.abs(sum / perms.length - orbits.length) < 1e-9 ? 'equal' : 'different'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.16
    {
      num: '3.16',
      kind: 'Paper',
      name: 'Über Gruppencharaktere',
      statement: String.raw`Dedekind’s question was to factor the **group determinant** $\Theta_G(x)=\det\big(x_{gh^{-1}}\big)_{g,h\in G}$, a polynomial of degree $|G|$ in one variable $x_g$ per group element. For an abelian group he had shown that it is a product of linear forms $\sum_gx_g\chi(g)$ over the characters $\chi$ of $G$. Frobenius showed in the general case that $\Theta_G$ is a product of irreducible polynomials $\Phi_i$ of degree $d_i$, each occurring $d_i$ times, and that the coefficients of the linear terms of the $\Phi_i$ (at $x=\delta_e$) are numbers $\chi_i(g)$, the **characters**; he proved their orthogonality and the other relations of this chapter. In modern terms $\Phi_i(x)=\det\sum_gx_g\rho_i(g)$ for the $i$-th irreducible representation $\rho_i$ and $\chi_i(g)=\operatorname{tr}\rho_i(g)=\partial\Phi_i/\partial x_g\big|_{x=\delta_e}$.`,
      idea: String.raw`Before 1896 the characters of a non-abelian group were not known to exist. Frobenius took Dedekind’s group determinant as the starting point (their correspondence began in April 1896), found its irreducible factors, and defined the characters from them, without matrices; the representations $\rho_i$ followed in 1897 (after Molin’s work, which Frobenius learned of that year). The paper introduces the characters (3.1), their orthogonality (3.5) and the character table (3.14), and the equality of the number of irreducibles with the number of conjugacy classes (3.10).`,
      caption: String.raw`Pick a group and a random point $x$ (a number $x_g$ for each element). The left panel shows the $|G|\times|G|$ matrix $(x_{gh^{-1}})$, coloured by value; the table on the right lists the factors $\Phi_i(x)=\det\sum_gx_g\rho_i(g)$ built from the irreducible representations (written with matrices known today: this reconstruction is not Frobenius’s own computation) and the product $\prod\Phi_i^{d_i}$, compared with $\det(x_{gh^{-1}})$ computed directly. The last line differentiates each $\Phi_i$ numerically at $x=\delta_e$ in the direction of $g$: the numbers are the character table.`,
      deps: ['nt-11.1', 'ladr-9.43'],
      refs: ['Frobenius 1896'],
      paper: { authors: 'G. Frobenius', year: 1896, title: 'Über Gruppencharaktere', venue: 'Sitzungsberichte der Königlich Preußischen Akademie der Wissenschaften zu Berlin 1896: 985–1021', url: 'https://archive.org/details/sitzungsberichte1896deutsch' },
      introduces: ['rep-3.1', 'rep-3.5', 'rep-3.14'],
      tags: ['group determinant', 'Frobenius', 'history'],
      credit: 'Frobenius, 1896 (after a question of Dedekind, letters from April 1896)',
      scope: String.raw`Complex groups, finite. The factorisation of $\Theta_G$ into $\prod\Phi_i^{d_i}$ is stated in modern form; which of its parts is in this particular paper and which in Frobenius’s companion paper on the prime factors of the group determinant (same year) was not checked against the originals.`,
      verify: true,
      viz(v) {
        const KEYS = ['Z4', 'S3', 'D4', 'Q8', 'A4'];
        let seed = 5;
        const gsel = v.select('group', KEYS.map((k) => ({ value: k, label: `$${tableOf(k).G.tex}$` })), 'S3');
        v.button('new random $x$', () => { seed += 1; });
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, weight: 0.95, title: 'the matrix $(x_{gh^{-1}})$' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, weight: 1.25, title: 'factors and characters' });
        const TA = v.table(A, { rows: 3, cols: 3, maxCell: 44, size: 11, labelSize: 11, margin: 8 });
        const TB = v.table(B, { rows: 3, cols: 4, square: false, maxCell: 60, cellAspect: 1.9, size: 12, labelSize: 12, margin: 8 });
        const calc = () => {
          const key = gsel.value, { G, rows } = tableOf(key), irr = irrepMats(key), r = v.rng(seed);
          const x = G.perms ? G.mul.map(() => 0) : [];
          for (let g = 0; g < G.n; g++) x[g] = Math.round(r.uniform(-2, 2) * 2) / 2;
          // direct group determinant (complex determinant of a real matrix)
          const M = Array.from({ length: G.n }, (_, g) => Array.from({ length: G.n }, (_, h) => [x[G.mul[g][G.inv[h]]], 0]));
          const direct = cdet(M);
          const Phi = (xs, ir) => { const d = ir.d; let S = Array.from({ length: d }, () => Array.from({ length: d }, () => [0, 0])); xs.forEach((xg, g) => { if (xg) S = S.map((row, i) => row.map((z, j) => cadd(z, csc(ir.mats[g][i][j], xg)))); }); return cdet(S); };
          const phis = irr.map((ir) => Phi(x, ir));
          let prod = [1, 0]; irr.forEach((ir, i) => { for (let k = 0; k < ir.d; k++) prod = cmul(prod, phis[i]); });
          // characters as derivatives of Phi_i at x = delta_e, in direction g
          const eps = 1e-5, delta = (g, s) => G.mul.map((_, h) => (h === 0 ? 1 : 0) + (h === g ? s * eps : 0));
          const tab = irr.map((ir) => G.classes.map((c) => { const g = c.rep, a = Phi(delta(g, 1), ir), b = Phi(delta(g, -1), ir); return csc(csub(a, b), 1 / (2 * eps)); }));
          const chars = irr.map((ir, i) => ({ vals: tab[i], d: ir.d }));
          return { G, rows, irr, x, M, direct, phis, prod, tab, defect: tableDefect(G, chars) };
        };
        v.render(() => {
          const { G, irr, x, M, phis, tab } = calc(), n = G.n;
          const mx = Math.max(...x.map(Math.abs), 1);
          TA.draw({
            rows: n, cols: n, rowLabels: (i) => `$${G.L[i]}$`, colLabels: (j) => `$${G.L[j]}$`, size: n > 8 ? 10 : 12,
            value: (i, j) => nm(M[i][j][0], 1).replace('-', '−'),
            fill: (i, j) => [M[i][j][0] >= 0 ? 'accent' : 'red', Math.min(0.55, (Math.abs(M[i][j][0]) / mx) * 0.55)],
          });
          const k = G.classes.length, nr = irr.length;
          TB.draw({
            rows: nr, cols: 3 + k, rowLabels: (i) => `$${irr[i].tex}$`,
            colLabels: ['$d_i$', '$\\Phi_i(x)$', '$\\partial\\Phi_i$:', ...G.classes.map((c) => `$${G.L[c.rep]}$`)].slice(0, 3 + k),
            value: (i, j) => (j === 0 ? String(irr[i].d) : j === 1 ? ctext(phis[i], 2) : j === 2 ? '' : ctext(tab[i][j - 3], 2).replace(/^-0$/, '0')),
            fill: (i, j) => (j >= 3 ? [ecol(j - 3), 0.16] : j === 1 ? ['accent', 0.14] : null), size: k > 5 ? 10.5 : 12,
          });
        });
        v.readout(() => {
          const { G, irr, direct, prod, defect, tab, rows } = calc();
          let dev = 0; tab.forEach((r, i) => r.forEach((z, j) => { dev = Math.max(dev, cabs(csub(z, rows[i].vals[j]))); }));
          return `$\\det(x_{gh^{-1}})=${ctex(direct, 3)}$ (direct, ${G.n}×${G.n}); $\\prod_i\\Phi_i^{d_i}=${ctex(prod, 3)}$ with degrees ${irr.map((r) => `$${r.d}$`).join(', ')} (so $\\sum d_i^2=${irr.reduce((s, r) => s + r.d * r.d, 0)}=|G|$): difference ${nm(cabs(csub(direct, prod)), 9) === '0' ? '$<10^{-9}$' : nm(cabs(csub(direct, prod)), 6)}.\nCharacters read off from the factors differ from the traces by $\\le${nm(dev, 6) === '0' ? '10^{-9}' : v.sci(dev, 1)}; their row/column orthogonality defect is ${v.sci(Math.max(defect, 1e-16), 1)}.`;
        });
        void matN; void mm; void ctr; void cscale; void cexp; void cm;
      },
    },
  ],
};
