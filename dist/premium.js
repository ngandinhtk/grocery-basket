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
 ['premium-refresh','Check purchase status','Kiểm tra trạng thái mua'],
 ['coffee-title','Buy Basket a Coffee','A small-thanks Basket!'],
 ['coffee-description','Scan the QR code to send a voluntary contribution.','Quét mã QR để gửi khoản ủng hộ tự nguyện.'],
 ['coffee-note','Thank you for your support!','Cảm ơn bạn đã ủng hộ!'],
 ['my-templates-title','My shopping templates','Mẫu đi chợ của tôi'],
 ['save-template-label','Save your current shopping list as a template','Lưu danh sách đi chợ hiện tại thành mẫu'],
 ['save-template-button','Save template','Lưu mẫu'],['weekly-title','Your weekly meal plan','Thực đơn trong tuần'],
 ['weekly-note','Write your meals or choose from the suggestions.','Nhập món ăn hoặc chọn từ gợi ý.'],
 ['save-weekly','Save meal plan','Lưu thực đơn'],['weekly-shopping-build','Build shopping list','Tạo danh sách đi chợ'],['weekly-shopping-title','Ingredients for this week','Nguyên liệu cho thực đơn tuần này'],['weekly-shopping-note','Check ingredients you already have at home to leave them off the list. Each ingredient appears once. Recipe suggestions have no quantities; personal templates keep their saved quantities.','Đánh dấu nguyên liệu bạn đã có ở nhà để bỏ qua. Mỗi nguyên liệu chỉ hiện một lần. Mẫu món chưa có định lượng; mẫu đi chợ riêng giữ số lượng đã lưu.'],['weekly-shopping-add','Add selected items','Thêm nguyên liệu đã chọn'],['weekly-shopping-cancel','Close preview','Đóng xem trước'],['premium-account-note','Saved to your account. Your everyday grocery list remains on this device.','Mẫu riêng và thực đơn lưu theo tài khoản. Danh sách đi chợ hằng ngày vẫn lưu trên thiết bị này.']
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
 $('premium-pay').textContent=premiumBusy?tr('Please wait…','Vui lòng chờ…'):tr('Pay with PayPal','Thanh toán qua PayPal');
 $('premium-pay').disabled=premiumBusy||!premiumConfig?.checkoutReady||!accountReady||premiumActive;
 $('premium-pay').hidden=!premiumConfig?.checkoutReady;
 $('paypal-note').hidden=!premiumConfig?.checkoutReady;
 $('premium-refresh').textContent=premiumConfig?.checkoutReady?tr('Check purchase status','Kiểm tra trạng thái mua'):tr('Refresh Premium status','Làm mới trạng thái Premium');
 $('premium-refresh').disabled=premiumBusy||!accountReady;
 $('premium-offer-card').hidden=premiumActive;$('premium-dashboard').hidden=!premiumActive;
 $('premium-membership').textContent=premiumActive?tr('✦ Premium active','✦ Premium đã kích hoạt'):tr('Basket Premium','Basket Premium');
 $('premium-signin').hidden=Boolean(premiumConfig?.signedIn);$('premium-signin').textContent=tr('Sign in with ChatGPT','Đăng nhập bằng ChatGPT');
 $('premium-signin').href='/signin-with-chatgpt?return_to='+encodeURIComponent('/?tab=premium');
 $('premium-availability').textContent=premiumConfig?(!premiumConfig.checkoutReady?tr('Premium checkout is temporarily unavailable.','Thanh toán Premium tạm thời chưa khả dụng.'):premiumConfig.environment==='sandbox'?tr('Sandbox checkout: test payments only.','Chế độ thử nghiệm: không thu tiền thật.'):''):tr('Loading payment options…','Đang tải phương thức thanh toán…');
 $('coffee-missing').hidden=true;
 const bankDetails=[`${tr('Bank:','Ngân hàng:')} ${BANK_DONATION.bank}`,`${tr('Account:','Số tài khoản:')} ${BANK_DONATION.account}`,...(BANK_DONATION.owner?[`${tr('Account holder:','Chủ tài khoản:')} ${BANK_DONATION.owner}`]:[])].join('\n');
 $('coffee-details').textContent=premiumConfig?.coffeeDetails||bankDetails;
 $('saved-templates').innerHTML=savedMeals.length?savedMeals.map(x=>`<article class="saved-meal"><div><h3>${escapeHTML(x.name)}</h3><p>${x.items.length} ${tr('ingredients','nguyên liệu')}</p></div><button type="button" class="outline" data-saved-add="${escapeHTML(x.id)}">${tr('Add to list','Thêm vào danh sách')}</button><button type="button" class="text-button" data-saved-delete="${escapeHTML(x.id)}">${tr('Delete','Xóa')}</button></article>`).join(''):`<p class="empty">${tr('Save a shopping list to create your first personal template.','Lưu một danh sách đi chợ để tạo mẫu riêng đầu tiên.')}</p>`;
 document.querySelectorAll('[data-weekday]').forEach(el=>{el.querySelector('span').textContent=tr(...weekdayNames[Number(el.dataset.weekday)]);el.querySelector('input').placeholder=tr('What are we cooking?','Hôm nay nấu gì?')});
 $('meal-options').innerHTML=[...templates.map(x=>tr(x[2],x[1])),...savedMeals.map(x=>x.name)].map(name=>`<option value="${escapeHTML(name)}"></option>`).join('');
}
let weeklyShoppingIngredients=[],weeklyShoppingAtHome=new Set();
function plannedMealIngredients(name){
 const key=ingredientKey(name);
 const saved=savedMeals.find(meal=>ingredientKey(meal.name)===key);
 if(saved)return saved.items.filter(item=>typeof item.name==='string'&&categories.includes(item.category)).map(item=>{const matchingCurrency=saved.currency===state.currency&&(item.priceCurrency||saved.currency)===state.currency;return {name:item.name,category:item.category,qty:item.qty,price:matchingCurrency?item.price:0,priceCurrency:state.currency,unit:item.unit||''}});
 const recipe=templates.find(item=>[item[1],item[2],tr(item[2],item[1])].some(label=>ingredientKey(label)===key));
 if(!recipe)return null;
 return recipe[4].map(value=>{const [ingredient,category]=value.split('|');return {name:ingredient,category:categories[Number(category)],qty:1,price:0,priceCurrency:state.currency,unit:''}});
}
function renderWeeklyShoppingPreview(unmatched=[]){
 $('weekly-shopping-items').innerHTML=weeklyShoppingIngredients.map((item,index)=>`<label class="weekly-shopping-item"><input type="checkbox" data-weekly-have="${index}" ${weeklyShoppingAtHome.has(index)?'checked':''}><span>${escapeHTML(item.name)} <small>${tr(item.category,viCategories[categories.indexOf(item.category)])}</small></span></label>`).join('')||`<p class="empty">${tr('No matching ingredient templates were found.','Chưa tìm thấy mẫu nguyên liệu phù hợp.')}</p>`;
 $('weekly-shopping-unmatched').textContent=unmatched.length?tr(`No ingredient template found for: ${unmatched.join(', ')}. Add those items manually.`,`Chưa có mẫu nguyên liệu cho: ${unmatched.join(', ')}. Bạn có thể tự thêm các món này.`):'';
 $('weekly-shopping-add').disabled=!pendingWeeklyShoppingIngredients().length;
 $('weekly-shopping-preview').hidden=false;
}
function pendingWeeklyShoppingIngredients(){
 return weeklyShoppingIngredients.filter((item,index)=>!weeklyShoppingAtHome.has(index)&&!state.items.some(existing=>!existing.done&&ingredientKey(existing.name)===ingredientKey(item.name)));
}
function prepareWeeklyShopping(){
 const unique=new Map(),unmatched=new Set();
 for(let day=0;day<7;day++){
  const name=$('weekly-'+day).value.trim();
  if(!name)continue;
  const ingredients=plannedMealIngredients(name);
  if(!ingredients){unmatched.add(name);continue}
  for(const item of ingredients)if(!unique.has(ingredientKey(item.name)))unique.set(ingredientKey(item.name),item);
 }
 weeklyShoppingIngredients=[...unique.values()];weeklyShoppingAtHome=new Set();
 renderWeeklyShoppingPreview([...unmatched]);
}
function addWeeklyShoppingIngredients(){
 const pending=pendingWeeklyShoppingIngredients();
 state.items.push(...pending.map(item=>({...item,id:crypto.randomUUID(),priceCurrency:item.priceCurrency||state.currency,done:false})));
 filter='all';save();$('weekly-shopping-preview').hidden=true;
 if(pending.length){showMainTab('shopping');notify(tr(`${pending.length} ingredients added to your list.`,`Đã thêm ${pending.length} nguyên liệu vào danh sách.`))}
 else notify(tr('No new ingredients to add.','Không có nguyên liệu mới để thêm.'));
}
function renderCoffeeQr(){
 const container=$('coffee-qr');
 let image=container.querySelector('img');
 if(!image){image=document.createElement('img');container.append(image)}
 image.src=BANK_DONATION.qrImage;
 image.alt=tr('Bank donation QR','Mã QR ngân hàng để ủng hộ');
 image.loading='eager';
 image.decoding='async';
 container.setAttribute('aria-label',tr('Bank donation QR','Mã QR ngân hàng để ủng hộ'));
 $('coffee-missing').hidden=true;
}
function weeklyInputSnapshot(){return Array.from({length:7},(_,i)=>$('weekly-'+i).value)}
function weeklyDirty(){return weeklyInputSnapshot().some((meal,i)=>meal.trim()!==weeklyDays[i])}
function updateWeeklyStatus(){$('weekly-status').textContent=weeklyDirty()?tr('You have unsaved meal plan changes.','Bạn có thay đổi thực đơn chưa lưu.'):''}
async function refreshTemplates(){
 const meals=await premiumApi('/api/templates');savedMeals=meals.templates;renderPremium();
}
async function refreshPremium(){
 const status=await premiumApi('/api/premium/status');premiumActive=status.premium;accountReady=true;
 if(premiumActive){
  const previousInput=weeklyInputSnapshot(),preserveInput=weeklyDirty();
  const [meals,plan]=await Promise.all([premiumApi('/api/templates'),premiumApi('/api/weekly-plan')]);
  savedMeals=meals.templates;weeklyDays=plan.days;
  if(!preserveInput&&weeklyInputSnapshot().every((meal,i)=>meal===previousInput[i]))weeklyDays.forEach((meal,i)=>$('weekly-'+i).value=meal);
  updateWeeklyStatus();
 }
 renderPremium();
}
async function initializePremium(){
 try{premiumConfig=await premiumApi('/api/config');renderPremium();
  if(premiumConfig.signedIn){await refreshPremium();$('premium-message').textContent=''}
  const params=new URLSearchParams(window.location.search);
  if(params.get('tab')==='premium'||params.has('payment'))showMainTab('premium');
  if(params.get('payment')==='paypal-return'&&premiumConfig.checkoutReady){
   premiumBusy=true;renderPremium();$('premium-message').textContent=tr('Confirming your payment…','Đang xác nhận thanh toán…');
   await premiumApi('/api/paypal/capture-order','POST',{orderId:params.get('token')});await refreshPremium();
   $('premium-message').textContent=tr('Payment confirmed. Welcome to Basket Premium!','Đã xác nhận thanh toán. Chào mừng bạn đến với Basket Premium!');
   window.history.replaceState({},'','/?tab=premium');
  }else if(params.has('payment'))window.history.replaceState({},'','/?tab=premium');
 }catch(error){$('premium-message').textContent=premiumError(error)}finally{premiumBusy=false;renderPremium()}
}
 $('premium-pay').addEventListener('click',async()=>{if(premiumBusy)return;premiumBusy=true;renderPremium();$('premium-message').textContent='';try{const data=await premiumApi('/api/paypal/create-order','POST',{});if(data.premium){await refreshPremium();return}window.location.assign(data.approvalUrl)}catch(error){$('premium-message').textContent=premiumError(error)}finally{premiumBusy=false;renderPremium()}});
 $('premium-refresh').addEventListener('click',async()=>{premiumBusy=true;renderPremium();try{
  const params=new URLSearchParams(window.location.search);
  if(premiumConfig?.checkoutReady&&params.get('payment')==='paypal-return'&&params.get('token'))await premiumApi('/api/paypal/capture-order','POST',{orderId:params.get('token')});
  if(premiumConfig?.checkoutReady)await premiumApi('/api/paypal/reconcile','POST',{});
  await refreshPremium();$('premium-message').textContent=premiumActive?tr('Your Premium purchase is active.','Gói Premium của bạn đã được kích hoạt.'):tr('No completed Premium purchase found.','Chưa có giao dịch mua Premium hoàn tất.');
 }catch(error){$('premium-message').textContent=premiumError(error)}finally{premiumBusy=false;renderPremium()}});
 $('save-template-form').addEventListener('submit',async e=>{e.preventDefault();if(!state.items.length){notify(tr('Add ingredients to your shopping list first.','Hãy thêm nguyên liệu vào danh sách trước.'));return}const button=$('save-template-button');button.disabled=true;try{await premiumApi('/api/templates','POST',{name:$('template-name').value.trim(),currency:state.currency,items:state.items.map(({name,category,qty,price,priceCurrency,unit})=>({name,category,qty,price,priceCurrency:priceCurrency||state.currency,unit}))});$('template-name').value='';await refreshTemplates();notify(tr('Personal template saved.','Đã lưu mẫu riêng.'))}catch(error){$('premium-message').textContent=premiumError(error)}finally{button.disabled=false}});
 $('saved-templates').addEventListener('click',async e=>{const addButton=e.target.closest('[data-saved-add]'),deleteButton=e.target.closest('[data-saved-delete]');if(addButton){const meal=savedMeals.find(x=>x.id===addButton.dataset.savedAdd);if(!meal)return;let count=0;meal.items.forEach(x=>{if(!state.items.some(item=>!item.done&&item.name.toLocaleLowerCase()===x.name.toLocaleLowerCase())){const matchingCurrency=meal.currency===state.currency&&(x.priceCurrency||meal.currency)===state.currency;state.items.push({...x,id:crypto.randomUUID(),priceCurrency:state.currency,price:matchingCurrency?x.price:0,done:false});count++}});filter='all';save();showMainTab('shopping');notify(tr(`${count} ingredients added.`, `Đã thêm ${count} nguyên liệu.`))}else if(deleteButton){deleteButton.disabled=true;try{await premiumApi('/api/templates/'+encodeURIComponent(deleteButton.dataset.savedDelete),'DELETE');await refreshTemplates()}catch(error){$('premium-message').textContent=premiumError(error);deleteButton.disabled=false}}});
 $('weekly-form').addEventListener('input',updateWeeklyStatus);
 window.addEventListener('beforeunload',event=>{if(weeklyDirty()){event.preventDefault();event.returnValue=''}});
 $('weekly-form').addEventListener('submit',async e=>{e.preventDefault();$('save-weekly').disabled=true;const submitted=weeklyInputSnapshot().map(meal=>meal.trim());try{await premiumApi('/api/weekly-plan','PUT',{days:submitted});weeklyDays=submitted;updateWeeklyStatus();notify(tr('Weekly meal plan saved.','Đã lưu thực đơn tuần.'))}catch(error){$('premium-message').textContent=premiumError(error)}finally{$('save-weekly').disabled=false}});
$('weekly-shopping-build').addEventListener('click',prepareWeeklyShopping);
$('weekly-shopping-items').addEventListener('change',e=>{const checkbox=e.target.closest('[data-weekly-have]');if(!checkbox)return;const index=Number(checkbox.dataset.weeklyHave);if(checkbox.checked)weeklyShoppingAtHome.add(index);else weeklyShoppingAtHome.delete(index);$('weekly-shopping-add').disabled=!pendingWeeklyShoppingIngredients().length});
$('weekly-shopping-add').addEventListener('click',addWeeklyShoppingIngredients);
$('weekly-shopping-cancel').addEventListener('click',()=>$('weekly-shopping-preview').hidden=true);
const renderBeforePremium=render;
render=function(){renderBeforePremium();renderPremium()};
renderCoffeeQr();renderPremium();initializePremium();
