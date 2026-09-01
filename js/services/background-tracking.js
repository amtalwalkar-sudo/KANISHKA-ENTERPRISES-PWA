// Hardware boundary: screens consume tracking events, never navigator.geolocation directly.
export function createBackgroundTracking({onPosition=()=>{},onError=()=>{},options={enableHighAccuracy:true,maximumAge:5000,timeout:15000}}={}){
  let watchId=null;
  let active=false;
  return {
    start(){
      if(active)return true;
      if(typeof navigator==='undefined'||!navigator.geolocation){onError(new Error('Geolocation unavailable'));return false;}
      watchId=navigator.geolocation.watchPosition(onPosition,onError,options);
      active=true;
      return true;
    },
    stop(){
      if(watchId!==null&&typeof navigator!=='undefined'&&navigator.geolocation)navigator.geolocation.clearWatch(watchId);
      watchId=null;active=false;
    },
    isActive(){return active;},
    dispose(){this.stop();}
  };
}
