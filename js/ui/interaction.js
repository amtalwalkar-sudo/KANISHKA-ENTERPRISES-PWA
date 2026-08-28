export const INTERACTION_STATES=Object.freeze({IDLE:'IDLE',BUSY:'BUSY',SUCCESS:'SUCCESS',ERROR:'ERROR'});

export function createInteractionGuard(){
  let state=INTERACTION_STATES.IDLE;
  return {
    get state(){return state;},
    async run(task){
      if(state===INTERACTION_STATES.BUSY)return {accepted:false,state};
      state=INTERACTION_STATES.BUSY;
      try{const value=await task();state=INTERACTION_STATES.SUCCESS;return {accepted:true,value,state};}
      catch(error){state=INTERACTION_STATES.ERROR;return {accepted:true,error,state};}
    },
    reset(){state=INTERACTION_STATES.IDLE;}
  };
}

export function axisLockedDelta(dx,dy,threshold=8){
  if(Math.max(Math.abs(dx),Math.abs(dy))<threshold)return 'NONE';
  return Math.abs(dx)>=Math.abs(dy)?'HORIZONTAL':'VERTICAL';
}
