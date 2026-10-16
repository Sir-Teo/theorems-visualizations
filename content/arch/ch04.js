// Architecture & Structural Form — Chapter 4: Vaults and domes (items 4.1–4.5; 4.6–4.11 are in ch04-b.js)
//
// Sources checked (Oct 2026):
//   Membrane theory of a spherical shell under its own weight: vertical equilibrium of the cap above the cut gives the meridional force
//   N_phi = -w a / (1 + cos phi); the normal equilibrium gives N_theta = w a (1/(1 + cos phi) - cos phi); N_theta = 0 at
//   cos phi (1 + cos phi) = 1, i.e. cos phi = (sqrt5 - 1)/2, phi = 51.83° (51°49'). This is the classical result (Timoshenko & Woinowsky-Krieger,
//   Flügge); the sign change and its dependence on the thickness profile are discussed by Rapallini (1997) and in Sajtos et al. (2019) according
//   to a literature search (Penn State "Geometry of the crack-free spherical masonry dome"; Princeton CASCE "Spherical domes II").
//   For a vertical load p per unit PLAN area: N_phi = -p a / 2, N_theta = -(p a / 2) cos 2 phi.
//   Everything is recomputed numerically from vertical and radial equilibrium (see ch04.shared.js: membrane()).
//   Cracked domes as sliced arches: Heyman, The Stone Skeleton (CUP 1995) and "Equilibrium of shell structures" (OUP 1977) — cited at book level;
//   the thrust-line check of a gore is computed with the chapter 3 engine, not copied from a table.
//   Groin and rib vaults: load model (webs lean on the groins) derived and integrated numerically in ch04.shared.js: crossVault();
//   it is an idealisation, labelled as such in each item.

import { crossVault, domeSlice, sphereMid, profile, membrane, hoopZero, deg, archFromLine, bestFit, centralLine, thrustLine, thrustRange, thrustLP, hinges, drawThrust, clamp, f2, placeLabels, blockAt } from './ch04.shared.js';

const kN = (x, d = 3) => `${Math.abs(x) < 0.05 ? 0 : x.toLocaleString('en-US', { maximumSignificantDigits: d })} kN`;

export default {
  collection: 'arch',
  chapter: 4,
  title: 'Vaults and domes',
  summary: String.raw`Vaults extend the arch into space, and domes extend it around a vertical axis. A dome carries load by meridional compression and by hoop forces that turn to tension low down, which is why masonry domes crack along meridians and why their builders used chains, rings and thickened haunches. From the Pantheon to Brunelleschi to modern thrust-network analysis, the same equilibrium reasoning applies.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 4.1
    {
      num: '4.1',
      kind: 'Concept',
      name: 'Barrel and groin vaults',
      statement: String.raw`A **barrel vault** is an arch extruded along a line: every slice across it is the same arch, so its weight and its horizontal thrust arrive on the two walls as a *continuous* line load, and the walls may not be opened. A **groin (cross) vault** is the intersection of two barrel vaults of equal height at right angles, keeping only the lower surface where they cross. The four webs meet along two diagonal curves, the groins. Each web is a set of short arches that lean on the groins, so the weight of the vault is gathered into the groins and carried to the four corner piers as *concentrated* forces, each with an outward diagonal thrust. The walls between the piers carry almost nothing from the vault and can be opened up.`,
      idea: String.raw`Cut a barrel vault into slices and each slice is an arch (arch-3.2) whose reactions go straight to the wall below. In a groin vault a slice of one web stops at the groin, so it cannot reach the wall: it presses on the groin, which is itself an arch whose span is the diagonal of the bay (the funicular argument of arch-1.5 gives its thrust). The load along the groin is largest at the crown and dies out at the springing, because the slices there are short. The thrust of the groin arch sits in the vertical plane of the diagonal, so it leaves the pier at 45° to the walls. The price of freeing the walls is that the piers and the buttressing behind them must be strong and must be exactly where the groins land.`,
      caption: String.raw`Switch between **barrel** and **groin**, and add bays. The plan shows where the vault's weight lands: a band of load along the full length of both walls for the barrel, circles at the four (or $2n+2$) piers for the groin, with the diagonal thrust drawn as arrows. Open up the walls with the slider: for the barrel the load concentrates on what remains of the wall, for the groin nothing changes. The vault is a semicircular one of radius 3 m and thickness 0.3 m, with unit weight 22 kN/m³; the numbers are illustrative.`,
      deps: ['arch-3.2'],
      see: ['arch-4.2'],
      tags: ['vaults', 'load path'],
      refs: ['Heyman'],
      scope: String.raw`Idealised statics: each web is cut into slices that lean on the groin, the groin is a semi-elliptical arch with its thrust line through the crown, and the walls carry only the weight of the webs they directly support (neglected). Real vaults lie between this and a full shell analysis (arch-4.11).`,
      credit: 'Roman concrete vaulting (groin vaults widely used in imperial Roman buildings)',
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Groin_vault' },
      viz(v) {
        const R = 3, T = 0.3, GAM = 22, HW = 2.4, cv = crossVault(R, T, GAM);
        const kind = v.select('vault', [{ value: 'barrel', label: 'barrel vault' }, { value: 'groin', label: 'groin vault' }], 'groin');
        const nb = v.slider('bays along the nave', 1, 3, 2, { int: true });
        const open = v.slider('wall openings (share of wall length)', 0, 0.8, 0, { step: 0.05 });
        const S3 = v.stage({ x: [-2, 2], y: [-1.5, 1.7], equal: true, axes: false, height: 380, weight: 1.25, title: 'the vault in space' });
        const sc = v.scene3(S3, { yaw: -0.75, pitch: 0.42, axes: false });
        const PL = v.stage({ x: [-2, 20], y: [-6.2, 6.2], equal: true, axes: false, height: 300, weight: 1, minWidth: 300, title: 'plan: where the weight lands' });
        let info = {};
        v.render(() => {
          const n = nb.value, g = kind.value === 'groin', k = 1 / (R * (0.55 + 0.45 * n)) * 1.05, cxm = n * R;
          const P = (x, y, z) => [(x - cxm) * k, y * k, (z - 0.15 * R) * k];
          const zf = (x, y) => (g ? Math.min(Math.sqrt(Math.max(0, R * R - (x - R) ** 2)), Math.sqrt(Math.max(0, R * R - y * y))) : Math.sqrt(Math.max(0, R * R - y * y)));
          const M = 14;
          sc.begin();
          // floor and walls
          sc.poly([P(0, -R, -HW), P(2 * R * n, -R, -HW), P(2 * R * n, R, -HW), P(0, R, -HW)], { fill: 'muted', fillAlpha: 0.06, color: 'faint', width: 1 });
          for (const sy of [-1, 1]) for (let b = 0; b < n; b++) {
            const x0 = 2 * R * b, x1 = x0 + 2 * R, w = open.value * 2 * R, xa = x0 + R - w / 2, xb = x0 + R + w / 2, z0 = -HW, z1 = 0;
            const wall = (a, c, lo, hi) => sc.poly([P(a, sy * R, lo), P(c, sy * R, lo), P(c, sy * R, hi), P(a, sy * R, hi)], { fill: 'muted', fillAlpha: 0.12, color: 'muted', width: 0.8, alpha: 0.5 });
            if (w < 0.01) wall(x0, x1, z0, z1);
            else { wall(x0, xa, z0, z1); wall(xb, x1, z0, z1); wall(xa, xb, z0, z0 + 0.25 * HW); wall(xa, xb, z1 - 0.25 * HW, z1); }
          }
          // vault surface
          for (let b = 0; b < n; b++) for (let i = 0; i < M; i++) for (let j = 0; j < M; j++) {
            const x0 = 2 * R * b + (2 * R * i) / M, x1 = x0 + (2 * R) / M, y0 = -R + (2 * R * j) / M, y1 = y0 + (2 * R) / M;
            const xl = (x) => x - 2 * R * b, f = (x, y) => zf(xl(x), y);
            const xm = (x0 + x1) / 2 - 2 * R * b - R, ym = (y0 + y1) / 2;
            const web = g && Math.abs(xm) > Math.abs(ym);
            sc.poly([P(x0, y0, f(x0, y0)), P(x1, y0, f(x1, y0)), P(x1, y1, f(x1, y1)), P(x0, y1, f(x0, y1))], { fill: g ? (web ? 'accent' : 'orange') : 'accent', fillAlpha: 0.2 + ((i + j) % 2) * 0.07, edge: true, color: g ? (web ? 'accent' : 'orange') : 'accent', alpha: 0.35, width: 0.7 });
          }
          if (g) for (let b = 0; b < n; b++) for (const sg of [-1, 1]) {
            const pts = Array.from({ length: 41 }, (_, i) => { const s = -R + (2 * R * i) / 40; return P(2 * R * b + R + s, sg * s, Math.sqrt(Math.max(0, R * R - s * s))); });
            sc.path(pts, { color: 'red', width: 2.4 });
          }
          for (let b = 0; b <= n; b++) for (const sy of [-1, 1]) sc.line(P(2 * R * b, sy * R, 0), P(2 * R * b, sy * R, -HW), { color: 'ink', width: 3.2 }, 1);
          sc.flush();
          // plan
          const adj = (b) => (b === 0 || b === n ? 1 : 2);
          const pierV = (b) => adj(b) * cv.pier, wallW = (cv.Wbarrel / 2) / (2 * R) / (1 - open.value);
          PL.setView([-2.2, 6 * n + 2.2], [-6.2, 6.2]);
          for (let b = 0; b < n; b++) PL.rect(2 * R * b, -R, 2 * R * b + 2 * R, R, { color: 'muted', fill: 'muted', fillAlpha: 0.05, width: 1 });
          for (let b = 0; b <= n; b++) for (const sy of [-1, 1]) PL.rect(2 * R * b - 0.28, sy * R - 0.28, 2 * R * b + 0.28, sy * R + 0.28, { fill: 'ink', fillAlpha: 0.22, color: 'ink' });
          if (g) {
            for (let b = 0; b < n; b++) for (const sg of [-1, 1]) PL.line(2 * R * b, -sg * R, 2 * R * b + 2 * R, sg * R, { color: 'red', width: 1.6, alpha: 0.75 });
            const arrowScale = 1 / 60;
            for (let b = 0; b <= n; b++) for (const sy of [-1, 1]) {
              const px = 2 * R * b, py = sy * R;
              let fx = 0, fy = 0;
              for (let c = 0; c < n; c++) { const cx = 2 * R * c + R; if (Math.abs(cx - px) <= R + 1e-9) { const dx = px - cx, dy = py, d = Math.hypot(dx, dy); fx += (cv.Hd * dx) / d; fy += (cv.Hd * dy) / d; } }
              PL.circle(px, py, 0.16 * Math.sqrt(pierV(b) / 100) * 1.3, { fill: 'accent', fillAlpha: 0.35, color: 'accent', width: 1.6 });
              PL.arrow(px, py, px + fx * arrowScale * 1.3, py + fy * arrowScale * 1.3, { color: 'orange', width: 2.4, head: 8 });
              PL.text(`${Math.round(pierV(b))}`, px, py - sy * 1.15, { size: 11, color: 'accent', align: 'center' });
            }
          } else {
            const sc2 = 0.045;
            for (const sy of [-1, 1]) for (let b = 0; b < n; b++) {
              const x0 = 2 * R * b, w = open.value * 2 * R, segs = w < 0.01 ? [[x0, x0 + 2 * R]] : [[x0, x0 + R - w / 2], [x0 + R + w / 2, x0 + 2 * R]];
              for (const [a, c] of segs) PL.rect(a, sy * R, c, sy * R + sy * wallW * sc2 * 1.0, { fill: 'accent', fillAlpha: 0.35, color: 'accent', width: 1.2 });
              if (w >= 0.01) PL.line(x0 + R - w / 2, sy * R, x0 + R + w / 2, sy * R, { color: 'faint', dash: [3, 3] });
              for (const xa of [x0 + 0.5 * R, x0 + 1.5 * R]) PL.arrow(xa, sy * R, xa, sy * (R + cv.Hbarrel * 0.07), { color: 'orange', width: 1.8, head: 6 });
            }
            PL.text(`${f2(wallW, 1)} kN/m`, 6 * n / 2, R + 2.9, { size: 12, color: 'accent', align: 'center' });
          }
          info = { wallW, pierMax: Math.max(...Array.from({ length: n + 1 }, (_, b) => pierV(b))), n, g };
          v.legend(g ? [['accent', 'webs of one family'], ['orange', 'webs of the other'], ['red', 'groins'], ['accent', 'pier load, kN (circles); thrust (arrows)', { dot: true }]] : [['accent', 'wall load, kN/m', { area: true }], ['orange', 'thrust']]);
        });
        v.readout(() => info.g
          ? `Groin vault, ${info.n} bay(s) of $6\\times6$ m: the vault weighs ${kN(cv.Wgroin)} per bay and all of it reaches the **piers**: ${kN(cv.pier)} per bay-corner (interior piers serve two bays, up to ${kN(info.pierMax)}). Each groin delivers a thrust of ${kN(cv.Hd)} at 45° to the walls. Wall load from the vault: **0 kN/m**, so any opening is free.`
          : `Barrel vault, ${info.n} bay(s): the vault weighs ${kN(cv.Wbarrel)} per bay and loads each wall with **${f2(info.wallW, 1)} kN/m** over the whole length (more where the wall is opened), with a continuous thrust of ${f2(cv.Hbarrel, 1)} kN/m pushing the walls outward.`);
      },
    },

    // ───────────────────────────────────────────────────────────────────────────────────── 4.2
    {
      num: '4.2',
      kind: 'Concept',
      name: 'Rib vaults and the Gothic skeleton',
      statement: String.raw`A **rib vault** is a groin vault in which the groins, and usually the arches along the edges of the bay, are built as separate stone arches (ribs) first, and the surfaces between them (the webs or severies) are laid afterwards as a thin infill. The webs can then be thin and light, because they only have to span between ribs; the ribs carry the weight and thrust of the whole vault down to the piers as a **skeleton** of arches. Since the loads arrive at the piers only at the rib springings, the walls between piers need not carry the vault, and in Gothic churches the thrust of the nave vault is then taken by flying buttresses (arch-3.10) placed at the pier heads.`,
      idea: String.raw`The statics is that of arch-4.1: the web is a set of slices leaning on the diagonal ribs, which are arches (arch-3.2) loaded by the web and by their own weight. Thinning the web reduces the load on the rib much faster than a deeper rib adds weight, so a rib needs a section only a fraction of the vault's thickness. Because ribs and webs are different structural elements, the ribs can be built first on timber centering and the webs laid on them with little formwork. The skeleton reading of Gothic architecture, in which every stone has a structural job, goes back to nineteenth-century writers such as Viollet-le-Duc; historians now argue about how far medieval builders thought this way, so treat it as a description of the statics, not of intentions.`,
      caption: String.raw`The left panel is one bay with its ribs; switch **webs in place** off to lift the infill and see the skeleton alone. The right panel is the diagonal rib as an arch, loaded by the web slices that lean on it (blue arrows) and by its own weight, with its most central thrust line (red). Thicken the web and the rib must become deeper to contain the line; thin the web, or remove it, and a very slim rib suffices. All sizes are illustrative (bay $6\times6$ m, rib width 0.3 m, unit weight 22 kN/m³).`,
      deps: ['arch-4.1', 'arch-3.10'],
      see: ['arch-3.5', 'arch-3.9'],
      tags: ['gothic', 'ribs'],
      refs: ['Heyman'],
      scope: String.raw`The same slice model as arch-4.1: the web leans on the diagonal rib only (the edge ribs and the wall are neglected), the rib is a plane arch with radial joints under vertical loads, no sliding.`,
      credit: 'rib vaults developed in the late 11th–12th centuries (for example at Durham Cathedral, begun 1093) and spread through Gothic architecture',
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Rib_vault' },
      viz(v) {
        const R = 3, GAM = 22, bw = 0.3, Nb = 24;
        const web = v.toggle('webs in place', true);
        const tw = v.slider('web thickness (m)', 0.08, 0.5, 0.2, { step: 0.01 });
        const dr = v.slider('rib depth (m)', 0.08, 0.6, 0.3, { step: 0.01 });
        const S3 = v.stage({ x: [-1.7, 1.7], y: [-1.2, 1.5], equal: true, axes: false, height: 330, weight: 1, minWidth: 280, title: 'one bay: ribs and webs' });
        const sc = v.scene3(S3, { yaw: -0.7, pitch: 0.38, axes: false });
        const A = v.stage({ x: [-4.9, 4.9], y: [-0.7, 3.7], equal: true, axes: false, height: 330, weight: 1.15, minWidth: 320, title: 'the diagonal rib as an arch' });
        const pts = Array.from({ length: Nb + 1 }, (_, k) => { const s = -R + (2 * R * k) / Nb; return [Math.SQRT2 * s, Math.sqrt(Math.max(0, R * R - s * s))]; });
        const sAt = (k) => -R + (2 * R * k) / Nb;
        const webLoad = (t) => Array.from({ length: Nb }, (_, k) => {
          let P = 0; const m = 10;
          for (let i = 0; i < m; i++) { const s = sAt(k) + ((sAt(k + 1) - sAt(k)) * (i + 0.5)) / m; P += 2 * GAM * t * R * Math.acos(Math.min(1, Math.abs(s) / R)) * ((sAt(k + 1) - sAt(k)) / m); }
          return P;
        });
        let M = null;
        const model = () => {
          const t = web.value ? tw.value : 0, WL = webLoad(t), mk = (d) => archFromLine(pts, d, GAM * bw);
          const g = mk(dr.value), loads = WL.map((P, k) => ({ x: (pts[k][0] + pts[k + 1][0]) / 2, P, k })).filter((l) => l.P > 0);
          const c = centralLine(g, loads), fit = bestFit(mk, () => loads, {}, 0.005, 2, 22);
          const u = c ? c.u : fit ? fit.u : [1, 1, 0], tl = thrustLine(g, loads, u);
          const Wweb = WL.reduce((a, b) => a + b, 0);
          return { g, loads, tl, ok: !!c, eps: c ? c.eps : 0, dmin: fit ? fit.t : NaN, Wweb, Wrib: g.W, u, WL };
        };
        v.render(() => {
          const m = M = model();
          // skeleton in space
          const k = 0.5 / R, P = (x, y, z) => [(x - R) * k * 1.3, y * k * 1.3, (z - 0.35 * R) * k * 1.3];
          sc.begin();
          sc.poly([P(0, -R, -1.2), P(2 * R, -R, -1.2), P(2 * R, R, -1.2), P(0, R, -1.2)], { fill: 'muted', fillAlpha: 0.05, color: 'faint', width: 1 });
          if (web.value) {
            const G = 12;
            for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
              const x0 = (2 * R * i) / G, x1 = x0 + (2 * R) / G, y0 = -R + (2 * R * j) / G, y1 = y0 + (2 * R) / G;
              const z = (x, y) => Math.min(Math.sqrt(Math.max(0, R * R - (x - R) ** 2)), Math.sqrt(Math.max(0, R * R - y * y)));
              const web1 = Math.abs((x0 + x1) / 2 - R) > Math.abs((y0 + y1) / 2);
              sc.poly([P(x0, y0, z(x0, y0)), P(x1, y0, z(x1, y0)), P(x1, y1, z(x1, y1)), P(x0, y1, z(x0, y1))], { fill: web1 ? 'accent' : 'orange', fillAlpha: 0.12 + 0.5 * tw.value * ((i + j) % 2 ? 0.8 : 1), edge: false });
            }
          }
          const rib = (arr, w, c) => sc.path(arr, { color: c, width: w });
          for (const sg of [-1, 1]) rib(Array.from({ length: 41 }, (_, i) => { const s = -R + (2 * R * i) / 40; return P(R + s, sg * s, Math.sqrt(Math.max(0, R * R - s * s))); }), 1.6 + dr.value * 7, 'red');
          for (const x of [0, 2 * R]) rib(Array.from({ length: 31 }, (_, i) => { const y = -R + (2 * R * i) / 30; return P(x, y, Math.sqrt(Math.max(0, R * R - y * y))); }), 1.4 + dr.value * 4, 'ink');
          for (const y of [-R, R]) rib(Array.from({ length: 31 }, (_, i) => { const x = (2 * R * i) / 30; return P(x, y, Math.sqrt(Math.max(0, R * R - (x - R) ** 2))); }), 1.4 + dr.value * 4, 'ink');
          for (const x of [0, 2 * R]) for (const y of [-R, R]) sc.line(P(x, y, 0), P(x, y, -1.2), { color: 'ink', width: 3.4 }, 1);
          sc.flush();
          // the diagonal rib
          const g = m.g;
          g.blocks.forEach((b, i) => A.poly(b.poly, { fill: 'red', fillAlpha: 0.14 + (i % 2) * 0.07, color: 'ink', width: 0.8, alpha: 0.8 }));
          drawThrust(v, A, m.tl, { color: 'green', bad: 'orange', width: 2.6 });
          m.loads.forEach((l) => { const y = (pts[l.k][1] + pts[l.k + 1][1]) / 2 + 0.2, len = 0.05 + 0.03 * l.P; A.arrow(l.x, y + len, l.x, y + 0.03, { color: 'accent', width: 1.6, head: 5, alpha: 0.85 }); });
          for (const x of [-R * Math.SQRT2, R * Math.SQRT2]) A.dot(x, 0, { r: 5, color: 'ink' });
          v.legend([['red', 'rib (diagonal)'], ['green', 'thrust line'], ['accent', 'web load on the rib']]);
        });
        v.readout(() => {
          const m = M, tot = m.Wweb + m.Wrib, st = m.ok ? `the rib **stands**: the line keeps ${f2(m.eps, 3)} m from the nearest edge` : `the rib **cannot contain** any thrust line: it needs depth $\\ge ${f2(m.dmin, 2)}$ m`;
          return `Web ${web.value ? `${f2(tw.value, 2)} m thick` : 'lifted off'}: the diagonal rib carries ${kN(m.Wweb)} of web plus its own ${kN(m.Wrib)} (rib = ${f2((100 * m.Wrib) / tot, 0)}% of the load). With depth ${f2(dr.value, 2)} m, ${st}; the smallest sufficient depth is $d_{\\min} = ${f2(m.dmin, 2)}$ m. Springing reaction: $H = ${f2(m.u[0], 1)}$ kN, $V = ${f2(m.u[1], 1)}$ kN.`;
        });
      },
    },
  ],
};
