export function createUnsavedGuard({hasChanges=()=>false,onSaveDraft=()=>{},onDiscard=()=>{}}={}){
  return {
    hasChanges(){return Boolean(hasChanges());},
    leave({preserveDraft=true}={}){
      if(!this.hasChanges())return {allowed:true,action:'leave'};
      if(preserveDraft){onSaveDraft();return {allowed:true,action:'draft-saved'};}
      onDiscard();
      return {allowed:true,action:'discarded'};
    }
  };
}
