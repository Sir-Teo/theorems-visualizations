// Programming Languages & Types — Chapter 2: The untyped λ-calculus (items 2.1–2.6; 2.7–2.12 in ch02-b.js)
import {
  V, L, A, fv, subst, naiveSubst, renameFree, parse, P, DEFS, key, alphaEq, layoutTerm, show, drawLine, redexes, contract, getAt, setAt, cat, size,
  runStrategy, normalize, makeGraph, drawGraph, hitBox, STRATS, decode, drawTrace, boolOf, churchNum, church, dbStr, toDB, allNames,
  layoutG, drawTreePx, hitNode, field, pxStage, drawParseError, rrect,
} from './ch02.shared.js';

const tf = (v, label, def, onChange, width = 340) => field(v, label, def, (s) => parse(s, DEFS), { width, onChange });
const ptr = (s) => { const p = s.pointer; return p && p.inside ? { x: s.X(p.x), y: s.Y(p.y) } : null; };
const setStr = (set) => (set.size ? '\\{' + [...set].sort().join(',\\,') + '\\}' : '\\varnothing');
const txt = (t, o) => '\\mathtt{' + show(t, o).replace(/λ/g, '\\lambda ').replace(/ /g, '\\ ') + '}';
const parens = (str) => (str.match(/\(/g) || []).length;
const NICE = { abbr: { names: true } };

export default {
  collection: 'pl',
  chapter: 2,
  title: 'The untyped λ-calculus',
  summary: String.raw`The λ-calculus has only variables, functions and application, yet it encodes booleans, numbers, pairs and recursion. Substitution must avoid capturing variables, which is subtle enough that implementations often switch to nameless de Bruijn indices. Different evaluation strategies decide which redex to reduce next, and fixed-point combinators make recursion possible without names — showing that the calculus is as powerful as Turing machines.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1', kind: 'Definition', name: 'λ-terms',
      statement: String.raw`The **λ-terms** over a countable set of variables form the smallest set $\Lambda$ such that: every variable $x$ is a term; if $t$ is a term and $x$ a variable, the **abstraction** $\lambda x.\,t$ (“the function sending $x$ to $t$”) is a term; if $t$ and $u$ are terms, the **application** $t\,u$ is a term. A term is a finite tree with three kinds of node. To keep strings short, application associates to the left ($t\,u\,w$ means $(t\,u)\,w$), the body of a $\lambda$ extends as far right as the parentheses allow ($\lambda x.\,t\,u$ means $\lambda x.\,(t\,u)$), and $\lambda x.\,\lambda y.\,t$ may be abbreviated $\lambda xy.\,t$.`,
      idea: String.raw`The grammar is the whole language: there are no numbers, no booleans and no loops, only functions and the act of applying one function to another (a function with several arguments is a function returning a function, “currying”). The conventions are about reading a flat string as a tree and nothing more; the tree is the term. The first mistake to avoid is reading $\lambda x.\,x\,x$ as $(\lambda x.\,x)\,x$, the second is reading $f\,x\,y$ as $f\,(x\,y)$. This is the inductive-definition pattern of Chapter 1 (syntax as a least set, structural induction on terms) applied to a language with binders.`,
      caption: String.raw`Type any term (λ or backslash, names are single lower-case letters, optionally with digits or primes) or pick an example. Hover over a node of the tree to see which part of the text it stands for; switch between the conventions and full parenthesisation and watch the parentheses reappear. The words True, Plus, … and the digits are shorthands for terms that we define later.`,
      deps: ['pl-1.1'], refs: ['Pierce §5.1'], tags: ['syntax', 'binding'],
      credit: 'Alonzo Church, 1930s (the λ-calculus)',
      viz(v) {
        const sTxt = pxStage(v, { height: 92, full: true, title: 'The term as text' });
        const sTree = pxStage(v, { height: 340, full: true, hover: true, title: 'The term as a tree' });
        const EX = { church: 'λf x. f (f x)', omega: '(λx. x x) (λx. x x)', s: 'λx y z. x z (y z)', app: 'f x y z', y: 'λf. (λx. f (x x)) (λx. f (x x))', trap: 'λx. x x' };
        const f = tf(v, 'term', EX.y, () => v.invalidate());
        const ex = v.select('Examples', [{ value: 'y', label: 'Y' }, { value: 'church', label: 'Church 2' }, { value: 's', label: 'S' }, { value: 'app', label: 'f x y z' }, { value: 'omega', label: 'Ω' }, { value: 'trap', label: 'λx. x x' }], 'y', { onChange: () => f.set(EX[ex.value]) });
        const form = v.select('Text', [{ value: 'conv', label: 'with the conventions' }, { value: 'full', label: 'fully parenthesised' }], 'conv');
        const merge = v.toggle('write λx.λy. as λxy.', true);
        v.legend([['accent', 'abstraction λx', { dot: true }], ['orange', 'application', { dot: true }], ['green', 'variable', { dot: true }], ['gold', 'hovered subterm', { dot: true }]]);
        let Lt = null, hov = null;
        const mk = (t, p) => (t.t === 'v' ? { label: t.x, path: p, kind: 'v', kids: [] }
          : t.t === 'l' ? { label: 'λ' + t.x, path: p, kind: 'l', kids: [mk(t.b, cat(p, 'b'))] }
            : { label: '@', path: p, kind: 'a', kids: [mk(t.f, cat(p, 'f')), mk(t.a, cat(p, 'a'))] });
        const under = (path, h) => h === '' || path === h || path.startsWith(h + '.');
        let stats = null;
        v.render(() => {
          if (f.err) {
            drawParseError(v, sTxt, f.src, f.err);
            sTree.textPx('fix the term to see its tree', sTree.W / 2, sTree.H / 2, { size: 14, color: 'muted', align: 'center' });
            stats = null; return;
          }
          const t = f.ast, root = mk(t, '');
          const p = ptr(sTree); const old = Lt;
          hov = null;
          if (p && old) { const hit = hitNode(old, p.x, p.y); if (hit) hov = hit.n.path; }
          Lt = layoutG(root);
          drawTreePx(v, sTree, Lt, {
            labelOf: (nd) => nd.n.label, dy: 62,
            fill: (nd) => (nd.n.kind === 'l' ? 'accent' : nd.n.kind === 'a' ? 'orange' : 'green'),
            ring: (nd) => (hov !== null && nd.n.path === hov ? 'gold' : null),
            dim: (nd) => hov !== null && !under(nd.n.path, hov),
            note: (nd) => (nd.parent && nd.parent.n.kind === 'a' ? (nd.parent.kids[0] === nd ? 'fun' : 'arg') : (nd.parent && nd.parent.n.kind === 'l' ? 'body' : '')),
            noteColor: () => 'muted',
          });
          const lay = layoutTerm(t, { full: form.value === 'full', merge: merge.value, style: (nd, path) => (hov !== null && path === hov ? 'gold' : undefined) });
          drawLine(v, sTxt, lay, sTxt.W / 2, sTxt.H / 2 + 4, { size: 24, align: 'center', maxW: sTxt.W - 40 });
          const full = show(t, { full: true }), conv = show(t, {});
          let nl = 0, na = 0, nv = 0; (function c(u) { if (u.t === 'v') nv++; else if (u.t === 'l') { nl++; c(u.b); } else { na++; c(u.f); c(u.a); } })(t);
          stats = { nl, na, nv, saved: parens(full) - parens(conv), depth: Lt.depth + 1 };
        });
        v.readout(() => (f.err ? `Not a term: ${f.err.error}.` : `The tree has $${stats.nl + stats.na + stats.nv}$ nodes: $${stats.nl}$ abstractions, $${stats.na}$ applications, $${stats.nv}$ variable occurrences; its depth is $${stats.depth}$ levels. The conventions save $${stats.saved}$ pairs of parentheses compared with full parenthesisation.`));
      },
    },
    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2', kind: 'Definition', name: 'Free and bound variables; α-equivalence',
      statement: String.raw`In $\lambda x.\,t$ the abstraction **binds** $x$, and the occurrences of $x$ in $t$ that are not inside a deeper $\lambda x$ are **bound** by it; its scope is $t$. The set of **free variables** is defined by recursion: $\mathrm{FV}(x)=\{x\}$, $\mathrm{FV}(t\,u)=\mathrm{FV}(t)\cup\mathrm{FV}(u)$, $\mathrm{FV}(\lambda x.\,t)=\mathrm{FV}(t)\setminus\{x\}$. Two terms are **α-equivalent** ($t\equiv_\alpha u$) if one is obtained from the other by consistently renaming bound variables, where the new name must not be captured by (or capture anything of) the surroundings; for instance $\lambda x.\,x\,y\equiv_\alpha\lambda z.\,z\,y$ but $\lambda x.\,x\,y\not\equiv_\alpha\lambda y.\,y\,y$. Terms are always considered up to $\equiv_\alpha$.`,
      idea: String.raw`A bound variable is only a placeholder that records a connection between an occurrence and its binder; its name carries no information beyond that connection (like the $i$ in $\sum_i a_i$ or the $x$ in $\int f(x)\,dx$). So a safe renaming must preserve all the connections, which fails exactly when the new name is already free in the body (it would be captured) or is bound again between an occurrence and its binder. This is why one works with equivalence classes, and why the nameless representation of 2.11 identifies them.`,
      caption: String.raw`Every occurrence is joined by an arc to its binder (colour = binder); free occurrences are underlined in red. Click a variable or a $\lambda$ to select its binder, then type a new name and press Rename. A safe rename leaves every arc in place; switch on “allow unsafe renames” to force a capturing rename and watch an arc jump to a different binder — the nameless form changes.`,
      deps: ['pl-2.1'], refs: ['Pierce §5.3'], tags: ['binding', 'substitution'],
      viz(v) {
        const s = pxStage(v, { height: 192, full: true, title: 'Binders, occurrences and scopes' });
        const EX = { a: 'λx. λy. x (y z)', b: 'λx. x (λx. x) y', c: '(λx. x y) (λy. y x)', d: 'λf. (λx. f (x x)) (λx. f (x x))' };
        let orig = P(EX.a), cur = orig, sel = null, msg = null;
        const f = tf(v, 'term', EX.a, () => { if (f.ast) { orig = f.ast; cur = orig; sel = null; msg = null; } v.invalidate(); });
        const ex = v.select('Examples', [{ value: 'a', label: 'λx.λy. x (y z)' }, { value: 'b', label: 'shadowing' }, { value: 'c', label: 'free and bound' }, { value: 'd', label: 'Y' }], 'a', { onChange: () => f.set(EX[ex.value]) });
        const nn = v.input('new name', 'w', { width: 70, placeholder: 'w' });
        const unsafe = v.toggle('allow unsafe renames', false);
        v.button('Rename selected binder', () => {
          if (sel === null) { msg = { ok: false, t: 'select a variable or a λ first' }; return; }
          const y = nn.value.trim(); const b = getAt(cur, sel);
          if (!/^[a-z][0-9']*$/.test(y)) { msg = { ok: false, t: 'a variable is a lower-case letter, optionally with digits or primes' }; return; }
          if (y === b.x) { msg = { ok: true, t: 'same name: nothing to do' }; return; }
          const next = setAt(cur, sel, L(y, renameFree(b.b, b.x, y)));
          if (alphaEq(next, cur)) { cur = next; msg = { ok: true, t: `renamed ${b.x} to ${y}: all connections are preserved` }; }
          else if (unsafe.value) { cur = next; msg = { ok: false, t: `unsafe: ${y} now captures or is captured — the term has changed meaning` }; }
          else msg = { ok: false, t: `refused: ${y} would be captured, or would capture a free ${y}` };
        });
        v.button('Reset', () => { cur = orig; sel = null; msg = null; });
        const COLS = ['accent', 'orange', 'green', 'purple', 'teal', 'pink'];
        let info = null;
        const analyse = (t) => {
          const vars = new Map(), binders = [];
          (function go(u, p, env) {
            if (u.t === 'v') { const i = env.findLastIndex((e) => e.name === u.x); vars.set(p, i >= 0 ? env[i].path : null); }
            else if (u.t === 'l') { binders.push({ path: p, name: u.x }); go(u.b, cat(p, 'b'), [...env, { name: u.x, path: p }]); }
            else { go(u.f, cat(p, 'f'), env); go(u.a, cat(p, 'a'), env); }
          })(t, '', []);
          return { vars, binders };
        };
        s.onClick((x) => {
          if (!info) return; const px = s.X(x); let best = null, bd = 16;
          for (const k of info.lay.toks) {
            const isB = k.node.t === 'l' && k.s.startsWith('λ'), isV = k.node.t === 'v';
            if (!isB && !isV) continue;
            const a = info.d.xOf(k.a), b = info.d.xOf(k.b), dd = px >= a && px <= b ? 0 : Math.min(Math.abs(px - a), Math.abs(px - b));
            if (dd < bd) { bd = dd; best = k; }
          }
          sel = best ? (best.node.t === 'l' ? best.path : info.an.vars.get(best.path)) : null;
          if (best && best.node.t === 'v' && sel === null) sel = null;
          v.invalidate();
        });
        v.render(() => {
          const t = cur, an = analyse(t), colOf = new Map(an.binders.map((b, i) => [b.path, COLS[i % COLS.length]]));
          const lay = layoutTerm(t, { merge: false, style: (nd, p) => (nd.t === 'v' ? (an.vars.get(p) === null ? 'red' : colOf.get(an.vars.get(p))) : nd.t === 'l' ? colOf.get(p) : undefined) });
          const baseY = s.H - 76;
          const d = drawLine(v, s, lay, s.W / 2, baseY, { size: 26, align: 'center', maxW: s.W - 50, weight: 700,
            under: (u) => {
              if (sel !== null && lay.spans.has(sel)) { const [a, b] = lay.spans.get(sel); const x0 = u.xOf(a), x1 = u.xOf(b); s.ctx.save(); s.ctx.fillStyle = v.color(colOf.get(sel), 0.13); rrect(s.ctx, x0 - 4, baseY - u.size * 0.95, x1 - x0 + 8, u.size * 1.9, 8); s.ctx.fill(); s.ctx.restore(); }
            } });
          info = { lay, d, an };
          const ctx = s.ctx; ctx.save();
          const center = (k) => (d.xOf(k.a) + d.xOf(k.b)) / 2;
          const binderTok = new Map(lay.toks.filter((k) => k.node.t === 'l' && k.s.startsWith('λ')).map((k) => [k.path, k]));
          const items = [...lay.toks.filter((k) => k.node.t === 'v')].map((k) => ({ k, b: an.vars.get(k.path) }));
          for (const { k, b } of items) {
            const x1 = center(k);
            if (b === null) {
              ctx.strokeStyle = v.color('red', 1); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(d.xOf(k.a), baseY + d.size * 0.72); ctx.lineTo(d.xOf(k.b), baseY + d.size * 0.72); ctx.stroke();
              s.textPx('free', x1, baseY + d.size * 0.72 + 13, { size: 11, color: 'red', weight: 700, align: 'center', halo: false });
              continue;
            }
            const bt = binderTok.get(b), x2 = (d.xOf(bt.a + 1) + d.xOf(bt.b)) / 2;
            const isSel = sel === b, h = Math.min(86, 22 + Math.abs(x1 - x2) * 0.22), y0 = baseY - d.size * 0.8;
            ctx.strokeStyle = v.color(colOf.get(b), isSel ? 1 : 0.7); ctx.lineWidth = isSel ? 2.8 : 1.7;
            ctx.beginPath(); ctx.moveTo(x1, y0); ctx.bezierCurveTo(x1, y0 - h, x2, y0 - h, x2, y0 - 2); ctx.stroke();
            ctx.fillStyle = v.color(colOf.get(b), isSel ? 1 : 0.8); ctx.beginPath(); ctx.moveTo(x2, y0 - 2); ctx.lineTo(x2 - 4.5, y0 - 10); ctx.lineTo(x2 + 4.5, y0 - 10); ctx.closePath(); ctx.fill();
          }
          ctx.restore();
          if (msg) s.textPx(msg.t, s.W / 2, s.H - 18, { size: 13, weight: 600, color: msg.ok ? 'green' : 'red', align: 'center' });
          else s.textPx(sel === null ? 'click a variable or a λ' : 'binder selected: its scope is shaded', s.W / 2, s.H - 18, { size: 12.5, color: 'muted', align: 'center' });
        });
        v.readout(() => {
          const t = cur, fvs = fv(t), db = dbStr(toDB(t, [...fv(orig)].sort()));
          const same = alphaEq(t, orig);
          return `$\\mathrm{FV}=${setStr(fvs)}$ · nameless form $\\mathtt{${db.replace(/λ/g, '\\lambda').replace(/ /g, '\\ ')}}$ (free variables numbered after the binders)\n` + (same ? 'The current term is α-equivalent to the term you started from.' : '**The current term is NOT α-equivalent to the start: a rename changed its meaning.**');
        });
      },
    },
    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3', kind: 'Definition', name: 'Capture-avoiding substitution',
      statement: String.raw`The substitution $[x\mapsto s]\,t$ of a term $s$ for the free occurrences of $x$ in $t$ is defined by recursion on $t$: $[x\mapsto s]\,x=s$; $[x\mapsto s]\,y=y$ for $y\ne x$; $[x\mapsto s](t_1\,t_2)=([x\mapsto s]t_1)\,([x\mapsto s]t_2)$; $[x\mapsto s](\lambda x.\,t)=\lambda x.\,t$; and for a binder $\lambda y.\,t$ with $y\ne x$: $[x\mapsto s](\lambda y.\,t)=\lambda y.\,[x\mapsto s]t$ provided $y\notin\mathrm{FV}(s)$ (or $x\notin\mathrm{FV}(t)$). When $y\in\mathrm{FV}(s)$ and $x\in\mathrm{FV}(t)$ one first renames the binder (an α-step) to a fresh name, which is always possible. Free variables of $s$ are then never captured: $\mathrm{FV}([x\mapsto s]t)=(\mathrm{FV}(t)\setminus\{x\})\cup\mathrm{FV}(s)$ when $x\in\mathrm{FV}(t)$.`,
      idea: String.raw`Replacing text blindly gives the wrong function: in $[x\mapsto y]\,\lambda y.\,x\,y$ the $y$ coming from outside would land under $\lambda y$ and be tied to the wrong binder, turning “the outer $y$ applied to the argument” into “the argument applied to itself”. Since bound names are placeholders (2.2), we are free to choose them, so the definition picks a name that clashes with nothing. The recursion on $t$ is well-founded only up to this renaming, a reason why implementations use a supply of fresh names or the nameless terms of 2.11.`,
      caption: String.raw`Edit the term $t$, the variable $x$ and the term $s$ (or choose an example). The first row replaces $x$ textually: inserted copies of $s$ are orange and every variable of $s$ that is swallowed by a binder is red and underlined. The second row is the definition above: renamed binders are green. The readout compares the free variables of both results with the formula, and with “rename every binder apart, then replace blindly”.`,
      deps: ['pl-2.2'], refs: ['Pierce §5.3'], tags: ['substitution', 'binding'],
      viz(v) {
        const s = pxStage(v, { height: 278, full: true, title: 'Substitution: naive versus capture-avoiding' });
        const EX = { a: ['λy. x y', 'x', 'y z'], b: ['(λz. x z) (λx. x)', 'x', 'z'], c: ['λy. x y', 'x', 'w'], d: ['λx. λy. x y z', 'z', 'x y'], e: ['λx. x y', 'x', 'z'] };
        const ft = tf(v, 't', EX.a[0], () => v.invalidate(), 300);
        const fx = v.input('x', EX.a[1], { width: 54, onChange: () => v.invalidate() });
        const fs = tf(v, 's', EX.a[2], () => v.invalidate(), 240);
        const ex = v.select('Examples', [{ value: 'a', label: 'capture' }, { value: 'b', label: 'capture, shadowing' }, { value: 'c', label: 'no clash' }, { value: 'd', label: 'two binders' }, { value: 'e', label: 'x is bound' }], 'a',
          { onChange: () => { const e = EX[ex.value]; ft.set(e[0]); fx.set(e[1]); fs.set(e[2]); v.invalidate(); } });
        let res = null;
        const apart = (t, avoid) => {
          if (t.t === 'v') return t;
          if (t.t === 'a') return A(apart(t.f, avoid), apart(t.a, avoid));
          let k = 1, y; do { y = 'v' + k++; } while (avoid.has(y)); avoid.add(y);
          return L(y, apart(renameFree(t.b, t.x, y), avoid));
        };
        v.render(() => {
          const x = fx.value.trim();
          if (ft.err || fs.err || !/^[a-z][0-9']*$/.test(x)) {
            s.textPx(ft.err ? 'term t: ' + ft.err.error : fs.err ? 'term s: ' + fs.err.error : 'x must be a variable', s.W / 2, s.H / 2, { size: 15, color: 'red', align: 'center' }); res = null; return;
          }
          const t = ft.ast, sT = fs.ast;
          const naive = naiveSubst(t, x, sT), right = subst(t, x, sT, true);
          const left = 150, maxW = s.W - left - 20;
          const row = (label, y, lay, o = {}) => {
            s.textPx(label, 16, y, { size: 12.5, weight: 700, color: o.lc || 'muted', align: 'left', halo: false });
            return drawLine(v, s, lay, left, y, { size: 20, maxW, weight: 600, under: o.under });
          };
          row('term  t', 32, layoutTerm(t, { style: (nd) => (nd.t === 'v' && nd.x === x ? 'orange' : undefined) }));
          row(`put  s  for  ${x}`, 66, layoutTerm(sT, { style: () => 'orange' }));
          s.ctx.save(); s.ctx.strokeStyle = v.color('grid', 1); s.ctx.beginPath(); s.ctx.moveTo(16, 92); s.ctx.lineTo(s.W - 16, 92); s.ctx.stroke(); s.ctx.restore();
          const nl = layoutTerm(naive, { style: (nd) => (nd.cap ? 'red' : nd.ins ? 'orange' : undefined) });
          const capToks = nl.toks.filter((k) => k.node.t === 'v' && k.node.cap);
          const dn = row('naive replacement', 130, nl, { lc: 'red' });
          for (const k of capToks) { const a = dn.xOf(k.a), b = dn.xOf(k.b); s.ctx.save(); s.ctx.strokeStyle = v.color('red', 1); s.ctx.lineWidth = 2.4; s.ctx.beginPath(); s.ctx.moveTo(a, 130 + 15); s.ctx.lineTo(b, 130 + 15); s.ctx.stroke(); s.ctx.restore(); }
          if (capToks.length) s.textPx(`captured: ${[...new Set(capToks.map((k) => k.s))].join(', ')}`, left, 130 + 32, { size: 12, color: 'red', weight: 700, align: 'left', halo: false });
          const rl = layoutTerm(right, { style: (nd) => (nd.ren ? 'green' : nd.ins ? 'orange' : undefined) });
          row('capture-avoiding', 218, rl, { lc: 'green' });
          const nR = [...allNames(right)].filter((n) => /'/.test(n)).length;
          if (nR) s.textPx(`binder renamed (shown in green) so that no free variable is captured`, left, 218 + 28, { size: 12, color: 'green', weight: 700, align: 'left', halo: false });
          else s.textPx(fv(t).has(x) ? 'no clash: no renaming was needed' : `${x} does not occur free in t: nothing to substitute`, left, 218 + 28, { size: 12, color: 'muted', weight: 600, align: 'left', halo: false });
          const exp = fv(t).has(x) ? new Set([...[...fv(t)].filter((n) => n !== x), ...fv(sT)]) : new Set(fv(t));
          const same = (a, b) => a.size === b.size && [...a].every((n) => b.has(n));
          const av = naiveSubst(apart(t, new Set([...allNames(t), ...allNames(sT), x])), x, sT);
          res = { exp, fvN: fv(naive), fvR: fv(right), okN: same(fv(naive), exp), okR: same(fv(right), exp), agree: alphaEq(right, av) };
        });
        v.readout(() => (res ? `Expected free variables $${setStr(res.exp)}$. Naive: $${setStr(res.fvN)}$ ${res.okN ? '✓' : '✗ **(a free variable was captured)**'} · Capture-avoiding: $${setStr(res.fvR)}$ ${res.okR ? '✓' : '✗'} · agrees with “rename all binders apart, then replace blindly”: ${res.agree ? '✓' : '✗'}` : 'Fix the inputs.'));
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4', kind: 'Definition', name: 'β-reduction',
      statement: String.raw`A **β-redex** is an application whose function part is an abstraction, $(\lambda x.\,t)\,u$, and it **contracts** to $[x\mapsto u]\,t$. The one-step relation $t\to_\beta t'$ holds when $t'$ is obtained from $t$ by contracting one redex occurring anywhere inside $t$ (in a function position, an argument position, or under a $\lambda$). $\to_\beta^{*}$ is its reflexive–transitive closure, and $=_\beta$ the equivalence relation it generates. A term with no redex is in **normal form**. A term may contain several redexes, so $\to_\beta$ is not a function: it defines a graph on terms (up to $\equiv_\alpha$), the **reduction graph**.`,
      idea: String.raw`Computation is nothing but the repeated contraction of redexes, each time substituting the argument for the parameter (2.3). Because redexes can be nested or disjoint, the order is a choice, and the graph of reachable terms records all choices. The diamond that appears when one contracts two disjoint redexes in either order is the seed of confluence (Church–Rosser); here we only observe that the graph can have several branches, merge again, or contain loops.`,
      caption: String.raw`Orange underlines mark the redexes of the current term; hover to see its two halves and a preview of the result, click to contract it. Each term you visit becomes a node of the reduction graph below (gold = your path, green = normal form). Switch on “reveal all reachable terms” to see the full graph, and click a node to jump to it.`,
      deps: ['pl-2.3'], refs: ['Pierce §5.1'], tags: ['reduction', 'operational semantics'],
      credit: 'Alonzo Church, 1936 (λ-conversion); the names α, β, η for the rules are later (origin not verified)',
      viz(v) {
        const sT = pxStage(v, { height: 150, full: true, hover: true, title: 'Click a redex to contract it' });
        const sG = pxStage(v, { height: 290, full: true, hover: true, title: 'Reduction graph' });
        const EX = {
          dia: '(λx. x x) ((λy. y) z)', ka: '(λx. λy. x) a ((λz. z z) (λz. z z))', three: '(λx. x x x) ((λy. y) z)', skk: 'S K K a', two: '(λx. λy. y x) ((λz. z) a) (λw. w)',
        };
        let G = null, cur = null, hist = [], trav = new Set(), vis = new Set(), msg = '';
        const load = (src) => {
          const r = parse(src, DEFS); if (!r.ast) return;
          G = makeGraph(r.ast, { cap: 36, maxSize: 90 }); cur = G.root; hist = [G.root.id]; trav = new Set(); vis = new Set([G.root.id]); msg = '';
          G.expand(G.root);
        };
        const f = tf(v, 'term', EX.dia, () => { load(f.src); v.invalidate(); });
        const ex = v.select('Examples', [{ value: 'dia', label: 'a diamond' }, { value: 'ka', label: 'K a Ω' }, { value: 'three', label: 'three copies' }, { value: 'skk', label: 'S K K a' }, { value: 'two', label: 'two redexes' }], 'dia', { onChange: () => f.set(EX[ex.value]) });
        const reveal = v.toggle('reveal all reachable terms', true, { onChange: () => { if (reveal.value) { G.exploreAll(); } } });
        const go = (p) => {
          const t2 = contract(cur.term, p);
          if (size(t2) > 220) { msg = 'the term has become too large to display'; return; }
          const nd = G.add(t2, cur.depth + 1); G.addEdge(cur, nd, p); G.expand(nd); trav.add(cur.id + '>' + nd.id); vis.add(nd.id); cur = nd; hist.push(nd.id); msg = '';
        };
        v.button('Step (leftmost-outermost)', () => { const q = runStrategy(cur.term, 'normal', { max: 1 }); if (q.paths.length) go(q.paths[0]); });
        v.button('Undo', () => { if (hist.length > 1) { hist.pop(); cur = G.nodes[hist[hist.length - 1]]; } });
        v.button('Restart', () => load(f.src));
        load(EX.dia);
        let info = null, hovR = null;
        sT.onClick((x) => {
          if (!info || !cur) return; const px = sT.X(x); const c = info.reds.filter((r) => px >= r.x0 && px <= r.x1).sort((a, b) => (a.x1 - a.x0) - (b.x1 - b.x0))[0];
          if (c) { go(c.p); v.invalidate(); }
        });
        sG.onClick((x, y) => { const nd = hitBox(info && info.shown || [], sG.X(x), sG.Y(y)); if (nd) { cur = nd; hist.push(nd.id); v.invalidate(); } });
        v.legend([['accent', 'start term', { dot: true }], ['green', 'normal form', { dot: true }], ['gold', 'your path / current term', { dot: true }], ['muted', 'reachable, not visited']]);
        v.render(() => {
          if (f.err) { drawParseError(v, sT, f.src, f.err); sG.textPx('fix the term', sG.W / 2, sG.H / 2, { size: 14, color: 'muted', align: 'center' }); info = null; return; }
          // ---- term strip
          const t = cur.term, reds = redexes(t);
          const lay0 = layoutTerm(t, NICE);
          const rs = reds.filter((p) => lay0.spans.has(p));
          const p = ptr(sT);
          hovR = null;
          if (p && info) { const c = info.reds.filter((r) => p.x >= r.x0 && p.x <= r.x1).sort((a, b) => (a.x1 - a.x0) - (b.x1 - b.x0))[0]; if (c && reds.includes(c.p)) hovR = c.p; }
          const hpart = (path) => (hovR !== null && (path === cat(hovR, 'f') || path.startsWith(cat(hovR, 'f') + '.')) ? 'orange' : hovR !== null && (path === cat(hovR, 'a') || path.startsWith(cat(hovR, 'a') + '.')) ? 'accent' : undefined);
          const lay = layoutTerm(t, { ...NICE, style: (nd, path) => (hovR === null ? undefined : hpart(path)) });
          const yT = 56;
          const d = drawLine(v, sT, lay, sT.W / 2, yT, { size: 25, align: 'center', maxW: sT.W - 40, weight: 600 });
          const lev = (q) => rs.filter((o) => o !== q && lay.spans.get(o)[0] <= lay.spans.get(q)[0] && lay.spans.get(o)[1] >= lay.spans.get(q)[1] && (lay.spans.get(o)[0] !== lay.spans.get(q)[0] || lay.spans.get(o)[1] !== lay.spans.get(q)[1])).length;
          const regs = rs.map((q) => { const [a, b] = lay.spans.get(q); return { p: q, x0: d.xOf(a), x1: d.xOf(b), lev: lev(q) }; });
          info = { reds: regs, shown: info ? info.shown : [] };
          for (const r of regs) {
            sT.ctx.save(); sT.ctx.strokeStyle = v.color('orange', hovR === r.p ? 1 : 0.85); sT.ctx.lineWidth = hovR === r.p ? 3.2 : 2;
            const yy = yT + d.size * 0.78 + r.lev * 6; sT.ctx.beginPath(); sT.ctx.moveTo(r.x0, yy); sT.ctx.lineTo(r.x1, yy); sT.ctx.stroke(); sT.ctx.restore();
          }
          if (hovR !== null) {
            const prev = layoutTerm(contract(t, hovR), NICE);
            sT.textPx('→  ' + prev.text, sT.W / 2, yT + 50, { size: 15, color: 'muted', weight: 600, align: 'center', halo: false });
          } else sT.textPx(reds.length ? `${reds.length} redex${reds.length > 1 ? 'es' : ''}: hover one, click to contract` : 'normal form: no redex left', sT.W / 2, yT + 50, { size: 13, color: reds.length ? 'muted' : 'green', weight: 600, align: 'center', halo: false });
          if (msg) sT.textPx(msg, sT.W / 2, sT.H - 10, { size: 12, color: 'red', align: 'center' });
          // ---- graph
          if (reveal.value) G.exploreAll();
          const shown = G.nodes.filter((n) => reveal.value || vis.has(n.id));
          const ids = new Set(shown.map((n) => n.id));
          const edges = G.edges.filter((e) => ids.has(e.from) && ids.has(e.to) && (reveal.value || trav.has(e.from + '>' + e.to)));
          const ph = ptr(sG); let hn = null;
          if (ph) hn = hitBox(shown, ph.x, ph.y);
          drawGraph(v, sG, G, shown, edges, {
            colorOf: (nd) => (nd === G.root ? 'accent' : nd.expanded && nd.redexes && !nd.redexes.length ? 'green' : null),
            ringOf: (nd) => (nd === cur ? 'gold' : null),
            faint: (nd) => !vis.has(nd.id),
            edgeColor: (e) => (trav.has(e.from + '>' + e.to) ? 'gold' : 'muted'), edgeWidth: (e) => (trav.has(e.from + '>' + e.to) ? 2.8 : 1.3),
            edgeAlpha: (e) => (trav.has(e.from + '>' + e.to) ? 1 : 0.6), region: [0, 4, sG.W, sG.H - (hn ? 34 : 4)],
            labelOf: (nd) => show(nd.term, NICE),
          });
          info.shown = shown;
          if (hn) sG.textPx(show(hn.term, NICE), sG.W / 2, sG.H - 16, { size: 13.5, weight: 600, color: 'ink', align: 'center', plate: true });
        });
        v.readout(() => {
          if (f.err) return 'Fix the term.';
          const nfs = G.nodes.filter((n) => n.expanded && n.redexes && !n.redexes.length);
          const reds = cur.redexes ? cur.redexes.length : 0;
          const full = reveal.value ? ` · ${G.nodes.length} terms are reachable${G.truncated ? ' (graph cut off at its size limit)' : ''}, ${nfs.length} of them in normal form${nfs.length === 1 ? ': every terminating path ends in the same term' : ''}.` : '';
          return `${hist.length - 1} step${hist.length === 2 ? '' : 's'} taken · the current term has $${reds}$ redex${reds === 1 ? '' : 'es'}${reds === 0 ? ' (normal form)' : ''}${full}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5', kind: 'Definition', name: 'Evaluation strategies',
      statement: String.raw`An **evaluation strategy** chooses, for each term that has a redex, which redex to contract. **Normal order** contracts the leftmost-outermost redex (anywhere, including under $\lambda$); **call by name** is the same but never reduces under a $\lambda$ (it stops at an abstraction); **call by value** contracts $(\lambda x.\,t)\,u$ only when the argument $u$ is already a value (an abstraction here, or a variable), reducing the function part first and then the argument, and never under a $\lambda$; **applicative order** contracts the leftmost-innermost redex, arguments before applications, also under $\lambda$. The strategies can disagree about termination: $(\lambda x.\,y)\,\Omega$ reaches $y$ under normal order and call by name but never terminates under call by value or applicative order.`,
      idea: String.raw`A strategy is a path through the reduction graph of 2.4: at each term it picks one outgoing edge. A strategy that avoids evaluating an argument it will discard is lazy; one that insists on evaluating arguments first does the work (and any divergence) of the arguments whether they are used or not, but never evaluates a duplicated argument twice. Normal order is complete: if a normal form exists it is found. The weak strategies stop at the first abstraction, which is what real programming languages do, so their final term can still contain redexes under a $\lambda$.`,
      caption: String.raw`Four strategies run on the same term; each has a colour and a marker. Drag “step” to advance all four at once: the coloured edges show each path through the reachable terms, the rows above show where each one is. Pick $(\lambda x.y)\,\Omega$ to see two strategies finish and two go round the loop forever.`,
      deps: ['pl-2.4'], refs: ['Pierce §5.1'], tags: ['reduction', 'evaluation order'],
      viz(v) {
        const sR = pxStage(v, { height: 156, full: true, title: 'The four strategies on one term' });
        const sG = pxStage(v, { height: 270, full: true, hover: true, title: 'Reachable terms and the four paths' });
        const EX = { om: '(λx. y) Omega', dup: '(λx. x x) ((λy. y) z)', lam: 'λa. (λx. x) a', k: '(λx. λy. x) a ((λz. z) b)' };
        let G = null, runs = [], trails = [];
        const MAXK = 14;
        const build = (src) => {
          const r = parse(src, DEFS); if (!r.ast) return;
          G = makeGraph(r.ast, { cap: 26, maxSize: 60 }); G.exploreAll();
          runs = STRATS.map((S) => runStrategy(r.ast, S.id, { max: MAXK, maxSize: 200 }));
          trails = runs.map((run) => {
            let a = G.add(run.states[0], 0); const ids = [a];
            for (let i = 0; i < run.paths.length; i++) { const b = G.add(run.states[i + 1], a.depth + 1); G.addEdge(a, b, run.paths[i]); ids.push(b); a = b; }
            return ids;
          });
        };
        const f = tf(v, 'term', EX.om, () => { build(f.src); v.invalidate(); });
        const ex = v.select('Examples', [{ value: 'om', label: '(λx.y) Ω' }, { value: 'dup', label: 'duplicated argument' }, { value: 'lam', label: 'redex under λ' }, { value: 'k', label: 'K a (I b)' }], 'om', { onChange: () => f.set(EX[ex.value]) });
        const kS = v.slider('step', 0, MAXK, 6, { step: 1, int: true });
        build(EX.om);
        v.legend(STRATS.map((S) => [S.color, S.name]));
        let hnode = null;
        const status = (run, k) => {
          if (k < run.paths.length) return { t: 'running', c: 'muted' };
          if (run.status === 'done') return redexes(run.states[run.states.length - 1]).length ? { t: 'stops at a value (redexes remain under λ)', c: 'orange' } : { t: 'normal form', c: 'green' };
          if (run.status === 'loop') return { t: 'loops forever', c: 'red' };
          return { t: `not finished after ${run.paths.length} steps`, c: 'red' };
        };
        v.render(() => {
          if (f.err) { drawParseError(v, sR, f.src, f.err); sG.textPx('fix the term', sG.W / 2, sG.H / 2, { size: 14, color: 'muted', align: 'center' }); return; }
          const k = kS.value;
          STRATS.forEach((S, i) => {
            const y = 20 + i * 34, run = runs[i], j = Math.min(k, run.paths.length);
            const st = status(run, k);
            sR.ctx.save(); sR.ctx.fillStyle = v.color(S.color, 1); rrect(sR.ctx, 14, y - 9, 6, 18, 3); sR.ctx.fill(); sR.ctx.restore();
            sR.textPx(S.name, 28, y, { size: 12.5, weight: 700, color: S.color, align: 'left', halo: false });
            const lay = layoutTerm(run.states[j], NICE);
            drawLine(v, sR, lay, 148, y, { size: 16, maxW: sR.W - 148 - 210, weight: 600 });
            sR.textPx(st.t, sR.W - 12, y, { size: 12, weight: 700, color: st.c, align: 'right', halo: false });
          });
          const ph = ptr(sG); const shown = G.nodes;
          hnode = ph ? hitBox(shown, ph.x, ph.y) : null;
          const used = new Set(); trails.forEach((tr, i) => { for (let j = 0; j < Math.min(k, runs[i].paths.length); j++) used.add(tr[j].id + '>' + tr[j + 1].id); });
          drawGraph(v, sG, G, shown, G.edges, {
            colorOf: (nd) => (nd.expanded && nd.redexes && !nd.redexes.length ? 'green' : null),
            faint: () => false, edgeAlpha: () => 0.5, edgeWidth: () => 1.2, edgeColor: () => 'muted',
            region: [0, 4, sG.W, sG.H - (hnode ? 34 : 4)], labelOf: (nd) => show(nd.term, NICE),
          });
          // coloured paths
          const ctx = sG.ctx;
          trails.forEach((tr, i) => {
            const S = STRATS[i], run = runs[i], upto = Math.min(k, run.paths.length);
            for (let j = 0; j < upto; j++) {
              const a = tr[j], b = tr[j + 1]; ctx.save(); ctx.strokeStyle = v.color(S.color, 1); ctx.fillStyle = v.color(S.color, 1); ctx.lineWidth = 2.6;
              const off = (i - 1.5) * 3.5;
              if (a === b) {
                const cx = a.px + a.pw / 2, cy = a.py, rr2 = 26 + i * 6;
                ctx.beginPath(); ctx.moveTo(cx - 2, cy - 6); ctx.bezierCurveTo(cx + rr2, cy - 28 - i * 3, cx + rr2, cy + 28 + i * 3, cx - 2, cy + 6); ctx.stroke();
              } else {
                const dx = b.px - a.px, dy = b.py - a.py, L2 = Math.hypot(dx, dy) || 1, nx = -dy / L2 * off, ny = dx / L2 * off;
                const sgn = dy >= 0 ? 1 : -1;
                const sx = a.px + nx, sy = a.py + sgn * a.ph / 2 * (Math.abs(dy) > 1 ? 1 : 0) + ny, ex = b.px + nx, ey = b.py - sgn * b.ph / 2 * (Math.abs(dy) > 1 ? 1 : 0) + ny;
                ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
                const ang = Math.atan2(ey - sy, ex - sx); ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - 8 * Math.cos(ang - 0.45), ey - 8 * Math.sin(ang - 0.45)); ctx.lineTo(ex - 8 * Math.cos(ang + 0.45), ey - 8 * Math.sin(ang + 0.45)); ctx.closePath(); ctx.fill();
              }
              ctx.restore();
            }
            const cn = tr[Math.min(k, run.paths.length)];
            ctx.save(); ctx.fillStyle = v.color(S.color, 1); ctx.strokeStyle = v.color('panel', 1); ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(cn.px - cn.pw / 2 + 5 + i * 9, cn.py - cn.ph / 2 - 2, 4.8, 0, 6.2832); ctx.fill(); ctx.stroke(); ctx.restore();
          });
          if (hnode) sG.textPx(show(hnode.term, NICE), sG.W / 2, sG.H - 16, { size: 13.5, weight: 600, color: 'ink', align: 'center', plate: true });
        });
        v.readout(() => {
          if (f.err) return 'Fix the term.';
          return STRATS.map((S, i) => { const r = runs[i]; const last = r.states[r.states.length - 1]; const st = r.status === 'done' ? `${r.paths.length} step${r.paths.length === 1 ? '' : 's'} → $${txt(last, NICE)}$` : r.status === 'loop' ? 'loops (a term repeats)' : 'no end within the step budget'; return `**${S.name}**: ${st}`; }).join(' · ');
        });
      },
    },
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6', kind: 'Method', name: 'Church booleans and pairs',
      statement: String.raw`Data can be encoded by what it does. **Booleans:** $\mathsf{true}=\lambda t\,f.\,t$ and $\mathsf{false}=\lambda t\,f.\,f$ (a boolean is a function that chooses one of its two arguments), $\mathsf{if}=\lambda b\,t\,e.\,b\,t\,e$, $\mathsf{and}=\lambda p\,q.\,p\,q\,p$, $\mathsf{or}=\lambda p\,q.\,p\,p\,q$, $\mathsf{not}=\lambda p.\,p\,\mathsf{false}\,\mathsf{true}$. **Pairs:** $\mathsf{pair}=\lambda a\,b\,f.\,f\,a\,b$, $\mathsf{fst}=\lambda p.\,p\,\mathsf{true}$, $\mathsf{snd}=\lambda p.\,p\,\mathsf{false}$. These satisfy, for all terms $a,b$: $\mathsf{if}\,\mathsf{true}\,a\,b\to^{*}_\beta a$, $\mathsf{if}\,\mathsf{false}\,a\,b\to^{*}_\beta b$, $\mathsf{fst}\,(\mathsf{pair}\,a\,b)\to^{*}_\beta a$, $\mathsf{snd}\,(\mathsf{pair}\,a\,b)\to^{*}_\beta b$, and $\mathsf{and}$, $\mathsf{or}$, $\mathsf{not}$ reduce to $\mathsf{true}/\mathsf{false}$ according to their truth tables when applied to booleans.`,
      idea: String.raw`In a calculus whose only objects are functions, a datum is represented by its behaviour: a boolean is the choice it makes, a pair is the way it hands its two components to whatever consumer is applied to it. Conditional is then application, and the connectives are programs that route the two selectors: $\mathsf{and}\,p\,q$ is “$p$ ? $q$ : $p$”, written $p\,q\,p$. Each law is a two- or three-step β-computation (2.4); no new primitive is needed.`,
      caption: String.raw`Type any expression in True/False/If/And/Or/Not/Xor/Pair/Fst/Snd (free letters such as a, b are allowed) and drag “step” through its normal-order reduction; the contracted redex is shaded. The table on the right is computed by actually reducing the chosen connective on all four inputs, with the number of β-steps in each cell.`,
      deps: ['pl-2.4'], refs: ['Pierce §5.2'], tags: ['encoding', 'data'],
      credit: 'Alonzo Church, 1930s',
      viz(v) {
        const sT = pxStage(v, { height: 250, minWidth: 380, weight: 1.4, title: 'Normal-order reduction trace' });
        const sB = pxStage(v, { height: 250, minWidth: 260, title: 'Truth table, by reduction' });
        const EX = { and: 'And True False', or: 'Or False True', not: 'Not (And True True)', ite: 'If (Or False True) a b', fst: 'Fst (Pair a (Snd (Pair b c)))', xor: 'Xor True False' };
        let run = null;
        const compute = () => { if (f.ast) run = runStrategy(f.ast, 'normal', { max: 60, maxSize: 600 }); };
        const f = tf(v, 'expression', EX.and, () => { compute(); kS.set(Math.min(30, run ? run.paths.length : 0)); v.invalidate(); }, 300);
        const ex = v.select('Examples', [{ value: 'and', label: 'And' }, { value: 'or', label: 'Or' }, { value: 'not', label: 'Not' }, { value: 'ite', label: 'If' }, { value: 'fst', label: 'pairs' }, { value: 'xor', label: 'Xor' }], 'and', { onChange: () => f.set(EX[ex.value]) });
        const kS = v.slider('step', 0, 30, 4, { step: 1, int: true });
        const op = v.select('Table of', [{ value: 'And', label: 'And' }, { value: 'Or', label: 'Or' }, { value: 'Xor', label: 'Xor' }, { value: 'Imp', label: 'Imp' }, { value: 'Nand', label: 'Nand' }], 'And');
        const LOCAL = { ...DEFS }; LOCAL.Imp = P('λp q. Or (Not p) q', LOCAL); LOCAL.Nand = P('λp q. Not (And p q)', LOCAL);
        compute();
        v.render(() => {
          if (f.err) { drawParseError(v, sT, f.src, f.err); }
          else {
            const k = Math.min(kS.value, run.paths.length);
            drawTrace(v, sT, run, k, { abbr: { names: true } });
            sT.textPx(k === run.paths.length ? (run.status === 'done' ? 'normal form' : 'budget exhausted') : `step ${k} of ${run.paths.length}`, sT.W - 10, sT.H - 10, { size: 11.5, color: 'muted', align: 'right', weight: 700 });
          }
          // truth table
          const name = op.value, X0 = 26, rowH = 46, y0 = 52;
          const cell = (p, q) => { const t = A(A(LOCAL[name], p), q); const r = normalize(t, 400); return { b: boolOf(r.t), n: r.steps }; };
          const heads = ['p', 'q', name + ' p q', 'β-steps'];
          const cx = [X0 + 14, X0 + 60, X0 + 158, X0 + 242].map((x) => x * Math.min(1, sB.W / 340));
          heads.forEach((h, i) => sB.textPx(h, cx[i], y0 - 26, { size: 12.5, weight: 700, color: 'muted', align: 'center', halo: false }));
          let k = 0;
          for (const p of [true, false]) for (const q of [true, false]) {
            const r = cell(p ? DEFS.True : DEFS.False, q ? DEFS.True : DEFS.False), y = y0 + 12 + k * rowH * 0.78;
            sB.ctx.save(); sB.ctx.fillStyle = v.color(r.b ? 'green' : 'muted', r.b ? 0.18 : 0.1); rrect(sB.ctx, cx[2] - 38, y - 15, 76, 30, 8); sB.ctx.fill(); sB.ctx.restore();
            sB.textPx(p ? 'T' : 'F', cx[0], y, { size: 16, weight: 700, color: p ? 'green' : 'muted', align: 'center', halo: false });
            sB.textPx(q ? 'T' : 'F', cx[1], y, { size: 16, weight: 700, color: q ? 'green' : 'muted', align: 'center', halo: false });
            sB.textPx(r.b === null ? '?' : r.b ? 'True' : 'False', cx[2], y, { size: 15, weight: 700, color: r.b ? 'green' : 'ink', align: 'center', halo: false });
            sB.textPx(String(r.n), cx[3], y, { size: 14, weight: 600, color: 'accent', align: 'center', halo: false });
            k++;
          }
          const defn = { And: 'λp q. p q p', Or: 'λp q. p p q', Xor: 'λp q. p (Not q) q', Imp: 'λp q. Or (Not p) q', Nand: 'λp q. Not (And p q)' }[name];
          sB.textPx(`${name} = ${defn}`, sB.W / 2, sB.H - 22, { size: 14, weight: 600, color: 'ink', align: 'center', halo: false });
        });
        v.readout(() => {
          if (f.err || !run) return 'Not a term.';
          const last = run.states[run.states.length - 1], k = Math.min(kS.value, run.paths.length), at = run.states[k];
          return `Result after ${run.status === 'done' ? run.paths.length : '≥' + run.paths.length} step${run.paths.length === 1 ? '' : 's'}: **${decode(last)}**` + (k < run.paths.length ? ` · current term: $${txt(at, { abbr: { names: true } })}$` : '');
        });
      },
    },
  ],
};
