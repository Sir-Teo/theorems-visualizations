// Big History & Quantitative History — Chapter 3, part b: items 3.6–3.10
//
// Sources checked (Oct 2026):
//   3.6 Actual North1980 NASApreprint/Gough1981/Myhre1998/Hoffman1998 bodies and source pixels compared.
//     See docs/verification/bighist-snowball-followup.md; retained flag pending independent acceptance.
//   3.7 Dates are rounded from the ICS chart and the cited literature: base of the Cambrian 538.8 +- 0.6 Ma (Linnemann et al.,
//     2019), Cloudina about 550-543 Ma (Grotzinger et al., 1995), first trilobites about 521 Ma, Chengjiang about 518 Ma, Burgess
//     Shale about 508 Ma, Mistaken Point about 574 Ma (all checked only to the stated rounding). Trigger windows are broad
//     literature ranges (Marshall, Annu. Rev. Earth Planet. Sci. 34: 355, 2006) and drawn as such.
//   3.8 Actual Raup1982 original, Barnosky2011 Table1 and Kirchner2000 primary/relevant supplement read.
//     Independently accepted; see docs/verification/bighist-extinction-peer.md.
//   3.9/3.10 Actual original Alvarez1980, Collins2005 and Renne2013 source equations/tables checked.
//     Sources, finite model/state limits and evidence: docs/verification/bighist-impact-followup.md.
//     Both impact entries independently accepted; source/model scope remains explicit.


import { clamp } from './ch03.shared.js';
import snowballItem from './snowball-item.js';
import {impactEvent,impactPaper} from './impact-items.js';
import extinctionItem from './extinction-item.js';

export default {
  collection: 'bighist',
  chapter: 3,
  items: [
    snowballItem,
    // ───────────────────────────────────────────────────────────────────────────────────── 3.7
    {
      num: '3.7',
      kind: 'Event',
      name: 'The Cambrian explosion',
      statement: String.raw`In the geological moment between about $539$ and $515$ million years ago the fossil record shows the first appearance of most of the major animal body plans, with mineralised skeletons, eyes, shells, burrowing and complex food webs; the soft-bodied Ediacaran biota that preceded it (about $574$–$539$ Ma) were mostly different. The *explosion* is fast on geological scales (a few tens of millions of years) but not instantaneous, and molecular clocks suggest that the animal lineages themselves began to diverge much earlier, perhaps in the Cryogenian, so part of the “explosion” is the first fossilisation of existing groups.

Proposed triggers, which are not exclusive: a rise in oxygen, the evolution of predation and an arms race, the origin of developmental gene networks, and the changes in ocean chemistry after Snowball Earth. None is accepted as the cause.`,
      idea: String.raw`An abrupt change in a record does not need an abrupt cause. If the growth of diversity is switched on by a condition that is slowly approached, such as oxygen passing the level needed for large, active animals, or predators arriving so that skeletons pay off, the response can look like a step: diversity grows exponentially, then saturates. The toy model below makes this explicit with a gate that opens over a chosen interval. The dated picture on the left shows how the candidate triggers line up with the rocks. Fossil preservation, first appearances in particular places, and the dating of boundaries make the observed timing uncertain.`,
      caption: String.raw`Left: dated fossil events (Ma, with the Cambrian time scale running left to right) and, with the toggles, the windows in which the proposed triggers are thought to have operated (broad literature ranges). Right: a toy model, not data: a diversity that grows logistically once a gate opens at the date you choose, over the width you choose. Narrow the gate or raise the growth rate and the rise sharpens, but a slow gate gives a gradual rise.`,
      deps: ['bighist-3.5'],
      see: ['bighist-3.4', 'bighist-3.6', 'bighist-3.8'],
      refs: ['Christian'],
      credit: 'recognised from the 19th century (Darwin’s “Origin of Species” puzzle); explored by Marshall, 2006, and many others',
      tags: ['animals', 'diversification'],
      scope: String.raw`The toy model has one rate and one gate; it illustrates how a slow condition can produce a sudden-looking rise, not what happened.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cambrian_explosion' },
      verify: true,
      viz(v) {
        const tg = [
          v.toggle('oxygenation (800–540 Ma)', true), v.toggle('predation and arms race (550–500 Ma)', false), v.toggle('gene toolkit (850–600 Ma)', false),
        ];
        const tauS = v.slider('gate opens (Ma ago)', 500, 580, 540, { step: 1 });
        const wS = v.slider('gate width (Myr)', 2, 60, 12, { step: 1 });
        const rS = v.slider('growth rate (per Myr)', 0.05, 0.6, 0.3, { step: 0.01 });
        const A = v.stage({ x: [-600, -495], y: [-0.8, 10.5], axes: false, height: 330, title: 'fossil events and proposed trigger windows' });
        const B = v.stage({ x: [-600, -495], y: [0, 1.05], axes: 'box', gutter: true, height: 330, xlabel: 'time (Ma ago, negative)', ylabel: 'diversity / saturation', title: 'toy model: a gate switches growth on' });
        const ev = [[-574, 'Mistaken Point', 6.6], [-546, 'Cloudina', 8.2], [-538.8, 'base of the Cambrian', 9.4], [-521, 'trilobites', 6.6], [-518, 'Chengjiang', 8.2], [-508, 'Burgess Shale', 9.4]];
        const win = [[-800, -540, 'teal', 'oxygenation'], [-550, -500, 'orange', 'predation'], [-850, -600, 'purple', 'gene toolkit']];
        v.render(() => {
          A.line(-600, 1.2, -495, 1.2, { color: 'muted', width: 1.2 });
          for (let t = -580; t <= -500; t += 20) { A.line(t, 1.0, t, 1.4, { color: 'muted', width: 1 }); A.text(String(-t), t, 0.6, { size: 10.5, color: 'muted', align: 'center', baseline: 'top' }); }
          A.text('Ma ago', -497, -0.4, { size: 10.5, color: 'muted', align: 'right', baseline: 'middle' });
          A.vband(-571, -539, { color: 'faint', alpha: 0.1, edges: false }); A.text('Ediacaran biota', -569, 2.3, { size: 10.5, color: 'muted', align: 'left' });
          A.vband(-538.8, -515, { color: 'pink', alpha: 0.15, edges: false }); A.text('the “explosion”', -536.6, 2.3, { size: 10.5, color: 'pink', align: 'left' });
          win.forEach(([a, b, col, lab], k) => { if (!tg[k].value) return; const y = 3.2 + 0.7 * k; A.rect(Math.max(a, -600), y - 0.25, Math.min(b, -495), y + 0.25, { fill: col, fillAlpha: 0.35, color: col, width: 1.2, radius: 3 }); A.text(lab + (a < -600 ? ' ← earlier' : ''), Math.max(a, -600) + 1.5, y, { size: 10, color: 'ink', align: 'left', baseline: 'middle' }); });
          for (const [t, lab, y] of ev) { A.line(t, 1.2, t, y - 0.3, { color: 'ink', width: 1, alpha: 0.5 }); A.dot(t, 1.2, { r: 4, color: 'ink' }); A.text(lab, t, y, { size: 10.5, color: 'ink', align: 'center', baseline: 'middle' }); }
          const tau = -tauS.value, w = wS.value, r = rS.value, dt = 0.25, pts = [], gp = [];
          let N = 1e-4;
          for (let t = -600; t <= -495; t += dt) {
            const g = clamp((t - (tau - w / 2)) / w, 0, 1), gate = g * g * (3 - 2 * g);
            N += dt * r * gate * N * (1 - N); pts.push([t, N]); gp.push([t, gate]);
          }
          B.path(gp, { color: 'orange', width: 1.5, dash: [4, 3], alpha: 0.8 });
          B.path(pts, { color: 'accent', width: 2.8 });
          B.vband(-538.8, -515, { color: 'pink', alpha: 0.12, edges: false });
          v.legend([['accent', 'diversity (model)'], ['orange', 'gate', { dash: true }], ['pink', 'the “explosion” interval']]);
        });
        v.readout(() => {
          const tau = -tauS.value, w = wS.value, r = rS.value, dt = 0.05; let N = 1e-4, t10 = null, t90 = null;
          for (let t = -600; t <= -495; t += dt) { const g = clamp((t - (tau - w / 2)) / w, 0, 1), gate = g * g * (3 - 2 * g); N += dt * r * gate * N * (1 - N); if (t10 === null && N > 0.1) t10 = t; if (t90 === null && N > 0.9) t90 = t; }
          const dur = t10 !== null && t90 !== null ? `${v.fix(t90 - t10, 1)} Myr from 10% to 90%` : 'no full rise in this window';
          return `Model: ${dur} (a logistic with no gate needs ln 81 / r = ${v.fix(Math.log(81) / r, 1)} Myr). Fossil record: base of the Cambrian 538.8 Ma, trilobites ≈ 521 Ma, Chengjiang ≈ 518 Ma.\nThe trigger windows are broad and uncertain; molecular clocks put animal origins well before the Cambrian.`;
        });
      },
    },
    extinctionItem,
    impactEvent,
    impactPaper,
  ],
};
