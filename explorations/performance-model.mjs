export const REGIONS={full:[0,8],first:[0,4],second:[4,8]};
export function normalizePerformance(a,raw={}) {
  const version=a.versions.some(x=>x.id===raw.version)?raw.version:a.versions[0].id;
  const bpm=a.tempos.includes(Number(raw.bpm))?Number(raw.bpm):90;
  const region=Object.hasOwn(REGIONS,raw.region)?raw.region:'full', [start,end]=REGIONS[region];
  const n=Number(raw.cursor), cursor=raw.cursor!==undefined&&Number.isFinite(n)&&n>=start&&n<=end?n:start;
  const volume=raw.volume!==undefined&&raw.volume!==''&&Number.isFinite(Number(raw.volume))&&Number(raw.volume)>=0&&Number(raw.volume)<=1?Number(raw.volume):0.35;
  return {version,bpm:String(bpm),region,event:a.events.some(x=>x.id===raw.event)?raw.event:a.events[0].id,cursor:String(Math.round(cursor*1000)/1000),volume:String(volume)};
}
export function performanceEvents(a,version,bpm) {
  const v=a.versions.find(x=>x.id===version);if(!v || !a.tempos.includes(Number(bpm)))throw new Error('Unsupported version/tempo');
  const secondsPerBeat=60/Number(bpm);
  return a.events.map((e,i)=>({...e,seconds:e.beat*secondsPerBeat,duration:v.gateBeats*secondsPerBeat,
    gap:((a.events[i+1]?.beat??a.spanBeats)-e.beat-v.gateBeats)*secondsPerBeat}));
}
export function renderSignal(a,version,bpm,sampleRate=48000,region='full') {
  if(![22050,44100,48000].includes(sampleRate)||!Object.hasOwn(REGIONS,region))throw new Error('Unsupported rendering parameters');
  const events=performanceEvents(a,version,bpm), [start,end]=REGIONS[region], secondsPerBeat=60/Number(bpm);
  const startFrame=Math.round(start*secondsPerBeat*sampleRate), endFrame=Math.round(end*secondsPerBeat*sampleRate);
  const pcm=new Float32Array(endFrame-startFrame);
  for(const e of events) {
    const onset=Math.round(e.seconds*sampleRate), duration=Math.round(e.duration*sampleRate);
    for(let frame=Math.max(onset,startFrame);frame<Math.min(onset+duration,endFrame);frame++) {
      const t=(frame-onset)/sampleRate, remaining=(onset+duration-frame)/sampleRate;
      const envelope=Math.max(0,Math.min(1,t/a.synthesis.attackSeconds,remaining/a.synthesis.releaseSeconds));
      pcm[frame-startFrame]+=a.synthesis.peakGain*envelope*Math.sin(2*Math.PI*a.synthesis.frequencyHz*t);
    }
  }
  return pcm;
}
export function performanceProvenance(record,raw={}) {
  const a=record.activity,s=normalizePerformance(a,raw),sampleRate=48000,[start,end]=REGIONS[s.region],bpm=Number(s.bpm);
  return {schemaVersion:1,explorationId:record.id,revision:record.revision,title:record.title,
    renderer:{id:'atlas-sine-envelope',version:1,formula:'Each onset and tone length rounds to the nearest sample. Float32 sample = peakGain * max(0,min(1,t/attackSeconds,remaining/releaseSeconds)) * sin(2*pi*frequencyHz*t); t and remaining are seconds from onset and to the exclusive tone end. PCM16 = round(sample*32767).'},
    selection:{version:s.version,bpm,region:s.region},format:{sampleRate,channels:1,bitsPerSample:16},
    region:{startBeat:start,endBeat:end,startFrame:Math.round(start*60/bpm*sampleRate),endFrame:Math.round(end*60/bpm*sampleRate)},
    events:performanceEvents(a,s.version,bpm),synthesis:{...a.synthesis},assetRights:{...a.assetRights},
    limits:'Generated stimulus, not a human performance. Pending release proposal is not a licence grant. Playback volume, cursor and private notes are not part of the exported signal.'};
}
export function encodeWav(pcm,sampleRate=48000,provenance) {
  // RIFF INFO strings are NUL-terminated ASCII; JSON escapes preserve Unicode.
  const comment=provenance?new TextEncoder().encode(JSON.stringify(provenance).replace(/[\u007f-\uffff]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'))+'\0'):null;
  const padded=comment?comment.length+(comment.length%2):0;
  const bytes=new Uint8Array(44+pcm.length*2+(comment?20+padded:0)), view=new DataView(bytes.buffer);
  const tag=(offset,s)=>{for(let i=0;i<s.length;i++)view.setUint8(offset+i,s.charCodeAt(i));};
  tag(0,'RIFF');view.setUint32(4,bytes.length-8,true);tag(8,'WAVE');tag(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);tag(36,'data');view.setUint32(40,pcm.length*2,true);
  pcm.forEach((x,i)=>{if(!Number.isFinite(x)||Math.abs(x)>1)throw new Error('Invalid or clipped signal');view.setInt16(44+i*2,Math.round(x*32767),true);});
  if(comment){const offset=44+pcm.length*2;tag(offset,'LIST');view.setUint32(offset+4,12+padded,true);tag(offset+8,'INFO');tag(offset+12,'ICMT');view.setUint32(offset+16,comment.length,true);bytes.set(comment,offset+20);}
  return bytes;
}
export function validatePerformance(a) {
  const e=[], check=(ok,s)=>{if(!ok)e.push(s);};
  check(a.spanBeats===8,'phrase span must be eight beats');check(JSON.stringify(a.tempos)==='[60,90,120]','reviewed tempos are 60, 90 and 120 BPM');
  check(Array.isArray(a.events)&&a.events.length===9&&a.events.every((x,i)=>x&&/^e[1-9]$/.test(x.id)&&x.id==='e'+(i+1)&&Number.isFinite(x.beat)&&x.beat>=0&&x.beat<8&&(i===0||x.beat>a.events[i-1].beat)),'nine ordered, identified phrase events required');
  check(Array.isArray(a.versions)&&a.versions.length===2&&a.versions.every((x,i)=>x&&x.id===['short','sustained'][i]&&typeof x.label==='string'&&x.label.trim()&&x.gateBeats===[0.12,0.42][i]),'reviewed envelope versions required');
  check(a.synthesis?.waveform==='sine'&&a.synthesis.frequencyHz===440&&a.synthesis.peakGain===0.18&&a.synthesis.attackSeconds===0.005&&a.synthesis.releaseSeconds===0.015,'reviewed synthesis parameters required');
  check(a.assetRights?.status==='local-draft'&&typeof a.assetRights?.provenance==='string'&&a.assetRights.provenance.trim()&&typeof a.assetRights?.releaseProposal==='string'&&a.assetRights.releaseProposal.trim(),'original asset provenance and pending release terms required');
  if(!e.length)for(const v of a.versions)for(const row of performanceEvents(a,v.id,120))check(row.gap>=0&&row.duration>0.02,'tone overlap or envelope too short for the reviewed model');
  return e;
}
