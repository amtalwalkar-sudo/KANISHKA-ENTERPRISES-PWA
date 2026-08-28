export function detectUiCapabilities(env=globalThis){
  const nav=env.navigator||{};
  return Object.freeze({
    geolocation:'geolocation' in nav,
    camera:!!env.MediaDevices?.prototype?.getUserMedia || !!nav.mediaDevices?.getUserMedia,
    share:typeof nav.share==='function',
    notifications:'Notification' in env,
    serviceWorker:'serviceWorker' in nav,
    vibration:typeof nav.vibrate==='function',
    wakeLock:!!nav.wakeLock,
    online:typeof nav.onLine==='boolean'?nav.onLine:true
  });
}

export function capabilityFallback(capabilities,name,fallback){
  return capabilities?.[name] ? true : fallback;
}
