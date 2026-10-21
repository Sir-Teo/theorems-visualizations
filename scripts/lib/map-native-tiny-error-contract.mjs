// Node-side output assertion only. Never filters, suppresses, retries or rewrites a native event/error.
import assert from'node:assert/strict';
export function assertNativeTinyErrorContract(row){
 assert.ok(['old','repair'].includes(row.variant),'known tiny source variant');assert.ok(['S1','S2','S3'].includes(row.caseName),'known tiny fault case');assert.equal(row.fixtureFailure??null,null,'no fixture failure');
 const intentional='declared tiny native worker failure',native='Uncaught Error: '+intentional,reference='Uncaught ReferenceError: map is not defined';
 const expectedPages=row.caseName==='S1'?(row.variant==='old'?['map is not defined',intentional]:[intentional]):[];assert.deepEqual(row.pageErrors,expectedPages,'exact declared pageerror identity, count and order');
 const actual=row.events.filter(e=>['native-worker-error','actual-worker-error-dispatch','window-error','fixture-failure'].includes(e.type)).map(e=>({type:e.type,message:e.message,isTrusted:e.isTrusted,phase:e.phase??null}));
 const expected=[];if(row.caseName==='S1'){expected.push({type:'native-worker-error',message:native,isTrusted:true,phase:null});if(row.variant==='old')expected.push({type:'window-error',message:reference,isTrusted:true,phase:'fault'});expected.push({type:'actual-worker-error-dispatch',message:native,isTrusted:true,phase:'fault'},{type:'window-error',message:native,isTrusted:true,phase:'fault'})}assert.deepEqual(actual,expected,'exact real Worker/window error identities, trust, phase, count and order');return true;
}
