// Auditable correction history. Events are append-only infrastructure records.
export const AUDIT_EVENT_TYPES=Object.freeze(['CREATE','CORRECTION','VOID','RESTORE']);
export function createAuditEvent({recordId,eventType,originalId=null,previousValue=null,newValue=null,occurredAt=new Date().toISOString(),actorId=null}={}){
  if(typeof recordId!=='string'||!recordId)throw new TypeError('recordId is required');
  if(!AUDIT_EVENT_TYPES.includes(eventType))throw new TypeError('Invalid audit event type');
  return Object.freeze({id:crypto.randomUUID(),record_id:recordId,event_type:eventType,original_id:originalId,previous_value:previousValue,new_value:newValue,occurred_at:occurredAt,actor_id:actorId});
}
