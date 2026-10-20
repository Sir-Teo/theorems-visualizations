// Big History & Quantitative History — Chapter 3, part b: items 3.6–3.10
//
// Sources checked (Oct 2026):
//   3.6 Actual North1980 NASApreprint/Gough1981/Myhre1998/Hoffman1998 bodies and source pixels compared.
//     Independently accepted; see docs/verification/bighist-snowball-peer.md.
//   3.7 Actual Marshall2006 chronology/explanation sections and ICS2024/12 chart compared.
//     Historical source scale and authored gate remain separate; independent review pending.
//   3.8 Actual Raup1982 original, Barnosky2011 Table1 and Kirchner2000 primary/relevant supplement read.
//     Independently accepted; see docs/verification/bighist-extinction-peer.md.
//   3.9/3.10 Actual original Alvarez1980, Collins2005 and Renne2013 source equations/tables checked.
//     Sources, finite model/state limits and evidence: docs/verification/bighist-impact-followup.md.
//     Both impact entries independently accepted; source/model scope remains explicit.


import snowballItem from './snowball-item.js';
import cambrianItem from './cambrian-item.js';
import {impactEvent,impactPaper} from './impact-items.js';
import extinctionItem from './extinction-item.js';

export default {
  collection: 'bighist',
  chapter: 3,
  items: [
    snowballItem,
    cambrianItem,
    extinctionItem,
    impactEvent,
    impactPaper,
  ],
};
