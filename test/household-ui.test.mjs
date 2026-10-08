import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';

function browser({search='',items=[],fetcher}){
 const nodes={},handlers={},stored=new Map(),shares=[];
 function node(id){
  return nodes[id]??={value:'',textContent:'',innerHTML:'',hidden:false,disabled:false,style:{},children:[],append(child){this.children.push(child)},setAttribute(key,value){this[key]=value},addEventListener(type,callback){handlers[id+':'+type]=callback},focus(){},select(){}};
 }
 const document={visibilityState:'visible',getElementById:node,createElement:tag=>{const element=node('created-'+Math.random());element.tagName=tag.toUpperCase();return element}};
 const context=vm.createContext({
  document,window:{location:{search,origin:'https://basket.example'},history:{replaceState(...args){this.replaced=args}}},
  navigator:{share:async share=>shares.push(share),clipboard:{writeText:async value=>shares.push({copied:value})}},
  localStorage:{getItem:key=>stored.get(key)||null,setItem:(key,value)=>stored.set(key,value),removeItem:key=>stored.delete(key)},
  fetch:fetcher,Response,URL,URLSearchParams,crypto:webcrypto,confirm:()=>true,setInterval:()=>1,
  console
 });
 vm.runInContext(`const $=id=>document.getElementById(id);const state={items:${JSON.stringify(items)},currency:'VND'};const categories=['Produce','Dairy & eggs','Meat & seafood','Bakery','Pantry','Frozen','Household'];function tr(en,vi){return vi}function render(){}function save(){}function ingredientKey(value){return String(value||'').normalize('NFC').trim().replace(/\\s+/g,' ').toLocaleLowerCase()}`,context);
 vm.runInContext(fs.readFileSync('dist/household.js','utf8'),context);
 return {context,nodes,handlers,stored,shares};
}

test('household creator shares an invite link and a signed-in recipient merges their list',async()=>{
 let household=null,items=[],joined=false;
 const ownerFetch=async(path,options={})=>{
  if(path==='/api/household'&&options.method!=='POST')return Response.json({household,items});
  if(path==='/api/household'&&options.method==='POST'){household={id:'home-1',isOwner:true,memberCount:1};return Response.json({household}, {status:201})}
  if(path==='/api/household/items'&&options.method==='POST'){const patch=JSON.parse(options.body);items=items.filter(item=>!patch.delete.includes(item.id));for(const item of patch.upsert)items=[...items.filter(existing=>existing.id!==item.id),item];return Response.json({items})}
  if(path==='/api/household/invites')return Response.json({token:'A'.repeat(43),expiresAt:new Date(Date.now()+86400000).toISOString()},{status:201});
  throw Error(path);
 };
 const rice={id:'rice-1',name:'Rice',category:'Pantry',qty:1,price:0,unit:'',done:false,actualPrice:25000,actualCurrency:'VND'};
 const owner=browser({items:[rice],fetcher:ownerFetch});
 await new Promise(resolve=>setImmediate(resolve));
 await owner.handlers['household-create:click']();
 assert.deepEqual(items,[rice]);
 await owner.handlers['household-invite-create:click']();
 await owner.handlers['household-share:click']();
 assert(owner.shares[0].url.includes('?invite='));

 const eggs={id:'eggs-2',name:'Eggs',category:'Dairy & eggs',qty:1,price:0,unit:'',done:false};
 const inviteFetch=async(path,options={})=>{
  if(path==='/api/household'&&options.method!=='POST')return Response.json(joined?{household:{...household,isOwner:false,memberCount:2},items}:{household:null,items:[]});
  if(path==='/api/household/join'){assert.equal(JSON.parse(options.body).token,'A'.repeat(43));joined=true;return Response.json({householdId:household.id},{status:201})}
  if(path==='/api/household/items'&&options.method==='POST'){const patch=JSON.parse(options.body);items=items.filter(item=>!patch.delete.includes(item.id));for(const item of patch.upsert)items=[...items.filter(existing=>existing.id!==item.id),item];return Response.json({items})}
  throw Error(path);
 };
 const guest=browser({search:'?invite='+'A'.repeat(43),items:[eggs],fetcher:inviteFetch});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(guest.nodes['household-token'].value,'A'.repeat(43));
 await guest.handlers['household-join-form:submit']({preventDefault(){}});
 assert.deepEqual(new Set(items.map(item=>item.id)),new Set(['rice-1','eggs-2']));
 assert.equal(vm.runInContext("state.items.find(item=>item.id==='rice-1').actualPrice",guest.context),25000);
 assert(guest.nodes['household-status'].textContent.includes('đồng bộ'));
});
