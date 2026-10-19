// Inspected source values, boundaries and conversions for energy 3.4.
// DOE AFDC Fuel Properties Comparison: LHV gasoline/E10 range and diesel,
// H2 33.3 kWh/kg. Gasoline/diesel mass densities below are declared assumptions.
const BTU_MJ=1055.05585262/1e6,US_GAL_L=3.785411784;
const gasolineL=[112114,116090].map(x=>x*BTU_MJ/US_GAL_L);
export const H2_LHV_AUDIT=33.3*3.6;
const cellE=3.6*3.25*.0036,leadE=12*7*.0036;
const uraniumE=200*1.602176634e-13*6.02214076e23/.2350439301/1e6;
export const ENERGY_DENSITY_AUDIT=[
  {key:'gasoline',n:'gasoline/E10',kg:(gasolineL[0]+gasolineL[1])/2/.75,L:(gasolineL[0]+gasolineL[1])/2,col:'orange',group:'engine',basis:'AFDC LHV midpoint; assumed 0.75 kg/L',rangeL:gasolineL},
  {key:'diesel',n:'diesel',kg:128488*BTU_MJ/US_GAL_L/.84,L:128488*BTU_MJ/US_GAL_L,col:'orange',group:'engine',basis:'AFDC LHV; assumed 0.84 kg/L'},
  // DOE/NASA 2022 workshop report §1.1: rounded reference 71 and 40 kg/m3.
  {key:'h2-liquid',n:'H₂ liquid',kg:H2_LHV_AUDIT,L:H2_LHV_AUDIT*.071,col:'teal',group:'fuelcell',basis:'fuel only; rounded 71 kg/m³ reference'},
  {key:'h2-gas',n:'H₂ 700 bar',kg:H2_LHV_AUDIT,L:H2_LHV_AUDIT*.040,col:'teal',group:'fuelcell',basis:'fuel only; rounded 40 kg/m³ reference'},
  // DOE Physical Hydrogen Storage, projected 5.6 kg usable single Type IV tank:
  // 1.4 kWh/kg system and 0.8 kWh/L system (not an uncontained-gas density).
  {key:'h2-system',n:'H₂ + tank',kg:1.4*3.6,L:.8*3.6,col:'teal',group:'fuelcell',basis:'DOE 700 bar single-tank system projection'},
  // Named manufacturer examples: nominal voltage × rated capacity, not a
  // measurement of integrated discharge energy or a universal chemistry range.
  {key:'lead',n:'NP7-12 lead-acid',kg:leadE/2.20,L:leadE/(151*65*97.5/1e6),col:'purple',group:'electric',basis:'12 V × 7 Ah; 2.20 kg; terminal-height bounding box'},
  {key:'li',n:'NCR18650BF Li-ion',kg:cellE/.0475,L:cellE/(Math.PI*(18.6/2)**2*65.3/1e6),col:'green',group:'electric',basis:'3.6 V × minimum 3.25 Ah; max approximate mass/envelope'},
  // DOE Vol1 NP01pp60–62: rounded reactor heat accounting ≈200 MeV/fission.
  // NIST isotopic mass; 18.95 kg/L natural-U density is only a metal reference.
  {key:'u235',n:'U-235 ideal',kg:uraniumE,L:uraniumE*18.95,col:'red',group:'nuclear',basis:'all U-235 fissioned; reference metal density'},
  {key:'lwr',n:'50 GWd/tU model',kg:50e9*86400/1000/1e6,L:50e9*86400/1000/1e6*9.2,col:'red',group:'nuclear',basis:'chosen burnup and 9.2 kgU/L pellet reference'},
];
export function densityRequirementAudit(key,target,{useful=false,engine=.25,electric=.85,fuelcell=.5}={}){
  const item=ENERGY_DENSITY_AUDIT.find(x=>x.key===key);
  if(!item)throw new Error('Unknown energy store');
  if(useful&&item.group==='nuclear')return null;
  const eta=!useful?1:item.group==='engine'?engine:item.group==='electric'?electric:fuelcell;
  const stored=target/eta;
  return {item,eta,stored,kg:stored/item.kg,L:stored/item.L};
}
