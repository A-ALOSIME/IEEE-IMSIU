import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:4321';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const context=await browser.newContext({locale:'ar-SA',extraHTTPHeaders:{'X-Dev-Email':'admin@example.test'}}),page=await context.newPage(),errors=[];
 page.setDefaultTimeout(25000);page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});page.on('pageerror',error=>errors.push(error.message));
 await page.goto(origin+'/',{waitUntil:'networkidle'});
 assert.match(await page.locator('h1').first().innerText(),/فضولك التقني/);assert.equal(await page.locator('html').getAttribute('dir'),'rtl');
 assert.ok((await page.locator('.site-header .brand').boundingBox()).width>=200);assert.equal(await page.locator('.partner-logo').count(),18);assert.equal(await page.locator('.social-links a').count(),4);
 const navBox=await page.locator('#site-nav').boundingBox();assert.ok(Math.abs(navBox.x+navBox.width/2-640)<90);
 await page.locator('[data-theme-toggle]').click();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');assert.equal(await page.locator('.site-header .brand-color').isVisible(),false);assert.equal(await page.locator('.site-header .brand-white').isVisible(),true);
 await page.goto(origin+'/events',{waitUntil:'networkidle'});assert.ok(await page.locator('.card').count()>0);assert.doesNotMatch(await page.locator('.card .meta').first().innerText(),/17:00/);assert.match(await page.locator('.card .meta').first().innerText(),/5:00/);
 await page.goto(origin+'/events/archive',{waitUntil:'networkidle'});assert.ok(await page.locator('.archive-card').count()>=20);assert.ok(await page.locator('.archive-card img').first().evaluate(image=>image.naturalWidth>0));
 await page.locator('[data-lang-toggle]').click();await page.goto(origin+'/impact',{waitUntil:'networkidle'});assert.equal(await page.locator('html').getAttribute('lang'),'en');assert.equal(await page.locator('html').getAttribute('dir'),'ltr');assert.equal(await page.locator('nav a[href="/impact"]').textContent(),'Impact');assert.match(await page.locator('h1').innerText(),/Impact made/);assert.equal(await page.locator('.site-header .brand-white').isVisible(),true);
 await page.locator('[data-lang-toggle]').click();assert.equal(await page.locator('html').getAttribute('lang'),'ar');assert.match(await page.locator('h1').innerText(),/أثر تصنعه/);
 await page.goto(origin+'/admin',{waitUntil:'commit'});await page.locator('h1').first().waitFor();assert.equal(await page.locator('h1').first().textContent(),'الرئيسية');assert.equal(await page.locator('.preview-strip:visible').count(),0);assert.ok((await page.locator('.account').textContent()).includes('admin@example.test'));
 await page.setViewportSize({width:390,height:844});assert.equal(await page.locator('.mobile-menu').isVisible(),true);assert.deepEqual(errors,[]);
 console.log('PASS: public identity, archive, 12-hour time, preferences, and responsive administration render without browser errors');
}finally{await browser.close();}
