import { countCycles } from './profession-models.mjs';
import { calendarDescription, cycleDescription, traceFigure, caseLabels } from './profession-views.mjs';
const $=id=>document.getElementById(id);
export function applyProfession(r,s) {
  if(r.activity.type==='case-reasoning') {
    const c=r.activity.cases.find(c=>c.id===s.case);
    $('case-facts').textContent=c.facts;
    $('case-calendar').textContent=calendarDescription(c);
    $('case-feedback').textContent='';
  }
  if(r.activity.type==='cycle-observation') {
    const t=r.activity.traces.find(t=>t.id===s.trace);
    $('cycle-result').textContent=cycleDescription(countCycles(t,s.start,s.end));
    $('cycle-figure').innerHTML=traceFigure(t,s.start,s.end);
    $('phase-description').textContent=s.phase==='in' ? 'Quiet inhalation: diaphragm contracts and moves downward; chest space increases and air enters. These labels do not measure displacement or gas exchange.' : 'Quiet exhalation: diaphragm relaxes and air leaves. Forced breathing, illness and clinical interpretation are outside this qualitative example.';
  }
}
export function connectProfession(r,getState) {
  if(r.activity.type==='case-reasoning') $('case-check').addEventListener('click',()=>{
    const s=getState(),c=r.activity.cases.find(c=>c.id===s.case);
    $('case-feedback').textContent=(s.category===c.category ? 'Your selection fits this bounded guide. ' : 'Reconsider the missing facts and scope. '+caseLabels[c.category]+'. ')+c.feedback;
  });
}
