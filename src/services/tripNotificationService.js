let LocalNotifications = null
let initialized = false

const loadPlugin = async () => {
  if (LocalNotifications) return LocalNotifications
  try { const module = await import('@capacitor/local-notifications'); LocalNotifications = module.LocalNotifications; return LocalNotifications } catch (error) { console.warn('Native notifications unavailable; KFE screen remains the fallback.', error); return null }
}

export const TripNotificationService = {
  async initialize(onAction) {
    if (initialized) return
    const plugin = await loadPlugin(); if (!plugin) return
    try {
      await plugin.requestPermissions()
      await plugin.registerActionTypes({ types: [{ id:'KFE_TRIP_CONTROL', actions:[{id:'START_TRIP',title:'START TRIP'},{id:'END_TRIP',title:'END TRIP'}] }] })
      await plugin.addListener('localNotificationActionPerformed', event => { const action=event?.actionId; if(action==='START_TRIP'||action==='END_TRIP') void onAction(action) })
      initialized=true
    } catch(error){ console.warn('Trip notification setup failed; KFE screen remains the fallback.',error) }
  },
  async showReady() { const plugin=await loadPlugin();if(!plugin)return;try{await plugin.schedule({notifications:[{id:7101,title:'KFE — Shift Active',body:'Ready for next trip',actionTypeId:'KFE_TRIP_CONTROL',ongoing:true,autoCancel:false}]})}catch(e){console.warn('Unable to show Shift notification.',e)} },
  async showTripActive(startedAt) { const plugin=await loadPlugin();if(!plugin)return;try{await plugin.schedule({notifications:[{id:7101,title:'KFE — Trip Active',body:`Started ${new Date(startedAt).toLocaleTimeString()}`,actionTypeId:'KFE_TRIP_CONTROL',ongoing:true,autoCancel:false}]})}catch(e){console.warn('Unable to show Trip notification.',e)} },
  async clear(){const plugin=await loadPlugin();if(!plugin)return;try{await plugin.cancel({notifications:[{id:7101}]})}catch(e){console.warn('Unable to clear Trip notification.',e)}}
}
