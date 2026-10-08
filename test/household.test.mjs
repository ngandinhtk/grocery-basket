import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import worker from '../worker/index.mjs';

function database(){
 const sql=new DatabaseSync(':memory:');
 for(const entry of JSON.parse(fs.readFileSync('drizzle/meta/_journal.json','utf8')).entries)sql.exec(fs.readFileSync('drizzle/'+entry.tag+'.sql','utf8'));
 return {
  sql,
  async batch(statements){
   sql.exec('BEGIN');
   try{const results=[];for(const statement of statements)results.push(await statement.run());sql.exec('COMMIT');return results}
   catch(error){sql.exec('ROLLBACK');throw error}
  },
  prepare(query){
   const statement=sql.prepare(query);let values=[];
   return {bind(...args){values=args;return this},async first(){return statement.get(...values)||null},async all(){return {results:statement.all(...values)}},async run(){return {meta:{changes:Number(statement.run(...values).changes)}}}};
  }
 };
}
const origin='https://basket.example';
function request(path,method='GET',body,who='alice',from=origin){
 return new Request(origin+path,{method,headers:{...(who?{'oai-authenticated-user-id':who}:{}),...(method!=='GET'?{'Origin':from,'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
}

test('signed-in users share a grocery list through a one-time household invite',async t=>{
 const DB=database(),env={DB};
 t.after(()=>DB.sql.close());
 assert.equal((await worker.fetch(request('/api/household','GET',undefined,null),env)).status,401);
 let response=await worker.fetch(request('/api/household'),env);
 assert.deepEqual(await response.json(),{household:null,items:[]});
 response=await worker.fetch(request('/api/household','POST',{}),env);
 assert.equal(response.status,201);
 const created=await response.json();
 assert.equal(created.household.isOwner,true);
 assert.equal((await worker.fetch(request('/api/household','POST',{},'alice','https://attacker.example'),env)).status,403);

 response=await worker.fetch(request('/api/household/invites','POST',{}),env);
 assert.equal(response.status,201);
 const invite=await response.json();
 assert.match(invite.token,/^[A-Za-z0-9_-]{40,50}$/);
 assert(Date.parse(invite.expiresAt)>Date.now());
 response=await worker.fetch(request('/api/household/join','POST',{token:invite.token},'bob'),env);
 assert.equal(response.status,201);
 assert.equal((await response.json()).householdId,created.household.id);
 assert.equal((await worker.fetch(request('/api/household/join','POST',{token:invite.token},'carol'),env)).status,410);

 const rice={id:'rice-1',name:'Rice',category:'Pantry',qty:1,price:2,unit:'',done:false,actualPrice:2.5,actualCurrency:'USD'};
 response=await worker.fetch(request('/api/household/items','POST',{upsert:[rice],delete:[]}),env);
 assert.equal(response.status,200);
 assert.deepEqual((await response.json()).items,[rice]);
 assert.equal((await worker.fetch(request('/api/household/items','POST',{upsert:[{...rice,actualCurrency:'XXX'}],delete:[]}),env)).status,400);
 response=await worker.fetch(request('/api/household/items','GET',undefined,'bob'),env);
 assert.deepEqual((await response.json()).items,[rice]);

 const updated={...rice,qty:2},eggs={id:'eggs-2',name:'Eggs',category:'Dairy & eggs',qty:1,price:0,done:false};
 response=await worker.fetch(request('/api/household/items','POST',{upsert:[updated,eggs],delete:[]},'bob'),env);
 assert.equal(response.status,200);
 const shared=(await response.json()).items;
 assert.equal(shared.length,2);
 assert.equal(shared.find(item=>item.id===rice.id).qty,2);
 assert.equal((await worker.fetch(request('/api/household/items','GET',undefined,'alice'),env)).status,200);
 assert.equal((await worker.fetch(request('/api/household/items','GET',undefined,'carol'),env)).status,409);
 assert.equal((await worker.fetch(request('/api/household/leave','DELETE',{},'alice'),env)).status,409);

 assert.equal((await worker.fetch(request('/api/household/leave','DELETE',{},'bob'),env)).status,200);
 assert.deepEqual(await (await worker.fetch(request('/api/household','GET',undefined,'bob'),env)).json(),{household:null,items:[]});
 assert.equal((await worker.fetch(request('/api/household','DELETE',{},'alice'),env)).status,200);
 assert.deepEqual(await (await worker.fetch(request('/api/household','GET'),env)).json(),{household:null,items:[]});
});
