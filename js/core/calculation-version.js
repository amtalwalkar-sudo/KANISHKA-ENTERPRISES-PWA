// Central calculation-version registry. Registry contains identifiers only; formulas stay in domains.
export function createCalculationVersionRegistry(initial={}){const versions=new Map(Object.entries(initial));return Object.freeze({
  get(domain){return versions.get(domain)||null;},
  set(domain,version){if(typeof domain!=='string'||!domain)throw new TypeError('domain is required');if(!Number.isInteger(version)||version<1)throw new TypeError('calculation version must be a positive integer');versions.set(domain,version);return version;},
  snapshot(){return Object.fromEntries(versions);}
});}
export function assertCalculationVersion(version){if(!Number.isInteger(version)||version<1)throw new TypeError('Invalid calculation version');return version;}
