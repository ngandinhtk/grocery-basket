let mainTab='shopping';
const mainTabs=['shopping','recipes','premium'];
function showMainTab(tab,focus=false){
 if(!mainTabs.includes(tab))return;
 mainTab=tab;
 for(const name of mainTabs){
  const active=name===tab,button=$(`tab-${name}`);
  $(`${name}-panel`).hidden=!active;
  button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;
  if(active&&focus)button.focus();
 }
}
function localizeNavigation(){
 $('main-tabs').setAttribute('aria-label',tr('Shopping and support','Đi chợ và ủng hộ'));
 $('tab-shopping').textContent=tr('Shopping list','Danh sách đi chợ');
 $('tab-recipes').textContent=tr('Templates & meal ideas','Mẫu & gợi ý món ăn');
 $('tab-premium').textContent=tr('Support Basket','Ủng hộ Basket');
 shoppingModeToggle.textContent=tr(shoppingMode?'Exit shopping mode':'Start shopping mode',shoppingMode?'Thoát chế độ đi chợ':'Bắt đầu đi chợ');
 shoppingModeToggle.setAttribute('aria-pressed',String(shoppingMode));
}
for(const name of mainTabs){
 const button=$(`tab-${name}`);
 button.addEventListener('click',()=>showMainTab(name));
 button.addEventListener('keydown',e=>{
  if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){
   e.preventDefault();const i=mainTabs.indexOf(mainTab),step=e.key==='ArrowLeft'?-1:1;showMainTab(e.key==='Home'?mainTabs[0]:e.key==='End'?mainTabs.at(-1):mainTabs[(i+step+mainTabs.length)%mainTabs.length],true);
  }
 });
}
const renderBeforeNavigation=render;
render=function(){renderBeforeNavigation();localizeNavigation()};
localizeNavigation();showMainTab('shopping');
