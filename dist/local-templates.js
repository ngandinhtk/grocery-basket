let localTemplates=[];
try{
 const saved=JSON.parse(localStorage.getItem('basket-templates-v1'));
 if(Array.isArray(saved))localTemplates=saved.filter(meal=>meal&&typeof meal.id==='string'&&typeof meal.name==='string'&&Array.isArray(meal.items)&&meal.items.length&&meal.items.every(item=>item&&typeof item.name==='string'&&categories.includes(item.category)&&Number.isFinite(item.qty)&&item.qty>0&&item.qty<=999&&Number.isFinite(item.price)&&item.price>=0)).slice(0,100);
}catch{}
const localTemplateSection=document.createElement('section');
localTemplateSection.className='templates-section local-templates';
localTemplateSection.innerHTML='<h2 id="local-templates-title"></h2><p id="local-templates-note"></p><form id="local-template-form"><label for="local-template-name" id="local-template-label"></label><input id="local-template-name" maxlength="80" required><button class="primary" id="local-template-save" type="submit"></button></form><div id="local-template-list"></div>';
$('recipes-panel').append(localTemplateSection);
function persistLocalTemplates(next){
 try{localStorage.setItem('basket-templates-v1',JSON.stringify(next));localTemplates=next;return true}
 catch{notify(tr('Could not save templates. Check browser storage and try again.','Không thể lưu mẫu. Hãy kiểm tra bộ nhớ trình duyệt và thử lại.'));return false}
}
function saveLocalTemplate(name){
 name=name.trim();
 if(!name||name.length>80){notify(tr('Enter a template name (up to 80 characters).','Nhập tên mẫu (tối đa 80 ký tự).'));return false}
 if(!state.items.length){notify(tr('Add ingredients to your shopping list first.','Hãy thêm nguyên liệu vào danh sách trước.'));return false}
 if(localTemplates.length>=100){notify(tr('You can save up to 100 templates. Delete one to make room.','Bạn có thể lưu tối đa 100 mẫu. Hãy xóa một mẫu để thêm mẫu mới.'));return false}
 const items=state.items.map(({name,category,qty,price,priceCurrency,unit,templateIngredient})=>({name,category,qty,price,priceCurrency:priceCurrency||state.currency,unit:unit||'',...(templateIngredient?{templateIngredient}:{})}));
 let servings=1;
 try{if(typeof planningServings==='function')servings=planningServings()}catch{notify(tr('Choose 1–20 people before saving the template.','Chọn từ 1–20 người trước khi lưu mẫu.'));return false}
 if(!persistLocalTemplates([...localTemplates,{id:crypto.randomUUID(),name,currency:state.currency,servings,items}]))return false;
 renderLocalTemplates();notify(tr('Template saved on this device.','Đã lưu mẫu trên thiết bị này.'));return true;
}
function renderLocalTemplates(){
 $('local-templates-title').textContent=tr('My templates','Mẫu của tôi');
 $('local-templates-note').textContent=tr('Build or edit your shopping list, then save it as a reusable template. Templates stay in this browser on this device.','Thêm hoặc chỉnh nguyên liệu trong danh sách đi chợ, rồi lưu thành mẫu để dùng lại. Mẫu được lưu trong trình duyệt trên thiết bị này.');
 $('local-template-label').textContent=tr('Template name','Tên mẫu');
 $('local-template-name').placeholder=tr('e.g. Sunday dinner','Ví dụ: Bữa cơm chủ nhật');
 $('local-template-save').textContent=tr('Save current list as template','Lưu danh sách hiện tại thành mẫu');
 $('local-template-list').innerHTML=localTemplates.length?localTemplates.map(meal=>`<article class="meal-card"><h3>${escapeHTML(meal.name)}</h3><p>${meal.items.length} ${tr('ingredients','nguyên liệu')}</p><details><summary>${tr('View ingredients','Xem nguyên liệu')}</summary><p>${escapeHTML(meal.items.map(item=>item.templateIngredient&&[item.templateIngredient,ingredientEnglish[item.templateIngredient]].includes(item.name)?templateIngredientName(item.templateIngredient):item.name).join(', '))}</p></details><button type="button" class="outline" data-local-template-add="${escapeHTML(meal.id)}">${tr('Add to list','Thêm vào danh sách')}</button><button type="button" class="outline" data-local-template-edit="${escapeHTML(meal.id)}">${tr('Edit template','Sửa mẫu')}</button><button type="button" class="text-button" data-local-template-delete="${escapeHTML(meal.id)}">${tr('Delete template','Xóa mẫu')}</button></article>`).join(''):`<p class="empty">${tr('No personal templates yet. Save your first shopping list above.','Chưa có mẫu riêng. Lưu danh sách đi chợ đầu tiên ở trên nhé.')}</p>`;
}
$('local-template-form').addEventListener('submit',event=>{event.preventDefault();if(saveLocalTemplate($('local-template-name').value))$('local-template-name').value=''});
$('local-template-list').addEventListener('click',event=>{
 const addButton=event.target.closest('[data-local-template-add]'),deleteButton=event.target.closest('[data-local-template-delete]');
 if(addButton){
  const meal=localTemplates.find(item=>item.id===addButton.dataset.localTemplateAdd);if(!meal)return;
  if(typeof openPlanningMeal==='function'){openPlanningMeal(meal);return}
  const translated={...meal,items:meal.items.map(item=>({...item,name:item.templateIngredient&&[item.templateIngredient,ingredientEnglish[item.templateIngredient]].includes(item.name)?templateIngredientName(item.templateIngredient):item.name}))};
  const result=combineTemplate(state.items,translated,{mode:'skip',currency:state.currency});
  state.items=result.items;filter='all';save();showMainTab('shopping');
  notify(result.resetPrices?tr('Template added. Prices in other currencies were cleared.','Đã thêm mẫu. Giá theo tiền tệ khác đã được xóa.'):tr(`${result.added} ingredients added.`, `Đã thêm ${result.added} nguyên liệu.`));
 }else if(deleteButton){
  if(persistLocalTemplates(localTemplates.filter(meal=>meal.id!==deleteButton.dataset.localTemplateDelete))){renderLocalTemplates();notify(tr('Template deleted.','Đã xóa mẫu.'))}
 }
});
const renderBeforeLocalTemplates=render;
render=function(){renderBeforeLocalTemplates();renderLocalTemplates()};
renderLocalTemplates();
