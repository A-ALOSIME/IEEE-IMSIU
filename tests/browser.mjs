import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:4321';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{const context=await browser.newContext({locale:'ar-SA',extraHTTPHeaders:{'X-Dev-Email':'admin@example.test'}});const page=await context.newPage(),errors=[];page.setDefaultTimeout(25000);page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});page.on('pageerror',error=>errors.push(error.message));
await page.goto(origin+'/',{waitUntil:'domcontentloaded'});assert.equal(await page.locator('h1').first().textContent(),'مجتمع تقني يصنع أثرًا يتجاوز القاعة');assert.equal(await page.locator('html').getAttribute('dir'),'rtl');
await page.goto(origin+'/events',{waitUntil:'domcontentloaded'});assert.ok(await page.locator('.card').count()>0);
await page.goto(origin+'/admin',{waitUntil:'commit'});await page.locator('h1').first().waitFor();assert.equal(await page.locator('h1').first().textContent(),'الرئيسية');assert.equal(await page.locator('.preview-strip:visible').count(),0);assert.ok((await page.locator('.account').textContent()).includes('admin@example.test'));
await page.setViewportSize({width:390,height:844});assert.equal(await page.locator('.mobile-menu').isVisible(),true);assert.deepEqual(errors,[]);console.log('PASS: public RTL pages and responsive live administration render without browser errors');}finally{await browser.close();}
