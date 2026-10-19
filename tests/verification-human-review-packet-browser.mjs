// Synthetic form interaction only; this must never grant actual human credit.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser,installBrowserAssets} from '../scripts/browser.mjs';
const server=createServer({verificationAssets:true});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const syntheticReviewer='AUTOMATED PACKET TEST — NOT A HUMAN REVIEW';
try{
 const context=await browser.newContext({viewport:{width:1400,height:1100},acceptDownloads:true});
 await installBrowserAssets(context,{local:true});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/docs/verification/human-review.html`);
 assert.equal(await page.locator('nav button').count(),339);
 await page.frameLocator('#page').locator('#app[data-route]').waitFor();
 // The required name guard is actual worksheet behavior, not skipped by the test.
 await page.locator('#export').click();
 assert.match(await page.locator('#state').innerText(),/Enter the actual human reviewer/);
 await page.locator('nav button').nth(1).click();
 await page.locator('#reviewer').pressSequentially(syntheticReviewer);
 await page.waitForFunction(name=>document.getElementById('reviewer').value===name&&saved.reviewer===name&&JSON.parse(localStorage.getItem(key)).reviewer===name,syntheticReviewer);
 await page.locator('#notes').pressSequentially('Automated form test only; no human findings.');
 await page.locator('#reviewed').check();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem(key)).records[packet.sample[1].id]?.reviewed===true);
 assert.match(await page.locator('#progress').innerText(),/1 \/ 339/);
 await page.reload();
 await page.waitForFunction(name=>document.getElementById('reviewer').value===name&&saved.reviewer===name,syntheticReviewer);
 assert.match(await page.locator('#progress').innerText(),/1 \/ 339/);
 await page.locator('nav button').nth(1).click();
 assert.equal(await page.locator('#notes').inputValue(),'Automated form test only; no human findings.');
 assert.equal(await page.locator('#reviewed').isChecked(),true);
 const downloaded=page.waitForEvent('download');
 await page.locator('#export').click();
 const download=await downloaded,output=JSON.parse(readFileSync(await download.path(),'utf8'));
 assert.equal(output.reviewer,syntheticReviewer);
 assert.equal(output.records.length,1);
 assert.equal(output.records[0].sourceCurrent,true);
 // Isolated stored-data fixture: changed sources invalidate credit and retain notes.
 await page.evaluate(()=>{const previous=JSON.parse(localStorage.getItem(key));previous.records[packet.sample[1].id].sourceHash='synthetic stale-source fixture';localStorage.setItem(key,JSON.stringify(previous));});
 await page.reload();
 await page.locator('nav button').nth(1).click();
 assert.equal(await page.locator('#reviewed').isChecked(),false);
 assert.match(await page.locator('#state').innerText(),/source changed/);
 assert.match(await page.locator('#progress').innerText(),/0 \/ 339/);
 assert.equal(await page.locator('#notes').inputValue(),'Automated form test only; no human findings.');
 assert.deepEqual(errors,[]);
 const sample=JSON.parse(readFileSync(new URL('../docs/verification/human-sample.json',import.meta.url),'utf8'));
 assert.equal(sample.humanReviewsRecorded,0);
 console.log('339 links, embedded atlas route, actual typing, saved name/notes/review after reload, parsed export and stale-source rejection pass.');
 console.log('Synthetic test context discarded; actual human review remains 0/339.');
 await context.close();
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
