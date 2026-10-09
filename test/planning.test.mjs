import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';

function planning(){
 const context=vm.createContext({crypto:webcrypto,TextEncoder,TextDecoder,btoa,atob});
 vm.runInContext(`const state={language:'en',currency:'USD'};const categories=['Produce','Dairy & eggs','Meat & seafood','Bakery','Pantry','Frozen','Household'];function tr(en,vi){return state.language==='vi'?vi:en}`,context);
 const source=fs.readFileSync('dist/vietnam.js','utf8');
 vm.runInContext('const ingredientEnglish='+source.split('const ingredientEnglish=')[1].split('const phrases=')[0],context);
 vm.runInContext(fs.readFileSync('dist/premium-data.js','utf8'),context);
 vm.runInContext(fs.readFileSync('dist/planning-core.js','utf8'),context);
 return source=>vm.runInContext(source,context);
}
test('all meal quantities scale from two people without changing prices or source recipes',()=>{
 const run=planning();
 assert.equal(run('templates.every((_,index)=>recipeMeal(index).items.every(item=>item.qty>0&&item.unit))'),true);
 assert.equal(run('scaleMeal(recipeMeal(0),4).items[0].qty'),400);
 assert.equal(run('recipeMeal(0).items[0].qty'),200);
 assert.equal(run('scaleMeal(recipeMeal(0),20).items[0].unit'),'kg');
 assert.equal(run('scaleMeal(recipeMeal(0),20).items[0].qty'),2);
 run('const priced=scaleMeal({servings:2,items:[{name:"Rice",qty:800,unit:"g",price:0.01}]},4)');
 assert.equal(run('priced.items[0].price*priced.items[0].qty'),16);
 assert.throws(()=>run('scaleMeal(recipeMeal(0),0)'),/INVALID_SERVINGS/);
 assert.throws(()=>run('scaleMeal(recipeMeal(0),2.5)'),/INVALID_SERVINGS/);
});
test('merging recognises both languages and compatible units, preserving total cost and completed rows',()=>{
 const run=planning();
 run(`const current=[{id:'rice',name:'Gạo',category:'Pantry',qty:0.5,unit:'kg',price:4,priceCurrency:'USD',done:false},{id:'done',name:'Rice',category:'Pantry',qty:1,unit:'kg',price:4,priceCurrency:'USD',done:true}];const meal={currency:'USD',items:[{name:'Rice',category:'Pantry',qty:250,unit:'g',price:0.006,priceCurrency:'USD'}]};const combined=mergePlanningItems(current,meal)`);
 assert.equal(run('combined.items.length'),2);
 assert.equal(run('combined.merged'),1);
 assert.equal(run('combined.items[0].qty'),0.75);
 assert.equal(run('combined.items[0].price*combined.items[0].qty'),3.5);
 assert.equal(run('current[0].qty'),0.5);
 assert.equal(run('mergePlanningItems(current,meal,{mode:"skip"}).skipped'),1);
 assert.equal(run('mergePlanningItems(current,meal,{mode:"separate"}).items.length'),3);
 assert.equal(run('mergePlanningItems(current,{currency:"USD",items:[{...meal.items[0],unit:"bag"}]}).items.length'),3);
 assert.equal(run('mergePlanningItems([],{currency:"EUR",items:[{...meal.items[0],priceCurrency:"EUR"}]}).items[0].price'),0);
});
test('pantry suggestions match English and Vietnamese names and show actual missing ingredients',()=>{
 const run=planning();
 run(`const pantry=['Rice','Pork','Eggs','Water spinach','Garlic','Fish sauce'];const ideas=suggestPantryMeals(pantry)`);
 assert.equal(run('ideas[0].index'),0);
 assert.equal(run('ideas[0].missing.length'),0);
 assert.equal(run('suggestPantryMeals([]).length'),0);
 assert.equal(run('canonicalIngredient("  RICE ")===canonicalIngredient("Gạo")'),true);
});
test('backup validation preserves list prices and history, strips unknown fields and rejects malformed data',()=>{
 const run=planning();
 run(`const backup={format:'smolbasket',version:1,shopping:{items:[{id:'rice',name:'Gạo',category:'Pantry',qty:2,unit:'kg',price:4,priceCurrency:'USD',done:true,actualPrice:5,actualCurrency:'USD',secret:'do not import'}],budget:100,budgetCurrency:'USD',currency:'USD',language:'vi',purchaseHistory:[{itemId:'rice',name:'Gạo',actualUnitPrice:5,currency:'USD',purchasedAt:'2026-10-09T00:00:00Z',active:true}]},templates:[{name:'Dinner',servings:2,currency:'USD',items:[{name:'Rice',category:'Pantry',qty:2,price:4,priceCurrency:'USD',unit:'kg'}]}],pantry:['Rice']};const clean=validatePlanningBackup(backup)`);
 assert.equal(run('clean.shopping.items[0].actualPrice'),5);
 assert.equal(run('clean.shopping.purchaseHistory.length'),1);
 assert.equal(run('clean.shopping.items[0].secret'),undefined);
 assert.equal(run('clean.templates[0].servings'),2);
 assert.throws(()=>run('validatePlanningBackup({...backup,version:2})'),/INVALID_BACKUP/);
 assert.throws(()=>run('validatePlanningBackup({...backup,shopping:{...backup.shopping,items:[{...backup.shopping.items[0],qty:-1}]}})'),/INVALID_ITEM/);
 assert.throws(()=>run('validatePlanningBackup({...backup,pantry:[{}]})'),/INVALID_PANTRY/);
});
test('shared lists round-trip Unicode and never import completion state or private item metadata',()=>{
 const run=planning();
 run(`const original=[{name:'Đậu phụ 🥬',category:'Pantry',qty:2,price:0,priceCurrency:'VND',unit:'gói',done:true,actualPrice:123,actualCurrency:'VND'}];const decoded=decodeSharedList(encodeSharedList(original))`);
 assert.equal(run('decoded[0].name'),'Đậu phụ 🥬');
 assert.equal(run('decoded[0].unit'),'gói');
 assert.equal(run('decoded[0].done'),false);
 assert.equal(run('decoded[0].actualPrice'),undefined);
 assert.throws(()=>run('decodeSharedList("bad%input")'),/INVALID_SHARE/);
 assert.throws(()=>run('encodeSharedList(Array.from({length:1000},()=>original[0]))'),/SHARE_TOO_LARGE/);
});
