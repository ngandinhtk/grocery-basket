let household=null,householdItems=[],householdLinked=false,householdBusy=false,householdStatus='',inviteUrl='';
const householdInvite=new URLSearchParams(window.location.search).get('invite');
const householdCard=document.createElement('section');
householdCard.id='household-card';householdCard.className='household-card';
householdCard.innerHTML=`<div class="household-heading"><div><div class="eyebrow" id="household-kicker"></div><h2 id="household-title"></h2></div><span id="household-count" class="pill" hidden></span></div><p id="household-description"></p><p id="household-status" role="status"></p><div id="household-local"><a id="household-signin" class="primary"></a><div id="household-local-actions" hidden><p id="household-join-note"></p><button id="household-create" class="primary" type="button"></button><form id="household-join-form"><label for="household-token" id="household-token-label"></label><input id="household-token" autocomplete="off" maxlength="50" required><button id="household-join" class="outline" type="submit"></button></form></div></div><div id="household-shared" hidden><p id="household-members"></p><p id="household-merge-note"></p><button id="household-link-device" class="primary" type="button" hidden></button><div id="household-invite-actions"><button id="household-invite-create" class="outline" type="button"></button><div id="household-invite-link" hidden><label for="household-url" id="household-url-label"></label><input id="household-url" readonly><div class="household-actions"><button id="household-share" class="primary" type="button"></button><button id="household-copy" class="outline" type="button"></button></div><small id="household-invite-expiry"></small></div></div><button id="household-leave" class="text-button" type="button"></button><button id="household-dissolve" class="text-button" type="button" hidden></button></div>`;
document.getElementById('shopping-panel').append(householdCard);

const householdText={
 kicker:['SHOP TOGETHER','CÙNG ĐI CHỢ'],
 title:['Share a household grocery list','Chia sẻ danh sách đi chợ trong gia đình'],
 description:['Invite signed-in family members to keep one grocery list in sync.','Mời người thân đã đăng nhập cùng cập nhật một danh sách đi chợ.'],
 signIn:['Sign in to create or join a household','Đăng nhập để tạo hoặc tham gia hộ gia đình'],
 inviteSignIn:['Sign in to accept this household invite. Your local list will only be shared after you confirm the join.','Đăng nhập để nhận lời mời. Danh sách trên thiết bị chỉ được chia sẻ sau khi bạn xác nhận tham gia.'],
 joinReady:['Invite ready. Joining merges this device’s current grocery list with the household list.','Lời mời đã sẵn sàng. Khi tham gia, danh sách hiện tại sẽ được gộp vào danh sách chung.'],
 create:['Create a household and share this device’s list','Tạo hộ gia đình và chia sẻ danh sách trên thiết bị này'],
 joinLabel:['Invite link or code','Liên kết hoặc mã mời'],
 join:['Join and merge my list','Tham gia và gộp danh sách của tôi'],
 joinNote:['Joining shares this device’s current grocery list with the household.','Khi tham gia, danh sách hiện có trên thiết bị này sẽ được chia sẻ với hộ gia đình.'],
 merge:['Merge this device’s list with the household list','Gộp danh sách trên thiết bị này với danh sách chung'],
 mergeNote:['Your current list stays on this device until you choose to merge it. Merging shares its items with the household.','Danh sách hiện tại vẫn riêng trên thiết bị cho đến khi bạn chọn gộp. Khi gộp, các món sẽ được chia sẻ với hộ gia đình.'],
 members:['{count} signed-in members','{count} thành viên đã đăng nhập'],
 invite:['Create a one-time invite link','Tạo liên kết mời dùng một lần'],
 share:['Share link','Chia sẻ liên kết'],
 copy:['Copy link','Sao chép liên kết'],
 urlLabel:['Send this one-use link in Messenger, Zalo or another app','Gửi liên kết dùng một lần này qua Messenger, Zalo hoặc ứng dụng khác'],
 expiry:['Expires in 7 days; the invited person must sign in.','Liên kết hết hạn sau 7 ngày; người được mời cần đăng nhập.'],
 leave:['Leave household','Rời hộ gia đình'],
 dissolve:['Close household for everyone','Đóng hộ gia đình với tất cả thành viên'],
 synced:['Household list synced.','Danh sách gia đình đã đồng bộ.'],
 localOnly:['Your list is saved on this device. Sign in to share it.','Danh sách đang lưu trên thiết bị này. Đăng nhập để chia sẻ.'],
 notLinked:['This account is in a household, but this device has not been linked yet.','Tài khoản này đã ở trong hộ gia đình nhưng thiết bị này chưa được kết nối.'],
 syncError:['Could not sync right now. Your local list is preserved; changes will retry.','Chưa thể đồng bộ. Danh sách trên thiết bị vẫn được giữ và sẽ thử lại.'],
 inviteCreated:['Invite link ready. Share it only with someone you want to invite.','Đã tạo liên kết mời. Chỉ gửi cho người bạn muốn mời.'],
 inviteCancelled:['Sharing cancelled. The invite link is still available to copy.','Đã hủy chia sẻ. Bạn vẫn có thể sao chép liên kết mời.'],
 copied:['Invite link copied. Paste it into Messenger or Zalo.','Đã sao chép liên kết mời. Hãy dán vào Messenger hoặc Zalo.'],
 copyFailed:['Copy unavailable. Select the invite link and copy it manually.','Không thể tự sao chép. Hãy chọn liên kết và sao chép thủ công.'],
 joined:['You joined the household. Your current list is being merged.','Bạn đã tham gia hộ gia đình. Đang gộp danh sách hiện có.'],
 created:['Household created. Your current list is now shared.','Đã tạo hộ gia đình. Danh sách hiện tại đã được chia sẻ.'],
 merged:['This device is linked and its list is shared with the household.','Thiết bị đã kết nối và danh sách được chia sẻ với hộ gia đình.'],
 invalidInvite:['This invite link is invalid, expired or already used. Ask for a new one.','Liên kết mời không hợp lệ, đã hết hạn hoặc đã được sử dụng. Hãy xin liên kết mới.'],
 alreadyMember:['This account already belongs to a household.','Tài khoản này đã thuộc một hộ gia đình.'],
 full:['This household has reached its 10-member limit.','Hộ gia đình đã đạt giới hạn 10 thành viên.'],
 pendingInvites:['There are already active invites for every available household spot.','Đã có lời mời đang chờ cho tất cả chỗ trống trong hộ gia đình.'],
 owner:['The household owner cannot leave. Close the household instead.','Chủ hộ không thể rời đi. Hãy đóng hộ gia đình nếu cần.'],
 confirmLeave:['Leave this household? This device’s list will stay here.','Rời hộ gia đình? Danh sách trên thiết bị này vẫn được giữ.'],
 confirmDissolve:['Close this household for everyone? Shared items and unused invites will be deleted.','Đóng hộ gia đình cho tất cả thành viên? Danh sách chung và lời mời chưa dùng sẽ bị xóa.'],
 unknown:['Household request failed. Your local grocery list is unchanged.','Yêu cầu hộ gia đình thất bại. Danh sách trên thiết bị không bị thay đổi.']
};
function householdTr(key,values={}){
 const [en,vi]=householdText[key];
 return tr(en.replace(/\{(\w+)\}/g,(_,name)=>values[name]),vi.replace(/\{(\w+)\}/g,(_,name)=>values[name]));
}
function renderHouseholdText(){
 $('household-kicker').textContent=householdTr('kicker');$('household-title').textContent=householdTr('title');$('household-description').textContent=householdTr('description');
 $('household-signin').textContent=householdTr('signIn');$('household-create').textContent=householdTr('create');$('household-token-label').textContent=householdTr('joinLabel');$('household-join').textContent=householdTr('join');$('household-join-note').textContent=householdTr('joinNote');
 $('household-invite-create').textContent=householdTr('invite');$('household-share').textContent=householdTr('share');$('household-copy').textContent=householdTr('copy');$('household-url-label').textContent=householdTr('urlLabel');
 $('household-invite-expiry').textContent=householdTr('expiry');$('household-leave').textContent=householdTr('leave');$('household-dissolve').textContent=householdTr('dissolve');$('household-link-device').textContent=householdTr('merge');
 if(household){$('household-members').textContent=householdTr('members',{count:household.memberCount});$('household-count').textContent=householdTr('members',{count:household.memberCount})}
 $('household-signin').href='/signin-with-chatgpt?return_to='+encodeURIComponent(householdInvite?'/?invite='+householdInvite:'/?tab=shopping');
}
async function householdApi(path,method='GET',body){
 const response=await fetch(path,{method,credentials:'same-origin',headers:method==='GET'?{}:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 let data;try{data=await response.json()}catch{throw Error('SERVICE_UNAVAILABLE')}
 if(!response.ok)throw Error(data.error||'SERVICE_UNAVAILABLE');
 return data;
}
function householdError(error){
 const errors={INVALID_INVITE:'invalidInvite',ALREADY_IN_HOUSEHOLD:'alreadyMember',HOUSEHOLD_FULL:'full',HOUSEHOLD_INVITES_PENDING:'pendingInvites',HOUSEHOLD_OWNER:'owner'};
 return householdTr(errors[error.message]||'unknown');
}
function normalizeHouseholdItems(items){
 return items.map(item=>({...item,id:typeof item.id==='string'&&item.id?item.id:crypto.randomUUID(),unit:item.unit||'',done:Boolean(item.done)}));
}
function householdItemEqual(a,b){
 return ['id','name','category','qty','price','unit','done','actualPrice','actualCurrency'].every(key=>(a[key]??(key==='unit'?'':undefined))===(b[key]??(key==='unit'?'':undefined)));
}
function householdDiff(before,after){
 const previous=new Map(before.map(item=>[item.id,item])),next=new Map(after.map(item=>[item.id,item]));
 return {upsert:after.filter(item=>!previous.has(item.id)||!householdItemEqual(previous.get(item.id),item)),delete:before.filter(item=>!next.has(item.id)).map(item=>item.id)};
}
function applyHouseholdChanges(remote,changes){
 const items=new Map(remote.map(item=>[item.id,item]));
 changes.delete.forEach(id=>items.delete(id));changes.upsert.forEach(item=>items.set(item.id,item));
 return [...items.values()];
}
function sameHouseholdItems(a,b){return a.length===b.length&&a.every(item=>b.some(other=>householdItemEqual(item,other)))}
function householdMeta(){
 try{const saved=JSON.parse(localStorage.getItem('basket-household-v1'));return saved&&typeof saved.householdId==='string'&&Array.isArray(saved.items)?saved:null}catch{return null}
}
function saveHouseholdMeta(){
 try{localStorage.setItem('basket-household-v1',JSON.stringify({householdId:household.id,items:householdItems}))}
 catch{householdStatus=householdTr('syncError')}
}
function showHouseholdStatus(keyOrText,isRaw=false){householdStatus=isRaw?keyOrText:householdTr(keyOrText);$('household-status').textContent=householdStatus}
function renderHousehold(){
 renderHouseholdText();
 $('household-status').textContent=householdStatus||'';
 $('household-local').hidden=Boolean(household);
 $('household-shared').hidden=!household;
 $('household-local-actions').hidden=!householdSignedIn;
 $('household-signin').hidden=householdSignedIn;
 $('household-join-note').hidden=!householdSignedIn;
 $('household-count').hidden=!household;
 $('household-link-device').hidden=!household||householdLinked;
 $('household-merge-note').textContent=household&&!householdLinked?householdTr('mergeNote'):'';
 $('household-invite-create').hidden=!household||household.memberCount>=10;
 $('household-leave').hidden=!household||household.isOwner;
 $('household-dissolve').hidden=!household||!household.isOwner;
 $('household-invite-link').hidden=!inviteUrl;
 $('household-invite-url').value=inviteUrl;
}
let householdSignedIn=false;
function ensureHouseholdIds(){
 let changed=false;
 state.items=state.items.map(item=>{
  const normalized={...item,id:typeof item.id==='string'&&item.id?item.id:crypto.randomUUID(),unit:item.unit||'',done:Boolean(item.done)};
  if(!item.id||item.unit===undefined||item.done===undefined)changed=true;
  return normalized;
 });
 if(changed)saveBeforeHousehold();
}
function persistHouseholdLocal(){saveBeforeHousehold()}
async function syncHousehold(){
 if(!household||!householdLinked||householdBusy)return;
 householdBusy=true;
 try{
  const current=normalizeHouseholdItems(state.items),changes=householdDiff(householdItems,current);
  if(!changes.upsert.length&&!changes.delete.length)return;
  let response={items:householdItems};
  for(let offset=0;offset<changes.delete.length;offset+=100)response=await householdApi('/api/household/items','POST',{upsert:[],delete:changes.delete.slice(offset,offset+100)});
  for(let offset=0;offset<changes.upsert.length;offset+=100)response=await householdApi('/api/household/items','POST',{upsert:changes.upsert.slice(offset,offset+100),delete:[]});
  const concurrent=householdDiff(current,normalizeHouseholdItems(state.items));
  householdItems=normalizeHouseholdItems(response.items);state.items=applyHouseholdChanges(householdItems,concurrent);saveHouseholdMeta();persistHouseholdLocal();showHouseholdStatus('synced');
  if(householdDiff(householdItems,state.items).upsert.length||householdDiff(householdItems,state.items).delete.length)setTimeout(syncHousehold,0);
 }catch(error){showHouseholdStatus('syncError')}
 finally{householdBusy=false}
}
async function refreshHousehold(){
 if(!household||!householdLinked||householdBusy)return;
 householdBusy=true;
 try{
  const response=await householdApi('/api/household/items'),local=normalizeHouseholdItems(state.items),pending=householdDiff(householdItems,local),remote=normalizeHouseholdItems(response.items),merged=applyHouseholdChanges(remote,pending),changed=!sameHouseholdItems(local,merged);
  householdItems=remote;state.items=merged;saveHouseholdMeta();
  if(changed)persistHouseholdLocal();
  showHouseholdStatus('synced');
  if(householdDiff(householdItems,state.items).upsert.length||householdDiff(householdItems,state.items).delete.length)setTimeout(syncHousehold,0);
 }catch(error){showHouseholdStatus('syncError')}
 finally{householdBusy=false}
}
async function activateHousehold(data,{mergeLocal=false,status='synced'}={}){
 household=data.household;householdItems=normalizeHouseholdItems(data.items);householdLinked=true;
 const local=normalizeHouseholdItems(state.items);
 state.items=mergeLocal?applyHouseholdChanges(householdItems,{upsert:local,delete:[]}):applyHouseholdChanges(householdItems,householdDiff(householdItems,local));
 saveHouseholdMeta();persistHouseholdLocal();showHouseholdStatus(status);renderHousehold();
 await syncHousehold();
}
async function loadHousehold(){
 ensureHouseholdIds();
 try{
  const data=await householdApi('/api/household');
  householdSignedIn=true;
  if(!data.household){
   household=null;householdLinked=false;
   if(householdInvite)$('household-token').value=householdInvite;
   if(householdInvite)showHouseholdStatus('joinReady');
   else showHouseholdStatus('localOnly');
   renderHousehold();return;
  }
  household=data.household;
  const saved=householdMeta();
  if(saved?.householdId===household.id){
   householdItems=normalizeHouseholdItems(saved.items);householdLinked=true;
   const remote=normalizeHouseholdItems(data.items),local=normalizeHouseholdItems(state.items),pending=householdDiff(householdItems,local);
   householdItems=remote;state.items=applyHouseholdChanges(remote,pending);saveHouseholdMeta();persistHouseholdLocal();renderHousehold();
   if(pending.upsert.length||pending.delete.length)await syncHousehold();else showHouseholdStatus('synced');
  }else{
   householdItems=normalizeHouseholdItems(data.items);householdLinked=false;showHouseholdStatus('notLinked');renderHousehold();
  }
 }catch(error){
  householdSignedIn=false;household=null;householdLinked=false;
  showHouseholdStatus(error.message==='SIGN_IN_REQUIRED'?(householdInvite?'inviteSignIn':'localOnly'):'unknown');
  renderHousehold();
 }
}
async function createHousehold(){
 $('household-create').disabled=true;
 try{await householdApi('/api/household','POST',{});const data=await householdApi('/api/household');await activateHousehold(data,{mergeLocal:true,status:'created'})}
 catch(error){showHouseholdStatus(householdError(error),true)}
 finally{$('household-create').disabled=false}
}
async function joinHousehold(token){
 $('household-join').disabled=true;
 try{await householdApi('/api/household/join','POST',{token});const data=await householdApi('/api/household');await activateHousehold(data,{mergeLocal:true,status:'joined'});inviteUrl='';window.history.replaceState({},'','/?tab=shopping')}
 catch(error){showHouseholdStatus(householdError(error),true)}
 finally{$('household-join').disabled=false}
}
async function createHouseholdInvite(){
 $('household-invite-create').disabled=true;
 try{const result=await householdApi('/api/household/invites','POST',{});inviteUrl=new URL('/?invite='+encodeURIComponent(result.token),window.location.origin).href;showHouseholdStatus('inviteCreated');renderHousehold()}
 catch(error){showHouseholdStatus(householdError(error),true)}
 finally{$('household-invite-create').disabled=false}
}
async function shareHouseholdInvite(){
 try{
  if(typeof navigator.share==='function')await navigator.share({title:householdTr('title'),text:householdTr('expiry'),url:inviteUrl});
  else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(inviteUrl);showHouseholdStatus('copied')}
  else{$('household-invite-url').focus();$('household-invite-url').select();showHouseholdStatus('copyFailed')}
 }catch(error){
  if(error.name==='AbortError'){showHouseholdStatus('inviteCancelled');return}
  try{await navigator.clipboard.writeText(inviteUrl);showHouseholdStatus('copied')}
  catch{$('household-invite-url').focus();$('household-invite-url').select();showHouseholdStatus('copyFailed')}
 }
}
async function copyHouseholdInvite(){
 try{await navigator.clipboard.writeText(inviteUrl);showHouseholdStatus('copied')}
 catch{$('household-invite-url').focus();$('household-invite-url').select();showHouseholdStatus('copyFailed')}
}
async function leaveHousehold(){
 const endpoint=household.isOwner?'/api/household':'/api/household/leave';
 if(!confirm(householdTr(household.isOwner?'confirmDissolve':'confirmLeave')))return;
 try{
  await householdApi(endpoint,'DELETE',{});household=null;householdItems=[];householdLinked=false;localStorage.removeItem('basket-household-v1');inviteUrl='';showHouseholdStatus('localOnly');renderHousehold();
 }catch(error){showHouseholdStatus(householdError(error),true)}
}
$('household-create').addEventListener('click',createHousehold);
$('household-join-form').addEventListener('submit',event=>{event.preventDefault();const token=$('household-token').value.trim().match(/[?&]invite=([A-Za-z0-9_-]{40,50})/)?.[1]||$('household-token').value.trim();return joinHousehold(token)});
$('household-link-device').addEventListener('click',async()=>{if(!household)return;await activateHousehold({household,items:householdItems},{mergeLocal:true,status:'merged'})});
$('household-invite-create').addEventListener('click',createHouseholdInvite);
$('household-share').addEventListener('click',shareHouseholdInvite);
$('household-copy').addEventListener('click',copyHouseholdInvite);
$('household-leave').addEventListener('click',leaveHousehold);
$('household-dissolve').addEventListener('click',leaveHousehold);
const renderBeforeHousehold=render;
render=function(){renderBeforeHousehold();renderHousehold()};
const saveBeforeHousehold=save;
save=function(){saveBeforeHousehold();if(householdLinked)syncHousehold()};
renderHouseholdText();renderHousehold();loadHousehold();
setInterval(()=>{if(document.visibilityState!=='hidden')refreshHousehold()},10000);
