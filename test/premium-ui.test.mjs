import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';

async function ui({failConfig=false}={}){
 const nodes={},handlers={},calls=[];
 function node(id){return nodes[id]??={value:'',textContent:'',innerHTML:'',hidden:false,disabled:false,style:{},children:[],append(child){this.children.push(child)},replaceChildren(){this.children=[]},setAttribute(key,value){this[key]=value},getAttribute(key){return this[key]},focus(){},showModal(){this.open=true},close(){this.open=false;handlers[id+':close']?.({})},querySelector(selector){return this.children.find(child=>selector==='img'&&child.tagName==='IMG')||(selector==='img'?null:node(id+selector))},addEventListener(type,callback){handlers[id+':'+type]=callback}}}
 const context=vm.createContext({document:{getElementById:node,querySelector:node,querySelectorAll:()=>[],createElement:tag=>{const el=node('created-'+Math.random());el.tagName=tag.toUpperCase();return el}},window:{location:{search:'',assign(){}},history:{replaceState(){}},addEventListener:(type,callback)=>handlers['window:'+type]=callback},fetch:async(path,options={})=>{
  calls.push([path,options]);if(failConfig&&path==='/api/config')throw Error('offline');return Response.json(path==='/api/config'?{signedIn:false,price:'7.50',originalPrice:'21.00',currency:'USD'}:path==='/api/premium/status'?{premium:true}:path==='/api/templates'?{templates:[]}:path==='/api/weekly-plan'?{days:['Server meal','','','','','','']}:{ok:true});
 },Response,URLSearchParams,crypto:webcrypto,console});
 vm.runInContext(`const $=id=>document.getElementById(id);const state={items:[],currency:'VND'};let filter='all';const categories=['Produce','Dairy & eggs','Meat & seafood','Bakery','Pantry','Frozen','Household'];const viCategories=categories;const templates=[];function tr(en,vi){return vi}function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function render(){}function save(){}function notify(){}function showMainTab(){}`,context);
 vm.runInContext(fs.readFileSync('dist/premium-data.js','utf8'),context);
 vm.runInContext(fs.readFileSync('dist/coffee-bank.js','utf8'),context);
 vm.runInContext(fs.readFileSync('dist/premium.js','utf8'),context);
 await new Promise(resolve=>setImmediate(resolve));
 return {context,nodes,handlers,calls,run:source=>vm.runInContext(source,context)};
}

test('Premium checkout stays hidden while the temporary pause is active',async()=>{
 const app=await ui();
 assert.equal(app.nodes['premium-pay'].hidden,true);
 assert.equal(app.nodes['premium-availability'].textContent,'Thanh toán Premium tạm thời chưa khả dụng.');
 const html=fs.readFileSync('dist/index.html','utf8');assert(html.includes('id="premium-pay" class="paypal-button" type="button" disabled hidden'));
 assert(html.includes('class="premium-intro" hidden'));
 assert(html.includes('class="premium-layout qr-only"><div hidden>'));
 assert(html.includes('<div id="coffee-qr"></div>'));
 assert(!html.includes('id="coffee-link"'));
});

test('template refreshes and slow status requests preserve unsaved weekly input',async()=>{
 const app=await ui();app.nodes['weekly-0'].value='My draft';app.handlers['weekly-form:input']();
 await app.run('refreshTemplates()');assert.equal(app.nodes['weekly-0'].value,'My draft');
 await app.run('refreshPremium()');assert.equal(app.nodes['weekly-0'].value,'My draft');
 assert(app.nodes['weekly-status'].textContent.includes('chưa lưu'));
 let prevent=false;app.handlers['window:beforeunload']({preventDefault(){prevent=true}});assert(prevent);
 app.run(`for(let i=0;i<7;i++)$('weekly-'+i).value='';weeklyDays=Array(7).fill('');`);
 let release;app.context.fetch=path=>new Promise(resolve=>{if(path==='/api/weekly-plan')release=()=>resolve(Response.json({days:['Server meal','','','','','','']}));else resolve(Response.json(path==='/api/premium/status'?{premium:true}:{templates:[]}))});
 const refresh=app.run('refreshPremium()');await new Promise(resolve=>setImmediate(resolve));
 app.nodes['weekly-0'].value='Typed while loading';app.handlers['weekly-form:input']();release();await refresh;
 assert.equal(app.nodes['weekly-0'].value,'Typed while loading');
});

test('failed weekly saves stay dirty and edits made during a successful save are preserved',async()=>{
 const app=await ui();app.nodes['weekly-0'].value='First draft';
 app.context.fetch=async()=>Response.json({error:'SERVICE_UNAVAILABLE'},{status:503});
 await app.handlers['weekly-form:submit']({preventDefault(){}});assert(app.run('weeklyDirty()'));assert.equal(app.run('weeklyDays[0]'),'');
 let finish;app.context.fetch=()=>new Promise(resolve=>finish=()=>resolve(Response.json({ok:true})));
 const saving=app.handlers['weekly-form:submit']({preventDefault(){}});
 app.nodes['weekly-0'].value='Newer draft';app.handlers['weekly-form:input']();finish();await saving;
 assert.equal(app.nodes['weekly-0'].value,'Newer draft');assert.equal(app.run('weeklyDays[0]'),'First draft');assert(app.run('weeklyDirty()'));
});

test('saving a template sends currency and never reloads the weekly plan',async()=>{
 const app=await ui();app.run(`state.items=[{name:'Rice',category:'Pantry',qty:1,price:40000}];`);
 app.nodes['template-name'].value='Dinner';app.calls.length=0;
 await app.handlers['save-template-form:submit']({preventDefault(){}});
 const request=app.calls.find(([path,options])=>path==='/api/templates'&&options.method==='POST');
 assert.equal(JSON.parse(request[1].body).currency,'VND');assert(!app.calls.some(([path])=>path==='/api/weekly-plan'));
});

test('template import combines compatible units, keeps incompatible units and preserves the cost',async()=>{
 const app=await ui();
 app.run(`state.items=[{id:'old',name:'Rice',category:'Pantry',qty:1,price:40000,unit:'kg',done:false}];savedMeals=[{currency:'VND',items:[{name:' rice ',category:'Pantry',qty:0.5,price:60000,unit:'kilogram'},{name:'Rice',category:'Pantry',qty:1,price:20000,unit:'bag'}]}];`);
 const result=app.run(`combineTemplate(state.items,savedMeals[0],{mode:'merge',currency:'VND'})`);
 assert.equal(result.items.length,2);assert.equal(result.items[0].qty,1.5);assert.equal(result.merged,1);assert.equal(result.separate,1);
 assert.equal(Math.round(result.items.reduce((sum,x)=>sum+x.qty*x.price,0)),90000);
 assert.equal(app.run('state.items[0].qty'),1,'preview does not mutate the list');
 const separate=app.run(`combineTemplate(state.items,savedMeals[0],{mode:'separate',currency:'VND'})`);assert.equal(separate.items.length,3);
 const skipped=app.run(`combineTemplate(state.items,savedMeals[0],{mode:'skip',currency:'VND'})`);assert.equal(skipped.skipped,1);assert.equal(skipped.items.length,2);
});

test('foreign and legacy template prices never become local currency prices',async()=>{
 const app=await ui();
 app.run(`savedMeals=[{currency:'VND',items:[{name:'Rice',category:'Pantry',qty:1,price:40000,unit:'kg'}]}];`);
 let result=app.run(`combineTemplate([],savedMeals[0],{currency:'USD'})`);assert.equal(result.items[0].price,0);assert(result.resetPrices);
 app.run('savedMeals[0].currency=null');result=app.run(`combineTemplate([],savedMeals[0],{currency:'VND'})`);assert.equal(result.items[0].price,0);
 app.run('openTemplateImport(savedMeals[0])');assert(app.nodes['import-currency'].textContent.includes('chưa rõ tiền tệ'));
});

test('donation QR uses the embedded bank image and keeps the thank-you message',async()=>{
 const html=fs.readFileSync('dist/index.html','utf8');
 assert(html.includes('<div id="coffee-qr"></div>'));
 assert(!html.includes('coffee-qr-open'));
 const app=await ui();
 assert(app.nodes['coffee-qr'].children[0].src.startsWith('data:image/jpeg;base64,'));
 assert(app.nodes['coffee-details'].textContent.includes('9021919786808'));
 assert(app.nodes['coffee-details'].textContent.includes('Timo'));
 assert.equal(app.nodes['coffee-note'].textContent,'Cảm ơn bạn đã ủng hộ!');
 app.run('renderCoffeeQr()');
 assert.equal(app.nodes['coffee-qr'].children.length,1);
 assert(app.nodes['coffee-qr'].children[0].src.startsWith('data:image/jpeg;base64,'));
 assert.equal(app.nodes['coffee-missing'].hidden,true);
});

test('donation QR renders even when premium configuration is unavailable',async()=>{
 const app=await ui({failConfig:true});
 assert(app.nodes['coffee-qr'].children[0].src.startsWith('data:image/jpeg;base64,'));
 assert.equal(app.nodes['coffee-missing'].hidden,true);
 assert(app.nodes['premium-message'].textContent.includes('Không thể kết nối'));
});

test('weekly meal plan builds a deduplicated list and skips items already at home',async()=>{
 const app=await ui();
 app.run(`templates.push(['🍚','Bữa cơm','Family meal','dish',['Gạo|4','Trứng gà|1'],'savory'],['🥣','Bữa sáng','Breakfast','dish',['Trứng gà|1','Sữa tươi|1'],'savory']);`);
 app.run(`savedMeals=[{name:'Meal prep',currency:'VND',items:[{name:'Rice',category:'Pantry',qty:2,price:12000}]}];$('weekly-0').value='Bữa cơm';$('weekly-1').value='Breakfast';$('weekly-2').value='Meal prep';$('weekly-3').value='Custom meal';prepareWeeklyShopping()`);
 assert.equal(app.run('weeklyShoppingIngredients.length'),4);
 assert(app.nodes['weekly-shopping-unmatched'].textContent.includes('Custom meal'));
 assert(app.nodes['weekly-shopping-items'].innerHTML.includes('Gạo'));
 app.handlers['weekly-shopping-items:change']({target:{checked:true,dataset:{weeklyHave:'0'},closest(){return this}}});
 app.handlers['weekly-shopping-add:click']();
 const result=app.run('JSON.stringify(state.items.map(({name,qty,price,done})=>({name,qty,price,done})))');
 assert.deepEqual(JSON.parse(result),[
  {name:'Trứng gà',qty:1,price:0,done:false},
  {name:'Sữa tươi',qty:1,price:0,done:false},
  {name:'Rice',qty:2,price:12000,done:false}
 ]);
});
