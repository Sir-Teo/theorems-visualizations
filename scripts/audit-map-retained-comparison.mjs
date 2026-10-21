// Run only inside a coordinated, bounded browser/CPU hold. Not a production gate.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
const exec=promisify(execFile),root=fileURLToPath(new URL('../',import.meta.url)),output=process.argv[2]||'/tmp/atlas-map-retained-performance.json';
const paths=['assets/js/graph.js','assets/js/viz/core.js',...['map-webgl-scene','map-scene-decorations','map-scene-edges','map-scene-gl','map-scene-model','map-scene-painter','map-scene-text','map-scene-worker','map-scene-retained'].map(n=>'assets/js/'+n+'.js'),'scripts/audit-map-retained.mjs','scripts/audit-map-retained-comparison.mjs','scripts/lib/map-scene-prototype.mjs','scripts/lib/map-retained-prototype.mjs','data/index.json','data/planned.json'];
const hashes=async()=>Object.fromEntries(await Promise.all(paths.map(async path=>[path,createHash('sha256').update(await readFile(new URL('../'+path,import.meta.url))).digest('hex')])));
const command=async(name,args)=>(await exec(name,args,{cwd:root,maxBuffer:4_000_000})).stdout;
async function snapshot(){const [processes,top,power]=await Promise.all([command('ps',['-Ao','pid,pcpu,comm','-r']),command('top',['-l','2','-s','1','-n','0']),command('pmset',['-g','batt'])]);return{utc:new Date().toISOString(),topProcesses:processes.split('\n').slice(0,21).join('\n'),top,power};}
const uncontrolled=process.argv.includes('--uncontrolled'),manifest={scope:uncontrolled?'12 uncontrolled protocol conditions replayed for fallback/cap correctness; no timing evidence':'12 controlled matched cases, light DPR2; bounded diagnostic, no full-map gate closure',before:await snapshot(),hashesBefore:await hashes(),runs:[]};
const save=async complete=>{await writeFile(output,JSON.stringify({complete,status:manifest.failure?'FAILED ATTEMPT: '+manifest.failure.message:uncontrolled?'UNCONTROLLED CORRECTNESS REPLAY: cadence is not performance evidence':'ISOLATED EXPERIMENT: production Canvas remains unchanged',manifest},null,2)+'\n');};
await save(false);
let failure;try{for(const regime of ['1440x1000@2','3840x2160@2'])for(const backend of ['canvas','retained']){
 const runPath=output.replace(/\.json$/,'')+`-${backend}-${regime}.json`,args=['scripts/audit-map-retained.mjs',runPath,'--full-chrome','--metal','--baseline','--frames=24','--regime='+regime,'--modes=detail-zoom,focus,pan-detail',...(backend==='retained'?['--retained']:[])],run={backend,regime,command:[process.execPath,...args],started:new Date().toISOString()};
 manifest.runs.push(run);await save(false);
 try{run.stdout=await command(process.execPath,args);run.exit=0;}catch(error){run.exit=error.code;run.stdout=error.stdout;run.stderr=error.stderr;}
 run.ended=new Date().toISOString();try{run.artifact=JSON.parse(await readFile(runPath,'utf8'));}catch(error){run.artifactError=error.message;}await save(false);
 assert.equal(run.exit,0,run.stderr);assert.equal(run.artifact.complete,true);assert.equal(run.artifact.results.length,3);assert.match(run.artifact.renderer.renderer,/Metal Renderer: Apple M1/);console.log(run.stdout.trim());
}
}catch(error){failure=error;manifest.failure={message:error.message};}finally{manifest.after=await snapshot();manifest.hashesAfter=await hashes();try{assert.deepEqual(manifest.hashesAfter,manifest.hashesBefore,'Source/data changed during the matched window');}catch(error){failure??=error;manifest.failure??={message:error.message};}await save(!failure);}if(failure)throw failure;
