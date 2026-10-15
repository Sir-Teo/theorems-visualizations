// Visualization kits: higher-level building blocks exposed on the viz API as v.<name>(...).
// Each kit module exports a factory make(api, rt, ...args); register it in KITS below.
// Content never imports kits directly — it calls v.<name>(...). See AUTHORING.md §3.
export const KITS = {};
