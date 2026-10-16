// Representation Theory — Chapter 4: Character tables of small groups (part 2: 4.7–4.12)
import { TAU, ecol, nm, tableOf, ip, cabs, csub, cmul, cconj, cadd, csc, ctext, cm, cmm, inv, mm, irrepMats, fsIndicator, sqrtCount, formSpace, icosaData, rotClasses, axisAngle, rodrigues, m3v, tr3, PHI, symData, extChars, extTrace, stdMats, moleculeData, displacementChars, projectDisp, pgDecompose, atomPerm, C2V, C3V, elOrder } from './ch04.shared.js';

const fmtZ = (z) => ctext(z).replace(/^-0$/, '0');
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const plain = (L) => L.replace(/\^\{(\d+)\}/g, (_, d) => [...d].map((c) => SUP[c]).join('')).replace(/\\,/g, '');
const clean = (x) => Math.round(x * 1e9) / 1e9 + 0;

export default {
  collection: 'rep',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Proposition',
      name: 'A₅ and the icosahedron',
      statement: String.raw`The rotation group of the icosahedron is $A_5$ (order $60$, classes of sizes $1,15,20,12,12$: the identity, half-turns, third-turns about face axes, and fifth-turns by $72^\circ$ and by $144^\circ$ about vertex axes). Its irreducible characters have degrees $1,3,3',4,5$ ($1+9+9+16+25=60$), with
$$\begin{array}{c|ccccc} &e&(12)(34)&(123)&(12345)&(13524)\\ \hline \mathbf 1&1&1&1&1&1\\ \chi_3&3&-1&0&\varphi&1-\varphi\\ \chi_3'&3&-1&0&1-\varphi&\varphi\\ \chi_4&4&0&1&-1&-1\\ \chi_5&5&1&-1&0&0\end{array}$$
where $\varphi=\tfrac{1+\sqrt5}2$ is the golden ratio. Here $\chi_3$ is the character of the rotation representation, $\chi_3'(g)=\chi_3(g^2)$, $\chi_5=\frac12(\chi_3^2+\chi_3(g^2))-1$ and $\chi_4=\chi_3\chi_3'-\chi_5$.`,
      idea: String.raw`A rotation by $\theta$ has trace $1+2\cos\theta$, giving $3,-1,0$ and, for $72^\circ$ and $144^\circ$, the numbers $1+2\cos72^\circ=\varphi$ and $1+2\cos144^\circ=1-\varphi$ — the golden ratio enters through the pentagon. Everything else is built by the operations of 3.3: the symmetric square of the rotation representation has character $\frac12(\chi^2(g)+\chi(g^2))$ and decomposes as $\mathbf1\oplus\chi_5$, the Galois-conjugate row $\chi_3'$ comes from $g\mapsto g^2$, and $\chi_3\chi_3'$ splits as $\chi_4+\chi_5$. Orthogonality (3.5) checks each row, and $\sum d^2=60$ shows the table is complete.`,
      caption: String.raw`Rotate the icosahedron about the axis of a chosen class (slide "turn"); the 12 vertices are mapped to vertices. Raise "rows derived" to build the table in the order trivial, $\chi_3$, $\chi_3'$, $\chi_5$, $\chi_4$ from the $3\times3$ matrices alone; each new row is tested against the rows above. The entries involving $\varphi$ are the traces $1+2\cos72^\circ$ and $1+2\cos144^\circ$.`,
      deps: ['rep-3.14', 'rep-3.3'],
      refs: ['Fulton–Harris §3.1'],
      tags: ['alternating group', 'icosahedron', 'character table'],
      viz(v) {
        const D = icosaData(), G = D.G, info = rotClasses(G);
        let which = 0;
        const csel = v.select('class', info.map((c) => ({ value: c.i, label: c.deg === 0 ? '$e$' : `${c.deg}° (${c.size})` })), info[1].i, { onChange: () => { which = 0; } });
        v.button('next element of the class', () => { which = (which + 1) % G.classes[csel.value].size; });
        const turn = v.slider('turn', 0, 1, 0.6, { step: 0.01 });
        const nrows = v.slider('rows derived', 1, 5, 5, { int: true });
        const chi3 = (g) => tr3(G.mats[g]), sq = (g) => G.mul[g][g];
        const rowF = [() => 1, chi3, (g) => chi3(sq(g)), (g) => (chi3(g) ** 2 + chi3(sq(g))) / 2 - 1, (g) => chi3(g) * chi3(sq(g)) - ((chi3(g) ** 2 + chi3(sq(g))) / 2 - 1)];
        const rowTex = ['\\mathbf 1', '\\chi_3', "\\chi_3'", '\\chi_5', '\\chi_4'];
        const how = ['trivial', 'trace of the rotation matrix', '$\\chi_3(g^2)$', 'symmetric square of $\\chi_3$, minus the trivial row', '$\\chi_3\\chi_3'+"'"+'-\\chi_5$'];
        const vals = rowF.map((f) => G.classes.map((c) => [clean(f(c.rep)), 0]));
        const ok = rowF.every((f) => G.classes.every((c) => c.els.every((g) => Math.abs(f(g) - f(c.rep)) < 1e-9)));
        const Sx = v.stage({ x: [-2.5, 2.5], y: [-2.3, 2.3], equal: true, axes: false, height: 340, weight: 1 });
        const sc = v.scene3(Sx, { yaw: 0.5, pitch: 0.3, axis: 0, lim: 1.5, axes: false, hint: true });
        const Stab = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 1.15 });
        const Tb = v.table(Stab, { rows: 6, cols: 5, square: false, maxCell: 62, cellAspect: 1.2, size: 13, labelSize: 11.5, margin: 6 });
        v.render(() => {
          const cl = G.classes[csel.value], g = cl.els[which % cl.size], { axis, th } = axisAngle(G.mats[g]), Rt = rodrigues(axis, th * turn.value);
          sc.begin();
          D.edges.forEach(([a, b]) => sc.line(D.verts[a], D.verts[b], { color: 'muted', width: 1.2, alpha: 0.4, dash: true }));
          const img = D.verts.map((p) => m3v(Rt, p));
          D.edges.forEach(([a, b]) => sc.line(img[a], img[b], { color: 'accent', width: 2 }));
          if (th > 1e-9) sc.line(axis.map((t) => -2.2 * t), axis.map((t) => 2.2 * t), { color: 'gold', width: 2 });
          img.forEach((p, i) => sc.dot(p, { r: i === 0 ? 7 : 3.5, color: i === 0 ? 'red' : 'accent', fill: i === 0 ? 'red' : 'accent' }));
          sc.flush();
          const nr = nrows.value;
          Tb.draw({
            rows: 6, cols: 5, colLabels: (j) => (info[j].deg === 0 ? '$e$' : `${info[j].deg}°`), rowLabels: (i) => (i === 0 ? 'size' : `$${rowTex[i - 1]}$`), cornerLabel: '',
            value: (i, j) => (i === 0 ? String(info[j].size) : i <= nr ? fmtZ(vals[i - 1][info[j].i]) : '?'),
            fill: (i, j) => {
              if (i === 0) return ['muted', 0.12];
              if (i > nr) return null;
              const r = vals[i - 1]; let good = cabs(csub(ip(G, r, r), [1, 0])) < 1e-9; for (let t = 0; t < i - 1; t++) good = good && cabs(ip(G, r, vals[t])) < 1e-9;
              return [good ? 'green' : 'red', 0.22];
            },
            activeCol: info.findIndex((c) => c.i === csel.value), activeColor: 'orange',
          });
        });
        v.readout(() => {
          const cl = G.classes[csel.value], g = cl.els[which % cl.size], nr = nrows.value, th = (axisAngle(G.mats[g]).th * 180) / Math.PI;
          const sqs = [1, 9, 9, 25, 16].slice(0, nr).reduce((s, x) => s + x, 0);
          return `Rotation by $${Math.round(th)}^\\circ$: $\\chi_3=1+2\\cos\\theta=${nm(chi3(g), 4)}$ (for reference $\\varphi=${nm(PHI, 4)}$, $1-\\varphi=${nm(1 - PHI, 4)}$). Row ${nr} is the ${how[nr - 1]}. $\\sum d^2=${sqs}$ of $60$. Every row constant on classes: ${ok ? '**yes**' : '**NO**'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Proposition',
      name: 'Exterior powers of the standard representation of Sₙ',
      statement: String.raw`Let $V$ be the standard $(n-1)$-dimensional representation of $S_n$ (the sum-zero subspace of the permutation representation $\mathbb C^n$). For each $k=0,1,\dots,n-1$ the exterior power $\Lambda^kV$ is irreducible, i.e. $\langle\chi_{\Lambda^kV},\chi_{\Lambda^kV}\rangle=1$. Its character is read off the generating function $\sum_k\chi_{\Lambda^kV}(g)\,t^k=\det(1+tg\,|\,V)=\prod_{\text{cycles of }g}\frac{1-(-t)^{\ell}}{1+t}$, and these $n$ representations are pairwise non-isomorphic (they are the "hook" representations, partitions $(n-k,1^k)$).`,
      idea: String.raw`Since $\mathbb C^n=\mathbf1\oplus V$ we get $\Lambda^k\mathbb C^n=\Lambda^kV\oplus\Lambda^{k-1}V$, and $\Lambda^k\mathbb C^n$ is a permutation-type representation (induced from a sign character of $S_k\times S_{n-k}$) whose character is computed from the cycle type of $g$ via the determinant $\det(1+tP_g)=\prod(1-(-t)^\ell)$. Dividing by $1+t$ gives the characters of $\Lambda^kV$. The computation of $\langle\chi,\chi\rangle$ then reduces to a sum over cycle types weighted by class sizes, and it equals $1$ for every $k$ (the proof in general uses Frobenius reciprocity, Chapter 6); here we simply compute it, for $n\le6$, for every class (3.8).`,
      caption: String.raw`Choose $n\le 6$ and $k$. The bars on the left give $\chi_{\Lambda^kV}$ on every conjugacy class (labelled by cycle type), computed from the product formula; the readout confirms it against the traces of $k\times k$ principal minors of the actual $(n-1)\times(n-1)$ matrices. The bars on the right give $\langle\chi_{\Lambda^kV},\chi_{\Lambda^kV}\rangle$ for all $k$ at once: they are all $1$.`,
      deps: ['rep-3.8', 'rep-1.9'],
      refs: ['Fulton–Harris §3.2'],
      tags: ['symmetric group', 'exterior powers', 'irreducibility'],
      viz(v) {
        const ns = v.slider('$n$', 3, 6, 5, { int: true }), ks = v.slider('$k$', 0, 5, 2, { int: true });
        const A = v.stage({ x: [-0.6, 7], y: [-3, 5], axes: 'box', gutter: true, height: 320, weight: 1.35, title: 'character of $\\Lambda^kV$ on each class', xlabel: 'cycle type' });
        const B = v.stage({ x: [-0.6, 5.6], y: [0, 1.5], axes: 'box', gutter: true, height: 320, weight: 0.8, title: '$\\langle\\chi_k,\\chi_k\\rangle$ for every $k$', xlabel: '$k$' });
        const cache = {};
        const calc = (n) => {
          if (cache[n]) return cache[n];
          const { G, types } = symData(n), mats = stdMats(G);
          const polys = types.map((t) => extChars(t));
          let err = 0;
          G.classes.forEach((c, i) => { const A2 = mats[c.rep].map((r) => r.map((z) => z[0])); for (let k = 0; k < n; k++) err = Math.max(err, Math.abs(extTrace(A2, k) - polys[i][k])); });
          const norms = Array.from({ length: n }, (_, k) => G.classes.reduce((s, c, i) => s + c.size * polys[i][k] ** 2, 0) / G.n);
          return (cache[n] = { G, types, polys, err, norms });
        };
        v.render(() => {
          const n = ns.value, k = Math.min(ks.value, n - 1), { G, types, polys, norms } = calc(n);
          const vals = polys.map((p) => p[k]), mx = Math.max(...vals.map(Math.abs), 1) * 1.25;
          A.setView([-0.6, types.length - 0.4], [-mx, mx]);
          A.setTicks(types.map((t, i) => [i, t.join('')]), null);
          A.bars(vals, { x0: 0, dx: 1, color: (_, i) => ecol(i) });
          vals.forEach((x, i) => A.text(String(x), i, x >= 0 ? x + mx * 0.03 : x - mx * 0.03, { align: 'center', baseline: x >= 0 ? 'bottom' : 'top', size: 11, color: 'ink' }));
          A.hline(0, { color: 'ink', width: 1 });
          B.setView([-0.6, n - 0.4], [0, 1.5]);
          B.setTicks(Array.from({ length: n }, (_, i) => [i, String(i)]), null);
          B.bars(norms, { x0: 0, dx: 1, color: (_, i) => (i === k ? 'green' : 'accent') });
          B.hline(1, { color: 'green', width: 1.6, dash: [6, 4] });
        });
        v.readout(() => {
          const n = ns.value, k = Math.min(ks.value, n - 1), { G, polys, err, norms } = calc(n);
          const dimk = polys[0][k];
          return `$S_{${n}}$ has ${G.classes.length} classes. $\\dim\\Lambda^{${k}}V=\\binom{${n - 1}}{${k}}=${dimk}$. Product formula vs. traces of minors of the actual matrices: largest difference ${err < 1e-9 ? '**0**' : nm(err, 3)}. $\\langle\\chi_{${k}},\\chi_{${k}}\\rangle=${nm(norms[k], 6)}$; over all $k$ the largest deviation from $1$ is ${nm(Math.max(...norms.map((x) => Math.abs(x - 1))), 9)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Definition',
      name: 'Real, complex and quaternionic representations',
      statement: String.raw`An irreducible complex representation $\rho$ of a finite group $G$ is of exactly one of three types:
- **real** if it is realisable by real matrices, equivalently there is a $G$-invariant non-degenerate *symmetric* bilinear form on $V$;
- **quaternionic** if $\rho\cong\bar\rho$ but it is not realisable over $\mathbb R$; equivalently there is an invariant non-degenerate *alternating* bilinear form (and $V$ carries an invariant quaternionic structure);
- **complex** if $\rho\not\cong\bar\rho$, i.e. its character is not real-valued; then there is no invariant bilinear form at all.
For irreducible $\rho$ the space of invariant bilinear forms has dimension $0$ or $1$ (Schur).`,
      idea: String.raw`An invariant bilinear form is an intertwiner $V\to V^*$, so by Schur's lemma (2.5) it exists, and is then unique up to scale, exactly when $V\cong V^*$, i.e. when the character is real. A one-dimensional space is spanned by a form $B$ with $B^{\mathsf T}=\pm B$ (the transpose is another invariant form, so it is a multiple of $B$ and the multiple squares to $1$). The sign $+$ means $\rho$ preserves a real structure, the sign $-$ a quaternionic one. The type does not change when the basis does: $B\mapsto P^{-\mathsf T}BP^{-1}$.`,
      caption: String.raw`Pick a group and press "next irreducible" to run through its irreps. The tool solves the linear equations $\rho(g)^{\mathsf T}B\rho(g)=B$ for every $g$ — over all matrices $B$, over symmetric and over alternating ones — and reports the dimensions of the solution spaces and the verdict. The slider changes the basis (shear); the form found changes, its type does not. The $2$-dimensional irreducible of $Q_8$ is quaternionic, the one of $S_3$ real, and $\mathbb Z/3$'s non-trivial characters are complex.`,
      deps: ['rep-2.9'],
      refs: ['Fulton–Harris §3.5', 'Serre §13.2'],
      tags: ['real structure', 'bilinear forms', 'quaternions'],
      viz(v) {
        const GK = ['Z3', 'Z4', 'S3', 'D4', 'Q8', 'A4'];
        let idx = 0;
        const gsel = v.select('group', GK.map((k) => ({ value: k, label: `$${tableOf(k).G.tex}$` })), 'Q8', { onChange: () => { idx = 0; } });
        v.button('next irreducible', () => { idx = (idx + 1) % irrepMats(gsel.value).length; });
        const sh = v.slider('change of basis (shear)', 0, 2, 0, { step: 0.05 });
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 230, weight: 0.9, title: 'invariant forms: dimension' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 230, weight: 1.1, title: 'the form $B$ found' });
        const TA = v.table(A, { rows: 3, cols: 1, square: false, maxCell: 70, cellAspect: 1.8, size: 16, labelSize: 12, margin: 8 });
        const TB = v.table(B, { square: false, maxCell: 62, cellAspect: 1.5, size: 12, margin: 8 });
        const cache = {};
        const solve = (key, k, t) => {
          const id = `${key}${k}${t}`; if (cache[id]) return cache[id];
          const ir = irrepMats(key)[k], d = ir.d;
          let mats = ir.mats;
          if (t > 0) { const P = Array.from({ length: d }, (_, i) => Array.from({ length: d }, (_, j) => (i === j ? 1 : 0) + (d > 1 && i === 0 && j === 1 ? t : d === 1 ? 0 : 0))); const Pi = inv(P), Pc = cm(P), Pic = cm(Pi); mats = mats.map((R) => cmm(cmm(Pc, R), Pic)); }
          const all = formSpace(v.M, mats, 'all'), sym = formSpace(v.M, mats, 'sym'), alt = formSpace(v.M, mats, 'alt');
          const T = tableOf(key), row = T.rows.find((r) => r.name === ir.name), isReal = row.vals.every((z) => Math.abs(z[1]) < 1e-9);
          const type = sym.length ? 'real' : alt.length ? 'quaternionic' : 'complex';
          const form = (sym[0] || alt[0] || null);
          return (cache[id] = { ir, all: all.length, sym: sym.length, alt: alt.length, type, form, isReal, nirr: irrepMats(key).length });
        };
        v.render(() => {
          const key = gsel.value; idx = Math.min(idx, irrepMats(key).length - 1);
          const r = solve(key, idx, sh.value);
          TA.draw({ rows: 3, cols: 1, rowLabels: ['all matrices', 'symmetric', 'alternating'], colLabels: ['dim'], cornerLabel: '', value: (i) => String([r.all, r.sym, r.alt][i]), fill: (i) => (i === 1 && r.sym ? ['green', 0.3] : i === 2 && r.alt ? ['purple', 0.3] : null) });
          if (r.form) {
            // normalise the form so that its largest entry has phase 1
            let big = [0, 0]; r.form.flat().forEach((z) => { if (cabs(z) > cabs(big) + 1e-9) big = z; });
            const ph = [big[0] / cabs(big), -big[1] / cabs(big)], F = r.form.map((row) => row.map((z) => cmul(z, ph)));
            const nrm = Math.max(...F.flat().map(cabs));
            TB.draw({ rows: r.ir.d, cols: r.ir.d, value: (i, j) => fmtZ([clean(F[i][j][0] / nrm), clean(F[i][j][1] / nrm)]), fill: (i, j) => [r.sym ? 'green' : 'purple', 0.15 + 0.3 * (cabs(F[i][j]) / nrm)], rowLabels: null, colLabels: null });
          } else TB.draw({ rows: 1, cols: 1, value: () => 'none', rowLabels: null, colLabels: null, fill: () => ['red', 0.2] });
        });
        v.readout(() => {
          const key = gsel.value, r = solve(key, Math.min(idx, irrepMats(key).length - 1), sh.value);
          const T = tableOf(key), row = T.rows.find((q) => q.name === r.ir.name);
          return `$${T.G.tex}$, irreducible ${Math.min(idx, r.nirr - 1) + 1} of ${r.nirr}: $${r.ir.tex}$ of degree ${r.ir.d}. Dimensions of the spaces of invariant forms: all ${r.all}, symmetric ${r.sym}, alternating ${r.alt} — so the type is **${r.type}**. Character real-valued: ${r.isReal ? 'yes' : 'no'}${r.type === 'complex' ? ' (so $V\\not\\cong V^*$)' : ''}.${sh.value > 0 ? ' (Basis changed: the form is different, the verdict is not.)' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Theorem',
      name: 'Frobenius–Schur indicator',
      statement: String.raw`For an irreducible character $\chi$ of a finite group $G$ put $\nu(\chi)=\frac1{|G|}\sum_{g\in G}\chi(g^2)$. Then $\nu(\chi)\in\{+1,0,-1\}$, and $\nu(\chi)=+1$, $0$, $-1$ exactly when the representation is of real, complex, quaternionic type (4.9). Moreover $\sum_\chi\nu(\chi)\chi(1)$ equals the number of $g\in G$ with $g^2=e$, and more generally $\sum_\chi\nu(\chi)\chi(g)=\#\{h:h^2=g\}$.`,
      idea: String.raw`The key identity is $\chi(g^2)=\chi_{S^2V}(g)-\chi_{\Lambda^2V}(g)$ (the eigenvalues of $g$ are $\lambda_i$, those of $g^2$ are $\lambda_i^2$, and $\sum_{i\le j}\lambda_i\lambda_j-\sum_{i<j}\lambda_i\lambda_j=\sum\lambda_i^2$), so so $\nu(\chi)=\dim(S^2V)^G-\dim(\Lambda^2V)^G$ (3.3, 3.6). The invariants of $V\otimes V$ are the invariant bilinear forms; by Schur there is at most one, either symmetric ($+1$) or alternating ($-1$), and none exactly when $V\not\cong V^*$ ($0$). The second formula follows by expanding the class function $g\mapsto\#\{h:h^2=g\}$ in the irreducible characters and computing the coefficients $\nu(\chi)$.`,
      caption: String.raw`Choose a group. The left bars show $\nu(\chi)=\frac1{|G|}\sum\chi(g^2)$ computed from the character table for each irreducible, coloured by type (green real, red complex, purple quaternionic); a marker records whether the explicit search for invariant bilinear forms of 4.9 reached the same verdict (that search needs matrices, which we have for the irreducibles of the smaller groups). The right bars compare, on each class, the number of square roots $\#\{h:h^2\in C\}/|C|$ counted by brute force with $\sum\nu(\chi)\chi(C)$.`,
      deps: ['rep-4.9', 'rep-3.5'],
      refs: ['Serre §13.2', 'Fulton–Harris §3.5'],
      tags: ['Frobenius–Schur', 'real structure'],
      credit: 'Frobenius & Schur, 1906 (Sitzungsberichte der Preussischen Akademie der Wissenschaften, pp. 186–208)',
      verify: true,
      viz(v) {
        const KEYS = ['Z3', 'Z4', 'S3', 'D4', 'Q8', 'D5', 'A4', 'S4', 'A5', 'S5'];
        const gsel = v.select('group', KEYS.map((k) => ({ value: k, label: `$${tableOf(k).G.tex}$` })), 'Q8');
        const A = v.stage({ x: [-0.6, 7], y: [-1.6, 1.6], axes: 'box', gutter: true, height: 300, weight: 1, title: '$\\nu(\\chi)$ for each irreducible', xlabel: 'irreducible' });
        const B = v.stage({ x: [-0.6, 7], y: [0, 5], axes: 'box', gutter: true, height: 300, weight: 1.15, title: 'square roots of each class', xlabel: 'class' });
        const cache = {};
        const calc = (key) => {
          if (cache[key]) return cache[key];
          const T = tableOf(key), G = T.G;
          const nu = T.rows.map((r) => fsIndicator(G, r.vals));
          const cnt = sqrtCount(G);
          const roots = G.classes.map((c, i) => cnt[i] / c.size);
          const viaChars = G.classes.map((_, i) => T.rows.reduce((s, r, j) => s + nu[j] * r.vals[i][0], 0));
          const found = {};
          irrepMats(key).forEach((ir) => { const row = T.rows.findIndex((r) => r.name === ir.name); const s = formSpace(v.M, ir.mats, 'sym').length, a = formSpace(v.M, ir.mats, 'alt').length; found[row] = s ? 1 : a ? -1 : 0; });
          return (cache[key] = { T, G, nu, roots, viaChars, found, inv: cnt.reduce((s, x, i) => s + (i === 0 ? x : 0), 0) });
        };
        v.render(() => {
          const { T, G, nu, roots, viaChars, found } = calc(gsel.value), r = T.rows.length;
          A.setView([-0.6, r - 0.4], [-1.6, 1.6]);
          A.setTicks(T.rows.map((q, i) => [i, q.name === '1' || q.name === 'A1' ? '1' : q.name.replace('psi', 'ψ')]), [[-1, '−1'], [0, '0'], [1, '+1']]);
          A.bars(nu.map(clean), { x0: 0, dx: 1, color: (x) => (Math.abs(x - 1) < 1e-6 ? 'green' : Math.abs(x + 1) < 1e-6 ? 'purple' : 'red') });
          A.hline(0, { color: 'ink', width: 1 });
          nu.forEach((x, i) => { if (found[i] !== undefined) A.dot(i, found[i] * 1.35, { r: 5, color: Math.abs(found[i] - clean(x)) < 1e-6 ? 'green' : 'red', hollow: true }); });
          const k = G.classes.length, mx = Math.max(...roots, ...viaChars, 1) * 1.2;
          B.setView([-0.6, k - 0.4], [0, mx]);
          B.setTicks(T.names.map((nmx, i) => [i, plain(nmx)]), null);
          roots.forEach((x, i) => { B.rect(i - 0.34, 0, i - 0.02, x, { fill: 'accent', fillAlpha: 0.5, color: 'accent' }); B.rect(i + 0.02, 0, i + 0.34, Math.max(0, viaChars[i]), { fill: 'orange', fillAlpha: 0.5, color: 'orange' }); });
        });
        v.legend([['green', '$\\nu=+1$ real'], ['red', '$\\nu=0$ complex'], ['purple', '$\\nu=-1$ quaternionic'], ['accent', 'square roots counted per element'], ['orange', '$\\sum\\nu\\chi$ on the class']]);
        v.readout(() => {
          const { T, G, nu, roots, viaChars, found } = calc(gsel.value);
          const cnt = sqrtCount(G)[0], sum = T.rows.reduce((s, r, j) => s + nu[j] * r.d, 0);
          const err = Math.max(...roots.map((x, i) => Math.abs(x - viaChars[i])));
          const agree = Object.keys(found).every((i) => Math.abs(found[i] - clean(nu[i])) < 1e-6), nf = Object.keys(found).length;
          return `$\\nu=(${nu.map((x) => nm(x, 3)).join(',\\ ')})$. $\\sum\\nu(\\chi)\\chi(1)=${nm(sum, 3)}$ and the number of $g$ with $g^2=e$ is ${sqrtCount(G)[0]}. Square-root counts vs. $\\sum\\nu\\chi$: largest difference ${err < 1e-9 ? '**0**' : nm(err, 3)}. Bilinear-form search (4.9) on ${nf} of the ${T.rows.length} irreducibles agrees with $\\nu$: ${agree ? '**yes**' : '**NO**'}.${cnt ? '' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11',
      kind: 'Theorem',
      name: 'Counting molecular vibrations by symmetry',
      statement: String.raw`Let a molecule with $N$ atoms have symmetry group $G$ (its point group). The $3N$ displacement coordinates form a representation $\Gamma_{3N}$ of $G$ whose character is $\chi_{3N}(g)=(\text{number of atoms fixed by }g)\cdot\operatorname{tr}(g)$, where $\operatorname{tr}(g)$ is the trace of $g\in O(3)$. Then the vibrations (normal modes) form the representation $\Gamma_{\mathrm{vib}}=\Gamma_{3N}-\Gamma_{\mathrm{trans}}-\Gamma_{\mathrm{rot}}$, where $\Gamma_{\mathrm{trans}}$ is the representation on vectors $(x,y,z)$ and $\Gamma_{\mathrm{rot}}$ the one on axial vectors ($\chi_{\mathrm{rot}}(g)=\det g\cdot\operatorname{tr}g$). The multiplicity of each irreducible $\Gamma_i$ in $\Gamma_{\mathrm{vib}}$, computed by 3.6, is the number of modes of that symmetry type (for a non-linear molecule $3N-6$ in all). For example $\Gamma_{\mathrm{vib}}(\mathrm{H_2O})=2A_1\oplus B_1$ and $\Gamma_{\mathrm{vib}}(\mathrm{NH_3})=2A_1\oplus2E$.`,
      idea: String.raw`A symmetry of the molecule permutes the atoms and rotates or reflects the displacement of each; the trace of the resulting $3N\times3N$ matrix only gets contributions from atoms that stay where they are, each contributing $\operatorname{tr}g$. Because the force constants are invariant under $G$, the Hessian commutes with this representation, so normal modes with distinct frequencies span subrepresentations (Schur, 2.5); the six trivial motions (translations and rotations of the whole molecule) have known characters, and the rest is multiplicity counting with 3.6. The same logic was introduced for vibrations of symmetric systems by Wigner.`,
      caption: String.raw`Choose water ($C_{2v}$) or ammonia ($C_{3v}$). The table is computed from the actual geometry: atoms fixed by each class, the trace of the matrix, and the characters of $\Gamma_{3N}$, translations, rotations; the decomposition appears in the readout. In the picture, a random displacement of the atoms (new random button) is projected onto one irreducible type with the projection formula of 3.12: what remains is a symmetry-adapted displacement of that type. For water, the three $A_1$ and $B_1$ projections of the vibrations are the familiar bending and stretching motions' symmetry types; the projection onto an irrep that does not occur in $\Gamma_{\mathrm{vib}}$ is a translation or rotation (or zero).`,
      deps: ['rep-3.6'],
      refs: ['Serre Ch. 5'],
      see: ['qchem-8.9'],
      tags: ['molecular vibrations', 'point groups', 'chemistry'],
      credit: 'E. Wigner, Nachrichten der Gesellschaft der Wissenschaften zu Göttingen, 1930, pp. 133–146 (vibrations of symmetric systems); geometries are approximate textbook values',
      verify: true,
      viz(v) {
        const mols = { H2O: moleculeData('H2O'), NH3: moleculeData('NH3') };
        let seed = 7, irx = 0;
        const msel = v.select('molecule', [{ value: 'H2O', label: 'H₂O ($C_{2v}$)' }, { value: 'NH3', label: 'NH₃ ($C_{3v}$)' }], 'H2O', { onChange: () => { irx = 0; } });
        v.button('next irreducible type', () => { irx = (irx + 1) % mols[msel.value].P.irreps.length; });
        v.button('new random displacement', () => { seed += 1; });
        const amp = v.slider('amplitude', 0, 1, 0.8, { step: 0.02 });
        const Sx = v.stage({ x: [-2, 2], y: [-1.7, 1.7], equal: true, axes: false, height: 330, weight: 1, title: 'displacement projected onto one type' });
        const sc = v.scene3(Sx, { yaw: 0.5, pitch: 0.25, axis: 0, lim: 1.3, axes: false, hint: true });
        const Stab = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1.15 });
        const Tb = v.table(Stab, { square: false, maxCell: 62, cellAspect: 1.3, size: 13, labelSize: 11, margin: 6 });
        const info = (m) => {
          const mol = mols[m], P = mol.P, ch = displacementChars(mol);
          const vib = ch.disp.map((x, i) => x - ch.trans[i] - ch.rot[i]);
          return { mol, P, ch, vib, mult: { disp: pgDecompose(P, ch.disp), trans: pgDecompose(P, ch.trans), rot: pgDecompose(P, ch.rot), vib: pgDecompose(P, vib) } };
        };
        const irTex = (P, mult) => P.irreps.map((ir, i) => (Math.abs(mult[i]) < 1e-9 ? null : `${Math.round(mult[i]) === 1 ? '' : Math.round(mult[i])}${ir.tex}`)).filter(Boolean).join('\\oplus ');
        v.render(() => {
          const { mol, P, ch, vib } = info(msel.value), ir = P.irreps[Math.min(irx, P.irreps.length - 1)];
          const r = v.rng(seed), u = mol.atoms.map(() => [r.normal(), r.normal(), r.normal()]);
          const pu = projectDisp(mol, ir, u), a = amp.value * 0.5;
          const mx = Math.max(1e-9, ...pu.map((d) => Math.hypot(...d)));
          sc.begin();
          mol.bonds.forEach(([i, j]) => sc.line(mol.atoms[i].p, mol.atoms[j].p, { color: 'muted', width: 2.5 }));
          mol.atoms.forEach((at, i) => {
            sc.dot(at.p, { r: at.el === 'H' ? 7 : 10, color: at.col, fill: at.col });
            const q = at.p.map((x, t) => x + (a * pu[i][t]) / mx);
            if (mx > 1e-6 && amp.value > 0) sc.arrow(at.p, q, { color: 'orange', width: 3 });
          });
          sc.flush();
          Tb.draw({
            rows: 5, cols: P.classes.length, colLabels: (j) => `$${P.classes[j].tex}$`, cornerLabel: '',
            rowLabels: ['fixed atoms', '$\\operatorname{tr}g$', '$\\Gamma_{3N}$', '$\\Gamma_{\\mathrm{trans}}$ / rot', '$\\Gamma_{\\mathrm{vib}}$'],
            value: (i, j) => [String(ch.fixed[j]), String(clean(ch.trans[j])), String(clean(ch.disp[j])), `${clean(ch.trans[j])} / ${clean(ch.rot[j])}`, String(clean(vib[j]))][i],
            fill: (i, j) => (i === 4 ? ['green', 0.2] : null),
          });
        });
        v.legend([['orange', 'projected displacement (arrows, scaled)']]);
        v.readout(() => {
          const { P, mol, mult } = info(msel.value), ir = P.irreps[Math.min(irx, P.irreps.length - 1)], N = mol.atoms.length;
          const modes = mult.vib.reduce((s, m, i) => s + m * P.irreps[i].d, 0);
          return `$\\Gamma_{3N}=${irTex(P, mult.disp)}$; $\\Gamma_{\\mathrm{trans}}=${irTex(P, mult.trans)}$; $\\Gamma_{\\mathrm{rot}}=${irTex(P, mult.rot)}$. **$\\Gamma_{\\mathrm{vib}}=${irTex(P, mult.vib)}$**, ${Math.round(modes)} modes ($3N-6=${3 * N - 6}$). Arrows: projection onto $${ir.tex}$, which occurs ${Math.round(mult.vib[P.irreps.indexOf(ir)])}× among the vibrations.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12',
      kind: 'Theorem',
      name: 'Selection rules',
      statement: String.raw`Let $G$ be a symmetry group of a quantum system, $\psi_i,\psi_f$ states transforming according to irreducible representations $\Gamma_i,\Gamma_f$ of $G$, and $V$ an operator (for instance a component of the dipole moment) transforming according to $\Gamma_V$. If the trivial representation does not occur in $\Gamma_f^*\otimes\Gamma_V\otimes\Gamma_i$ — that is, if $\frac1{|G|}\sum_g\overline{\chi_f(g)}\chi_V(g)\chi_i(g)=0$ — then the matrix element $\langle\psi_f|V|\psi_i\rangle$ vanishes: the transition is forbidden. When the trivial representation does occur, the matrix element is allowed (it need not be non-zero for particular states, but is not zero for symmetry reasons).`,
      idea: String.raw`The number $\langle\psi_f|V|\psi_i\rangle$ is a $G$-invariant pairing, i.e. an invariant linear form on $\Gamma_f^*\otimes\Gamma_V\otimes\Gamma_i$. By Maschke (2.2) and Schur (2.5) a representation with no trivial summand has no non-zero invariant linear form; the multiplicity of the trivial summand is computed from characters by 3.6 and 3.3 (the character of a tensor product is the product of characters).`,
      caption: String.raw`Choose a point group ($C_{2v}$ or $C_{3v}$) and an operator ($x,y,z$ are dipole components, $xy$ and $x^2+y^2$ quadratic, as in Raman scattering). Rows are initial and columns final symmetry types; green cells are predicted allowed by the character rule, grey cells forbidden. The small number in each cell is a numerical check: we build functions of each type by projecting random functions on a symmetric set of points, and compute the normalised sum $\sum\psi_f V\psi_i$ — it is zero (to rounding) in every forbidden cell. Click a cell to see the products $\chi_f\chi_V\chi_i$ class by class.`,
      deps: ['rep-3.6', 'rep-3.3'],
      refs: ['Serre Ch. 5'],
      see: ['qchem-8.10', 'qchem-9.2'],
      tags: ['selection rules', 'point groups', 'quantum mechanics'],
      credit: 'Wigner; Bethe, 1929 (group theory in the quantum mechanics of crystals and molecules)',
      verify: true,
      viz(v) {
        const PG = { C2v: C2V, C3v: C3V };
        let sel = [0, 0];
        const gsel = v.select('point group', [{ value: 'C2v', label: '$C_{2v}$' }, { value: 'C3v', label: '$C_{3v}$' }], 'C2v', { onChange: () => { sel = [0, 0]; } });
        const osel = v.select('operator', [{ value: 'z', label: '$z$' }, { value: 'x', label: '$x$' }, { value: 'y', label: '$y$' }, { value: 'xy', label: '$xy$' }, { value: 'r2', label: '$x^2+y^2$' }], 'z');
        const S = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1.1, title: 'initial (rows) and final (columns)' });
        const T = v.table(S, { square: false, maxCell: 70, cellAspect: 1.15, size: 13, labelSize: 12, margin: 8 });
        const Sb = v.stage({ x: [-0.6, 3.6], y: [-3, 3], axes: 'box', gutter: true, height: 330, weight: 0.9, title: '$\\chi_f\\chi_V\\chi_i$ on each class', xlabel: 'class' });
        const cache = {};
        const setup = (key) => {
          if (cache[key]) return cache[key];
          const P = PG[key], r = v.rng(5);
          const seeds = Array.from({ length: 4 }, () => [r.normal(), r.normal(), r.normal()]);
          const X = []; seeds.forEach((s) => P.ops.forEach((o) => X.push(m3v(o.M, s))));
          const find = (q) => X.findIndex((p) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) < 1e-9);
          const perm = P.ops.map((o) => X.map((p) => find(m3v(o.M, p))));
          const permInv = P.ops.map((o) => X.map((p) => find(m3v(o.M.map((_, i) => o.M.map((rr) => rr[i])), p))));
          const proj = (ir, f) => f.map((_, x) => P.ops.reduce((s, o, g) => s + ir.chi[o.cls] * f[permInv[g][x]], 0) * (ir.d / P.ops.length));
          const states = P.irreps.map((ir) => { const f = X.map(() => r.normal()); return proj(ir, f); });
          const ops = { z: X.map((p) => p[2]), x: X.map((p) => p[0]), y: X.map((p) => p[1]), xy: X.map((p) => p[0] * p[1]), r2: X.map((p) => p[0] ** 2 + p[1] ** 2) };
          const type = {};
          Object.entries(ops).forEach(([k, f]) => { type[k] = P.irreps.map((ir) => { const q = proj(ir, f); return Math.hypot(...q) > 1e-8 * (1 + Math.hypot(...f)); }); });
          return (cache[key] = { P, X, states, ops, type });
        };
        const calc = () => {
          const { P, states, ops, type } = setup(gsel.value), V = ops[osel.value], tv = type[osel.value], n = P.irreps.length;
          const prod = (a, b, c) => P.classes.map((_, k) => P.irreps[a].chi[k] * P.irreps[b].chi[k] * c.reduce((s, ir, i) => s + (ir ? P.irreps[i].chi[k] : 0), 0));
          const allowed = Array.from({ length: n }, () => Array(n).fill(false)), num = Array.from({ length: n }, () => Array(n).fill(0));
          for (let i = 0; i < n; i++) for (let f = 0; f < n; f++) {
            allowed[i][f] = tv.some((on, t) => on && P.classes.reduce((s, c, k) => s + c.size * P.irreps[f].chi[k] * P.irreps[t].chi[k] * P.irreps[i].chi[k], 0) / P.ops.length > 1e-9);
            const si = states[i], sf = states[f], Vsi = si.map((x, t) => x * V[t]);
            const nrm = Math.hypot(...sf) * Math.hypot(...Vsi) || 1;
            num[i][f] = Math.abs(sf.reduce((s, x, t) => s + x * Vsi[t], 0)) / nrm;
          }
          return { P, allowed, num, tv, n };
        };
        S.onClick((x, y) => { const h = T.hit(x, y); if (h && h.i >= 0 && h.j >= 0) sel = [h.i, h.j]; });
        v.render(() => {
          const { P, allowed, num, tv, n } = calc();
          if (sel[0] >= n || sel[1] >= n) sel = [0, 0];
          T.draw({
            rows: n, cols: n, rowLabels: (i) => `$${P.irreps[i].tex}$`, colLabels: (j) => `$${P.irreps[j].tex}$`, cornerLabel: '$i\\backslash f$',
            value: (i, j) => (allowed[i][j] ? 'allowed' : 'forbidden'),
            sub: (i, j) => nm(num[i][j], 2),
            fill: (i, j) => (allowed[i][j] ? ['green', 0.25] : ['muted', 0.15]),
            highlight: [[sel[0], sel[1], 'orange']],
            size: 11,
          });
          const [a, b] = sel, vals = P.classes.map((_, k) => P.irreps[a].chi[k] * P.irreps[b].chi[k] * tv.reduce((s, on, i) => s + (on ? P.irreps[i].chi[k] : 0), 0));
          const K = P.classes.length, mx = Math.max(3, ...vals.map(Math.abs)) * 1.2;
          Sb.setView([-0.6, K - 0.4], [-mx, mx]);
          Sb.setTicks(P.classes.map((c, k) => [k, c.tex.replace(/\\sigma_v/g, 'σ').replace(/[\\{}_]/g, '').replace("'", '′')]), null);
          Sb.bars(vals, { x0: 0, dx: 1, color: (x) => (x >= 0 ? 'accent' : 'red') });
          Sb.hline(0, { color: 'ink', width: 1 });
        });
        v.readout(() => {
          const { P, allowed, num, tv, n } = calc(), [a, b] = sel;
          const m = P.classes.reduce((s, c, k) => s + c.size * P.irreps[a].chi[k] * P.irreps[b].chi[k] * tv.reduce((q, on, i) => q + (on ? P.irreps[i].chi[k] : 0), 0), 0) / P.ops.length;
          let bad = 0; for (let i = 0; i < n; i++) for (let f = 0; f < n; f++) if (!allowed[i][f] && num[i][f] > 1e-8) bad++;
          const types = P.irreps.filter((_, i) => tv[i]).map((ir) => ir.tex).join('+');
          return `Operator type: $${types}$. Selected: $${P.irreps[a].tex}\\to ${P.irreps[b].tex}$, multiplicity of the trivial representation in $\\Gamma_f\\otimes\\Gamma_V\\otimes\\Gamma_i$ is $${nm(m, 3)}$, so the transition is **${m > 1e-9 ? 'allowed' : 'forbidden'}**; numerical matrix element ${num[a][b] < 1e-8 ? '$0$' : nm(num[a][b], 3)}. Forbidden cells with a non-zero numerical element: ${bad}.`;
        });
      },
    },
  ],
};
