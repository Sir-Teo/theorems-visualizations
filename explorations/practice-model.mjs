// Canonical coordinates always identify the same strips; a view never mutates them.
export const WEAVE_SIZE = 6;
export const plainWeave = () => Array.from({length:36},(_,i)=>(Math.floor(i/6)+i%6)%2===0?'1':'0').join('');
export function normalizeWeave(raw={}) {
  const integer=(v,min,max,fallback)=>Number.isInteger(Number(v)) && Number(v)>=min && Number(v)<=max ? String(Number(v)):String(fallback);
  return {view:raw.view==='back'?'back':'front',row:integer(raw.row,1,6,1),column:integer(raw.column,1,6,1),
    cells:typeof raw.cells==='string' && /^[01]{36}$/.test(raw.cells)?raw.cells:plainWeave(),
    repairs:typeof raw.repairs==='string' && /^(?:[1-6](?:,[1-6]){0,11})?$/.test(raw.repairs)?raw.repairs:'',
    step:integer(raw.step,0,6,6)};
}
export function weaveCrossing(state,row,column) {
  const s=normalizeWeave(state), front=s.cells[(row-1)*6+column-1]==='1';
  return {frontWeftOnTop:front,visibleWeft:s.view==='front'?front:!front,
    displayColumn:s.view==='front'?column:7-column};
}
export function weaveDiagnosis(raw) {
  const s=normalizeWeave(raw), expected=plainWeave(), mismatches=[], repeats=[];
  for(let r=1;r<=6;r++)for(let c=1;c<=6;c++) {
    const i=(r-1)*6+c-1;if(s.cells[i]!==expected[i])mismatches.push({row:r,column:c});
    if(c<6 && s.cells[i]===s.cells[i+1])repeats.push(`F${r}: W${c}–W${c+1}`);
    if(r<6 && s.cells[i]===s.cells[i+6])repeats.push(`W${c}: F${r}–F${r+1}`);
  }
  return {mismatches,repeats};
}
export function changeWeave(raw,action) {
  const s=normalizeWeave(raw), row=Number(s.row), i=(row-1)*6+Number(s.column)-1;
  if(action==='error')s.cells=s.cells.slice(0,i)+(s.cells[i]==='1'?'0':'1')+s.cells.slice(i+1);
  if(action==='repair') {
    const expected=plainWeave();s.cells=s.cells.slice(0,(row-1)*6)+expected.slice((row-1)*6,row*6)+s.cells.slice(row*6);
    s.repairs=[...s.repairs.split(',').filter(Boolean),s.row].slice(-12).join(',');
  }
  if(action==='restore'){s.cells=plainWeave();s.repairs='';}
  return s;
}
export function validatePractice(a) {
  const errors=[];
  if(a.size!==6)errors.push('weave grid must use the reviewed 6 by 6 contract');
  if(a.physicalEvidence?.status!=='unobserved')errors.push('physical evidence requires a separately implemented observation/asset contract');
  if(!Array.isArray(a.steps)||a.steps.length!==7||!a.steps.every(s=>s&&typeof s.title==='string'&&s.title.trim()&&typeof s.text==='string'&&s.text.trim()))errors.push('seven complete schematic steps required');
  if(!Array.isArray(a.physicalEvidence?.missing)||!a.physicalEvidence.missing.length||!a.physicalEvidence.missing.every(x=>typeof x==='string'&&x.trim()))errors.push('missing physical evidence must be explicit');
  if(a.assetRights?.status!=='local-draft'||typeof a.assetRights?.provenance!=='string'||!a.assetRights.provenance.trim()||typeof a.assetRights?.releaseProposal!=='string'||!a.assetRights.releaseProposal.trim())errors.push('original schematic provenance and proposed release terms required');
  return errors;
}
