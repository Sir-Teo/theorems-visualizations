// A finite table of explicitly hypothetical premises. No evidence is altered by a selection.
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=x=>typeof x==='string'&&x.trim().length>0;
export function validateReasoning(a){
 if(a?.type!=='conditional-reasoning')return [];
 const errors=[];
 if(!Array.isArray(a.inputs)||a.inputs.length<1||a.inputs.length>5||!a.inputs.every(x=>x&&/^[a-z][a-z0-9-]*$/.test(x.id)&&text(x.label)&&text(x.boundary))||new Set(a.inputs.map(x=>x.id)).size!==a.inputs.length)return ['Invalid bounded premise inputs'];
 if(!Array.isArray(a.assumptions)||!a.assumptions.length||!a.assumptions.every(text))errors.push('Fixed assumptions missing');
 if(!Array.isArray(a.cases)||a.cases.length!==2**a.inputs.length)return [...errors,'Complete premise truth table required'];
 const keys=[];
 for(const c of a.cases){
  if(!c||!c.inputs||Object.keys(c.inputs).sort().join()!==a.inputs.map(x=>x.id).sort().join()||!a.inputs.every(x=>typeof c.inputs[x.id]==='boolean')||!Array.isArray(c.conclusions)||!c.conclusions.length||!c.conclusions.every(text)){errors.push('Malformed premise case');continue;}
  keys.push(a.inputs.map(x=>Number(c.inputs[x.id])).join(''));
 }
 if(new Set(keys).size!==2**a.inputs.length)errors.push('Duplicate or missing premise combination');
 return errors;
}
export function normalizeReasoning(r,raw){return r.activity.type==='conditional-reasoning'?Object.fromEntries(r.activity.inputs.map(x=>[x.id,raw[x.id]==='true'?'true':'false'])):{};}
export function reasoningResult(a,state){return a.cases.find(c=>a.inputs.every(x=>String(c.inputs[x.id])===state[x.id]));}
export function renderReasoning(r){
 const a=r.activity;if(a.type!=='conditional-reasoning')return '';
 return `<h3>Fixed assumptions for this exercise</h3><ul>${a.assumptions.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><div class="interactive" hidden>${a.inputs.map(x=>`<label for="${x.id}">${esc(x.label)}</label><select id="${x.id}"><option value="false">Not established in this hypothetical case</option><option value="true">Assume established in this hypothetical case</option></select><p>${esc(x.boundary)}</p>`).join('')}<div id="premise-result" role="status"></div></div><details class="static-guide"><summary>Read all ${a.cases.length} premise combinations</summary>${a.cases.map((c,i)=>`<section><h3>Case ${i+1}</h3><ul>${a.inputs.map(x=>`<li>${esc(x.label)}: ${c.inputs[x.id]?'assumed established':'not established'}</li>`).join('')}</ul><ol>${c.conclusions.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></section>`).join('')}</details>`;
}
export function applyReasoning(r,state){
 if(r.activity.type!=='conditional-reasoning')return;
 const target=document.getElementById('premise-result');target.replaceChildren();
 for(const conclusion of reasoningResult(r.activity,state).conclusions){const p=document.createElement('p');p.textContent=conclusion;target.append(p);}
}
