// Service-worker cache strategies kept separate from application/domain code.
export async function cacheFirst(request,cacheName){
  const cache=await caches.open(cacheName);
  const hit=await cache.match(request);
  if(hit) return hit;
  const response=await fetch(request);
  if(response.ok) await cache.put(request,response.clone());
  return response;
}

export async function networkFirst(request,cacheName){
  const cache=await caches.open(cacheName);
  try{
    const response=await fetch(request);
    if(response.ok) await cache.put(request,response.clone());
    return response;
  }catch{
    return (await cache.match(request))||Response.error();
  }
}
