const PREMIUM_OFFER=Object.freeze({price:'3.00',originalPrice:'18.00',currency:'USD'});
const {price:PRICE,currency:CURRENCY}=PREMIUM_OFFER;
const categories=['Produce','Dairy & eggs','Meat & seafood','Bakery','Pantry','Frozen','Household'];
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
class ApiError extends Error{constructor(code,status=400){super(code);this.status=status}}
const VERIFY_INTERVAL=5*60*1000,VERIFIED_GRACE=24*60*60*1000;
const paypalEnv=env=>env.PAYPAL_ENV==='live'?'live':'sandbox';
function configured(env){return Boolean(env.PAYPAL_CLIENT_ID&&env.PAYPAL_CLIENT_SECRET&&['live','sandbox'].includes(env.PAYPAL_ENV))}
function safeHttps(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&u.href.length<1800?u.href:null}catch{return null}}
function coffeeUrl(env){return safeHttps(env.COFFEE_URL)}
async function paypal(env,path,method='GET',body,key){
 try{return await paypalRequest(env,path,method,body,key)}catch(error){
  if(error instanceof ApiError)throw error;
  throw new ApiError('PAYPAL_UNAVAILABLE',502);
 }
}
async function paypalRequest(env,path,method='GET',body,key){
 if(!configured(env))throw new ApiError('PAYPAL_NOT_CONFIGURED',503);
 const base=paypalEnv(env)==='live'?'https://api-m.paypal.com':'https://api-m.sandbox.paypal.com';
 const auth=await fetch(base+'/v1/oauth2/token',{method:'POST',headers:{Authorization:'Basic '+btoa(env.PAYPAL_CLIENT_ID+':'+env.PAYPAL_CLIENT_SECRET),'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials',signal:AbortSignal.timeout(15000)});
 if(!auth.ok)throw new ApiError(auth.status===429||auth.status>=500?'PAYPAL_UNAVAILABLE':'PAYPAL_PAYMENT_ERROR',502);
 const token=await auth.json();
 const response=await fetch(base+path,{method,headers:{Authorization:'Bearer '+token.access_token,'Content-Type':'application/json',Prefer:'return=representation',...(key?{'PayPal-Request-ID':key}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});
 const data=await response.json();
 if(!response.ok){
  const issue=data.details?.[0]?.issue;
  if(response.status===429||response.status>=500)throw new ApiError('PAYPAL_UNAVAILABLE',502);
  if(response.status===404&&method==='GET'&&path.startsWith('/v2/checkout/orders/'))throw new ApiError('PAYPAL_ORDER_MISSING',404);
  if(['ORDER_EXPIRED','ORDER_VOIDED'].includes(issue))throw new ApiError('PAYPAL_ORDER_EXPIRED',409);
  throw new ApiError('PAYPAL_PAYMENT_ERROR',502);
 }
 return data;
}
function validateCapture(data,order,userId){
 const unit=data.purchase_units?.[0],captures=unit?.payments?.captures;
 const capture=captures?.find(c=>c.status==='COMPLETED'&&c.amount?.currency_code===CURRENCY&&c.amount?.value===PRICE);
 if(data.id!==order.order_id||data.status!=='COMPLETED'||data.purchase_units.length!==1||unit.custom_id!==userId||!capture||captures.length!==1)throw new ApiError('PAYMENT_NOT_COMPLETED',409);
 return capture;
}
async function paymentRow(db,user){return db.prepare('SELECT * FROM payment_orders WHERE user_id = ?').bind(user).first()}
async function isPremium(db,user,env){
 const row=await paymentRow(db,user);if(row?.status!=='COMPLETED'||row.environment!==paypalEnv(env))return false;
 const verifiedAt=Date.parse(row.verified_at),age=Date.now()-verifiedAt;
 const inGrace=Number.isFinite(age)&&age>=0&&age<=VERIFIED_GRACE&&Boolean(row.capture_id);
 if(inGrace&&Date.parse(row.next_verify_at)>Date.now())return true;
 if(!Number.isFinite(age)||age>VERIFY_INTERVAL||age<0){
  let data;
  try{data=await paypal(env,'/v2/payments/captures/'+encodeURIComponent(row.capture_id))}catch(error){
   if(error.message==='PAYPAL_UNAVAILABLE'&&inGrace){
    const result=await db.prepare("UPDATE payment_orders SET next_verify_at = ? WHERE user_id = ? AND capture_id = ? AND status = 'COMPLETED'").bind(new Date(Date.now()+VERIFY_INTERVAL).toISOString(),user,row.capture_id).run();
    return Boolean(result.meta.changes);
   }
   throw error;
  }
  const valid=data.id===row.capture_id&&data.status==='COMPLETED'&&data.amount?.currency_code===CURRENCY&&data.amount?.value===PRICE;
  await db.prepare('UPDATE payment_orders SET status = ?, verified_at = ?, next_verify_at = NULL WHERE user_id = ? AND capture_id = ?').bind(valid?'COMPLETED':'REVOKED',new Date().toISOString(),user,row.capture_id).run();
  return valid;
 }
 return true;
}
function validateItems(items){
 if(!Array.isArray(items)||items.length<1||items.length>200)throw new ApiError('INVALID_ITEMS');
 return items.map(x=>{if(!x||typeof x.name!=='string'||!x.name.trim()||x.name.length>80||!categories.includes(x.category)||!Number.isFinite(x.qty)||x.qty<0.01||x.qty>999||!Number.isFinite(x.price)||x.price<0||x.price>999999999||(x.unit!==undefined&&(typeof x.unit!=='string'||x.unit.length>20)))throw new ApiError('INVALID_ITEMS');return {name:x.name.trim(),category:x.category,qty:x.qty,price:x.price,unit:x.unit?.trim()||''}});
}
function expiredOrder(order,row){
 if(['VOIDED','EXPIRED'].includes(order.status))return true;
 // CREATED may remain queryable after expiry. Use the documented maximum
 // extension window, never discard an APPROVED or pending capture by age.
 return order.status==='CREATED'&&Date.now()-Date.parse(order.create_time||row.created_at)>72*60*60*1000;
}
async function resetAttempt(db,user,row,environment,reason){
 const now=new Date().toISOString();
 await db.batch([
  db.prepare("INSERT OR IGNORE INTO payment_attempt_history (request_id,user_id,order_id,environment,status,capture_id,paid_at,reason,created_at,archived_at) SELECT request_id,user_id,order_id,environment,status,capture_id,paid_at,?,created_at,? FROM payment_orders WHERE user_id = ? AND request_id = ? AND (environment <> ? OR status NOT IN ('COMPLETED','REVOKED'))").bind(reason,now,user,row.request_id,environment),
  db.prepare("UPDATE payment_orders SET request_id = ?, order_id = NULL, capture_id = NULL, status = 'NEW', environment = ?, created_at = ?, paid_at = NULL, verified_at = NULL, next_verify_at = NULL WHERE user_id = ? AND request_id = ? AND (environment <> ? OR status NOT IN ('COMPLETED','REVOKED'))").bind(crypto.randomUUID(),environment,now,user,row.request_id,environment)
 ]);
 return paymentRow(db,user);
}
async function api(request,env){
 const url=new URL(request.url),path=url.pathname,user=request.headers.get('oai-authenticated-user-id');
 if(path==='/api/config'&&request.method==='GET')return json({...PREMIUM_OFFER,checkoutReady:configured(env),environment:paypalEnv(env),coffeeUrl:coffeeUrl(env),coffeeQrImage:safeHttps(env.COFFEE_QR_IMAGE_URL)||(typeof assets!=='undefined'&&assets['/bank-qr.jpg']?'/bank-qr.jpg':null),coffeeDetails:typeof env.COFFEE_DETAILS==='string'?env.COFFEE_DETAILS.slice(0,500):'',signedIn:Boolean(user)});
 if(!user)throw new ApiError('SIGN_IN_REQUIRED',401);
 if(!env.DB)throw new ApiError('SERVICE_UNAVAILABLE',503);
 if(!['GET','POST','PUT','DELETE'].includes(request.method))throw new ApiError('METHOD_NOT_ALLOWED',405);
 if(request.method!=='GET'&&request.headers.get('Origin')!==url.origin)throw new ApiError('INVALID_ORIGIN',403);
 let body={};
 if(['POST','PUT'].includes(request.method)){
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))throw new ApiError('JSON_REQUIRED',415);
  const raw=await request.text();if(raw.length>100000)throw new ApiError('BODY_TOO_LARGE',413);
  try{body=JSON.parse(raw)}catch{throw new ApiError('INVALID_JSON')}
  if(!body||typeof body!=='object'||Array.isArray(body))throw new ApiError('INVALID_JSON');
 }
 if(path==='/api/premium/status'&&request.method==='GET')return json({premium:await isPremium(env.DB,user,env)});
 if(path==='/api/paypal/create-order'&&request.method==='POST'){
  if(!configured(env))throw new ApiError('PAYPAL_NOT_CONFIGURED',503);
  if(await isPremium(env.DB,user,env))return json({premium:true});
  const now=new Date().toISOString();
  await env.DB.prepare('INSERT OR IGNORE INTO payment_orders (user_id,request_id,environment,created_at) VALUES (?,?,?,?)').bind(user,crypto.randomUUID(),paypalEnv(env),now).run();
  let row=await paymentRow(env.DB,user);
  if(row.environment!==paypalEnv(env)){
   row=await resetAttempt(env.DB,user,row,paypalEnv(env),'ENVIRONMENT_CHANGED');
  }
  if(row.status==='REVOKED')throw new ApiError('CONTACT_SUPPORT',409);
  if(row.status==='COMPLETED'){if(!await isPremium(env.DB,user,env))throw new ApiError('CONTACT_SUPPORT',409);return json({premium:true})}
  let order;
  if(row.order_id){
   try{order=await paypal(env,'/v2/checkout/orders/'+encodeURIComponent(row.order_id))}catch(error){
    if(!['PAYPAL_ORDER_MISSING','PAYPAL_ORDER_EXPIRED'].includes(error.message))throw error;
    row=await resetAttempt(env.DB,user,row,paypalEnv(env),error.message);
   }
   if(order&&expiredOrder(order,row)){row=await resetAttempt(env.DB,user,row,paypalEnv(env),'ORDER_EXPIRED');order=null}
   if(row.status==='COMPLETED'){if(!await isPremium(env.DB,user,env))throw new ApiError('CONTACT_SUPPORT',409);return json({premium:true})}
   if(row.status==='REVOKED')throw new ApiError('CONTACT_SUPPORT',409);
  }
  if(!order&&row.order_id)order=await paypal(env,'/v2/checkout/orders/'+encodeURIComponent(row.order_id));
  if(!order){
   order=await paypal(env,'/v2/checkout/orders','POST',{intent:'CAPTURE',purchase_units:[{custom_id:user,description:'Basket Premium — lifetime access',amount:{currency_code:CURRENCY,value:PRICE}}],payment_source:{paypal:{experience_context:{brand_name:'Basket',shipping_preference:'NO_SHIPPING',user_action:'PAY_NOW',return_url:url.origin+'/?payment=paypal-return',cancel_url:url.origin+'/?payment=cancelled'}}}},row.request_id);
   if(!order.id)throw new ApiError('PAYPAL_PAYMENT_ERROR',502);
   await env.DB.prepare("UPDATE payment_orders SET order_id = ?, status = 'CREATED' WHERE user_id = ? AND request_id = ? AND status IN ('NEW','CREATED')").bind(order.id,user,row.request_id).run();
  }
  if(['COMPLETED','APPROVED'].includes(order.status))return captureOrder(env,user,order.id);
  const approval=order.links?.find(x=>['payer-action','approve'].includes(x.rel))?.href;
  const allowedHost=paypalEnv(env)==='live'?'www.paypal.com':'www.sandbox.paypal.com';
  if(!approval||new URL(approval).protocol!=='https:'||new URL(approval).hostname!==allowedHost)throw new ApiError('PAYPAL_PAYMENT_ERROR',502);
  return json({orderId:order.id,approvalUrl:approval});
 }
 if(path==='/api/paypal/reconcile'&&request.method==='POST'){
  if(await isPremium(env.DB,user,env))return json({premium:true,status:'COMPLETED'});
  const row=await paymentRow(env.DB,user);
  if(!row||row.environment!==paypalEnv(env))return json({premium:false,status:'NONE'});
  if(row.status==='REVOKED')throw new ApiError('CONTACT_SUPPORT',409);
  if(!row.order_id)return json({premium:false,status:'NEW'});
  let order;
  try{order=await paypal(env,'/v2/checkout/orders/'+encodeURIComponent(row.order_id))}catch(error){
   if(['PAYPAL_ORDER_MISSING','PAYPAL_ORDER_EXPIRED'].includes(error.message))return json({premium:false,status:'EXPIRED'});
   throw error;
  }
  if(['APPROVED','COMPLETED'].includes(order.status))return captureOrder(env,user,row.order_id);
  return json({premium:false,status:expiredOrder(order,row)?'EXPIRED':order.status});
 }
 if(path==='/api/paypal/capture-order'&&request.method==='POST')return captureOrder(env,user,body.orderId);
 if(!await isPremium(env.DB,user,env))throw new ApiError('PREMIUM_REQUIRED',403);
 if(path==='/api/templates'&&request.method==='GET'){
  const data=await env.DB.prepare('SELECT id,name,items,currency FROM saved_templates WHERE user_id = ? ORDER BY created_at DESC').bind(user).all();
  return json({templates:data.results.map(x=>({...x,items:JSON.parse(x.items)}))});
 }
 if(path==='/api/templates'&&request.method==='POST'){
  if(typeof body.name!=='string'||!body.name.trim()||body.name.length>80)throw new ApiError('INVALID_NAME');
  if(!['USD','VND','EUR','GBP'].includes(body.currency))throw new ApiError('INVALID_CURRENCY');
  const items=validateItems(body.items),id=crypto.randomUUID();
  // The conditional INSERT keeps the per-user storage limit atomic.
  const result=await env.DB.prepare('INSERT INTO saved_templates (id,user_id,name,items,currency,created_at) SELECT ?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM saved_templates WHERE user_id = ?) < 100').bind(id,user,body.name.trim(),JSON.stringify(items),body.currency,new Date().toISOString(),user).run();
  if(!result.meta.changes)throw new ApiError('TEMPLATE_LIMIT',409);
  return json({id},201);
 }
 if(path.startsWith('/api/templates/')&&request.method==='DELETE'){
  await env.DB.prepare('DELETE FROM saved_templates WHERE id = ? AND user_id = ?').bind(path.slice('/api/templates/'.length),user).run();return json({ok:true});
 }
 if(path==='/api/weekly-plan'&&request.method==='GET'){
  const plan=await env.DB.prepare('SELECT days FROM weekly_plans WHERE user_id = ?').bind(user).first();return json({days:plan?JSON.parse(plan.days):Array(7).fill('')});
 }
 if(path==='/api/weekly-plan'&&request.method==='PUT'){
  if(!Array.isArray(body.days)||body.days.length!==7||body.days.some(x=>typeof x!=='string'||x.length>200))throw new ApiError('INVALID_PLAN');
  await env.DB.prepare('INSERT INTO weekly_plans (user_id,days,updated_at) VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET days = excluded.days, updated_at = excluded.updated_at').bind(user,JSON.stringify(body.days),new Date().toISOString()).run();return json({ok:true});
 }
 throw new ApiError('NOT_FOUND',404);
}
async function captureOrder(env,user,orderId){
 if(typeof orderId!=='string'||! /^[A-Z0-9]{8,32}$/.test(orderId))throw new ApiError('INVALID_ORDER');
 const row=await paymentRow(env.DB,user);
 if(!row||row.order_id!==orderId||row.environment!==paypalEnv(env))throw new ApiError('ORDER_NOT_FOUND',404);
 if(row.status==='REVOKED')throw new ApiError('CONTACT_SUPPORT',409);
 if(row.status==='COMPLETED'){if(!await isPremium(env.DB,user,env))throw new ApiError('CONTACT_SUPPORT',409);return json({premium:true})}
 let data=await paypal(env,'/v2/checkout/orders/'+encodeURIComponent(orderId));
 if(data.status!=='COMPLETED'){
  if(data.status!=='APPROVED')throw new ApiError('PAYMENT_NOT_COMPLETED',409);
  try{data=await paypal(env,'/v2/checkout/orders/'+encodeURIComponent(orderId)+'/capture','POST',{},'capture-'+row.request_id)}catch(error){
   // Reconcile a successful capture whose response was lost before retrying.
   data=await paypal(env,'/v2/checkout/orders/'+encodeURIComponent(orderId));if(data.status!=='COMPLETED')throw error;
  }
 }
 const capture=validateCapture(data,row,user),now=new Date().toISOString();
 if(!capture.final_capture)throw new ApiError('PAYMENT_NOT_COMPLETED',409);
 const result=await env.DB.prepare("UPDATE payment_orders SET status = 'COMPLETED', capture_id = ?, paid_at = COALESCE(paid_at,?), verified_at = ?, next_verify_at = NULL WHERE user_id = ? AND order_id = ? AND status <> 'REVOKED'").bind(capture.id,now,now,user,orderId).run();
 if(!result.meta.changes)throw new ApiError('CONTACT_SUPPORT',409);
 return json({premium:true});
}
export {api,validateCapture,validateItems,coffeeUrl,isPremium};
export default {
 async fetch(request,env){
  try{
   const path=new URL(request.url).pathname;
   if(path.startsWith('/api/'))return await api(request,env);
   if(!['GET','HEAD'].includes(request.method))return json({error:'METHOD_NOT_ALLOWED'},405);
   const asset=assets[path==='/'?'/index.html':path];if(!asset)return new Response('Not found',{status:404});
   const body=asset.encoding==='base64'?Uint8Array.from(atob(asset.body),c=>c.charCodeAt(0)):asset.body;
   return new Response(request.method==='HEAD'?null:body,{headers:{'Content-Type':asset.type,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'}});
  }catch(error){return json({error:error instanceof ApiError?error.message:'SERVICE_UNAVAILABLE'},error instanceof ApiError?error.status:503)}
 }
};
