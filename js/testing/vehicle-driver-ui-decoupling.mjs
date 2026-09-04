import assert from 'node:assert/strict';
import fs from 'node:fs';

const files = [
  'src/components/VehicleModuleView.vue',
  'src/components/DriverModuleView.vue'
];

const forbidden = [
  /localStorage|sessionStorage|indexedDB/i,
  /\bfetch\s*\(/,
  /navigator\.storage/i,
  /from\s+['"](?:\.\.\/)+js\/(?:domain|persistence|services)\//,
  /import\s+[^;]+from\s+['"][^'"]*\/js\/(?:domain|persistence|services)\//
];

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  assert.match(source, /defineProps\(\{\s*application\s*:/, `${file} must receive the application boundary`);
  assert.match(source, /props\.application\.administrator\./, `${file} must use the administrator application boundary`);
  for (const pattern of forbidden) {
    assert.doesNotMatch(source, pattern, `${file}: forbidden direct infrastructure/domain access ${pattern}`);
  }
}

const vehicle = fs.readFileSync(files[0], 'utf8');
const driver = fs.readFileSync(files[1], 'utf8');
assert.match(vehicle, /listVehicles\(\)/);
assert.match(vehicle, /createVehicle\(|updateVehicle\(|retireVehicle\(|sellVehicle\(/);
assert.match(driver, /listDrivers\(\)/);
assert.match(driver, /createDriver\(|updateDriver\(|assignDriver\(|deactivateDriver\(/);

console.log('Vehicle/Driver UI decoupling contract: PASS');
