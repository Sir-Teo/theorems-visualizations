import {validateWater, normalizeWater} from './water-ledger.mjs';
import {validateReasoning, normalizeReasoning} from './reasoning-lab.mjs';
import {validateProfession, normalizeProfession} from './profession-models.mjs';
import {validatePractice, normalizeWeave} from './practice-model.mjs';
import {validatePerformance, normalizePerformance} from './performance-model.mjs';
// Shared pure logic for argument reconstruction and observed-data exploration.
export const EXTRA_METHODS = ['argument-map', 'measured-data', 'weave-structure', 'phrase-comparison', 'case-reasoning', 'cycle-observation', 'conditional-reasoning', 'water-ledger'];
export const PREMISE_KINDS = ['interpretation', 'empirical-assumption', 'normative-addition'];
const text = x => typeof x === 'string' && x.trim().length > 0;
const id = x => typeof x === 'string' && /^[a-z][a-z0-9-]*$/.test(x);
const objects = xs => Array.isArray(xs) && xs.length > 0 && xs.every(x => x && typeof x === 'object' && !Array.isArray(x));
const unique = xs => new Set(xs).size === xs.length;
export function validateMethod(a, passageIds, sourceIds) {
  const errors = [], check = (ok, why) => { if (!ok) errors.push(why); };
  if (a?.type === 'argument-map') {
    check(text(a.scenario) && text(a.definitions), 'argument scenario and definitions required');
    for (const k of ['premises', 'actions', 'guides']) {
      check(objects(a[k]), 'argument ' + k + ' must be nonempty objects');
      if (!objects(a[k])) return errors;
      check(unique(a[k].map(x => x.id)) && a[k].every(x => id(x.id)), 'invalid or duplicate ' + k + ' identity');
    }
    check(a.premises.length <= 12, 'argument premise bank exceeds bounded state');
    for (const p of a.premises) check(text(p.text) && PREMISE_KINDS.includes(p.kind), 'premise text/kind required');
    for (const p of a.actions) check(text(p.label) && text(p.objection), 'action label/objection required');
    for (const g of a.guides) {
      check(text(g.title) && text(g.conclusion) && text(g.objection), 'argument guide incomplete');
      check(passageIds.includes(g.passageId), 'argument guide passage missing');
      check(a.actions.some(x => x.id === g.action), 'guide action missing');
      check(Array.isArray(g.premiseIds) && g.premiseIds.length > 0 && unique(g.premiseIds) && g.premiseIds.every(p => a.premises.some(x => x.id === p)), 'guide premise missing');
    }
  } else if (a?.type === 'measured-data') {
    const d = a.dataset;
    check(d && text(d.sourceFile) && /^[a-f0-9]{64}$/.test(d.sourceSha256 || '') && sourceIds.includes(d.sourceId), 'dataset provenance required');
    check(objects(d?.rows), 'dataset rows must be nonempty objects');
    check(Array.isArray(d?.selection?.Sample_ID) && d.selection.Sample_ID.length > 0 && unique(d.selection.Sample_ID) && d.selection.Sample_ID.every(x => /^[A-Za-z0-9_-]+$/.test(x)) && text(d.selection.rationale), 'bounded sample selection required');
    check(d?.instrumentLabels?.['1'] === 'WP4C' && d?.instrumentLabels?.['2'] === 'HyProp', 'instrument mapping required');
    check(Array.isArray(d?.omittedColumns) && d.omittedColumns.every(text), 'omitted columns must be a text array');
    check(Array.isArray(d?.projection) && d.projection.length > 0 && unique(d.projection) && d.projection.every(text), 'projection must name distinct columns');
    if (errors.length) return errors;
    check(unique(d.rows.map(x => x.sourceRow)), 'duplicate source-row identity');
    for (const r of d.rows) {
      check(Number.isSafeInteger(r.sourceRow) && r.sourceRow >= 2, 'invalid source row');
      check(d.selection.Sample_ID.includes(r.Sample_ID), 'row outside sample selection');
      for (const k of ['Site', 'Sample_ID', 'Plot', 'Depth_cm', 'MPa_Abs', 'Vol_Water', 'Hypropfilter', 'Sampling_Date']) check(text(r[k]), 'source decimal/text must be retained: ' + k);
      check(Number.isFinite(Number(r.MPa_Abs)) && Number(r.MPa_Abs) > 0, 'magnitude must be finite and positive');
      check(Number.isFinite(Number(r.Vol_Water)) && Number(r.Vol_Water) >= 0 && Number(r.Vol_Water) <= 100, 'reported percent out of range');
      check(Number.isFinite(Number(r.Depth_cm)) && Number(r.Depth_cm) >= 0 && ['1', '2'].includes(r.Hypropfilter), 'depth or instrument invalid');
      check(!Object.keys(r).some(k => /Bulk_Den|Conduct|KS_/i.test(k)), 'excluded density/conductivity field');
    }
    for (const s of d.selection.Sample_ID) check(d.rows.some(r => r.Sample_ID === s), 'sample without rows');
  }
  if (a?.type === 'weave-structure') errors.push(...validatePractice(a));
  if (a?.type === 'phrase-comparison') errors.push(...validatePerformance(a));
  errors.push(...validateProfession(a, passageIds), ...validateReasoning(a), ...validateWater(a));
  return errors;
}
function numeric(raw, fallback, max) {
  if (raw === undefined) return fallback;
  if (typeof raw !== 'string' && typeof raw !== 'number') return '';
  if (String(raw).trim() === '') return '';
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 && n <= max ? String(n) : '';
}
export function normalizeMethodState(record, raw) {
  const a = record.activity;
  if (a.type === 'argument-map') {
    const selected = typeof raw.premises === 'string' ? raw.premises.split(',') : [];
    return {
      guide: a.guides.some(x => x.id === raw.guide) ? raw.guide : a.guides[0].id,
      actor: raw.actor === 'quiet' ? 'quiet' : 'music',
      action: a.actions.some(x => x.id === raw.action) ? raw.action : a.actions[0].id,
      premises: [...new Set(selected.filter(p => a.premises.some(x => x.id === p)))].join(','),
    };
  }
  if (a.type === 'measured-data') {
    const d = a.dataset, samples = d.selection.Sample_ID;
    const sample = samples.includes(raw.sample) ? raw.sample : samples[0];
    const rows = d.rows.filter(r => r.Sample_ID === sample);
    return { sample, compare: samples.includes(raw.compare) && raw.compare !== sample ? raw.compare : 'none',
      point: String(rows.some(r => String(r.sourceRow) === String(raw.point)) ? raw.point : rows[0].sourceRow),
      upper: numeric(raw.upper, '0.3', 1), lower: numeric(raw.lower, '0.15', 1), depth: numeric(raw.depth, '0.4', 2) };
  }
  if (a.type === 'weave-structure') return normalizeWeave(raw);
  if (a.type === 'phrase-comparison') return normalizePerformance(a,raw);
  return {...normalizeProfession(record, raw), ...normalizeReasoning(record, raw), ...normalizeWater(record, raw)};
}
export function argumentAssessment(record, state) {
  const a = record.activity, s = normalizeMethodState(record, state), g = a.guides.find(x => x.id === s.guide);
  const ids = s.premises.split(',').filter(Boolean), missing = g.premiseIds.filter(x => !ids.includes(x));
  return { guide: g, selected: ids.map(id => a.premises.find(p => p.id === id)), missing,
    message: missing.length ? `This editor's example uses ${missing.length} additional premise(s). You may defend a different reconstruction; explain the omitted links.` : 'Your list contains the premises in this editorial example. That does not establish that the premises are true or the action is morally required.',
    actionObjection: a.actions.find(x => x.id === s.action).objection };
}
export function storageResult(state) {
  const keys = ['upper', 'lower', 'depth'];
  if (keys.some(k => state[k] === '' || state[k] === undefined || !Number.isFinite(Number(state[k])))) return { error: 'Enter both assumed fractions (0 to 1) and a positive layer depth (up to 2 m).' };
  const [upper, lower, depth] = keys.map(k => Number(state[k]));
  if (upper < 0 || upper > 1 || lower < 0 || lower > 1 || depth <= 0 || depth > 2) return { error: 'Fractions must be between 0 and 1; depth must be greater than 0 and at most 2 m.' };
  if (upper < lower) return { error: 'The upper fraction must be at least the lower fraction for this storage-difference model.' };
  return { mm: (upper - lower) * depth * 1000 };
}
