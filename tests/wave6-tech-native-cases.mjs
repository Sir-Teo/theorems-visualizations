const tiny=Number.MIN_VALUE;
export const criticalCases={
 1:[
  {name:'heat-and-fill',selects:{'device phase':'Steam / heat'},sliders:{'selected stroke fraction':1}},
  {name:'suction-unavailable',sliders:{'ambient pressure (absolute kPa)':50,'condensed pressure (absolute kPa)':150,'receiver height above water (m)':15}},
  {name:'discharge-unavailable',selects:{'device phase':'Working stroke'},sliders:{'ambient pressure (absolute kPa)':120,'discharge steam (absolute kPa)':50,'selected stroke fraction':.8}},
  {name:'pressure-discharge',selects:{'device phase':'Working stroke'},sliders:{'discharge steam (absolute kPa)':1000,'selected stroke fraction':.8}},
  {name:'reset',selects:{'device phase':'Reset'}},
  {name:'tiny-position',sliders:{'selected stroke fraction':tiny,'receiver height above water (m)':tiny}}
 ],
 2:[
  {name:'infeasible-water-load',sliders:{'piston area (m²)':.05,'pump arm / engine arm':3,'pump area (m²)':.05,'water lift (m)':150,'selected stroke fraction':1}},
  {name:'long-engine-arm',sliders:{'pump arm / engine arm':.5,'selected stroke fraction':0}},
  {name:'long-pump-arm',sliders:{'pump arm / engine arm':3,'selected stroke fraction':0}},
  {name:'no-reheat',sliders:{'chosen cylinder swing (K)':0,'water lift (m)':0}},
  {name:'tiny-water-load',sliders:{'water lift (m)':tiny}}
 ],
 3:[
  {name:'charcoal',selects:{'illustrated furnace fuel':'Charcoal'}},
  {name:'zero-carbon-budget',sliders:{'separate carbon budget (kg)':0,'chosen iron output (kg)':2000}},
  {name:'zero-prices',sliders:{'coke price (units/kg)':0,'charcoal price (units/kg)':0}},
  {name:'large-wood-scenario',sliders:{'separate carbon budget (kg)':2000,'chosen wood yield (kg/ha)':1000}},
  {name:'tiny-cost-and-area',sliders:{'separate carbon budget (kg)':tiny,'coke price (units/kg)':tiny,'charcoal price (units/kg)':tiny}}
 ],
 4:[
  {name:'linear-extrapolation',selects:{'highlighted support':'Cantilever, end load'},sliders:{'bar span (m)':3,'bar diameter (m)':.05,'chosen cutting load (N)':3000,'chosen modulus (GPa)':50}},
  {name:'zero-load',sliders:{'chosen cutting load (N)':0}},
  {name:'stiff-short-bar',sliders:{'bar span (m)':.5,'bar diameter (m)':.3,'chosen modulus (GPa)':250}},
  {name:'tiny-load',sliders:{'chosen cutting load (N)':tiny}}
 ],
 5:[
  {name:'condense-inside',selects:{'condensation location':'Inside working cylinder'}},
  {name:'no-metal-swing',sliders:{'chosen temperature swing (K)':0}},
  {name:'no-reheat-saving',sliders:{'residual metal reheating fraction':1}},
  {name:'zero-residual',sliders:{'residual metal reheating fraction':0,'active cylinder mass (kg)':1000}},
  {name:'tiny-swing',sliders:{'chosen temperature swing (K)':tiny}}
 ],
 6:[
  {name:'two-shaft-turns',sliders:{'carrier angle (radians)':2*Math.PI}},
  {name:'open-loop-low-speed',sliders:{'feedback gain':0,'step load':.5,'selected response time':20}},
  {name:'strong-lagged-feedback',sliders:{'feedback gain':5,'throttle lag':4,'step load':.5,'selected response time':2}},
  {name:'zero-load',sliders:{'step load':0}},
  {name:'tiny-angles-and-load',sliders:{'carrier angle (radians)':tiny,'step load':tiny}},
  {name:'tiny-response-time',sliders:{'selected response time':tiny}}
 ],
 7:[
  {name:'centre',sliders:{'input arm angle (radians)':0}},
  {name:'negative-end',sliders:{'input arm angle (radians)':-.55}},
  {name:'positive-end',sliders:{'input arm angle (radians)':.55}},
  {name:'resolved-fifth-order',sliders:{'input arm angle (radians)':1e-12}},
  {name:'positive-unresolved-error',sliders:{'input arm angle (radians)':tiny}},
  {name:'negative-unresolved-error',sliders:{'input arm angle (radians)':-tiny}}
 ],
 8:[
  {name:'isothermal',sliders:{'polytropic exponent':1}},
  {name:'gauge-origin',toggles:{'show gauge pressure':true},sliders:{'selected trace position':.7}},
  {name:'negative-prescribed-loop',sliders:{'cut-off fraction of swept volume':0,'supply pressure (absolute kPa)':50,'return pressure (absolute kPa)':900,'selected trace position':.5}},
  {name:'zero-work',sliders:{'cut-off fraction of swept volume':1,'supply pressure (absolute kPa)':200,'return pressure (absolute kPa)':200}},
  {name:'near-isothermal-exponent',sliders:{'polytropic exponent':1+Number.EPSILON}},
  {name:'subnormal-admission-and-return',sliders:{'cut-off fraction of swept volume':tiny,'return pressure (absolute kPa)':tiny}}
 ],
 9:[
  {name:'thick-cylinder',sliders:{'cylinder inner radius (m)':.1,'wall thickness (m)':.1,'working pressure difference (kPa)':1000}},
  {name:'subpixel-wall',sliders:{'cylinder inner radius (m)':1,'wall thickness (m)':.001}},
  {name:'large-displacement',sliders:{'working pressure difference (kPa)':20,'chosen indicated power (kW)':50,'working cycles per second':.2}}
 ],
 10:[
  {name:'reversible-limit',sliders:{'fraction of reversible limit':1}},
  {name:'equal-reservoirs',sliders:{'hot reservoir (K)':300,'cold reservoir (K)':300}},
  {name:'reversed-reservoirs',sliders:{'hot reservoir (K)':200,'cold reservoir (K)':1200}},
  {name:'zero-heat',sliders:{'chosen heat input (kJ)':0}},
  {name:'tiny-work-fraction',sliders:{'fraction of reversible limit':tiny}},
  {name:'tiny-heat',sliders:{'chosen heat input (kJ)':tiny}}
 ],
 11:[
  {name:'concentration-rises',sliders:{'chosen carbon removal rate':.1,'chosen iron removal rate':1,'selected arbitrary process time':10}},
  {name:'zero-carbon',sliders:{'initial carbon mass fraction':0}},
  {name:'zero-rolling-change',sliders:{'rolling thickness reduction':0}},
  {name:'large-rolling-reduction',sliders:{'rolling thickness reduction':.9}},
  {name:'unresolved-carbon-and-rolling',sliders:{'initial carbon mass fraction':tiny,'chosen carbon removal rate':1,'selected arbitrary process time':10,'rolling thickness reduction':tiny}}
 ],
 12:[
  {name:'all-carbon-removed',sliders:{'chosen fraction of carbon removed':1}},
  {name:'no-carbon-removed',sliders:{'chosen fraction of carbon removed':0}},
  {name:'negative-net-heat',sliders:{'chosen heat per kg carbon (MJ/kg)':0,'chosen heat loss (MJ)':1000}},
  {name:'retained-phosphorus',sliders:{'initial phosphorus mass fraction':.02,'chosen fraction of carbon removed':1}},
  {name:'tiny-positive-heat',sliders:{'initial carbon mass fraction':tiny,'chosen fraction of carbon removed':tiny,'chosen heat loss (MJ)':0}}
 ],
 13:[
  {name:'four-start-thread',sliders:{'thread starts':4,'driving gear teeth':37,'driven gear teeth':73}},
  {name:'maximum-feed',sliders:{'lead-screw advance (mm/turn)':8,'driving gear teeth':80,'driven gear teeth':12,'spindle turns':10}},
  {name:'no-prescribed-error',sliders:{'chosen error amplitude (mm)':0,'chosen error slope':0}},
  {name:'tiny-carriage-position',sliders:{'spindle turns':tiny}},
  {name:'tiny-error-terms',sliders:{'chosen error amplitude (mm)':tiny,'chosen error slope':tiny}}
 ],
 14:[
  {name:'point-mass-fit',sliders:{'hole error half-width (mm)':0,'shaft error half-width (mm)':0}},
  {name:'precise-but-biased',sliders:{'hole error half-width (mm)':0,'shaft error half-width (mm)':0,'chosen clearance bias (mm)':.04}},
  {name:'rounded-boundary-rejection',sliders:{'hole error half-width (mm)':0,'shaft error half-width (mm)':0,'chosen clearance bias (mm)':.02}},
  {name:'one-uniform-limit',sliders:{'hole error half-width (mm)':0,'shaft error half-width (mm)':.03}},
  {name:'empty-batch',sliders:{'pairs in seeded batch':0}},
  {name:'large-batch-last-pair',sliders:{'pairs in seeded batch':144,'pair number (clamped to batch)':144,'hole error half-width (mm)':.1,'shaft error half-width (mm)':.1}},
  {name:'tiny-continuous-widths',sliders:{'hole error half-width (mm)':tiny,'shaft error half-width (mm)':tiny}},
  {name:'clamped-pair-request',sliders:{'pairs in seeded batch':3,'pair number (clamped to batch)':144}}
 ]
};
