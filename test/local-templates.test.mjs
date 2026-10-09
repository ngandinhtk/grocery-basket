import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';

function app(storage={},failStorage=false){
 const nodes={},handlers={};
 const node=id=>nodes[id]??={value:'',innerHTML:'',textContent:'',append(){},addEventListener(type,fn){handlers[id+':'+type]=fn}};
 const context=vm.createContext({document:{getElementById:node,createElement:()=>node('section')},localStorage:{getItem:key=>storage[key]||null,setItem(key,value){if(failStorage)throw Error('quota');storage[key]=value}},crypto:webcrypto});
 vm.runInContext(`const $=id=>document.getElementById(id);const state={language:'en',currency:'USD',items:[]};const categories=['Produce','Dairy & eggs','Meat & seafood','Bakery','Pantry','Frozen','Household'];let filter='all';function tr(en,vi){return state.language==='vi'?vi:en}function render(){}function save(){render()}function notify(){}function showMainTab(){}function escapeHTML(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}`,context);
 const translation=fs.readFileSync('dist/vietnam.js','utf8');
 vm.runInContext('const ingredientEnglish='+translation.split('const ingredientEnglish=')[1].split('const templates=')[0],context);
 vm.runInContext(fs.readFileSync('dist/premium-data.js','utf8'),context);
 vm.runInContext(fs.readFileSync('dist/local-templates.js','utf8'),context);
 return {nodes,handlers,run:source=>vm.runInContext(source,context)};
}
test('all built-in ingredients have English names',()=>{
 const ui=app();
 const source=fs.readFileSync('dist/vietnam.js','utf8');
 ui.run('const templates='+source.split('const templates=')[1].split('const phrases=')[0]);
 assert.equal(ui.run('templates.every(t=>t[4].every(x=>Boolean(ingredientEnglish[x.split("|")[0]])))'),true);
 assert.equal(ui.run('templateIngredientName("Gạo")'),'Rice');
 assert.equal(ui.run('state.language="vi";templateIngredientName("Gạo")'),'Gạo');
});
test('local templates preserve quantities and prices, survive reload, skip duplicates and can be deleted',()=>{
 const storage={},ui=app(storage);
 assert.equal(ui.run('saveLocalTemplate("Empty")'),false);
 ui.run('state.items=[{name:"Rice",templateIngredient:"Gạo",category:"Pantry",qty:2,price:3,priceCurrency:"USD",unit:"kg",done:true}]');
 assert.equal(ui.run('saveLocalTemplate("<Dinner>")'),true);
 assert(ui.nodes['local-template-list'].innerHTML.includes('&lt;Dinner&gt;'));
 ui.run('state.items[0].qty=7');
 assert.equal(JSON.parse(storage['basket-templates-v1'])[0].items[0].qty,2);
 const reloaded=app(storage),id=JSON.parse(storage['basket-templates-v1'])[0].id;
 reloaded.run('state.language="vi";renderLocalTemplates()');
 assert(reloaded.nodes['local-template-list'].innerHTML.includes('Gạo'));
 const event=dataset=>({target:{closest:selector=>selector==='[data-local-template-add]'&&dataset.localTemplateAdd||selector==='[data-local-template-delete]'&&dataset.localTemplateDelete?{dataset}:null}});
 reloaded.handlers['local-template-list:click'](event({localTemplateAdd:id}));
 assert.equal(reloaded.run('state.items[0].name'),'Gạo');
 assert.equal(reloaded.run('state.items[0].qty'),2);
 assert.equal(reloaded.run('state.items[0].price'),3);
 assert.equal(reloaded.run('state.items[0].done'),false);
 reloaded.handlers['local-template-list:click'](event({localTemplateAdd:id}));
 assert.equal(reloaded.run('state.items.length'),1);
 reloaded.handlers['local-template-list:click'](event({localTemplateDelete:id}));
 assert.deepEqual(JSON.parse(storage['basket-templates-v1']),[]);
});
test('failed browser storage writes do not report success or retain unsaved templates',()=>{
 const ui=app({},true);
 ui.run('state.items=[{name:"Rice",category:"Pantry",qty:1,price:0}]');
 assert.equal(ui.run('saveLocalTemplate("Dinner")'),false);
 assert.equal(ui.run('localTemplates.length'),0);
});
