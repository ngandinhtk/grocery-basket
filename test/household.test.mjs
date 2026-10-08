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

 const rice={id:'rice-1',name:'Rice',category:'Pantry',qty:1,price:2,priceCurrency:'USD',unit:'',done:false,actualPrice:2.5,actualCurrency:'USD'};
 response=await worker.fetch(request('/api/household/items','POST',{upsert:[rice],delete:[]}),env);
 assert.equal(response.status,200);
 assert.deepEqual((await response.json()).items,[rice]);
 assert.equal((await worker.fetch(request('/api/household/items','POST',{upsert:[{...rice,actualCurrency:'XXX'}],delete:[]}),env)).status,400);
 assert.equal((await worker.fetch(request('/api/household/items','POST',{upsert:[{...rice,priceCurrency:'XXX'}],delete:[]}),env)).status,400);
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

test('Google OAuth creates a verified session that can access household APIs and sign out',async t=>{
 const DB=database(),env={DB,GOOGLE_CLIENT_ID:'client-id',GOOGLE_CLIENT_SECRET:'client-secret'};
 const originalFetch=globalThis.fetch;
 globalThis.fetch=async(url,options={})=>{
  if(url==='https://oauth2.googleapis.com/token'){
   const form=new URLSearchParams(options.body);assert.equal(form.get('client_id'),'client-id');assert.equal(form.get('code_verifier').length,64);assert.equal(form.get('redirect_uri'),origin+'/auth/google/callback');
   return Response.json({access_token:'google-access-token'});
  }
  if(url==='https://openidconnect.googleapis.com/v1/userinfo'){
   assert.equal(options.headers.Authorization,'Bearer google-access-token');
   return Response.json({sub:'google-sub-1',email:'member@example.com',email_verified:true});
  }
  throw Error('Unexpected OAuth URL');
 };
 t.after(()=>{globalThis.fetch=originalFetch;DB.sql.close()});
 let response=await worker.fetch(new Request(origin+'/auth/google/start?return_to=%2F%3Finvite%3D'+('A'.repeat(43))),env);
 assert.equal(response.status,302);
 const authorize=new URL(response.headers.get('Location'));
 assert.equal(authorize.origin,'https://accounts.google.com');
 assert.equal(authorize.searchParams.get('code_challenge_method'),'S256');
 const state=authorize.searchParams.get('state');
 response=await worker.fetch(new Request(origin+'/auth/google/callback?code=auth-code&state='+state),env);
 assert.equal(response.status,302);
 assert.equal(new URL(response.headers.get('Location')).searchParams.get('invite'),'A'.repeat(43));
 const cookie=response.headers.get('Set-Cookie');
 assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Lax/);assert.match(cookie,/Secure/);
 const sessionCookie=cookie.split(';')[0];
 response=await worker.fetch(new Request(origin+'/api/household',{headers:{Cookie:sessionCookie}}),env);
 assert.equal(response.status,200);assert.deepEqual(await response.json(),{household:null,items:[]});
 response=await worker.fetch(new Request(origin+'/api/household',{method:'POST',headers:{Cookie:sessionCookie,Origin:origin,'Content-Type':'application/json'},body:'{}'}),env);
 assert.equal(response.status,201);
 response=await worker.fetch(new Request(origin+'/auth/google/logout',{method:'POST',headers:{Cookie:sessionCookie,Origin:origin}}),env);
 assert.equal(response.status,303);assert.match(response.headers.get('Set-Cookie'),/Max-Age=0/);
 response=await worker.fetch(new Request(origin+'/api/household',{headers:{Cookie:sessionCookie}}),env);
 assert.equal(response.status,401);
});

test('Google OAuth rejects invalid state, unverified email, and cross-origin logout',async t=>{
 const DB=database(),env={DB,GOOGLE_CLIENT_ID:'client-id',GOOGLE_CLIENT_SECRET:'client-secret'};
 const originalFetch=globalThis.fetch;
 globalThis.fetch=async url=>url==='https://oauth2.googleapis.com/token'?Response.json({access_token:'token'}):Response.json({sub:'google-sub-2',email:'unverified@example.com',email_verified:false});
 t.after(()=>{globalThis.fetch=originalFetch;DB.sql.close()});
 let response=await worker.fetch(new Request(origin+'/auth/google/callback?code=auth-code&state=unknown'),env);
 assert.equal(new URL(response.headers.get('Location')).searchParams.get('auth_error'),'google_state');
 response=await worker.fetch(new Request(origin+'/auth/google/start'),env);
 const state=new URL(response.headers.get('Location')).searchParams.get('state');
 response=await worker.fetch(new Request(origin+'/auth/google/callback?code=auth-code&state='+state),env);
 assert.equal(new URL(response.headers.get('Location')).searchParams.get('auth_error'),'google_email');
 response=await worker.fetch(new Request(origin+'/auth/google/callback?error=access_denied'),env);
 assert.equal(new URL(response.headers.get('Location')).searchParams.get('auth_error'),'google_cancelled');
 response=await worker.fetch(new Request(origin+'/auth/google/logout',{method:'POST',headers:{Origin:'https://attacker.example'}}),env);
 assert.equal(response.status,403);
 response=await worker.fetch(new Request(origin+'/auth/google/start'),{DB});
 assert.equal(new URL(response.headers.get('Location')).searchParams.get('auth_error'),'google_not_configured');
});
