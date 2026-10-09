// Run after build:netlify: node scripts/check-planning.cjs <playwright package path>
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.argv[2]||'playwright');
const root=path.resolve('dist/netlify');
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname.startsWith('/api/')){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({signedIn:false,checkoutReady:false,householdEnabled:false}));return}
 const filename=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!filename.startsWith(root+path.sep)||!fs.existsSync(filename)){res.writeHead(404);res.end();return}
 res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'})[path.extname(filename)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(fs.readFileSync(filename));
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://fonts.googleapis.com/**',route=>route.abort());
  await page.goto(origin,{waitUntil:'networkidle'});
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.selectOption('#language','en');await page.click('#tab-recipes');
  await page.fill('#pantry-input','Rice\nEggs');await page.click('#pantry-save');
  assert((await page.locator('#pantry-ideas').innerText()).includes('Family dinner'));
  await page.fill('#planning-servings','4');await page.click('[data-template="0"]');
  assert.equal(await page.locator('#planning-preview input:checked').count(),2);
  assert((await page.locator('#planning-preview-items').innerText()).includes('400 g'));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
  if(process.argv[3])await page.screenshot({path:process.argv[3]});
  await page.click('#planning-preview-add');
  assert.equal(await page.locator('#items .item').count(),4);
  await page.click('#tab-recipes');await page.fill('#pantry-input','');await page.click('#pantry-save');
  await page.click('[data-template="0"]');await page.click('#planning-preview-add');
  assert.equal(await page.locator('#items .item').count(),6);
  assert.equal(await page.evaluate(()=>state.items.filter(item=>item.name==='Pork')[0].unit),'kg');
  await page.click('#tab-recipes');await page.fill('#local-template-name','Sunday dinner');await page.click('#local-template-save');
  assert.equal(await page.locator('[data-local-template-edit]').count(),1);
  await page.click('[data-local-template-edit]');await page.fill('#local-template-edit-name','Sunday edited');
  await page.locator('[data-edit-row="0"] [data-edit-field="name"]').fill('Dinner pork');
  await page.locator('[data-edit-row="0"] [data-edit-field="qty"]').fill('0.75');
  await page.locator('[data-edit-row="0"] [data-edit-field="price"]').fill('10');
  await page.click('#local-template-edit-new');
  await page.locator('[data-edit-row="6"] [data-edit-field="name"]').fill('Coffee');
  await page.locator('[data-edit-row="6"] [data-edit-field="category"]').selectOption('Pantry');
  await page.click('#local-template-edit-save');
  assert((await page.locator('#local-template-list').innerText()).includes('Sunday edited'));
  assert.equal(await page.evaluate(()=>localTemplates[0].items.length),7);
  assert.equal(await page.evaluate(()=>state.items.some(item=>item.name==='Dinner pork')),false);
  await page.reload({waitUntil:'networkidle'});await page.click('#tab-recipes');
  assert((await page.locator('#local-template-list').innerText()).includes('Sunday edited'));
  await page.click('[data-local-template-add]');assert.equal(await page.locator('#planning-preview-items input').count(),7);await page.click('#planning-preview-cancel');
  await page.click('#tab-shopping');await page.click('#planning-share');
  const link=await page.inputValue('#planning-share-link');assert(link.includes('#list='));
  const recipient=await browser.newContext(),recipientPage=await recipient.newPage();await recipientPage.goto(link,{waitUntil:'networkidle'});
  assert.equal(await recipientPage.locator('#planning-transfer').isVisible(),true);
  assert.equal(await recipientPage.locator('#items .item').count(),0);
  await recipientPage.click('#planning-transfer-confirm');assert.equal(await recipientPage.locator('#items .item').count(),6);
  await recipient.close();
  const downloadPromise=page.waitForEvent('download');await page.click('#planning-export');const download=await downloadPromise;
  const backup=fs.readFileSync(await download.path());const data=JSON.parse(backup);assert.equal(data.templates[0].name,'Sunday edited');
  await page.fill('#name','Temporary');await page.click('#add-form .primary');assert.equal(await page.locator('#items .item').count(),7);
  await page.setInputFiles('#planning-import',{name:'backup.json',mimeType:'application/json',buffer:backup});await page.click('#planning-transfer-cancel');
  assert.equal(await page.locator('#items .item').count(),7);
  await page.setInputFiles('#planning-import',{name:'backup.json',mimeType:'application/json',buffer:backup});await page.click('#planning-transfer-confirm');
  assert.equal(await page.locator('#items .item').count(),6);
  await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('#items .item').count(),6);
  await page.fill('#name','Offline item');await page.click('#add-form .primary');assert.equal(await page.locator('#items .item').count(),7);
  await page.click('#tab-recipes');assert((await page.locator('#local-template-list').innerText()).includes('Sunday edited'));
  await page.emulateMedia({media:'print'});assert.equal(await page.locator('body>header').isVisible(),false);assert.equal(await page.locator('main>footer').isVisible(),false);assert.equal(await page.locator('.grocery-tools').isVisible(),false);assert.equal(await page.locator('#shopping-panel').isVisible(),true);
  assert.deepEqual(errors,[]);
  await context.close();
  console.log('Passed mobile preview, pantry exclusions, portion scaling, quantity merging, template editing and reload, shared-list import, backup confirmation and restore, offline reload/editing, and print visibility.');
 }finally{await browser.close();server.close()}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
