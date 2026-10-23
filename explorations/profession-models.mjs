// Educational fictional cases and synthetic traces; no personal-case or patient input.
const text = x => typeof x === 'string' && x.trim().length > 0;
const objects = xs => Array.isArray(xs) && xs.length > 0 && xs.every(x => x && typeof x === 'object' && !Array.isArray(x));
const dayMs = 86400000;
export function civilDay(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(value + 'T00:00:00Z');
  if (!Number.isFinite(date.valueOf()) || date.toISOString().slice(0, 10) !== value || Number(value.slice(0,4)) < 1900 || Number(value.slice(0,4)) > 2100) return null;
  return date.valueOf() / dayMs;
}
const civil = n => new Date(n * dayMs).toISOString().slice(0, 10);
export function legalCalendar(conditionsComplete, observation, { repair = false } = {}) {
  if (repair) return { error: 'Repair waiting periods are outside this unextended calendar. No deadline is calculated.' };
  const trigger = civilDay(conditionsComplete), observed = civilDay(observation);
  if (trigger === null || observed === null) return { error: 'Supply valid illustrative dates between 1900 and 2100; the date all conditions were met must be known.' };
  const elapsed = observed - trigger;
  return { first: civil(trigger + 1), last: civil(trigger + 30), day: elapsed,
    position: elapsed < 1 ? 'before-counting-start' : elapsed < 30 ? 'within-window' : elapsed === 30 ? 'last-day' : 'after-window' };
}
export function refundCalendar(agreement) {
  const start = civilDay(agreement);
  return start === null ? null : civil(start + 13);
}
export function countCycles(trace, start, end) {
  if (!trace || !Array.isArray(trace.cycles)) return { error: 'Unknown synthetic trace.' };
  if ([start,end].some(x => x === '' || x === null || !['number','string'].includes(typeof x) || !Number.isFinite(Number(x)))) return { error: 'Enter two finite window endpoints in seconds.' };
  const lo = Number(start) * 1000, hi = Number(end) * 1000;
  if (hi <= lo) return { error: 'Window end must be later than its start.' };
  if (lo < trace.cycles[0][0] || hi > trace.cycles.at(-1)[2]) return { error: 'Outside the supplied trace: unknown, not zero.' };
  const complete = [], partial = [], onsets = [];
  trace.cycles.forEach(([a, , b], i) => {
    if (a >= lo && b <= hi) complete.push(i + 1);
    else if (a < hi && b > lo) partial.push(i + 1);
    if (a >= lo && a < hi) onsets.push(i + 1);
  });
  const minutes = (hi - lo) / 60000;
  return { complete, partial, onsets, completeRate: complete.length / minutes, onsetRate: onsets.length / minutes, seconds: (hi-lo)/1000 };
}
export function validateProfession(a, passageIds) {
  const errors = [], check = (ok, why) => { if (!ok) errors.push(why); };
  if (a?.type === 'case-reasoning') {
    check(a.jurisdiction === 'England and Wales' && a.legalSnapshotCertified === false && text(a.snapshotScope), 'fictional legal scope and uncertified snapshot must be explicit');
    check(objects(a.cases), 'legal cases required');
    if (!objects(a.cases)) return errors;
    check(new Set(a.cases.map(x=>x.id)).size === a.cases.length, 'duplicate legal case');
    for (const c of a.cases) {
      check(/^[a-z][a-z0-9-]*$/.test(c.id) && text(c.title) && text(c.facts) && text(c.feedback), 'incomplete legal case');
      check(['conditional-route','missing-fact','outside-scope','separate-clock'].includes(c.category), 'invalid case conclusion');
      check(Array.isArray(c.passageIds) && c.passageIds.length > 0 && c.passageIds.every(x=>passageIds.includes(x)), 'case evidence missing');
      check(typeof c.repair === 'boolean', 'repair scope flag required');
      for (const k of ['conditionsComplete','observation','refundAgreed']) check(c[k] === null || civilDay(c[k]) !== null, 'invalid or missing illustrative date');
      check(!c.repair || c.category === 'outside-scope', 'repair cannot use ordinary calendar');
    }
  }
  if (a?.type === 'cycle-observation') {
    check(a.synthetic === true && a.patientData === false && text(a.countingConvention), 'synthetic trace scope required');
    check(objects(a.traces), 'synthetic traces required');
    if (!objects(a.traces)) return errors;
    check(new Set(a.traces.map(x=>x.id)).size === a.traces.length, 'duplicate trace');
    for (const t of a.traces) {
      check(/^[a-z][a-z0-9-]*$/.test(t.id) && text(t.label), 'trace identity required');
      check(Array.isArray(t.cycles) && t.cycles.length > 0 && t.cycles.length <= 30, 'bounded cycles required');
      if (!Array.isArray(t.cycles)) continue;
      let previous = 0;
      for (const row of t.cycles) {
        const valid = Array.isArray(row) && row.length === 3 && row.every(Number.isSafeInteger) && row[0] === previous && row[0] >= 0 && row[0] < row[1] && row[1] < row[2] && row[2] <= 60000;
        check(valid, 'trace rows must be contiguous ordered millisecond triples');
        if (valid) previous = row[2];
      }
    }
  }
  return errors;
}
export function normalizeProfession(r, raw) {
  const a = r.activity;
  if (a.type === 'case-reasoning') {
    const c = a.cases.find(c=>c.id === raw.case) || a.cases[0];
    return { case: c.id, category: ['conditional-route','missing-fact','outside-scope','separate-clock'].includes(raw.category) ? raw.category : 'missing-fact' };
  }
  if (a.type === 'cycle-observation') {
    const number = (value, fallback) => value === undefined ? fallback : (typeof value === 'number' || typeof value === 'string') && String(value).trim() !== '' && Number.isFinite(Number(value)) && Math.abs(Number(value)) <= 120 ? String(Number(value)) : '';
    return { trace: a.traces.some(t=>t.id === raw.trace) ? raw.trace : a.traces[0].id, start: number(raw.start, '0'), end: number(raw.end, '20'), phase: raw.phase === 'out' ? 'out' : 'in' };
  }
  return {};
}
