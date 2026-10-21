// One bounded mirror case; no matrix dimensions, arbitrary theme or run-mode parameter.
export const DARK_CASE = Object.freeze({
  id: 'checkpoint5-3840x2160-dpr2-dark-fractional-pan',
  sourceBaseline: 'f778d8ebf95df00fb6c2bb4cb506dd37e2728312',
  viewport: Object.freeze({width:3840,height:2160,dpr:2,theme:'dark'}),
  defaultOutputPrefix: '/tmp/atlas-map-paired-dark-prepared-',
  fullRunFlag: '--root-authorized-dark-exact-state',
});
export function darkPageOptions() {
  const {width,height,dpr,theme}=DARK_CASE.viewport;
  return {viewport:{width,height},deviceScaleFactor:dpr,colorScheme:theme};
}
