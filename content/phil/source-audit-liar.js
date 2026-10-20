// Authored one-sentence status equations, not a construction of a truth language.
// Numeric code = truth support + 2*falsity support; coordinates are (truth,falsity).
export const LIAR_STATUS = Object.freeze([1, 2, 0, 3]);
export const LIAR_DOMAINS = Object.freeze({ classical: [1, 2], gap: [1, 2, 0], glut: [1, 2, 3], four: [1, 2, 0, 3] });
export function liarBits(status) {
  if (!Number.isInteger(status) || status < 0 || status > 3) throw new RangeError('A status must be one of the four Boolean pairs.');
  return [status & 1, (status >> 1) & 1];
}
export function liarObjectNegation(status) {
  const [truth, falsity] = liarBits(status); return falsity + 2 * truth;
}
// A total Boolean metalanguage classification, encoded as T-only or F-only.
// It becomes a self-applicable object operator only under the explicit enrichment.
export function liarExternalNotTrue(status) { return liarBits(status)[0] ? 2 : 1; }
export function liarStatusModel(sentence, domain, enrich = false) {
  if (!['liar', 'teller', 'external'].includes(sentence) || typeof domain !== 'string' || !Object.hasOwn(LIAR_DOMAINS, domain) || typeof enrich !== 'boolean') throw new RangeError('A declared sentence/domain/enrichment is required.');
  const compared = sentence !== 'external' || enrich;
  const rows = LIAR_STATUS.map(input => {
    const output = sentence === 'liar' ? liarObjectNegation(input) : sentence === 'teller' ? input : liarExternalNotTrue(input);
    const allowed = LIAR_DOMAINS[domain].includes(input);
    return { input, output, allowed, equal: input === output, bits: liarBits(input), outputBits: liarBits(output), externalNotTrue: (input & 1) === 0 };
  });
  return { sentence, domain, enrich, compared, rows, fixed: compared ? rows.filter(r => r.allowed && r.equal).map(r => r.input) : null };
}
