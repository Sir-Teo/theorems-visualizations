// Shared validation for local human records. Source changes invalidate reviews.
export function validateRecords(manifest, records) {
  if (!Array.isArray(records)) throw new Error('Review records must be an array.');
  const entries = new Map(manifest.entries.map(e => [e.id, e])), accepted = [], rejected = [], seen = new Set();
  for (const record of records) {
    const entry = entries.get(record?.id), key = `${record?.id}:${record?.type}`;
    const required = record?.type === 'visual' ? ['controls', 'light', 'dark'] : ['listened'];
    if (!entry || !['visual', 'audio'].includes(record.type) || !entry[record.type] || seen.has(key) ||
      record.fingerprint !== entry.fingerprint || !['pass', 'needs-fix'].includes(record.status) ||
      typeof record.reviewer !== 'string' || !record.reviewer.trim() ||
      typeof record.notes !== 'string' || !Number.isFinite(Date.parse(record.reviewedAt)) ||
      (record.status === 'pass' && !required.every(k => record.attestations?.[k] === true)) ||
      (record.status === 'needs-fix' && !record.notes.trim())) {
      rejected.push(record); continue;
    }
    seen.add(key);
    accepted.push({ id: entry.id, type: record.type, fingerprint: entry.fingerprint, status: record.status,
      reviewer: record.reviewer.trim(), notes: record.notes, reviewedAt: record.reviewedAt,
      attestations: Object.fromEntries(required.map(k => [k, record.attestations?.[k] === true])) });
  }
  return { accepted, rejected };
}

export function reviewSummary(manifest, records) {
  const { accepted } = validateRecords(manifest, records);
  const summary = {};
  for (const type of ['visual', 'audio']) {
    const total = manifest.entries.filter(e => e[type]).length;
    const passed = accepted.filter(r => r.type === type && r.status === 'pass').length;
    const issues = accepted.filter(r => r.type === type && r.status === 'needs-fix').length;
    summary[type] = { total, passed, issues, pending: total - passed - issues, complete: total > 0 && passed === total };
  }
  return summary;
}
