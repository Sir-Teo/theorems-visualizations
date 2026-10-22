import {changeWeave, weaveCrossing, weaveDiagnosis} from './practice-model.mjs';
import {REGIONS, performanceEvents, performanceProvenance, renderSignal, encodeWav} from './performance-model.mjs';
import {weaveDiagram, weaveTable, eventTable, phraseDiagram} from './studio-views.mjs';
const $=id=>document.getElementById(id);
let transport;
export function applyStudio(record,state) {
  const a=record.activity;
  if(a.type==='weave-structure') {
    const row=Number(state.row), column=Number(state.column), p=weaveCrossing(state,row,column), d=weaveDiagnosis(state), inserted=row<=Number(state.step);
    $('weave-diagram').innerHTML=weaveDiagram(state);$('weave-table').innerHTML=weaveTable(state);
    $('crossing-readout').textContent=`Canonical crossing F${row}/W${column}; screen column ${p.displayColumn} in ${state.view} view. ${inserted?(p.visibleWeft?'Weft F'+row:'Warp W'+column)+' is visible on this side.':'This weft has not been inserted at the selected schematic stage.'} Front-relative plan: weft ${p.frontWeftOnTop?'over':'under'} warp.`;
    $('weave-error').disabled=!inserted;$('weave-repair').disabled=!inserted;
    $('weave-diagnosis').textContent=`Complete plan: ${d.repeats.length} adjacent repeated pairs; ${d.mismatches.length} crossings differ from the specified starting phase. ${d.repeats.length?'Repeated pairs: '+d.repeats.join('; ')+'.':'Both directions alternate. An opposite starting phase can also alternate.'}`;
    $('repair-history').textContent='Symbolic whole-strip repairs (last 12): '+(state.repairs?state.repairs.split(',').map(r=>'F'+r).join(' → '):'none')+'. This is not a record of physical making.';
  } else if(a.type==='phrase-comparison') {
    const e=performanceEvents(a,state.version,Number(state.bpm)).find(e=>e.id===state.event), n=x=>Number(x.toFixed(4));
    $('event-readout').textContent=`${e.id}: beat offset ${e.beat} (displayed beat ${e.beat+1}); onset ${n(e.seconds)} s; tone ${n(e.duration)} s; gap to next onset or span end ${n(e.gap)} s at ${state.bpm} BPM.`;
    $('phrase-diagram').innerHTML=phraseDiagram(a,state.version,Number(state.bpm),state.event);
    $('event-table').innerHTML=eventTable(a,state.version,Number(state.bpm));
    transport?.sync(state);
  }
}
export function connectStudio(record,getState,change) {
  const a=record.activity;
  if(a.type==='weave-structure') {
    for(const [id,action] of [['weave-error','error'],['weave-repair','repair'],['weave-restore','restore']])$(id).addEventListener('click',()=>change({...getState(),...changeWeave(getState(),action)}));
  } else if(a.type==='phrase-comparison') {
    const audio=$('phrase-player');let key='',url='',token=0,raf=0,previousCursor='',lastPaint=0;
    const announce=s=>$('playback-status').textContent=s;
    const halt=()=>{token++;audio.pause();cancelAnimationFrame(raf);};
    const beat=()=>{const s=getState();return Math.min(REGIONS[s.region][1],REGIONS[s.region][0]+(Number.isFinite(audio.currentTime)?audio.currentTime:0)*Number(s.bpm)/60);};
    const position=b=>{$('playback-position').textContent=`Beat offset ${b.toFixed(3)} · ${(b*60/Number(getState().bpm)).toFixed(3)} seconds from phrase start`;$('playback-position').dataset.beat=String(b);};
    const paint=now=>{if(now-lastPaint>=100){position(beat());lastPaint=now;}if(!audio.paused)raf=requestAnimationFrame(paint);};
    const wav=()=>{const s=getState();return encodeWav(renderSignal(a,s.version,Number(s.bpm),48000,s.region),48000,performanceProvenance(record,s));};
    const source=()=>{if(url)return;url=URL.createObjectURL(new Blob([wav()],{type:'audio/wav'}));audio.src=url;audio.load();};
    transport={sync(s){
      const next=[s.version,s.bpm,s.region].join(':');
      if(next!==key){halt();if(url)URL.revokeObjectURL(url);url='';audio.removeAttribute('src');audio.load();key=next;announce('Stopped. Selections are ready; press Play to hear generated audio.');}
      audio.volume=Number(s.volume);
      if(previousCursor!==s.cursor){if(audio.readyState>=1)audio.currentTime=(Number(s.cursor)-REGIONS[s.region][0])*60/Number(s.bpm);position(Number(s.cursor));previousCursor=s.cursor;}
    }};
    $('phrase-play').addEventListener('click',async()=>{
      if(!audio.paused)return;
      halt();const request=token;
      try {
        source();const s=getState(),[start,end]=REGIONS[s.region], cursor=Number(s.cursor)>=end?start:Number(s.cursor);
        // Before metadata this sets the media element's default playback-start position.
        audio.currentTime=(cursor-start)*60/Number(s.bpm);audio.volume=Number(s.volume);
        await audio.play();if(request!==token)return;
        announce('Playing generated '+a.versions.find(v=>v.id===s.version).label+' at '+s.bpm+' BPM.');raf=requestAnimationFrame(paint);
      }catch(e){if(request===token){halt();announce('Audio could not start. The event tables and interpretation task remain available. '+(e?.name||'Playback error'));}}
    });
    $('phrase-pause').addEventListener('click',()=>{const cursor=audio.readyState>=1?beat():Number(getState().cursor);halt();change({...getState(),cursor:String(cursor)});announce('Paused. The approximate beat cursor is saved; it is not evidence of what another listener heard.');});
    $('phrase-stop').addEventListener('click',()=>{halt();const s=getState();if(audio.readyState>=1)audio.currentTime=0;change({...s,cursor:String(REGIONS[s.region][0])});position(REGIONS[s.region][0]);announce('Stopped at the replay region’s start.');});
    $('phrase-seek').addEventListener('click',()=>{halt();const s=getState(), e=a.events.find(e=>e.id===s.event);change({...s,region:'full',cursor:String(e.beat)});announce('Ready at '+e.id+'. Press Play to start from this event.');});
    $('volume').addEventListener('input',()=>change({...getState(),volume:$('volume').value}));
    $('phrase-download').addEventListener('click',()=>{const s=getState(),u=URL.createObjectURL(new Blob([wav()],{type:'audio/wav'})),link=document.createElement('a');link.href=u;link.download=`original-phrase-${s.version}-${s.bpm}bpm-${s.region}.wav`;link.click();setTimeout(()=>URL.revokeObjectURL(u),1000);});
    audio.addEventListener('ended',()=>{halt();const s=getState(),end=REGIONS[s.region][1];change({...s,cursor:String(end)});position(end);announce('Replay region finished. Press Play to replay it from the start.');});
    audio.addEventListener('error',()=>{if(url)announce('Generated audio is unavailable. Use the event tables; no listening result is recorded.');});
    $('reset').addEventListener('click',()=>{halt();if(audio.readyState>=1)audio.currentTime=0;previousCursor='';announce('Stopped; selections reset.');});
    window.addEventListener('pagehide',()=>{halt();});
  }
}
