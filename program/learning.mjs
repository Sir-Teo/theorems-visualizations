import {sha, insist} from './federation.mjs';
const text = x => typeof x === 'string' && x.trim().length > 0;
export const STUDY_ID = /^s-[a-z][a-z0-9-]{1,60}$/;
export const REVISION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
export function studyDigest(study) {
  const {status, authorVerification, ...content} = study;
  return sha(JSON.stringify(content));
}
export function validateStudy(s, sourceIds) {
  insist(s?.schemaVersion === 1 && STUDY_ID.test(s.id) && REVISION.test(s.revision), 'Invalid general study identity');
  insist(text(s.seriesId) && text(s.author), 'A study needs its own series and author');
  insist(['draft', 'accepted-local', 'withdrawn'].includes(s.status), 'Invalid local study state');
  insist(Array.isArray(s.domainIds) && s.domainIds.length && s.domainIds.every(d => /^D(?:0[1-9]|[12]\d|30)$/.test(d)), 'Invalid study domains');
  insist(Array.isArray(s.sourceIds) && s.sourceIds.length && new Set(s.sourceIds).size === s.sourceIds.length && s.sourceIds.every(id => sourceIds.includes(id)), 'Unknown study source');
  insist(Array.isArray(s.languages) && s.languages.length && new Set(s.languages).size === s.languages.length && s.languages.every(l => ['en','es'].includes(l)), 'Add explicit interface text before enabling another language');
  insist(Array.isArray(s.tasks) && s.tasks.length >= 1 && new Set(s.tasks.map(t => t.id)).size === s.tasks.length, 'Missing or duplicate tasks');
  for (const language of s.languages) {
    for (const key of ['title','scope','transfer']) insist(text(s[key]?.[language]), 'Missing localized ' + key);
    insist(Array.isArray(s.body?.[language]) && s.body[language].length && s.body[language].every(text), 'Missing localized reading');
    for (const t of s.tasks) {
      insist(/^[a-z][a-z0-9-]*$/.test(t.id) && text(t.question?.[language]) && text(t.guide?.[language]), 'Incomplete localized task');
      insist(Array.isArray(t.choices) && t.choices.length > 1 && new Set(t.choices.map(c => c.id)).size === t.choices.length, 'Invalid choices');
      insist(t.choices.every(c => /^[a-z0-9-]+$/.test(c.id) && text(c[language])) && t.choices.some(c => c.id === t.answer), 'Unknown answer or incomplete choices');
    }
  }
  insist(text(s.translationScope), 'Missing translation scope');
  if (s.status === 'accepted-local') {
    insist(s.authorVerification?.kind === 'author-check' && s.authorVerification.contentDigest === studyDigest(s), 'Stale or missing study author check');
    insist(s.authorVerification.scope === 'local-only', 'No public publication in this contract');
  }
  return s;
}
export function assessStudy(study, taskId, choiceId) {
  const task = study.tasks.find(t => t.id === taskId);
  if (!task || !task.choices.some(c => c.id === choiceId)) return {state: 'unanswered'};
  return {state: choiceId === task.answer ? 'matches' : 'reconsider', guide: task.guide};
}

// Postorder gives a readable dependency-first list, preserving every unresolved edge.
export function prerequisiteClosure(roots, lookup) {
  const done = new Set(), active = new Set(), ordered = [], missing = new Set(), cycles = [];
  function visit(id, stack) {
    if (active.has(id)) { cycles.push([...stack.slice(stack.indexOf(id)), id]); return; }
    if (done.has(id)) return;
    const node = lookup(id);
    if (!node) { missing.add(id); return; }
    active.add(id);
    for (const dep of node.prerequisites) visit(dep, [...stack, id]);
    active.delete(id); done.add(id); ordered.push(id);
  }
  roots.forEach(id => visit(id, []));
  return {ordered, missing: [...missing].sort(), cycles, complete: missing.size === 0 && cycles.length === 0};
}

export function ledgerBalances(events) {
  const balances = {cash:0, equipment:0, capital:0, loan:0}; let debits = 0, credits = 0;
  for (const event of events) {
    insist(Array.isArray(event.entries) && event.entries.length >= 2, 'Journal event needs entries');
    for (const e of event.entries) {
      insist(Object.hasOwn(balances, e.account) && ['debit','credit'].includes(e.side) && Number.isSafeInteger(e.amount) && e.amount >= 0, 'Invalid ledger entry');
      const sign = ['cash','equipment'].includes(e.account) ? 1 : -1;
      balances[e.account] += sign * (e.side === 'debit' ? e.amount : -e.amount);
      if (e.side === 'debit') debits += e.amount; else credits += e.amount;
    }
  }
  return {...balances, assets: balances.cash + balances.equipment, liabilities: balances.loan, equity: balances.capital, debits, credits, balanced: debits === credits};
}

export function practiceExport({activity, observation, interpretation, nextAttempt}) {
  insist(['paper-weave','original-phrase','explanation'].includes(activity), 'Unknown practice activity');
  insist([observation, interpretation, nextAttempt].every(v => typeof v === 'string' && v.length <= 10000), 'Invalid practice note');
  return {schemaVersion:1, kind:'self-recorded-practice', activity, observation, interpretation, nextAttempt,
    scope:'User-entered notes, not independently observed performance, consent, certification or a learner outcome.'};
}
