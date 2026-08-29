const PREFIX='kfe.draft.';

function keyFor(formId){return `${PREFIX}${String(formId)}`;}

export function createDraftStore(storage=globalThis.localStorage){
  const canUse=!!storage;
  return {
    load(formId){
      if(!canUse)return null;
      try{const raw=storage.getItem(keyFor(formId));return raw?JSON.parse(raw):null;}catch{return null;}
    },
    save(formId,value){
      if(!canUse)return false;
      try{storage.setItem(keyFor(formId),JSON.stringify({savedAt:new Date().toISOString(),value}));return true;}catch{return false;}
    },
    clear(formId){if(!canUse)return false;try{storage.removeItem(keyFor(formId));return true;}catch{return false;}},
    has(formId){return this.load(formId)!==null;}
  };
}

export function isDraftRecord(value){return !!value&&typeof value==='object'&&'savedAt' in value&&'value' in value;}
