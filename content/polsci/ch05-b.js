// Political Science & Social Choice — Chapter 5 (part b): items 5.6-5.10
import {essaiPaper} from './source-audit-condorcet-essai.js';
import {aggregationConcept} from './source-audit-aggregation.js';
import {swingTheorem} from './source-audit-swing.js';
import {juryTheorem} from './source-audit-strategic-jury.js';
import {downsIgnorance} from './source-audit-downs-items.js';

export default {
  collection: 'polsci',
  chapter: 5,
  items: [
    // Source-audited jury branches 5.6
    juryTheorem,

    // Source-audited finite comparison 5.7
    downsIgnorance,

    // Source-audited independent aggregation illustration 5.8
    aggregationConcept,

    // Source-audited exact deviation example 5.9
    swingTheorem,

    // Source-audited original Condorcet examples5.10
    essaiPaper,
  ],
};
