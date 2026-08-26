// Navigation handling is isolated so offline navigation cannot affect asset/data routing.
export async function handleNavigation(request,cacheName,transform){
  try{
    const response=await fetch(request);
    if(!response.ok || !response.headers.get('content-type')?.includes('text/html')) return response;
    const html=await response.text();
    return new Response(await transform(html),{status:response.status,statusText:response.statusText,headers:response.headers});
  }catch{
    return caches.match(request)||caches.match('./index.html');
  }
}
