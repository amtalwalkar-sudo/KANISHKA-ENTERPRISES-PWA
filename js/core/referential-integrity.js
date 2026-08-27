// Generic relationship validator. Business domains supply relationship definitions later.
export function validateReferences(recordsByStore,relationships=[]){
  const errors=[];
  for(const rule of relationships){
    const source=recordsByStore[rule.sourceStore]||[];
    const target=recordsByStore[rule.targetStore]||[];
    const ids=new Set(target.map(r=>r?.id));
    for(const record of source){
      const value=record?.[rule.foreignKey];
      if(value!=null&&!ids.has(value)) errors.push({sourceStore:rule.sourceStore,sourceId:record?.id,foreignKey:rule.foreignKey,targetStore:rule.targetStore,targetId:value});
    }
  }
  if(errors.length) throw new Error(`Referential integrity violation: ${JSON.stringify(errors)}`);
  return true;
}
export function assertNoOrphans(recordsByStore,relationships){return validateReferences(recordsByStore,relationships);}
