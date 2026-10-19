// Versioned, bounded visualization state. No DOM values or executable source are serialized.
export const SHARE_VERSION = 1;
export const MAX_STATE_BYTES = 18000;
export const MAX_STATE_TOKEN = 24000;
const forbidden = new Set(['__proto__', 'prototype', 'constructor']);

function safeValue(value, depth = 0, budget = { n: 0 }) {
  if (++budget.n > 10000 || depth > 12) throw new Error('The shared state is too complex.');
  if (value === null || typeof value === 'boolean') return;
  if (typeof value === 'number' && Number.isFinite(value)) return;
  if (typeof value === 'string' && value.length <= 4096) return;
  if (Array.isArray(value)) { for (const x of value) safeValue(x, depth + 1, budget); return; }
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    for (const [key, x] of Object.entries(value)) {
      if (forbidden.has(key)) throw new Error('The shared state contains an unsupported key.');
      safeValue(x, depth + 1, budget);
    }
    return;
  }
  throw new Error('The shared state must contain finite numbers, text and plain data.');
}
export function validateState(state) {
  safeValue(state);
  if (state?.v !== SHARE_VERSION) throw new Error('This shared state uses an unsupported version.');
  if (!Array.isArray(state.parts) || state.parts.length > 1000) throw new Error('This shared state has an invalid component list.');
  const keys = new Set();
  for (const row of state.parts) {
    if (!Array.isArray(row) || row.length !== 2 || typeof row[0] !== 'string' || !row[0] || row[0].length > 512 || keys.has(row[0])) throw new Error('This shared state has invalid or repeated components.');
    keys.add(row[0]);
  }
  return state;
}
export function encodeState(state) {
  validateState(state);
  const bytes = new TextEncoder().encode(JSON.stringify(state));
  if (bytes.length > MAX_STATE_BYTES) throw new Error('This state is too large for a share link. Reduce custom data and try again.');
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function decodeState(token) {
  if (typeof token !== 'string' || !token || token.length > MAX_STATE_TOKEN || !/^[A-Za-z0-9_-]+$/.test(token)) throw new Error('This shared state link is invalid or too large.');
  try {
    const bytes = Uint8Array.from(atob(token.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    if (bytes.length > MAX_STATE_BYTES) throw new Error('State too large');
    return validateState(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)));
  } catch (error) {
    if (error.message.startsWith('This shared state') || error.message.startsWith('The shared state')) throw error;
    throw new Error('This shared state link could not be read.');
  }
}

/** A registry of actual runtime getters and setters, in author creation order. */
export class StateRegistry {
  constructor() { this.parts = new Map(); this.counts = new Map(); }
  register(kind, label, adapter) {
    const stem = `${kind}:${label || ''}`, n = this.counts.get(stem) || 0;
    this.counts.set(stem, n + 1);
    const key = `${stem}:${n}`;
    this.parts.set(key, adapter);
    return key;
  }
  capture() {
    const state = { v: SHARE_VERSION, parts: [...this.parts].map(([key, adapter]) => [key, adapter.get()]) };
    for (const [key, value] of state.parts) if (!this.parts.get(key).valid(value)) throw new Error('A visualization value cannot be shared in its current form.');
    // A snapshot must be independent of live arrays/objects owned by a visualization.
    encodeState(state);
    return JSON.parse(JSON.stringify(state));
  }
  restore(state) {
    validateState(state);
    if (state.parts.length !== this.parts.size || state.parts.some(([key]) => !this.parts.has(key))) throw new Error('This visualization has changed; its saved components no longer match.');
    for (const [key, value] of state.parts) if (!this.parts.get(key).valid(value)) throw new Error('This shared state contains an invalid visualization value.');
    // Use registration order, not input order: controls restore before dependent data/handles.
    const values = new Map(state.parts);
    for (const [key, adapter] of [...this.parts].sort((a, b) => (a[1].order || 0) - (b[1].order || 0))) adapter.set(values.get(key));
  }
}

export function stateURL(base, id, state, embed = false) {
  const url = new URL(base), q = new URLSearchParams();
  url.searchParams.delete('embed');
  if (embed) url.searchParams.set('embed', '1');
  q.set('s', encodeState({ ...state, item: id }));
  url.hash = `/t/${encodeURIComponent(id)}?${q}`;
  return url.href;
}
