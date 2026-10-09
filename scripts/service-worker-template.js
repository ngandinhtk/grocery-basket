const CACHE_NAME=__CACHE_NAME__;
const PRECACHE=__PRECACHE__;
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(PRECACHE.map(url=>new Request(url,{cache:'reload'})))));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('smolbasket-')&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/')||url.pathname.startsWith('/auth/'))return;
 if(request.mode==='navigate'&&['/','/index.html'].includes(url.pathname)){
  event.respondWith(caches.open(CACHE_NAME).then(async cache=>await cache.match('/')||fetch(request)));return;
 }
 if(PRECACHE.includes(url.pathname))event.respondWith(caches.open(CACHE_NAME).then(async cache=>await cache.match(url.pathname)||fetch(request)));
});
