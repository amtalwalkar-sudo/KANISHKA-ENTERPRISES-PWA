// Classic service-worker module loaded with importScripts.
const STATIC_ASSET=/\.(?:css|js|mjs|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|eot|map)$/i;
self.KFE_SW={
  isImmutableAsset(request){
    const url=new URL(request.url);
    return url.pathname.includes('/assets/')||STATIC_ASSET.test(url.pathname);
  },
  async cacheFirst(request,cacheName){
    const cache=await caches.open(cacheName);
    const hit=await cache.match(request);
    if(hit)return hit;
    const response=await fetch(request);
    if(response.ok)await cache.put(request,response.clone());
    return response;
  },
  async staleWhileRevalidate(request,cacheName){
    const cache=await caches.open(cacheName);
    const hit=await cache.match(request);
    const update=fetch(request).then(response=>{if(response.ok)cache.put(request,response.clone());return response;}).catch(()=>null);
    return hit||await update||Response.error();
  },
  async networkFirst(request,cacheName){
    const cache=await caches.open(cacheName);
    try{
      const response=await fetch(request);
      if(response.ok)await cache.put(request,response.clone());
      return response;
    }catch{return (await cache.match(request))||Response.error();}
  }
};
