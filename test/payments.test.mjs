import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {DatabaseSync} from 'node:sqlite';
import worker,{validateCapture,validateItems,coffeeUrl} from '../worker/index.mjs';
function database(){const sql=new DatabaseSync(':memory:');sql.exec(fs.readFileSync('drizzle/0000_premium.sql','utf8'));return {sql,prepare(query){const statement=sql.prepare(query);let values=[];return {bind(...args){values=args;return this},async first(){return statement.get(...values)||null},async all(){return {results:statement.all(...values)}},async run(){return {meta:{changes:Number(statement.run(...values).changes)}}}}}}}
const origin='https://basket.example';
function request(path,method='GET',body,who='alice',from=origin){return new Request(origin+path,{method,headers:{...(who?{'oai-authenticated-user-id':who}:{}),...(method!=='GET'?{'Origin':from,'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})})}
const capture={id:'CAPTURE123456',status:'COMPLETED',amount:{currency_code:'USD',value:'3.00'},final_capture:true};
function order(status='COMPLETED'){return {id:'ORDER123456789',status,purchase_units:[{custom_id:'alice',payments:{captures:[structuredClone(capture)]}}],links:[{rel:'payer-action',href:'https://www.sandbox.paypal.com/checkoutnow?token=ORDER123456789'}]}}
test('payment validation rejects pending, wrong totals, wrong owner and multiple captures',()=>{
 assert.equal(validateCapture(order(),{order_id:'ORDER123456789'},'alice').id,capture.id);
 for(const change of [x=>x.status='APPROVED',x=>x.purchase_units[0].custom_id='bob',x=>x.purchase_units[0].payments.captures[0].amount.value='0.01',x=>x.purchase_units[0].payments.captures[0].status='PENDING',x=>x.purchase_units[0].payments.captures.push(capture)]){const data=order();change(data);assert.throws(()=>validateCapture(data,{order_id:'ORDER123456789'},'alice'))}
});
test('authorization, checkout, idempotent capture, Premium features and refund revocation',async t=>{
 const DB=database(),env={DB,PAYPAL_CLIENT_ID:'test-id',PAYPAL_CLIENT_SECRET:'test-secret',PAYPAL_ENV:'sandbox'};
 const originalFetch=globalThis.fetch;let orderStatus='CREATED',captureStatus='COMPLETED',createCalls=0,captureCalls=0;
 globalThis.fetch=async(url,options={})=>{
  if(url.endsWith('/v1/oauth2/token'))return Response.json({access_token:'test-token'});
  if(url.endsWith('/v2/checkout/orders')&&options.method==='POST'){
   createCalls++;const body=JSON.parse(options.body);assert.equal(body.purchase_units[0].amount.value,'3.00');assert.equal(body.purchase_units[0].amount.currency_code,'USD');assert.equal(body.purchase_units[0].custom_id,'alice');assert(options.headers['PayPal-Request-ID']);return Response.json(order('CREATED'));
  }
  if(url.endsWith('/capture')){captureCalls++;orderStatus='COMPLETED';return Response.json(order())}
  if(url.includes('/v2/payments/captures/'))return Response.json({...capture,status:captureStatus});
  return Response.json(order(orderStatus));
 };
 t.after(()=>{globalThis.fetch=originalFetch;DB.sql.close()});
 let response=await worker.fetch(request('/api/premium/status','GET',undefined,null),env);assert.equal(response.status,401);
 response=await worker.fetch(request('/api/paypal/create-order','POST',{},'alice','https://attacker.example'),env);assert.equal(response.status,403);assert.equal(createCalls,0);
 response=await worker.fetch(request('/api/templates'),env);assert.equal(response.status,403);
 response=await worker.fetch(request('/api/paypal/create-order','POST',{price:'0.01'}),env);assert.equal(response.status,200);assert((await response.json()).approvalUrl.startsWith('https://www.sandbox.paypal.com/'));
 await worker.fetch(request('/api/paypal/create-order','POST',{}),env);assert.equal(createCalls,1);
 response=await worker.fetch(request('/api/paypal/capture-order','POST',{orderId:'ORDER123456789'},'bob'),env);assert.equal(response.status,404);assert.equal(captureCalls,0);
 response=await worker.fetch(request('/api/paypal/capture-order','POST',{orderId:'ORDER123456789'}),env);assert.equal((await response.json()).premium,true);
 await worker.fetch(request('/api/paypal/capture-order','POST',{orderId:'ORDER123456789'}),env);assert.equal(captureCalls,1);
 const items=[{name:'Nấm',category:'Produce',qty:0.5,price:40000,unit:'kg'}];
 response=await worker.fetch(request('/api/templates','POST',{name:'Bữa chay',items}),env);assert.equal(response.status,201);
 response=await worker.fetch(request('/api/templates'),env);const saved=(await response.json()).templates;assert.equal(saved[0].items[0].qty,0.5);assert.equal(saved[0].items[0].price,40000);
 response=await worker.fetch(request('/api/templates','GET',undefined,'bob'),env);assert.equal(response.status,403);
 response=await worker.fetch(request('/api/weekly-plan','PUT',{days:['Phở','Bún','Cơm','','','','']}),env);assert.equal(response.status,200);
 response=await worker.fetch(request('/api/weekly-plan'),env);assert.equal((await response.json()).days[0],'Phở');
 response=await worker.fetch(request('/api/weekly-plan','PUT',{days:['short']}),env);assert.equal(response.status,400);
 response=await worker.fetch(request('/api/config','GET',undefined,null),{...env,COFFEE_URL:'https://buymeacoffee.com/mybasket'});const config=await response.json();assert.equal(config.coffeeUrl,'https://buymeacoffee.com/mybasket');assert(!JSON.stringify(config).includes('test-secret'));assert.equal(config.price,'3.00');
 captureStatus='REFUNDED';DB.sql.exec("UPDATE payment_orders SET verified_at = '2000-01-01'");
 response=await worker.fetch(request('/api/premium/status'),env);assert.equal((await response.json()).premium,false);
 response=await worker.fetch(request('/api/templates'),env);assert.equal(response.status,403);
});
test('an unknown price or successful browser flag cannot enable Premium',async()=>{
 const DB=database();const env={DB};
 assert.equal((await worker.fetch(request('/api/paypal/create-order','POST',{premium:true,price:3}),env)).status,503);
 assert.equal((await worker.fetch(request('/api/templates','POST',{premium:true}),env)).status,403);
 assert.equal((await (await worker.fetch(request('/api/premium/status'),env)).json()).premium,false);DB.sql.close();
});
test('custom ingredient validation and safe donation URLs',()=>{
 assert.equal(validateItems([{name:'Nấm',category:'Produce',qty:0.5,price:40000}])[0].qty,0.5);
 assert.throws(()=>validateItems([{name:'Nấm',category:'Produce',qty:-1,price:0}]));
 assert.equal(coffeeUrl({COFFEE_URL:'javascript:alert(1)'}),null);
 assert.equal(coffeeUrl({COFFEE_URL:'https://user:password@example.com'}),null);
 assert.equal(coffeeUrl({}),null);
});
test('QR generator creates an SVG from the actual donation URL',()=>{
 const context=vm.createContext({});vm.runInContext(fs.readFileSync('dist/qrcode.js','utf8'),context);
 const svg=vm.runInContext("const qr=qrcode(0,'M');qr.addData('https://buymeacoffee.com/mybasket');qr.make();qr.createSvgTag({cellSize:4,margin:16,scalable:true})",context);
 assert(svg.startsWith('<svg'));assert(svg.includes('<path'));assert(!svg.includes('<script'));
});
