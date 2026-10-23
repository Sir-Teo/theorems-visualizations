// Original daily netting exercise. This does not recommend a field irrigation schedule.
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=x=>x!==null&&x!==''&&['number','string'].includes(typeof x)&&Number.isFinite(Number(x))?Number(x):null;
export function waterDay(model,{deficit,rain,cropUse,grossIrrigation,incomingIrrigation}){
 const d=num(deficit),r=num(rain),e=num(cropUse),measured=incomingIrrigation!==undefined;
 const input=num(measured?incomingIrrigation:grossIrrigation),capacity=num(model.capacity),fraction=num(model.boundaryDeliveryFraction),rate=num(model.grossDeliveryRate),limit=num(model.maximumHoursPerDay);
 if([d,r,e,input,capacity,fraction,rate,limit].some(x=>x===null))return {error:'unknown-input'};
 if([d,r,e,input].some(x=>x<0)||d>capacity||capacity<=0||fraction<0||fraction>1||rate<=0||limit<=0)return {error:'outside-assumed-range'};
 const hours=measured?null:input/rate;
 if(hours!==null&&hours>limit+1e-10)return {error:'infeasible-in-one-day',hours};
 const incoming=measured?input:input*fraction,loss=measured?null:input-incoming,raw=d+e-r-incoming;
 if(raw>capacity+1e-10)return {error:'outside-assumed-range',raw,hours};
 const surplus=Math.max(0,-raw),end=Math.max(0,raw);
 return {deficit:end,storage:capacity-end,raw,incoming,loss,surplus,hours};
}
export function waterSequence(model,s){let deficit=s.initialDeficit;return s.days.map(day=>{const result=deficit===null?{error:'prior-row-unresolved'}:waterDay(model,{deficit,...day});deficit=result.error?null:result.deficit;return {day:day.day,...result};});}
export function normalizeWater(r,raw){if(r.activity.type!=='water-ledger')return {};const a=r.activity;return {sequence:a.sequences.some(s=>s.id===raw.sequence)?raw.sequence:a.sequences[0].id,gross:num(raw.gross)===null?(raw.gross===undefined?'0.5':''):(Math.abs(Number(raw.gross))<=10?String(Number(raw.gross)):'')};}
export function validateWater(a){
 if(a?.type!=='water-ledger')return [];
 const errors=[];
 if(!a.model||['capacity','boundaryDeliveryFraction','grossDeliveryRate','maximumHoursPerDay'].some(k=>num(a.model[k])===null))return ['Water model quantities missing'];
 if(Number(a.model.capacity)!==3.24||Number(a.model.boundaryDeliveryFraction)!==.8||Number(a.model.grossDeliveryRate)!==.025||Number(a.model.maximumHoursPerDay)!==24)errors.push('Unreviewed water-model envelope; update model and fixtures explicitly');
 if(!Array.isArray(a.sequences)||a.sequences.length!==4||!a.sequences.every(s=>s&&/^[a-z][a-z0-9-]*$/.test(s.id)&&Array.isArray(s.days)&&s.days.length===3))return [...errors,'Four bounded water paths required'];
 if(new Set(a.sequences.map(s=>s.id)).size!==a.sequences.length)errors.push('Duplicate water path');
 for(const s of a.sequences){
  if(s.days.some((d,i)=>!d||d.day!==i+1)) {errors.push('Water days must be ordered');continue;}
  const rows=waterSequence(a.model,s);
  if(rows.some((r,i)=>r.error||num(s.days[i].expectedEndDeficit)===null||Math.abs(r.deficit-Number(s.days[i].expectedEndDeficit))>1e-9))errors.push('Water path disagrees with its supplied fixtures');
 }
 return errors;
}
const rounded=x=>x===null?'not inferred':Number(x.toFixed(6));
function table(a,s){const rows=waterSequence(a.model,s);return `<h3>${esc(s.id.replaceAll('-',' '))}</h3><p>Rain: ${esc(s.rainProvenance)}. All quantities are fictional, in inches of water. Scroll the table horizontally on a narrow screen; keyboard users can focus the table region and use arrow keys.</p><div class="table-scroll" tabindex="0" role="region" aria-label="Daily water budget"><table class="water-budget-table"><caption>Three-day path; daily order within each day is unresolved</caption><thead><tr><th>Day</th><th>Rain</th><th>Crop use</th><th>Gross irrigation</th><th>Boundary input</th><th>End deficit</th><th>Hours</th></tr></thead><tbody>${s.days.map((d,i)=>`<tr><th>${d.day}</th><td>${d.rain}</td><td>${d.cropUse}</td><td>${d.grossIrrigation}</td><td>${rows[i].error?'unknown':rounded(rows[i].incoming)}</td><td>${rows[i].error?esc(rows[i].error):rounded(rows[i].deficit)}</td><td>${rows[i].error?'unknown':rounded(rows[i].hours)}</td></tr>`).join('')}</tbody></table></div>`;}
export function waterDescription(r){if(r.error)return r.error==='infeasible-in-one-day'?`The request needs ${rounded(r.hours)} hours, more than the available 24. No water is silently delivered or truncated.`:r.error==='unknown-input'?'An input is missing: the result is unknown, not zero.':'The assumptions no longer supply a valid ending storage; stop this path.';return `Boundary input ${rounded(r.incoming)} in; delivery loss ${rounded(r.loss)} in; surplus outflow ${rounded(r.surplus)} in; ending deficit ${rounded(r.deficit)} in; storage ${rounded(r.storage)} in; operating hours ${rounded(r.hours)}. This is an illustrative balance, not an approved field action.`;}
export function renderWater(r){
 const a=r.activity;if(a.type!=='water-ledger')return '';
 return `<p>Capacity is an assumed 36 × 0.09 = 3.24 inches. Gross delivery is 0.025 inches/hour; 80% crosses the selected boundary. The fraction is not a claim about final stored-water efficiency.</p><div class="interactive" hidden><label for="sequence">Compare a daily path</label><select id="sequence">${a.sequences.map(s=>`<option value="${s.id}">${esc(s.id.replaceAll('-',' '))}</option>`).join('')}</select><div id="water-path"></div><label for="gross">Independent one-day gross request (inches)</label><input id="gross" data-model type="number" min="0" max="10" step="any"><p>Hold starting deficit 1.00, rain 0.10 and crop use 0.25 inches fixed for this separate calculation.</p><p id="water-result" role="status"></p></div><details class="static-guide"><summary>Read all four paths and boundary cases</summary>${a.sequences.map(s=>table(a,s)).join('')}<h3>Delivery and evidence boundaries</h3><ul>${a.boundaryNotes.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details>`;
}
export function applyWater(r,s){if(r.activity.type!=='water-ledger')return;document.getElementById('water-path').innerHTML=table(r.activity,r.activity.sequences.find(x=>x.id===s.sequence));document.getElementById('water-result').textContent=waterDescription(waterDay(r.activity.model,{deficit:1,rain:.1,cropUse:.25,grossIrrigation:s.gross}));}
