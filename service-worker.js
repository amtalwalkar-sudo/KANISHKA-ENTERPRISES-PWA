// KFE PWA infrastructure boundary. Application/domain/UI modules are not imported here.
importScripts('./js/pwa/sw-strategies.js');

const CACHE_NAME='kanishka-fleet-beta-v6-android-runtime';
const APP_SHELL=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./js/app.js','./js/ui-shell.js','./js/core/store.js','./js/core/repository.js','./js/core/network.js','./js/core/resilience.js','./js/domain/work.js','./js/domain/fuel.js','./js/domain/expenses.js','./js/domain/revenue.js','./js/domain/maintenance.js','./js/services/background-tracking.js','./js/services/wake-lock.js','./js/services/core-loop.js','./js/pwa/sw-strategies.js','./js/pwa/push-notifications.js','./js/pwa/crash-buffer.js','./js/pwa/silent-recovery.js'];
const LEGACY_PATH='./js/legacy-runtime.js';

async function transform(html){
  if(html.includes('<!-- KFE-12-STEP-UI-SHELL -->'))return html;
  const re=/<script>([\s\S]*?)<\/script>/g;const matches=[...html.matchAll(re)];if(!matches.length)return html;
  const last=matches[matches.length-1];const runtime=last[1].trim()+'\n';
  const body=html.slice(0,last.index)+`<script src="${LEGACY_PATH}"></script><script type="module" src="./js/ui-shell.js"></script><!-- KFE-12-STEP-UI-SHELL -->`+html.slice(last.index+last[0].length);
  const cache=await caches.open(CACHE_NAME);await cache.put(LEGACY_PATH,new Response(runtime,{headers:{'Content-Type':'application/javascript; charset=utf-8'}}));return body;
}
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('sync',event=>{if(event.tag==='kfe-outbox-retry')event.waitUntil(notifyClients('kfe:outbox-retry'));});
async function notifyClients(type){const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});clients.forEach(client=>client.postMessage({type}));}
self.addEventListener('push',event=>{let payload={title:'Kanishka Enterprises',body:'New operational alert',data:{}};try{if(event.data)payload={...payload,...event.data.json()};}catch{try{payload.body=event.data?.text()||payload.body;}catch{}}event.waitUntil(self.registration.showNotification(payload.title,{body:payload.body,data:payload.data||{},tag:'kfe-urgent-alert',renotify:true}));});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(clients=>{const active=clients.find(client=>client.visibilityState==='visible')||clients[0];if(active)return active.focus();return self.clients.openWindow('./');}));});
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(url.origin!==location.origin)return;if(event.request.mode==='navigate'){event.respondWith(transformNavigation(event.request));return;}if(url.pathname.endsWith('/js/legacy-runtime.js')){event.respondWith(caches.match(LEGACY_PATH).then(r=>r||fetch(event.request)));return;}event.respondWith(self.KFE_SW.networkFirst(event.request,CACHE_NAME));});
async function transformNavigation(request){try{const response=await fetch(request);if(!response.ok||!response.headers.get('content-type')?.includes('text/html'))return response;return new Response(await transform(await response.text()),{status:response.status,statusText:response.statusText,headers:response.headers});}catch{return(await caches.match(request))||caches.match('./index.html');}}
