import { buildWorldPaths } from './map-scene-model.js';
// Worker startup/cold fidelity construction cannot block map input or animation.
self.onmessage = event => {
  const { request, paths, scale } = event.data;
  try {
    const started = performance.now(), geometry = buildWorldPaths(paths, scale, { includeInstances: false, maxBytes: 60_000_000 });
    self.postMessage({ request, geometry, constructionMS: performance.now() - started }, [geometry.points.buffer, geometry.joins.buffer]);
  } catch (error) { self.postMessage({ request, error: error.message }); }
};
