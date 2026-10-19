// Logic & Foundations — Chapter 4: Proofs, soundness and completeness (items 4.1–4.6)
import {
  parseFO, toStr, toTex, equalAst, freeVars, holds, langOf, range, foField, SIGH, P1, imp, all, axiomOf, matchInst, substitutable, justify,
  checkProof, deductionTransform, generalizeTransform, soundnessTest, structText, drawStruct, FRAG_POOL, FRAG_STARTS, henkinRun, termModel,
  subNum, circlePos,
} from './ch04.shared.js';

// ---------- helpers ----------
const JCOL = { hyp: 'teal', axiom: 'purple', mp: 'orange', bad: 'red' };
/** Parse a ';'-separated list of formulas; returns {asts, error}. */
function parseList(src, sig = SIGH) {
  const asts = [];
  for (const part of src.split(/;|\n/).map((t) => t.trim()).filter(Boolean)) {
    const r = parseFO(part, sig);
    if (!r.ast) return { asts, error: `“${part}”: ${r.error}` };
    asts.push(r.ast);
  }
  return { asts, error: null };
}
const P = (s) => P1(s);
const clip = (s, k = 46) => (s.length > k ? `${s.slice(0, k - 1)}…` : s);
/** Row descriptors for a derivation. */
function proofRows(lines, chk, { allow = null, mark = null, sch = null } = {}) {
  return lines.map((f, i) => {
    const j = chk[i];
    let just = j.ok ? j.label : 'not justified', col = j.ok ? JCOL[j.kind] : 'red';
    if (allow && allow(i)) { just = 'bogus rule'; col = 'orange'; }
    return { n: i + 1, text: (j.ok || (allow && allow(i)) ? '' : '✗ ') + (sch && sch[i] ? sch[i] : toStr(f)), just, jcolor: col, color: j.ok || (allow && allow(i)) ? 'ink' : 'red', hl: mark ? mark(i) : false };
  });
}
const geom = (n, maxRows = 14, off = 0) => { const rowH = Math.min(8.2, (96 - off) / Math.max(n, maxRows * 0.6)); return { rowH, top: 100 - off - rowH * 0.7 }; };
function drawRows(s, rows, { W = 100, sel = -1, hlColor = 'gold', maxRows = 14, size = 12.5, justX = 99, off = 0 } = {}) {
  const { rowH, top } = geom(Math.max(rows.length, 1), maxRows, off);
  const fs = Math.min(size, rowH * 1.55 + 2);
  rows.forEach((r, i) => {
    const y = top - i * rowH;
    if (r.hl || i === sel) s.rect(0, y - rowH * 0.5, W, y + rowH * 0.5, { fill: r.hl ? hlColor : 'gold', fillAlpha: 0.16, stroke: false });
    s.text(String(r.n ?? i + 1), 3.6, y, { align: 'right', baseline: 'middle', size: fs - 1, color: 'muted' });
    s.text(r.text, 5.4, y, { align: 'left', baseline: 'middle', size: fs, color: r.color || 'ink' });
    if (r.just) s.text(r.just, justX, y, { align: 'right', baseline: 'middle', size: fs - 1.5, color: r.jcolor || 'muted', weight: 600 });
  });
  return { rowH, top };
}
const rowStage = (v, o = {}) => v.stage({ x: [0, 100], y: [0, 100], axes: false, full: true, height: 300, ...o });
const texL = (f) => `$${toTex(f)}$`;
const listTex = (G) => (G.length ? G.map(texL).join(',\\ ') : '\\varnothing').replace(/^\$\\varnothing\$$/, '$\\varnothing$');
const setTex = (G) => (G.length ? `$\\{${G.map(toTex).join(',\\ ')}\\}$` : '$\\varnothing$');

const EX41 = [
  { id: 'mp', label: 'Q(c) from ∀x (P(x) → Q(x)) and P(c)', G: '∀x (P(x) → Q(x)); P(c)', L: ['∀x (P(x) → Q(x))', '∀x (P(x) → Q(x)) → (P(c) → Q(c))', 'P(c) → Q(c)', 'P(c)', 'Q(c)'] },
  { id: 'inst', label: 'a term instance, P(f(c))', G: '∀x P(x)', L: ['∀x P(x)', '∀x P(x) → P(f(c))', 'P(f(c))'] },
  { id: 'cap', label: 'a capture mistake', G: '∀x ∃y R(x,y)', L: ['∀x ∃y R(x,y)', '∀x ∃y R(x,y) → ∃y R(y,y)', '∃y R(y,y)'] },
  { id: 'gen', label: 'generalized axioms', G: '', L: ['x = x', '∀x x = x', '∀x (P(x) → P(x))', '∀x ∀y (x = y → (P(x) → P(y)))'] },
  { id: 'free', label: 'start from nothing', G: 'P(c)', L: [] },
];

// ---------- the shared scenarios for 4.2 and 4.3 ----------
const DED = [
  { id: 'a', label: 'Γ = {∀x(P→Q)}, φ = P(c), ψ = Q(c)', G: ['∀x (P(x) → Q(x))'], phi: 'P(c)', L: ['∀x (P(x) → Q(x))', '∀x (P(x) → Q(x)) → (P(c) → Q(c))', 'P(c) → Q(c)', 'P(c)', 'Q(c)'] },
  { id: 'b', label: 'Γ = {P(c)→Q(c), Q(c)→P(d)}, φ = P(c), ψ = P(d)', G: ['P(c) → Q(c)', 'Q(c) → P(d)'], phi: 'P(c)', L: ['P(c)', 'P(c) → Q(c)', 'Q(c)', 'Q(c) → P(d)', 'P(d)'] },
  { id: 'c', label: 'Γ = ∅, φ = ∀x P(x), ψ = P(c)', G: [], phi: '∀x P(x)', L: ['∀x P(x)', '∀x P(x) → P(c)', 'P(c)'] },
];
const GEN = [
  { id: 'a', label: 'from ∀y P(y) to P(x), then ∀x P(x)', x: 'x', G: ['∀y P(y)'], L: ['∀y P(y)', '∀y P(y) → P(x)', 'P(x)'] },
  { id: 'b', label: 'Q(y) from ∀x(P→Q), ∀x P; then ∀y Q(y)', x: 'y', G: ['∀x (P(x) → Q(x))', '∀x P(x)'], L: ['∀x (P(x) → Q(x))', '∀x (P(x) → Q(x)) → (P(y) → Q(y))', 'P(y) → Q(y)', '∀x P(x)', '∀x P(x) → P(y)', 'P(y)', 'Q(y)'] },
  { id: 'c', label: 'a hypothesis mentions y: P(y)', x: 'y', G: ['∀x (P(x) → Q(x))', 'P(y)'], L: ['∀x (P(x) → Q(x))', '∀x (P(x) → Q(x)) → (P(y) → Q(y))', 'P(y) → Q(y)', 'P(y)', 'Q(y)'] },
  { id: 'd', label: 'x is free in the hypothesis P(x)', x: 'x', G: ['P(x)'], L: ['P(x)'] },
];

export default {
  collection: 'logic',
  chapter: 4,
  title: 'Proofs, soundness and completeness',
  summary: String.raw`A deductive calculus turns logical consequence into a finite, checkable activity: axioms plus modus ponens. Soundness says derivations never lead from truth to falsehood; Gödel’s completeness theorem says every valid consequence has a derivation, proved by Henkin’s idea of building a model out of the syntax itself. Compactness falls out at once, and with it the first limits of what first-order axioms can say.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Definition',
      name: 'A deductive calculus: axioms and modus ponens',
      statement: String.raw`Fix a first-order language. The **logical axioms** (in the form used by Enderton) are all *generalizations* — formulas $\forall x_1\cdots\forall x_k\,\theta$ with $k \ge 0$ — of the following six kinds:
(1) every **tautology** (a formula that is true under every truth assignment to its quantified and atomic subformulas);
(2) $\forall x\,\alpha \to \alpha^x_t$, where the term $t$ is substitutable for $x$ in $\alpha$ (no variable of $t$ is captured);
(3) $\forall x\,(\alpha\to\beta) \to (\forall x\,\alpha \to \forall x\,\beta)$;
(4) $\alpha \to \forall x\,\alpha$, where $x$ does not occur free in $\alpha$;
(5) $x = x$;
(6) $x = y \to (\alpha \to \alpha')$, where $\alpha$ is atomic and $\alpha'$ comes from $\alpha$ by replacing $x$ at some places by $y$.
A **deduction** of $\varphi$ from a set $\Gamma$ of formulas is a finite sequence of formulas ending with $\varphi$ in which every formula is a logical axiom, a member of $\Gamma$, or follows from two earlier ones $\theta$ and $\theta\to\psi$ by **modus ponens**. We write $\Gamma\vdash\varphi$ when a deduction exists.`,
      idea: String.raw`Logical consequence (logic-3.5) quantifies over all structures, which no one can survey; a deduction replaces it by a finite object whose correctness is *checked mechanically*, line by line, by looking only at the shapes of formulas. Axiom group (1) is decidable by a truth table on the propositional skeleton, group (2) needs the substitutability test of logic-3.2, and the closure under generalization is what makes the later transformation theorems clean. Everything depends on the axioms being true in every structure under every assignment, which is the content of the soundness theorem (logic-4.4).`,
      caption: String.raw`Choose an example, or type a formula into **next line** and press **Add line**. Each line is classified automatically as a hypothesis, a logical axiom (with its group) or a modus ponens step from two earlier lines, and an unjustified line turns red. The **capture mistake** example fails group (2) because the term $y$ would be caught by $\exists y$; the same instance with a fresh variable is accepted. Edit the hypotheses to see which lines survive.`,
      deps: ['logic-3.5', 'logic-3.2'],
      refs: ['Enderton §2.4'],
      tags: ['proofs', 'calculus'],
      links: {},
      viz(v) {
        const ex = v.select('example', EX41.map((e) => ({ value: e.id, label: e.label })), 'mp', { onChange: (id) => load(id) });
        const gam = v.input('hypotheses Γ (separated by ;)', EX41[0].G, { width: 330, onChange: () => { parseG(); v.invalidate(); } });
        const nl = foField(v, 'next line', '', { sig: SIGH, width: 330, onChange: () => v.invalidate() });
        let lines = [], G = [], gerr = null;
        const parseG = () => { const r = parseList(gam.value); G = r.asts; gerr = r.error; };
        const load = (id) => {
          const e = EX41.find((q) => q.id === id);
          gam.set(e.G); parseG(); lines = e.L.map((t) => P(t)); sel = -1; v.invalidate();
        };
        let sel = -1;
        const S = rowStage(v, { height: 340 });
        v.button('Add line', () => { if (nl.ok && nl.ast) { lines.push(nl.ast); nl.set(''); } });
        v.button('Remove last line', () => { lines.pop(); });
        v.button('Clear', () => { lines = []; });
        S.onClick((x, y) => {
          const { rowH, top } = geom(Math.max(lines.length, 1), 9, 6);
          const k = Math.round((top - y) / rowH); sel = k >= 0 && k < lines.length ? (sel === k ? -1 : k) : -1;
        });
        parseG(); lines = EX41[0].L.map((t) => P(t));
        let chk = [];
        v.render(() => {
          chk = checkProof(lines, G);
          const rows = proofRows(lines, chk);
          S.text(`Γ = {${G.map(toStr).join(';  ') || ''}}`, 1.5, 98, { align: 'left', baseline: 'top', size: 12, color: 'muted' });
          if (!lines.length) S.text('no lines yet: type a formula below and press “Add line”', 50, 55, { align: 'center', size: 13, color: 'muted' });
          drawRows(S, rows, { sel, maxRows: 9, off: 6 });
          const bad = chk.findIndex((c) => !c.ok);
          S.corner(!lines.length ? '' : bad < 0 ? `a deduction of the last line from Γ ✓` : `line ${bad + 1} is not justified`, 'br', { size: 12, color: bad < 0 ? 'green' : 'red', weight: 700 });
        });
        const why = (i) => {
          const f = lines[i];
          if (f.op === 'imp' && f.a.op === 'all') {
            const r = matchInst(f.a.a, f.b, f.a.v);
            if (r.ok && r.t) { const sb = substitutable(f.a.a, f.a.v, r.t); if (!sb.ok) return `it looks like ∀-instantiation with $${f.a.v} := ${toTex(r.t)}$, but the variable $${sb.captured}$ of the term would be captured by a quantifier of the formula, so group (2) does not apply`; }
          }
          if (f.op === 'imp' && f.b.op === 'all' && equalAst(f.a, f.b.a) && freeVars(f.a).includes(f.b.v)) return `it looks like group (4), but $${f.b.v}$ is free in the antecedent`;
          return 'it is not in Γ, not an instance of any of the six axiom groups (even after generalizing), and no earlier pair $\\theta,\\ \\theta\\to$ (this line) exists';
        };
        v.readout(() => {
          if (gerr) return `Cannot read Γ: ${gerr}`;
          if (nl.error && nl.src.trim()) return `The next line cannot be read yet: ${nl.error}.`;
          if (!lines.length) return `Γ = ${setTex(G)}. Add lines to build a deduction.`;
          const bad = chk.findIndex((c) => !c.ok);
          const last = lines[lines.length - 1];
          const counts = { hyp: 0, axiom: 0, mp: 0 }; chk.forEach((c) => { if (c.ok) counts[c.kind]++; });
          const s0 = `${lines.length} lines: ${counts.hyp} hypotheses, ${counts.axiom} logical axioms, ${counts.mp} modus ponens steps.`;
          if (sel >= 0 && chk[sel] && !chk[sel].ok) return `${s0} **Line ${sel + 1}** (${texL(lines[sel])}): ${why(sel)}.`;
          if (bad < 0) return `${s0} Every line is justified, so $\\Gamma \\vdash ${toTex(last)}$ ✓ with $\\Gamma = ${setTex(G).slice(1, -1)}$.`;
          return `${s0} **Line ${bad + 1}** (${texL(lines[bad])}) is not justified: ${why(bad)}. Click a row to inspect it.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Theorem',
      name: 'Deduction theorem',
      statement: String.raw`For any set $\Gamma$ of formulas and formulas $\varphi,\psi$:
$$\Gamma \cup \{\varphi\} \vdash \psi \quad\Longleftrightarrow\quad \Gamma \vdash \varphi \to \psi .$$
In words, to prove an implication it is enough to assume its antecedent and derive its consequent. In the calculus of logic-4.1 there is no restriction on free variables of $\varphi$, because the only rule is modus ponens and the logical axioms are closed under generalization.`,
      idea: String.raw`($\Leftarrow$) is one use of modus ponens. For ($\Rightarrow$), take a deduction $\theta_1,\dots,\theta_n=\psi$ from $\Gamma\cup\{\varphi\}$ and prove by induction on $i$ that $\Gamma\vdash\varphi\to\theta_i$. If $\theta_i$ is an axiom or in $\Gamma$, write $\theta_i$, then the tautology $\theta_i\to(\varphi\to\theta_i)$, then $\varphi\to\theta_i$ by modus ponens. If $\theta_i=\varphi$, then $\varphi\to\varphi$ is a tautology. If $\theta_i$ comes from $\theta_j$ and $\theta_j\to\theta_i$, use the tautology $(\varphi\to\theta_j)\to\big((\varphi\to(\theta_j\to\theta_i))\to(\varphi\to\theta_i)\big)$ and two modus ponens steps. The conversion is a program: the output has at most three lines per input line. This counts proof lines, not character-copying or axiom-checking time.`,
      caption: String.raw`The top panel is a deduction of $\psi$ from $\Gamma\cup\{\varphi\}$ (the hypothesis $\varphi$ is highlighted). Step through it: the bottom panel grows by the one to three lines that replace the current line, and the result is a deduction of $\varphi\to\psi$ from $\Gamma$ alone. Every line of the new deduction is re-checked by the checker of 4.1 (green labels). Very long tautology lines are abbreviated as a schema in terms of the original line numbers.`,
      deps: ['logic-4.1'],
      refs: ['Enderton §2.4', 'Open Logic Project, §§22.7, 23.9, 32.8; Weiss–D’Mello, Fundamentals of Model Theory, chs.2–3'],
      credit: 'First-order logic',
      tags: ['proofs', 'calculus'],
      viz(v) {
        const sc = v.select('derivation', DED.map((d) => ({ value: d.id, label: d.label })), 'a', { onChange: () => { setup(); S.reset(null, { at: 'end' }); } });
        const TOP = rowStage(v, { height: 190 });
        const BOT = rowStage(v, { height: 330 });
        let cur, G, phi, lines, D, chk0, chk1;
        const setup = () => {
          cur = DED.find((d) => d.id === sc.value); G = cur.G.map(P); phi = P(cur.phi); lines = cur.L.map(P);
          D = deductionTransform(lines, phi, G);
          chk0 = checkProof(lines, [...G, phi]); chk1 = checkProof(D.out.map((o) => o.f), G);
        };
        setup();
        const S = v.steps({
          frames: () => lines.map((_, i) => ({ i, line: [D.out[D.at[i]].role === 'id' ? 2 : D.out[D.at[i]].role === 'mp1' ? 1 : 3], note: `Line ${i + 1} of the original is converted into ${i ? 'the next lines' : 'the first lines'} of the new deduction.` })),
          start: 'end', still: 'end', speed: 1,
          code: ['θ is an axiom or in Γ: write θ, then θ → (φ → θ), then φ → θ', 'θ is φ itself: write φ → φ (a tautology)', 'θ from θⱼ and θⱼ → θᵢ: use (φ→θⱼ) → ((φ→(θⱼ→θᵢ)) → (φ→θᵢ)) and modus ponens twice'],
          codeTitle: 'the conversion, case by case', codePos: 'side',
        });
        v.render(() => {
          const i = S.frame.i ?? lines.length - 1;
          const rowsA = lines.map((f, k) => {
            const isPhi = equalAst(f, phi) && !G.some((g) => equalAst(g, f)) && !axiomOf(f);
            const c = chk0[k];
            return { n: k + 1, text: toStr(f), just: isPhi ? 'hypothesis φ' : c.label, jcolor: isPhi ? 'gold' : JCOL[c.kind], hl: k === i, color: k > i ? 'faint' : 'ink' };
          });
          drawRows(TOP, rowsA, { maxRows: 6, size: 12.5 });
          TOP.corner(`from Γ ∪ {φ},  φ = ${toStr(phi)}`, 'br', { size: 11.5, color: 'muted' });
          const upto = D.at[i] ?? -1, shown = D.out.slice(0, upto + 1);
          const rows = shown.map((o, k) => ({
            n: k + 1, text: o.sch && toStr(o.f).length > 52 ? o.sch : clip(toStr(o.f), 60), just: chk1[k].label, jcolor: JCOL[chk1[k].kind], color: chk1[k].ok ? 'ink' : 'red', hl: o.src === i,
          }));
          drawRows(BOT, rows, { maxRows: 13, size: 12 });
        });
        v.readout(() => {
          const i = S.frame.i ?? lines.length - 1, upto = D.at[i] ?? -1, ok = chk1.slice(0, upto + 1).every((c) => c.ok);
          const done = i === lines.length - 1;
          return `${done ? `Done: a deduction of $${toTex(phi)} \\to ${toTex(lines[lines.length - 1])}$ from $\\Gamma$ alone with **${D.out.length} lines** (the original had ${lines.length}; at most $3n$ in general). ` : `After original line ${i + 1}, the new deduction has ${upto + 1} lines. `}All of them ${ok ? 'are justified by the checker ✓ without using $\\varphi$' : '**fail** the checker ✗'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Theorem',
      name: 'Generalization theorem',
      statement: String.raw`If $\Gamma\vdash\varphi$ and the variable $x$ does not occur free in any formula of $\Gamma$, then $\Gamma\vdash\forall x\,\varphi$.
The restriction cannot be dropped: from the hypothesis $P(x)$ one can derive $P(x)$, but $P(x)\vdash\forall x\,P(x)$ would be unsound, since $P(x)$ is true under an assignment that gives $x$ a point of $P$ while $\forall x\,P(x)$ is false in the same structure.`,
      idea: String.raw`Take a deduction $\theta_1,\dots,\theta_n=\varphi$ from $\Gamma$ and show by induction that $\Gamma\vdash\forall x\,\theta_i$ for each $i$. If $\theta_i$ is a logical axiom, so is its generalization $\forall x\,\theta_i$, by the way the axioms were defined in logic-4.1. If $\theta_i\in\Gamma$, then $x$ is not free in it, so axiom group (4) gives $\theta_i\to\forall x\,\theta_i$ and one modus ponens gives $\forall x\,\theta_i$; this is the only place where the hypothesis on $\Gamma$ is used. If $\theta_i$ follows from $\theta_j$ and $\theta_j\to\theta_i$, combine $\forall x\,\theta_j$ and $\forall x\,(\theta_j\to\theta_i)$ with axiom group (3), $\forall x(\theta_j\to\theta_i)\to(\forall x\theta_j\to\forall x\theta_i)$, and two modus ponens steps.`,
      caption: String.raw`The top panel is a deduction of its last line from $\Gamma$, the bottom panel the conversion into a deduction of $\forall x$ of every line. Step through it. In the last two examples a hypothesis has the variable free and the conversion **stops at that line** (red). The readout then searches small structures for a model of $\Gamma$ in which $\forall x\,\varphi$ is false, which shows that the restriction is needed and not just an artefact of the proof.`,
      deps: ['logic-4.1'],
      refs: ['Enderton §2.4'],
      tags: ['proofs', 'calculus'],
      viz(v) {
        const sc = v.select('derivation', GEN.map((d) => ({ value: d.id, label: d.label })), 'a', { onChange: () => { setup(); S.reset(null, { at: 'end' }); } });
        const TOP = rowStage(v, { height: 230 });
        const BOT = rowStage(v, { height: 330 });
        let cur, G, lines, x, D, chk0, chk1, counter;
        const setup = () => {
          cur = GEN.find((d) => d.id === sc.value); G = cur.G.map(P); lines = cur.L.map(P); x = cur.x;
          D = generalizeTransform(lines, x, G);
          chk0 = checkProof(lines, G); chk1 = checkProof(D.out.map((o) => o.f), G);
          counter = null;
          if (D.failAt >= 0) { const concl = all(x, lines[lines.length - 1]); const r = soundnessTest([concl], G, { maxN: 3, cap: 300 })[0]; counter = r.counter ? { ...r.counter, concl, lang: langOf(concl, ...G) } : null; }
        };
        setup();
        const S = v.steps({
          frames: () => lines.map((_, i) => ({ i, line: [D.failAt >= 0 && i >= D.failAt ? 2 : (axiomOf(lines[i]) ? 1 : G.some((h) => equalAst(h, lines[i])) ? 2 : 3)], note: `Converting line ${i + 1}.` })),
          start: 'end', still: 'end', speed: 1,
          code: ['θ is a logical axiom: its generalization ∀x θ is also an axiom', 'θ is in Γ: x is not free in θ, so θ → ∀x θ is axiom (4); modus ponens gives ∀x θ', 'θ from θⱼ, θⱼ → θᵢ: use ∀x(θⱼ→θᵢ) → (∀xθⱼ → ∀xθᵢ), axiom (3), and modus ponens twice'],
          codeTitle: 'the conversion, case by case', codePos: 'side',
        });
        v.render(() => {
          const i = S.frame.i ?? lines.length - 1;
          const rowsA = lines.map((f, k) => {
            const c = chk0[k], badHyp = D.failAt === k;
            return { n: k + 1, text: toStr(f), just: badHyp ? `hypothesis, ${x} free` : c.label, jcolor: badHyp ? 'red' : JCOL[c.kind], hl: k === i, color: k > i ? 'faint' : badHyp ? 'red' : 'ink' };
          });
          drawRows(TOP, rowsA, { maxRows: 8, size: 12.5 });
          TOP.corner(`Γ = {${G.map(toStr).join('; ')}},  generalize on ${x}`, 'br', { size: 11.5, color: 'muted' });
          const stopped = D.failAt >= 0 && i >= D.failAt;
          const upto = stopped ? (D.failAt > 0 ? D.at[D.failAt - 1] : -1) : D.at[i];
          const shown = D.out.slice(0, upto + 1);
          const rows = shown.map((o, k) => ({ n: k + 1, text: clip(toStr(o.f), 60), just: chk1[k].label, jcolor: JCOL[chk1[k].kind], color: chk1[k].ok ? 'ink' : 'red', hl: o.src === i }));
          if (stopped) rows.push({ n: rows.length + 1, text: `stuck: ${D.why}`, just: '✗', jcolor: 'red', color: 'red', hl: true });
          drawRows(BOT, rows, { maxRows: 13, size: 12 });
        });
        v.readout(() => {
          const i = S.frame.i ?? lines.length - 1, last = lines[lines.length - 1];
          if (D.failAt < 0) return `Success: ${x} is not free in $\\Gamma$, and the new deduction of $${toTex(all(x, last))}$ from $\\Gamma$ has ${D.out.length} lines, every one justified ✓ (the original had ${lines.length}).`;
          const c = counter;
          const stopped = i >= D.failAt;
          const witness = c ? ` Indeed in the ${c.n}-element structure (${structText(c.M, c.lang).slice(1).join('; ')}) with ${Object.entries(c.env).map(([a, d]) => `$${a} = ${d}$`).join(', ') || 'no free variables'}, all of $\\Gamma$ is true but $${toTex(c.concl)}$ is false, so no sound calculus can prove it.` : ' (No countermodel with at most 3 elements turned up in the sample.)';
          return `${stopped ? `**The conversion stops at line ${D.failAt + 1}:** ${D.why}, so axiom group (4) is not available.` : 'The conversion has not reached the troublesome hypothesis yet.'}${witness}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Theorem',
      name: 'Soundness theorem',
      statement: String.raw`If $\Gamma\vdash\varphi$, then $\Gamma\models\varphi$: every structure $\mathfrak A$ and assignment $s$ that satisfy all of $\Gamma$ also satisfy $\varphi$. In particular, a deducible sentence is valid, and a set with a model is consistent (it does not deduce both $\psi$ and $\neg\psi$).`,
      idea: String.raw`Induct on the length of a deduction. Hypotheses in $\Gamma$ hold by assumption. Each logical axiom of logic-4.1 is valid: tautologies by truth tables, group (2) by the substitution lemma, groups (3)–(6) directly from Tarski's clauses of logic-3.4, and valid formulas stay valid under generalization. Modus ponens preserves truth at a given assignment: if $\theta$ and $\theta\to\psi$ hold, so does $\psi$. The proof is a check of six schemas, and that is why any proposed extra rule can be refuted by a single structure.`,
      caption: String.raw`Each line of the deduction is tested on random small structures (up to 3 elements, with random assignments to the free variables) that satisfy the hypotheses; the bar shows in how many of them the line was true. Genuine deductions stay at 100 %. Choose a scenario with a **bogus rule**: the offending line is flagged, the tester finds structures where the hypotheses are true and the line false, and draws one on the right (click a line to see its counterexample, **Resample** for another random sample). Switch off *allow the bogus rule* to see it rejected by the checker as well.`,
      deps: ['logic-4.1', 'logic-3.5'],
      refs: ['Enderton §2.5'],
      tags: ['soundness', 'proofs'],
      viz(v) {
        const SC = [
          { id: 'ok', label: 'sound: instantiate, then modus ponens', G: ['∀x (P(x) → Q(x))', 'P(c)'], L: ['∀x (P(x) → Q(x))', '∀x (P(x) → Q(x)) → (P(c) → Q(c))', 'P(c) → Q(c)', 'P(c)', 'Q(c)'], bogus: [] },
          { id: 'ac', label: 'bogus: affirming the consequent', G: ['∀x (P(x) → Q(x))', 'Q(c)'], L: ['∀x (P(x) → Q(x))', '∀x (P(x) → Q(x)) → (P(c) → Q(c))', 'P(c) → Q(c)', 'Q(c)', 'P(c)'], bogus: [4], rule: 'from α → β and β infer α' },
          { id: 'gen', label: 'bogus: generalizing a free variable', G: ['P(x)'], L: ['P(x)', '∀x P(x)'], bogus: [1], rule: 'from α infer ∀x α with no condition' },
          { id: 'sw', label: 'bogus: swapping quantifiers', G: ['∀x ∃y R(x,y)'], L: ['∀x ∃y R(x,y)', '∃y ∀x R(x,y)'], bogus: [1], rule: 'from ∀x ∃y α infer ∃y ∀x α' },
          { id: 'ei', label: 'bogus: naming a witness by an old constant', G: ['∃x P(x)', '∃x ¬P(x)'], L: ['∃x P(x)', 'P(c)', '∃x ¬P(x)', '¬P(c)'], bogus: [1, 3], rule: 'from ∃x α infer α(c) for a constant c already in use' },
        ];
        const sel = v.select('scenario', SC.map((q) => ({ value: q.id, label: q.label })), 'ac', { onChange: () => { setup(); } });
        const allow = v.toggle('allow the bogus rule', true, { onChange: () => v.invalidate() });
        let seed = 11; v.button('Resample', () => { seed += 17; setup(); });
        const A = rowStage(v, { height: 300, weight: 1.3, full: false, minWidth: 340 });
        const B = v.stage({ x: [-1.7, 1.7], y: [-1.45, 1.55], equal: true, axes: false, height: 300, weight: 1, minWidth: 260 });
        let cur, G, lines, res, chk, lang, pick = -1;
        const setup = () => {
          cur = SC.find((q) => q.id === sel.value); G = cur.G.map(P); lines = cur.L.map(P);
          res = soundnessTest(lines, G, { maxN: 3, cap: 400, seed }); chk = checkProof(lines, G); lang = langOf(...lines, ...G); pick = -1; v.invalidate();
        };
        setup();
        A.onClick((x, y) => { const { rowH, top } = geom(Math.max(lines.length, 1), 9), k = Math.round((top - y) / rowH); pick = k >= 0 && k < lines.length ? k : -1; });
        const shown = () => (pick >= 0 && res[pick].counter ? pick : res.findIndex((r) => r.fails > 0));
        v.render(() => {
          const sk = shown();
          const rows = lines.map((f, i) => {
            const isB = cur.bogus.includes(i), r = res[i];
            const okj = chk[i].ok || (isB && allow.value);
            const meter = r.tested ? (r.fails ? `✗ false in ${r.fails} of ${r.tested}` : `✓ true in ${r.tested} of ${r.tested}`) : 'no model of Γ sampled';
            return { n: i + 1, text: (okj ? '' : '✗ ') + toStr(f), just: `${isB && allow.value ? 'bogus rule' : chk[i].ok ? chk[i].label : 'not justified'}   ${meter}`, jcolor: r.fails ? 'red' : isB && allow.value ? 'orange' : okj ? 'green' : 'red', color: okj ? 'ink' : 'red', hl: i === sk };
          });
          drawRows(A, rows, { maxRows: 9, size: 12, justX: 99.5 });
          A.corner(`Γ = {${G.map(toStr).join('; ')}}`, 'bl', { size: 11, color: 'muted' });
          if (sk >= 0) {
            const c = res[sk].counter;
            drawStruct(B, c.M, lang, { radius: 0.95, r: 15 });
            B.corner(`line ${sk + 1} false here: ${toStr(lines[sk])}`, 'tl', { size: 11.5, color: 'red', weight: 700 });
            const env = Object.entries(c.env).map(([a, d]) => `${a} = ${d}`).join(', ');
            B.corner(`Γ is true${env ? `  (${env})` : ''}`, 'bl', { size: 11.5, color: 'green' });
          } else {
            B.text('no counterexample found', 0, 0.1, { align: 'center', size: 13, color: 'green', weight: 700 });
            B.text('every line is true wherever Γ is', 0, -0.2, { align: 'center', size: 12, color: 'muted' });
          }
        });
        v.readout(() => {
          const tot = Math.max(...res.map((r) => r.tested)), sk = shown();
          const bad = res.map((r, i) => (r.fails ? i + 1 : null)).filter(Boolean);
          if (!bad.length) return `Tested on ${tot.toLocaleString('en')} structure–assignment pairs satisfying $\\Gamma$: every line of the deduction is true in all of them, as soundness guarantees. Lines: ${lines.length}, all justified by hypotheses, axioms and modus ponens.`;
          const c = res[sk].counter;
          return `The rule “${cur.rule}” is unsound: line${bad.length > 1 ? 's' : ''} ${bad.join(', ')} ${bad.length > 1 ? 'are' : 'is'} false in some structure where all of $\\Gamma$ is true (drawn on the right: ${c.n} elements). Out of ${tot.toLocaleString('en')} sampled pairs satisfying $\\Gamma$, line ${sk + 1} fails in ${res[sk].fails.toLocaleString('en')}. ${allow.value ? 'The checker of 4.1 does not know this rule, and calls the line unjustified once it is switched off.' : 'With the rule switched off the checker rejects the line immediately.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Lemma',
      name: 'Henkin’s lemma: complete theories with witnesses',
      statement: String.raw`Let $\Gamma$ be a consistent set of sentences in a countable language $L$. There is a language $L^*\supseteq L$, obtained by adding countably many new constants, and a set $\Theta\supseteq\Gamma$ of $L^*$-sentences that is
- **consistent**,
- **complete**: for every $L^*$-sentence $\sigma$, either $\sigma\in\Theta$ or $\neg\sigma\in\Theta$, and
- **witnessed**: for every sentence $\exists x\,\psi$ in $\Theta$ there is a constant $c$ with $\psi(c)\in\Theta$.`,
      idea: String.raw`First add, for every $L$-formula $\exists x\,\psi(x)$, a new constant $c_\psi$ and the Henkin axiom $\exists x\,\psi\to\psi(c_\psi)$. The enlarged set stays consistent: from a deduction of a contradiction, replace the new constants by variables and use the deduction and generalization theorems (logic-4.2, logic-4.3) to remove the Henkin axioms one at a time. Repeat for the new language; the union of the countably many stages is witnessed. Finally enumerate the sentences $\sigma_0,\sigma_1,\dots$ and add $\sigma_n$ when it keeps the set consistent, $\neg\sigma_n$ otherwise; one of the two always does, since if both fail then $\Gamma_n\vdash\neg\sigma_n$ and $\Gamma_n\vdash\sigma_n$.`,
      caption: String.raw`This is the construction run on a small **fragment**: one-place predicates $P,Q$, equality, three reserved witness constants $c_0,c_1,c_2$ and a pool of 13 sentences in place of all of them. Choose a starting set, then step through: the three Henkin axioms are added first, then the pool is decided one sentence at a time. Consistency is tested honestly as *having a model with at most 4 elements* (all 18 244 of them are enumerated, and the bar shows how many survive). That test is exact for this monadic fragment. Turn off **witnesses** or flip the **rule** and see what changes. The set $\{\forall x\,P(x),\exists x\,\neg P(x)\}$ is inconsistent: the construction refuses to start.`,
      scope: String.raw`The real lemma works over all (infinitely many) sentences of a countable language and tests consistency by deducibility; the fragment replaces both by finite checks that are exact only here.`,
      deps: ['logic-4.2', 'logic-4.3'],
      refs: ['Enderton §2.5'],
      credit: 'Leon Henkin, 1949 (Journal of Symbolic Logic 14, 159–166)',
      tags: ['completeness', 'models'],
      viz(v) {
        const st = v.select('start', Object.entries(FRAG_STARTS).map(([k, a]) => ({ value: k, label: `{${a.join(', ')}}` })), 'A', { onChange: () => reset() });
        const wit = v.toggle('Henkin witnesses', true, { onChange: () => reset() });
        const rule = v.select('rule for undecided sentences', [{ value: 'eager', label: 'add σ if consistent' }, { value: 'lazy', label: 'add ¬σ if consistent' }], 'eager', { onChange: () => reset() });
        const L = v.stage({ x: [0, 100], y: [0, 100], axes: false, height: 340, weight: 1.15, minWidth: 340 });
        const R = v.stage({ x: [0, 100], y: [0, 100], axes: false, height: 340, weight: 0.85, minWidth: 260 });
        let run = null;
        const compute = () => { run = henkinRun(FRAG_STARTS[st.value], { witness: wit.value, lazy: rule.value === 'lazy' }); };
        const reset = () => { compute(); S.reset(null, { at: 'end' }); };
        compute();
        const S = v.steps({ frames: () => run.frames.map((f, i) => ({ i, note: f.kind === 'given' ? 'a sentence of Γ' : f.kind === 'witness' ? `Henkin axiom: ${f.text}` : `decide ${f.sent}: add ${f.text}${f.free ? ' (both were consistent)' : ' (forced)'}` })), start: 'end', still: 'end', speed: 1 });
        v.render(() => {
          const i = Math.min(S.frame.i ?? run.frames.length - 1, run.frames.length - 1);
          const fr = run.frames.slice(0, i + 1), N = 18244;
          const rowH = 5.4, top = 90;
          L.text('the theory so far', 2, 99, { align: 'left', baseline: 'top', size: 12, color: 'muted', weight: 700 });
          const start = Math.max(0, fr.length - 16);
          fr.slice(start).forEach((f, k) => {
            const y = top - k * rowH, col = f.kind === 'given' ? 'accent' : f.kind === 'witness' ? 'purple' : f.text.startsWith('¬') ? 'red' : 'green';
            if (start + k === i) L.rect(0, y - rowH * 0.5, 100, y + rowH * 0.5, { fill: 'gold', fillAlpha: 0.16, stroke: false });
            L.text(f.kind === 'given' ? 'given' : f.kind === 'witness' ? 'witness' : 'decide', 2, y, { align: 'left', baseline: 'middle', size: 11, color: 'muted' });
            L.text(f.text, 20, y, { align: 'left', baseline: 'middle', size: 12.5, color: col });
            L.text(`${f.survivors} models`, 99, y, { align: 'right', baseline: 'middle', size: 10.5, color: 'muted' });
          });
          if (start > 0) L.text(`… ${start} earlier lines`, 2, 4, { align: 'left', size: 10.5, color: 'muted' });
          // right: models alive and the pool grid
          const last = fr[fr.length - 1], frac = last.survivors / (run.frames.length ? Math.max(...run.frames.map((f) => f.survivors), 1) : 1);
          R.text('models of size ≤ 4 still alive', 2, 99, { align: 'left', baseline: 'top', size: 12, color: 'muted', weight: 700 });
          R.rect(2, 82, 98, 88, { fill: 'faint', fillAlpha: 0.15, stroke: false, radius: 3 });
          if (last.survivors) R.rect(2, 82, 2 + 96 * Math.max(0.02, Math.min(1, Math.log10(last.survivors + 1) / Math.log10(N))), 88, { fill: last.survivors ? 'green' : 'red', fillAlpha: 0.5, stroke: false, radius: 3 });
          R.text(last.survivors ? `${last.survivors.toLocaleString('en')} (log scale)` : 'none: the set is inconsistent', 50, 85, { align: 'center', baseline: 'middle', size: 12, color: 'ink', weight: 600 });
          R.text('sentences decided (green in Θ, red: negation in Θ)', 2, 74, { align: 'left', baseline: 'top', size: 11, color: 'muted', weight: 700 });
          const decided = new Map(); fr.forEach((f) => { if (f.kind === 'decide') decided.set(f.sent, f.val); });
          FRAG_POOL.forEach((e, k) => {
            const y = 66 - k * 5, d = decided.get(e.text);
            R.rect(2, y - 2, 6, y + 2, { fill: d === undefined ? 'faint' : d ? 'green' : 'red', fillAlpha: d === undefined ? 0.15 : 0.55, stroke: false, radius: 1.5 });
            R.text(e.text + (e.wit ? `   [witness ${e.wit}]` : ''), 9, y, { align: 'left', baseline: 'middle', size: 11.5, color: d === undefined ? 'faint' : 'ink' });
          });
        });
        v.readout(() => {
          if (run.inconsistent) return `**Inconsistent start:** no structure of size ≤ 4 satisfies ${FRAG_STARTS[st.value].map((t) => `$${toTex(P1(t, { rels: { P: 1, Q: 1 }, funcs: {}, consts: ['c0', 'c1', 'c2'] }))}$`).join(' and ')} together, so there is nothing to complete (a contradiction is derivable).`;
          const i = Math.min(S.frame.i ?? 0, run.frames.length - 1), done = i === run.frames.length - 1;
          if (!done) return `Step ${i + 1} of ${run.frames.length}: ${S.frame.note}. ${run.frames[i].survivors.toLocaleString('en')} models of size at most 4 remain.`;
          const inTheta = (t) => run.theta.find((q) => q.sent === t).in;
          const ws = [['∃x P(x)', (c) => inTheta(`P(c${c})`)], ['∃x ¬P(x)', (c) => !inTheta(`P(c${c})`)], ['∃x Q(x)', (c) => inTheta(`Q(c${c})`)]];
          const wres = ws.filter(([t]) => inTheta(t)).map(([t, f]) => [t, [0, 1, 2].some(f)]);
          const witnessed = wres.every(([, ok]) => ok);
          return `Finished. Θ decides all ${run.theta.length} sentences of the pool (complete ✓) and has ${run.survivors.toLocaleString('en')} models of size ≤ 4 (consistent ✓). Witnessed: ${wres.length ? wres.map(([t, ok]) => `$${toTex(P1(t, { rels: { P: 1, Q: 1 }, funcs: {}, consts: [] }))}$ ${ok ? '✓' : '✗ (no constant names a witness)'}`).join(', ') : 'no existential sentence in Θ'} — ${witnessed ? 'so Θ is witnessed.' : '**Θ is not witnessed**, which is why the Henkin axioms are part of the construction.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Theorem',
      name: 'Gödel’s completeness theorem',
      statement: String.raw`Every logically valid sentence is deducible, and more generally, for every set $\Gamma$ of formulas and formula $\varphi$ of a first-order language,
$$\Gamma\models\varphi \quad\Longrightarrow\quad \Gamma\vdash\varphi .$$
Equivalently: every consistent set of sentences has a model. Together with soundness (logic-4.4), $\Gamma\models\varphi$ if and only if $\Gamma\vdash\varphi$.`,
      idea: String.raw`Given consistent $\Gamma$, take the complete witnessed theory $\Theta\supseteq\Gamma$ of Henkin's lemma (logic-4.5). Build the **term model** $\mathfrak T$: its elements are the closed terms of the extended language modulo the equivalence $t\sim t'$ iff $(t=t')\in\Theta$, and a predicate holds of (classes of) terms iff the corresponding atomic sentence is in $\Theta$. A **truth lemma** shows by induction on sentences that $\mathfrak T\models\sigma\iff\sigma\in\Theta$: the atomic case is the definition, connectives use completeness and consistency of $\Theta$, and the quantifier case uses witnesses ($\exists x\,\psi\in\Theta$ gives some $\psi(c)\in\Theta$, hence a satisfying element). So $\mathfrak T\models\Gamma$. If $\Gamma\not\vdash\varphi$, then $\Gamma\cup\{\neg\varphi\}$ is consistent and has a model, so $\Gamma\not\models\varphi$.`,
      caption: String.raw`The Henkin theory $\Theta$ for the chosen start set (the same construction and fragment as 4.5) is turned into its term model: the left panel shows its elements, the constants collected into each (classes of equal constants), and the predicates $P$, $Q$. The right panel evaluates every pool sentence in that model and compares it with its status in $\Theta$; a green row is an instance of the truth lemma. Turn **witnesses** off and use the lazy rule: the truth lemma now fails at an existential sentence, because the term model has no element to point to.`,
      scope: String.raw`Illustration on a monadic fragment with three constants, where consistency can be tested by exhaustive search of models with at most 4 elements; the theorem itself is for arbitrary first-order languages (countable here, arbitrary with the axiom of choice).`,
      deps: ['logic-4.4', 'logic-4.5'],
      refs: ['Enderton §2.5'],
      credit: 'Gödel, 1929 (thesis) and 1930; the proof by term models is Henkin’s, 1949',
      tags: ['completeness', 'models'],
      viz(v) {
        const st = v.select('start', Object.entries(FRAG_STARTS).filter(([k]) => k !== 'C').map(([k, a]) => ({ value: k, label: `{${a.join(', ')}}` })), 'A', { onChange: () => v.invalidate() });
        const wit = v.toggle('Henkin witnesses', true, { onChange: () => v.invalidate() });
        const rule = v.select('rule', [{ value: 'eager', label: 'add σ if consistent' }, { value: 'lazy', label: 'add ¬σ if consistent' }], 'eager', { onChange: () => v.invalidate() });
        const L = v.stage({ x: [-1.7, 1.7], y: [-1.5, 1.6], equal: true, axes: false, height: 320, weight: 1, minWidth: 280 });
        const R = v.stage({ x: [0, 100], y: [0, 100], axes: false, height: 320, weight: 1.05, minWidth: 300 });
        let run, M, ev;
        const compute = () => {
          run = henkinRun(FRAG_STARTS[st.value], { witness: wit.value, lazy: rule.value === 'lazy' });
          M = termModel(run.theta);
          ev = FRAG_POOL.map((e, k) => ({ e, inTheta: run.theta[k].in, inModel: holds(e.ast, M) }));
        };
        v.render(() => {
          compute();
          const lang = { rels: new Map([['P', 1], ['Q', 1]]), consts: new Set(), funcs: new Map() };
          const n = M.n;
          // elements: classes with their constants
          range(n).forEach((a) => {
            const [x, y] = n === 1 ? [0, 0] : circlePos(a, n, 0.95, 0, 0, 90 + 180 / n);
            const inP = (M.Pm >> a) & 1, inQ = (M.Qm >> a) & 1;
            L.circle(x, y, 0.27, { color: inP ? 'accent' : 'muted', fill: inP ? 'accent' : 'panel', fillAlpha: inP ? 0.3 : 1, width: 2 });
            if (inQ) L.circle(x, y, 0.34, { color: 'orange', fill: false, width: 2.4 });
            L.text(M.members[a].map((i) => `c${subNum(i)}`).join(' = '), x, y, { align: 'center', baseline: 'middle', size: 12, weight: 600, color: 'ink', math: true });
            L.text(`${inP ? 'P' : '¬P'}${inQ ? ' Q' : ''}`, x, y, { align: 'center', baseline: 'top', dy: 32, size: 11, weight: 700, color: inP ? 'accent' : 'muted' });
          });
          void lang;
          L.corner('term model T: elements = constants mod “c = c′ ∈ Θ”', 'tl', { size: 11, color: 'muted' });
          L.corner('blue fill: P  ·  orange ring: Q', 'bl', { size: 11, color: 'muted' });
          R.text('sentence', 3, 99, { align: 'left', baseline: 'top', size: 11, color: 'muted', weight: 700 });
          R.text('in Θ', 58, 99, { align: 'center', baseline: 'top', size: 11, color: 'muted', weight: 700 });
          R.text('true in T', 76, 99, { align: 'center', baseline: 'top', size: 11, color: 'muted', weight: 700 });
          ev.forEach((r, k) => {
            const y = 91 - k * 6.6, ok = r.inTheta === r.inModel;
            R.rect(0, y - 3, 100, y + 3, { fill: ok ? 'green' : 'red', fillAlpha: ok ? 0.08 : 0.2, stroke: false });
            R.text(r.e.text, 3, y, { align: 'left', baseline: 'middle', size: 12, color: 'ink' });
            R.text(r.inTheta ? 'σ' : '¬σ', 58, y, { align: 'center', baseline: 'middle', size: 12, color: r.inTheta ? 'green' : 'red', weight: 700 });
            R.text(r.inModel ? 'true' : 'false', 76, y, { align: 'center', baseline: 'middle', size: 12, color: r.inModel ? 'green' : 'red', weight: 700 });
            R.text(ok ? '✓' : '✗', 95, y, { align: 'center', baseline: 'middle', size: 14, color: ok ? 'green' : 'red', weight: 700 });
          });
        });
        v.readout(() => {
          const bad = ev.filter((r) => r.inTheta !== r.inModel);
          const gv = FRAG_STARTS[st.value].map((t) => P1(t, { rels: { P: 1, Q: 1 }, funcs: {}, consts: ['c0', 'c1', 'c2'] }));
          const gok = gv.every((g) => holds(g, M));
          if (!bad.length) return `The term model has ${M.n} element${M.n > 1 ? 's' : ''} and agrees with $\\Theta$ on all ${ev.length} pool sentences (truth lemma ✓); in particular it satisfies the starting set: ${gv.map((g) => `$${toTex(g)}$`).join(', ')} ${gok ? '✓' : '✗'}.`;
          return `**The truth lemma fails** for ${bad.map((r) => `$${toTex(r.e.ast)}$`).join(', ')}: $\\Theta$ says ${bad[0].inTheta ? 'it is in' : 'its negation is in'} $\\Theta$, but the term model says ${bad[0].inModel ? 'true' : 'false'}. Without witnesses Θ may contain $\\exists x\\,\\psi$ while naming no element that satisfies $\\psi$; the starting set ${gok ? 'is still satisfied here' : 'is **not** satisfied by this model'}.`;
        });
      },
    },
  ],
};
