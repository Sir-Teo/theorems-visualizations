// Waves & Optics — Chapter 3 shared helpers (dispersion relations of simple media, numerical derivative).
// Re-exports the chapter 2 helpers; imported by ch03.js and ch03-b.js.
export * from './ch02.shared.js';

/** Central-difference derivative of w at k (relative step). */
export const dwdk = (w, k) => { const h = 1e-5 * Math.max(1, Math.abs(k)); return (w(k + h) - w(k - h)) / (2 * h); };

/**
 * Dispersion relations ω(k) in units where the "light speed" / wave speed is 1:
 * none (ω = k), deep water (g = 1), plasma-like (ω² = 1 + k²), capillary ripples (σ = 1, ω² = k³),
 * stiff string (ω² = k²(1 + k²/4)), beaded chain (spacing 1, ω = 2|sin(k/2)|).
 */
export const MEDIA = {
  none: { label: 'non-dispersive', w: (k) => k },
  deep: { label: 'deep water', w: (k) => Math.sqrt(k) },
  plasma: { label: 'plasma-like', w: (k) => Math.sqrt(1 + k * k) },
  cap: { label: 'capillary ripples', w: (k) => Math.pow(k, 1.5) },
  stiff: { label: 'stiff string', w: (k) => k * Math.sqrt(1 + (k * k) / 4) },
  chain: { label: 'chain of masses', w: (k) => 2 * Math.abs(Math.sin(k / 2)) },
};
