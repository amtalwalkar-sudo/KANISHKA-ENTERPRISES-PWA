// KFE PWA infrastructure boundary. Application/domain/UI modules are not imported here.
importScripts('./js/pwa/sw-strategies.js');

// Production CI replaces this source marker with the exact deployment SHA.
const CACHE_NAME='kanishka-fleet-kfe2-source';
const APP_SHELL=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./js/app.js','./js/core/store.js','./js/core/repository.js','./js/core/network.js','./js/core/resilience.js','./js/domain/work.js','./js/domain/fuel.js','./js/domain/expenses.js','./js/domain/revenue.js','./js/domain/maintenance.js','./js/services/background-tracking.js','./js/services/wake-lock.js','./js/services/core-loop.js','./js/pwa/sw-strategies.js','./js/pwa/push-notifications.js','./js/pwa/crash-buffer.js','./js/pwa/silent-recovery.js'];

self.addEventListener('install',event=>event.waitUntil(precacheAppShell().then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('sync',event=>{if(event.tag==='kfe-outbox-retry')event.waitUntil(notifyClients('kfe:outbox-retry'));});
async function notifyClients(type){const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});clients.forEach(client=>client.postMessage({type}));}
self.addEventListener('push',event=>{let payload={title:'Kanishka Enterprises',body:'New operational alert',data:{}};try{if(event.data)payload={...payload,...event.data.json()};}catch{try{payload.body=event.data?.text()||payload.body;}catch{}}event.waitUntil(self.registration.showNotification(payload.title,{body:payload.body,data:payload.data||{},tag:'kfe-urgent-alert',renotify:true}));});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(clients=>{const active=clients.find(client=>client.visibilityState==='visible')||clients[0];if(active)return active.focus();return self.clients.openWindow('./');}));});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;const url=new URL(event.request.url);if(url.origin!==location.origin)return;if(event.request.mode==='navigate'){event.respondWith(transformNavigation(event.request));return;}if(self.KFE_SW.isImmutableAsset(event.request)){event.respondWith(self.KFE_SW.cacheFirst(event.request,CACHE_NAME));return;}event.respondWith(self.KFE_SW.networkFirst(event.request,CACHE_NAME));});

async function precacheAppShell(){const cache=await caches.open(CACHE_NAME);await cache.addAll(APP_SHELL);try{const response=await fetch('./index.html',{cache:'no-store'});if(!response.ok)return;const html=await response.text();const assets=[...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map(match=>new URL(match[1],self.registration.scope)).filter(url=>url.origin===location.origin&&url.pathname.startsWith(new URL(self.registration.scope).pathname)).map(url=>url.toString());if(assets.length)await cache.addAll([...new Set(assets)]);}catch{}}
async function transformNavigation(request){try{const response=await fetch(request);if(!response.ok||!response.headers.get('content-type')?.includes('text/html'))return response;return response;}catch{return(await caches.match(request))||caches.match('./index.html');}}
