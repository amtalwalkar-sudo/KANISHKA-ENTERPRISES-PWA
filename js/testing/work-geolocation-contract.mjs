import assert from 'node:assert/strict'
import {formatPlaceName, reverseGeocode} from '../services/reverse-geocoding.js'

assert.equal(formatPlaceName({road:'MG Road',city:'Mumbai',state:'Maharashtra',postcode:'400001',country:'India'}),'MG Road, Mumbai, Maharashtra, 400001, India')
assert.equal(formatPlaceName({road:'MG Road',city:'Mumbai',country:'India'}),'MG Road, Mumbai, India')
assert.equal(formatPlaceName(null),'')

let calls=0
const place=await reverseGeocode(19.076,72.8777,{fetchImpl:async(url,options)=>{
  calls++
  assert.match(url,/nominatim\.openstreetmap\.org\/reverse/)
  assert.equal(options.headers.Accept,'application/json')
  return {ok:true,json:async()=>({address:{road:'MG Road',city:'Mumbai',state:'Maharashtra',country:'India'}})}
}})
assert.equal(place,'MG Road, Mumbai, Maharashtra, India')
assert.equal(calls,1)

const failed=await reverseGeocode(19.076,72.8777,{fetchImpl:async()=>({ok:false})})
assert.equal(failed,null)
assert.equal(await reverseGeocode(999,72.8777,{fetchImpl:async()=>({ok:true,json:async()=>({})})}),null)

console.log('WORK_GEOLOCATION_CONTRACT_PASS')
