// Big History & Quantitative History — Chapter 3: Life on Earth (items 3.1–3.5; 3.6–3.10 are in ch03-b.js)
//
// Sources checked (Oct 2026):
//   3.1 Actual Miller1953 report, Johnson2008 fullmain+SOM/TableS1 and NASA CP2276 printed50 audited; see private source report.
//   3.2 Dated primary claims and bounded original-abstract access; authored ordinal sensitivity matrix. See private audit report.
//   3.3 Actual1977/1990 originals and2024dated methods/Fig1 audited; posterior/soft-calibration limits explicit.
//   3.4 Actual2000original,2004authorabstract,2018regional MIF persistence and2014review source/sink sections audited; private report retains access/proxy/model limits.
//   3.5 Actual bounded Sagan1967/Andersson1998/Nierman2001/Rath2021 and versioned RefSeq counts.
//     Protein-coding versus inclusive gene units and nuclear catalogue versus ancestral loss distinguished.

import millerEvent from './source-audit-miller.js';
import originsHypothesis from './source-audit-origins.js';
import lucaEvent from './source-audit-luca.js';
import goeEvent from './source-audit-goe.js';
import endosymbiosisItem from './endosymbiosis-item.js';

export default {
  collection: 'bighist',
  chapter: 3,
  title: 'Life on Earth',
  summary: String.raw`Life appeared on Earth within a billion years of its formation, by routes still debated. For most of its history it was microbial, yet microbes oxidised the atmosphere and, by merging, built the complex cells from which plants and animals came. Animal life diversified rapidly in the Cambrian, and five mass extinctions, at least one caused by an asteroid, repeatedly reset the board.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 3.1
    millerEvent,
    // ───────────────────────────────────────────────────────────────────────────────────── 3.2
    originsHypothesis,
    // ───────────────────────────────────────────────────────────────────────────────────── 3.3
    lucaEvent,
    // ───────────────────────────────────────────────────────────────────────────────────── 3.4
    goeEvent,
    // ───────────────────────────────────────────────────────────────────────────────────── 3.5
    endosymbiosisItem,
  ],
};
