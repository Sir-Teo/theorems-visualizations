import dispersalItem from './dispersal-item.js';
import orbitsItem from './orbits-item.js';
import homininItem from './hominin-item.js';
// Big History & Quantitative History — Chapter 4: Human origins (items 4.1–4.4; 4.5–4.8 are in ch04-b.js)
//
// Sources checked (Oct 2026). Crossref was used for bibliographic details; "rounded" means the number was not taken from one table.
//   Audited4.1: actualAiello/Wheeler1995main199–211/reply217–218, Tables1/4/Fig6; historical summaries and authored accounting separated.
//   Audited4.2: actualHays1976main1121–1131/Imbrie1980main943–952; authored harmonics, daily insolation and finite response/power.
//   Audited4.3: six bounded actual-source date cases; distinguish context/ash/specimen/onset/activity and avoid inferred itineraries.
//   4.4 Actual complete Ramachandran2005 original source read; conditional model and saved seed repaired.
//     See docs/verification/bighist-founder-followup.md; source flag retained pending independent acceptance.

import founderItem from './founder-item.js';

export default {
  collection: 'bighist',
  chapter: 4,
  title: 'Human origins',
  summary: String.raw`Bipedal hominins were present in Africa several million years ago, before the later marked enlargement of the brain. Ice ages paced by Earth’s orbital cycles shaped the environments our ancestors lived in. Dated African and non-African finds document parts of a complex dispersal history; a find records a particular presence rather than a whole population’s first arrival. Collective learning — the ability to share and accumulate knowledge — is Christian’s candidate for what made humans different.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    homininItem,
    // ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    orbitsItem,
    // ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    dispersalItem,
    // Accepted founder model remains imported.
    founderItem,
  ],
};
