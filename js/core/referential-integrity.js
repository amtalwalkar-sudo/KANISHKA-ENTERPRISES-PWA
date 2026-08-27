// KFE foundation referential-integrity contract. Business domains supply relationship definitions later.
export function validateReferences(recordsByStore,relationships=[]){
  if(!recordsByStore||typeof recordsByStore!=='object')throw new TypeError('recordsByStore is required');
  if(!Array.isArray(relationships))throw new TypeError('relationships must be an array');
  const errors=[];
  for(const rule of relationships){
    if(!rule?.sourceStore||!rule?.targetStore||!rule?.foreignKey)throw new TypeError('Relationship requires sourceStore, targetStore and foreignKey');
    const source=recordsByStore[rule.sourceStore]||[];const target=recordsByStore[rule.targetStore]||[];
    const ids=new Set(target.map(r=>r?.id));
    for(const record of source){const value=record?.[rule.foreignKey];if(value!=null&&!ids.has(value))errors.push({sourceStore:rule.sourceStore,sourceId:record?.id,foreignKey:rule.foreignKey,targetStore:rule.targetStore,targetId:value});}
  }
  if(errors.length)throw new Error(`Referential integrity violation: ${JSON.stringify(errors)}`);
  return true;
}
export function assertNoOrphans(recordsByStore,relationships){return validateReferences(recordsByStore,relationships);}
