import {applyStudio, connectStudio} from './studio-ui.mjs';
import { argumentAssessment, storageResult } from './method-models.mjs';
import { scatter } from './method-views.mjs';
const $=id=>document.getElementById(id);
export function applyMethod(record,state) {
  applyStudio(record,state);
  const a=record.activity;
  if(a.type==='argument-map') {
    const result=argumentAssessment(record,state), list=$('argument-list');list.replaceChildren();
    $('role-context').textContent=state.actor==='music' ? 'Start from the music lover’s perspective; the other person still needs quiet. Reversing roles asks which treatment is acceptable in the relevant position, without assuming identical tastes.' : 'Start from the quiet seeker’s perspective; the other person still enjoys music. Consider both needs; changing perspective does not make the other preference disappear.';
    $('argument-source').textContent='Selected source: '+record.passages.find(p=>p.id===result.guide.passageId).title+'. All premises below are editorial additions or interpretations.';
    for(const [i,p] of result.selected.entries()) {
      const li=document.createElement('li'), para=document.createElement('p');para.textContent=p.kind.replaceAll('-',' ')+': '+p.text;li.append(para);
      for(const [action,label,disabled] of [['up','Move up',i===0],['down','Move down',i===result.selected.length-1],['remove','Remove',false]]) {
        const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.premise=p.id;b.dataset.move=action;b.disabled=disabled;b.setAttribute('aria-label',label+' premise '+(i+1));li.append(b);
      }list.append(li);
    }
    $('argument-feedback').textContent=result.message+' List order is yours to explain; no logical validity or moral score is computed.';
    $('premise-preview').textContent=a.premises.find(p=>p.id===$('premise-choice').value).text;
    $('action-objection').textContent='Proposed action: '+a.actions.find(x=>x.id===state.action).label+'. Consider an objection: '+result.actionObjection;
  } else if(a.type==='measured-data') {
    const d=a.dataset, rows=d.rows.filter(r=>r.Sample_ID===state.sample), select=$('point');select.replaceChildren();
    for(const r of rows) {const o=document.createElement('option');o.value=String(r.sourceRow);o.textContent=`Row ${r.sourceRow} · ${r.MPa_Abs} MPa · ${r.Vol_Water}% · ${d.instrumentLabels[r.Hypropfilter]}`;select.append(o);}select.value=state.point;
    const r=rows.find(r=>String(r.sourceRow)===state.point);
    $('point-detail').textContent=`Observed source row ${r.sourceRow}: ${r.MPa_Abs} MPa water-potential magnitude; ${r.Vol_Water}% reported water content; ${d.instrumentLabels[r.Hypropfilter]}; depth ${r.Depth_cm} cm; sampled ${r.Sampling_Date}.`;
    // Authored data validated by the build; scatter escapes strings and generates numeric coordinates.
    $('measured-plot').innerHTML=scatter(d,state.sample,state.compare,state.point);
    $('plot-legend').textContent=`Circles: ${state.sample}. ${state.compare==='none'?'No comparison sample.':'Squares: '+state.compare+'.'} Ring: selected observation. Observed points only; no connecting curve. On a narrow screen, scroll the chart horizontally.`;
    const result=storageResult(state);$('model-result').textContent=result.error || `Synthetic storage difference: ${Number(result.mm.toFixed(6))} mm. These parameters are independent of the observed dataset.`;
  }
}
export function connectMethod(record,getState,change) {
  connectStudio(record,getState,change);
  const a=record.activity;
  if(a.type==='argument-map') {
    $('premise-choice').addEventListener('change',()=>{ $('premise-preview').textContent=a.premises.find(p=>p.id===$('premise-choice').value).text; });
    $('load-guide').addEventListener('click',()=>{const s=getState(), g=a.guides.find(x=>x.id===s.guide);change({...s,premises:g.premiseIds.join(','),action:g.action});});
    $('add-premise').addEventListener('click',()=>{const s=getState();change({...s,premises:[...new Set([...s.premises.split(',').filter(Boolean),$('premise-choice').value])].join(',')});});
    $('argument-list').addEventListener('click',event=>{
      const b=event.target.closest('button[data-premise]');if(!b)return;
      const s=getState(), ids=s.premises.split(',').filter(Boolean), i=ids.indexOf(b.dataset.premise);if(i<0)return;
      const action=b.dataset.move;
      if(action==='remove')ids.splice(i,1);else {const j=i+(action==='up'?-1:1);if(j<0||j>=ids.length)return;[ids[i],ids[j]]=[ids[j],ids[i]];}
      change({...s,premises:ids.join(',')});
      // Re-render replaces buttons. Keep keyboard focus in a predictable place.
      const next=[...$('argument-list').querySelectorAll('button')].find(x=>x.dataset.premise===b.dataset.premise && x.dataset.move===action && !x.disabled);
      (next || $('add-premise')).focus();
    });
  }
  for(const input of document.querySelectorAll('[data-model]'))input.addEventListener('change',()=>change({...getState(),[input.id]:input.value}));
}
