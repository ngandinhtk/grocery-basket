let premiumConfig=null,premiumActive=false,premiumBusy=false,savedMeals=[],weeklyDays=Array(7).fill(''),accountReady=false;
const weekdayNames=[['Monday','Thứ hai'],['Tuesday','Thứ ba'],['Wednesday','Thứ tư'],['Thursday','Thứ năm'],['Friday','Thứ sáu'],['Saturday','Thứ bảy'],['Sunday','Chủ nhật']];
const premiumText=[
 ['premium-kicker','A little more room for your plans','THÊM KHÔNG GIAN CHO KẾ HOẠCH CỦA BẠN'],
 ['premium-title','Plan your meals, your way.','Bữa ăn của bạn. Kế hoạch của bạn.'],
 ['premium-description','Keep your favorite shopping templates and plan a week of good meals.','Lưu những mẫu đi chợ yêu thích và lên thực đơn cho cả tuần.'],
 ['premium-offer','One-time offer','Ưu đãi một lần'],['premium-lifetime','Lifetime access · One-time payment · No subscription','Trọn đời · Trả một lần · Không gia hạn định kỳ'],
 ['premium-benefit-templates','Save personal shopping templates with your own ingredients and prices.','Lưu mẫu riêng với nguyên liệu, số lượng và giá do bạn chọn.'],
 ['premium-benefit-plan','Create and save a seven-day meal plan.','Lập và lưu thực đơn cho bảy ngày.'],
 ['premium-benefit-account','Your templates and meal plan stay with your signed-in account.','Mẫu riêng và thực đơn được lưu theo tài khoản đăng nhập.'],
 ['premium-free-note','Your shopping list, budget and existing Vietnamese meal templates remain free.','Danh sách đi chợ, ngân sách và các mẫu món Việt hiện có vẫn miễn phí.'],
 ['paypal-note','Complete your payment on PayPal. Premium activates after payment is confirmed.','Hoàn tất thanh toán trên PayPal. Premium được kích hoạt khi giao dịch được xác nhận.'],
 ['premium-refresh','Check purchase status','Kiểm tra trạng thái mua'],
 ['coffee-title','Buy Basket a coffee','Mời Basket một ly cà phê'],
 ['coffee-description','A small thank-you, at any amount you choose.','Một lời cảm ơn nhỏ, với số tiền bạn tự chọn.'],
 ['coffee-note','This is a voluntary contribution, separate from the Premium purchase. It does not activate Premium.','Đây là khoản ủng hộ tự nguyện, riêng với việc mua Premium và không kích hoạt Premium.'],
 ['coffee-link','Open donation page','Mở trang ủng hộ'],
 ['my-templates-title','My shopping templates','Mẫu đi chợ của tôi'],
 ['save-template-label','Save your current shopping list as a template','Lưu danh sách đi chợ hiện tại thành mẫu'],
 ['save-template-button','Save template','Lưu mẫu'],['weekly-title','Your weekly meal plan','Thực đơn trong tuần'],
 ['weekly-note','Write your meals or choose from the suggestions.','Nhập món ăn hoặc chọn từ gợi ý.'],
 ['save-weekly','Save meal plan','Lưu thực đơn'],['premium-account-note','Saved to your account. Your everyday grocery list remains on this device.','Mẫu riêng và thực đơn lưu theo tài khoản. Danh sách đi chợ hằng ngày vẫn lưu trên thiết bị này.']
];
function premiumError(error){
 const messages={SIGN_IN_REQUIRED:['Sign in to purchase or use Premium.','Đăng nhập để mua hoặc sử dụng Premium.'],PAYPAL_NOT_CONFIGURED:['PayPal checkout is being prepared. Please check back soon.','Thanh toán PayPal đang được chuẩn bị. Vui lòng quay lại sau.'],PAYPAL_UNAVAILABLE:['PayPal is temporarily unavailable. Please try again.','PayPal tạm thời không khả dụng. Vui lòng thử lại.'],PAYPAL_PAYMENT_ERROR:['Payment could not be completed. Check the purchase status before trying again.','Chưa thể hoàn tất thanh toán. Hãy kiểm tra trạng thái mua trước khi thử lại.'],PAYMENT_NOT_COMPLETED:['Payment is not yet completed. Premium will activate after confirmation.','Thanh toán chưa hoàn tất. Premium sẽ mở sau khi được xác nhận.'],ORDER_NOT_FOUND:['This payment does not belong to your signed-in account.','Giao dịch này không thuộc tài khoản đang đăng nhập.'],PREMIUM_REQUIRED:['Premium is required for this feature.','Tính năng này cần Premium.'],CONTACT_SUPPORT:['This payment needs support. Please contact the app owner.','Giao dịch này cần hỗ trợ. Vui lòng liên hệ chủ ứng dụng.'],TEMPLATE_LIMIT:['You can keep up to 100 personal templates. Delete a template to save another.','Bạn có thể lưu tối đa 100 mẫu riêng. Xóa một mẫu để lưu mẫu mới.']};
 return messages[error.message]?tr(...messages[error.message]):tr('Could not connect. Please try again; your shopping list is still here.','Không thể kết nối. Vui lòng thử lại; danh sách đi chợ của bạn vẫn được giữ.');
}
async function premiumApi(path,method='GET',body){
 const response=await fetch(path,{method,credentials:'same-origin',headers:method==='GET'?{}:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 let data;try{data=await response.json()}catch{throw Error('SERVICE_UNAVAILABLE')}
 if(!response.ok)throw Error(data.error||'SERVICE_UNAVAILABLE');return data;
}
function renderPremium(){
 premiumText.forEach(([id,en,vi])=>$(id).textContent=tr(en,vi));
 $('template-name').placeholder=tr('e.g. Our Sunday dinner','Ví dụ: Bữa cơm chủ nhật');
 $('premium-pay').textContent=premiumBusy?tr('Please wait…','Vui lòng chờ…'):tr('Pay $3 with PayPal','Thanh toán 3 USD qua PayPal');
 $('premium-pay').disabled=premiumBusy||!premiumConfig?.checkoutReady||!accountReady||premiumActive;
 $('premium-refresh').disabled=premiumBusy||!accountReady;
 $('premium-offer-card').hidden=premiumActive;$('premium-dashboard').hidden=!premiumActive;
 $('premium-membership').textContent=premiumActive?tr('✦ Premium active','✦ Premium đã kích hoạt'):tr('Basket Premium','Basket Premium');
 $('premium-signin').hidden=Boolean(premiumConfig?.signedIn);$('premium-signin').textContent=tr('Sign in with ChatGPT','Đăng nhập bằng ChatGPT');
 $('premium-signin').href='/signin-with-chatgpt?return_to='+encodeURIComponent('/?tab=premium');
 $('premium-availability').textContent=premiumConfig?(!premiumConfig.checkoutReady?tr('PayPal checkout is being prepared.','Thanh toán PayPal đang được chuẩn bị.'):premiumConfig.environment==='sandbox'?tr('Sandbox checkout: test payments only.','Chế độ thử nghiệm: không thu tiền thật.'):''):tr('Loading payment options…','Đang tải phương thức thanh toán…');
 $('coffee-missing').hidden=Boolean(premiumConfig?.coffeeUrl||premiumConfig?.coffeeQrImage);$('coffee-missing').textContent=tr('The donation QR is being prepared.','Mã QR ủng hộ đang được chuẩn bị.');
 $('coffee-link').hidden=!premiumConfig?.coffeeUrl;
 $('coffee-details').textContent=premiumConfig?.coffeeDetails||'';
 if(premiumConfig?.coffeeUrl)$('coffee-link').href=premiumConfig.coffeeUrl;
 $('saved-templates').innerHTML=savedMeals.length?savedMeals.map(x=>`<article class="saved-meal"><div><h3>${escapeHTML(x.name)}</h3><p>${x.items.length} ${tr('ingredients','nguyên liệu')}</p></div><button type="button" class="outline" data-saved-add="${escapeHTML(x.id)}">${tr('Add to list','Thêm vào danh sách')}</button><button type="button" class="text-button" data-saved-delete="${escapeHTML(x.id)}">${tr('Delete','Xóa')}</button></article>`).join(''):`<p class="empty">${tr('Save a shopping list to create your first personal template.','Lưu một danh sách đi chợ để tạo mẫu riêng đầu tiên.')}</p>`;
 document.querySelectorAll('[data-weekday]').forEach(el=>{el.querySelector('span').textContent=tr(...weekdayNames[Number(el.dataset.weekday)]);el.querySelector('input').placeholder=tr('What are we cooking?','Hôm nay nấu gì?')});
 $('meal-options').innerHTML=[...templates.map(x=>tr(x[2],x[1])),...savedMeals.map(x=>x.name)].map(name=>`<option value="${escapeHTML(name)}"></option>`).join('');
}
function renderCoffeeQr(){
 $('coffee-qr').replaceChildren();
 if(premiumConfig?.coffeeQrImage){const img=document.createElement('img');img.src=premiumConfig.coffeeQrImage;img.alt=tr('Bank donation QR','Mã QR ngân hàng để ủng hộ');img.onerror=()=>{$('coffee-qr').replaceChildren();$('coffee-missing').hidden=false;$('coffee-missing').textContent=tr('Unable to load this QR. Please try again later.','Chưa tải được mã QR. Vui lòng thử lại sau.')};$('coffee-qr').append(img)}
 else if(premiumConfig?.coffeeUrl){try{const qr=qrcode(0,'M');qr.addData(premiumConfig.coffeeUrl);qr.make();$('coffee-qr').innerHTML=qr.createSvgTag({cellSize:4,margin:16,scalable:true});$('coffee-qr').setAttribute('aria-label',tr('Scan to open the donation page','Quét mã để mở trang ủng hộ'))}catch{$('coffee-missing').hidden=false}}
}
async function refreshPremium(){
 const status=await premiumApi('/api/premium/status');premiumActive=status.premium;accountReady=true;
 if(premiumActive){const [meals,plan]=await Promise.all([premiumApi('/api/templates'),premiumApi('/api/weekly-plan')]);savedMeals=meals.templates;weeklyDays=plan.days;weeklyDays.forEach((meal,i)=>$('weekly-'+i).value=meal)}
 renderPremium();
}
async function initializePremium(){
 try{premiumConfig=await premiumApi('/api/config');renderPremium();renderCoffeeQr();
  if(premiumConfig.signedIn){await refreshPremium();$('premium-message').textContent=''}
  const params=new URLSearchParams(window.location.search);
  if(params.get('tab')==='premium'||params.has('payment'))showMainTab('premium');
  if(params.get('payment')==='paypal-return'){
   premiumBusy=true;renderPremium();$('premium-message').textContent=tr('Confirming your payment…','Đang xác nhận thanh toán…');
   await premiumApi('/api/paypal/capture-order','POST',{orderId:params.get('token')});await refreshPremium();
   $('premium-message').textContent=tr('Payment confirmed. Welcome to Basket Premium!','Đã xác nhận thanh toán. Chào mừng bạn đến với Basket Premium!');
   window.history.replaceState({},'','/?tab=premium');
  }else if(params.get('payment')==='cancelled'){$('premium-message').textContent=tr('Checkout cancelled. Premium has not been activated.','Đã hủy thanh toán. Premium chưa được kích hoạt.');window.history.replaceState({},'','/?tab=premium')}
 }catch(error){$('premium-message').textContent=premiumError(error)}finally{premiumBusy=false;renderPremium()}
}
 $('premium-pay').addEventListener('click',async()=>{if(premiumBusy)return;premiumBusy=true;renderPremium();$('premium-message').textContent='';try{const data=await premiumApi('/api/paypal/create-order','POST',{});if(data.premium){await refreshPremium();return}window.location.assign(data.approvalUrl)}catch(error){$('premium-message').textContent=premiumError(error)}finally{premiumBusy=false;renderPremium()}});
 $('premium-refresh').addEventListener('click',async()=>{premiumBusy=true;renderPremium();try{
  const params=new URLSearchParams(window.location.search);
  if(params.get('payment')==='paypal-return'&&params.get('token'))await premiumApi('/api/paypal/capture-order','POST',{orderId:params.get('token')});
  await refreshPremium();$('premium-message').textContent=premiumActive?tr('Your Premium purchase is active.','Gói Premium của bạn đã được kích hoạt.'):tr('No completed Premium purchase found.','Chưa có giao dịch mua Premium hoàn tất.');
 }catch(error){$('premium-message').textContent=premiumError(error)}finally{premiumBusy=false;renderPremium()}});
 $('save-template-form').addEventListener('submit',async e=>{e.preventDefault();if(!state.items.length){notify(tr('Add ingredients to your shopping list first.','Hãy thêm nguyên liệu vào danh sách trước.'));return}const button=$('save-template-button');button.disabled=true;try{await premiumApi('/api/templates','POST',{name:$('template-name').value.trim(),items:state.items.map(({name,category,qty,price,unit})=>({name,category,qty,price,unit}))});$('template-name').value='';await refreshPremium();notify(tr('Personal template saved.','Đã lưu mẫu riêng.'))}catch(error){$('premium-message').textContent=premiumError(error)}finally{button.disabled=false}});
 $('saved-templates').addEventListener('click',async e=>{const addButton=e.target.closest('[data-saved-add]'),deleteButton=e.target.closest('[data-saved-delete]');if(addButton){const meal=savedMeals.find(x=>x.id===addButton.dataset.savedAdd);if(!meal)return;let count=0;meal.items.forEach(x=>{if(!state.items.some(item=>!item.done&&item.name.toLocaleLowerCase()===x.name.toLocaleLowerCase())){state.items.push({...x,id:crypto.randomUUID(),done:false});count++}});filter='all';save();showMainTab('shopping');notify(tr(`${count} ingredients added.`, `Đã thêm ${count} nguyên liệu.`))}else if(deleteButton){deleteButton.disabled=true;try{await premiumApi('/api/templates/'+encodeURIComponent(deleteButton.dataset.savedDelete),'DELETE');await refreshPremium()}catch(error){$('premium-message').textContent=premiumError(error);deleteButton.disabled=false}}});
 $('weekly-form').addEventListener('submit',async e=>{e.preventDefault();$('save-weekly').disabled=true;try{weeklyDays=Array.from({length:7},(_,i)=>$('weekly-'+i).value.trim());await premiumApi('/api/weekly-plan','PUT',{days:weeklyDays});notify(tr('Weekly meal plan saved.','Đã lưu thực đơn tuần.'))}catch(error){$('premium-message').textContent=premiumError(error)}finally{$('save-weekly').disabled=false}});
const renderBeforePremium=render;
render=function(){renderBeforePremium();renderPremium()};
renderPremium();initializePremium();
