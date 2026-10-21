// Offline only: every child is guarded against browser/process/server/network work.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
const [stage,base,out]=process.argv.slice(2);assert.ok(stage&&base&&out);assert.ok(!fs.existsSync(out));fs.mkdirSync(out,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const flag='ROOT_AUTHORISED_CURVE_EDGE_PIXELS_2026_10_20',controller=path.resolve(stage,'tests/map-curve-edge-tiny.mjs');
const guard=path.resolve(out,'guard.cjs'),loader=path.resolve(out,'loader.mjs');
fs.writeFileSync(guard,`const fs=require('node:fs');const log=process.env.PEER_GUARD_LOG;const events=[];const save=()=>fs.writeFileSync(log,JSON.stringify({events}));const block=k=>(...args)=>{events.push(k);save();throw Error('forbidden offline operation '+k);};for(const [m,keys] of [['node:http',['createServer','request','get']],['node:https',['createServer','request','get']],['node:net',['connect','createConnection']],['node:tls',['connect','createServer']],['node:dgram',['createSocket']],['node:child_process',['spawn','spawnSync','exec','execSync','execFile','execFileSync','fork']]])for(const k of keys)require(m)[k]=block(m+'.'+k);require('node:net').Server.prototype.listen=block('listen');global.fetch=block('fetch');global.WebSocket=block('WebSocket');require('node:module').syncBuiltinESMExports();save();`);
fs.writeFileSync(loader,`import fs from 'node:fs';export async function resolve(specifier,context,next){if(/playwright|puppeteer/.test(specifier)){fs.writeFileSync(process.env.PEER_LOADER_LOG,JSON.stringify({blocked:specifier}));throw Error('browser module forbidden during preparation');}return next(specifier,context);}`);
const rows=[];const persist=()=>fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({nativeEvidence:false,rows},null,2));
function child(name,args,{expected=1,runFlag,existsAfter}={}){
 const log=path.resolve(out,name+'-guard.json'),esm=path.resolve(out,name+'-loader.json');
 const env={...process.env,PEER_GUARD_LOG:log,PEER_LOADER_LOG:esm};delete env.NODE_OPTIONS;delete env.MAP_CURVE_EDGE_ROOT_RUN;if(runFlag!==undefined)env.MAP_CURVE_EDGE_ROOT_RUN=runFlag;
 const r=spawnSync(process.execPath,['--require',guard,'--experimental-loader',loader,controller,...args],{env,cwd:stage,encoding:'utf8',maxBuffer:1_000_000});
 fs.writeFileSync(path.join(out,name+'.log'),(r.stdout||'')+(r.stderr||''));const row={name,status:r.status,expected,error:r.error?.message??null,guard:fs.existsSync(log)?JSON.parse(fs.readFileSync(log)):null,browserImportAttempt:fs.existsSync(esm)?JSON.parse(fs.readFileSync(esm)):null};rows.push(row);persist();
 assert.equal(r.status,expected);assert.deepEqual(row.guard?.events,[]);assert.equal(row.browserImportAttempt,null);if(existsAfter!==undefined)assert.equal(fs.existsSync(args.at(-1)),existsAfter);row.pass=true;persist();
}
const prepared=path.resolve(out,'default-prepared');
child('default-even-with-authorising-flag',[path.resolve(base),prepared],{expected:0,runFlag:flag});
const manifest=path.join(prepared,'prepared.json'),before=hash(fs.readFileSync(manifest));
child('default-output-collision',[path.resolve(base),prepared]);assert.equal(hash(fs.readFileSync(manifest)),before);
child('native-output-collision',['--run-root-only',manifest,prepared],{runFlag:flag});assert.equal(hash(fs.readFileSync(manifest)),before);
child('native-missing-flag',['--run-root-only',manifest,path.resolve(out,'denied-no-flag')],{existsAfter:false});
child('native-near-miss-flag',['--run-root-only',manifest,path.resolve(out,'denied-near-flag')],{runFlag:flag+'x',existsAfter:false});
child('near-miss-cli-mode',['--run-root-onlyx',manifest,path.resolve(out,'denied-mode')],{runFlag:flag,existsAfter:false});
child('extra-default-argument',[path.resolve(base),path.resolve(out,'denied-extra'),'extra'],{existsAfter:false});
const facts=JSON.parse(fs.readFileSync(manifest));assert.equal(facts.preflight.length,32);assert.equal(facts.recipes.length,32);assert.equal(Object.keys(facts.sourceHashes).length,11);
assert.equal(facts.browserStarted,false);assert.equal(facts.serverStarted,false);assert.equal(facts.networkStarted,false);
const evidence={runtime:{node:process.version,v8:process.versions.v8,platform:process.platform,arch:process.arch},nativeEvidence:false,childCount:rows.length,allGuardsQuiet:true,manifestSHA256:before,recipes:facts.recipes,preflight:facts.preflight,rows};
fs.writeFileSync(path.join(out,'complete.json'),JSON.stringify(evidence,null,2));console.log(JSON.stringify({pass:true,children:rows.length,recipes:32,zeroBrowserServerNetwork:true,out}));
