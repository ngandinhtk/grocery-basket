let mainTab='shopping';
function showMainTab(tab,focus=false){
 if(!['shopping','recipes'].includes(tab))return;
 mainTab=tab;
 for(const name of ['shopping','recipes']){
  const active=name===tab,button=$(`tab-${name}`);
  $(`${name}-panel`).hidden=!active;
  button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;
  if(active&&focus)button.focus();
 }
}
function localizeNavigation(){
 $('main-tabs').setAttribute('aria-label',tr('Shopping and meal planning','Đi chợ và lên thực đơn'));
 $('tab-shopping').textContent=tr('Shopping list','Danh sách đi chợ');
 $('tab-recipes').textContent=tr('Templates & meal ideas','Mẫu & gợi ý món ăn');
}
for(const name of ['shopping','recipes']){
 const button=$(`tab-${name}`);
 button.addEventListener('click',()=>showMainTab(name));
 button.addEventListener('keydown',e=>{
  if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){
   e.preventDefault();showMainTab(e.key==='Home'?'shopping':e.key==='End'?'recipes':mainTab==='shopping'?'recipes':'shopping',true);
  }
 });
}
const renderBeforeNavigation=render;
render=function(){renderBeforeNavigation();localizeNavigation()};
localizeNavigation();showMainTab('shopping');
