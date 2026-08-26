// KFE modular application shell. The original visual DOM remains untouched, while the
// legacy inline runtime is extracted at navigation time and loaded as an external boundary.
const CACHE_NAME='kanishka-fleet-beta-v3-decoupled';
const APP_SHELL=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./js/app.js','./js/ui-shell.js','./js/core/store.js','./js/dashboard/aggregator.js','./js/domain/work.js','./js/domain/fuel.js','./js/domain/expenses.js','./js/domain/revenue.js','./js/domain/maintenance.js','./js/domain/loan.js','./js/domain/renewals.js','./js/screens/work.js','./js/screens/fuel.js','./js/screens/expenses.js','./js/screens/revenue.js','./js/screens/maintenance.js','./js/screens/loan.js','./js/screens/renewals.js'];
const LEGACY_PATH='./js/legacy-runtime.js';
async function transform(html){
  if(html.includes('<!-- KFE-12-STEP-UI-SHELL -->')) return html;
  const re=/<script>([\s\S]*?)<\/script>/g;
  const matches=[...html.matchAll(re)];
  if(!matches.length) return html;
  const last=matches[matches.length-1];
  const runtime=last[1].trim()+'\n';
  const body=html.slice(0,last.index)+`<script src="${LEGACY_PATH}"></script><script type="module" src="./js/ui-shell.js"></script><!-- KFE-12-STEP-UI-SHELL -->`+html.slice(last.index+last[0].length);
  const cache=await caches.open(CACHE_NAME);
  await cache.put(LEGACY_PATH,new Response(runtime,{headers:{'Content-Type':'application/javascript; charset=utf-8'}}));
  return body;
}
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(url.origin!==location.origin) return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).then(async r=>{
      if(!r.ok || !r.headers.get('content-type')?.includes('text/html')) return r;
      const html=await r.text();
      return new Response(await transform(html),{status:r.status,statusText:r.statusText,headers:r.headers});
    }).catch(()=>caches.match(event.request)));
    return;
  }
  if(url.pathname.endsWith('/js/legacy-runtime.js')){
    event.respondWith(caches.match(LEGACY_PATH).then(r=>r||fetch(event.request)));
    return;
  }
  event.respondWith(fetch(event.request).then(r=>{if(r.ok){const c=r.clone();caches.open(CACHE_NAME).then(x=>x.put(event.request,c));}return r;}).catch(()=>caches.match(event.request)));
});
