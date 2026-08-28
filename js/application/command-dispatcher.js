import {isUiCommand} from './ui-contract.js';

export function createCommandDispatcher(handlers={}){
  return async function dispatch(command){
    if(!isUiCommand(command)) throw new Error('Invalid UI command');
    const handler=handlers[command.type];
    if(typeof handler!=='function') throw new Error(`No application handler for ${command.type}`);
    return handler(command.payload);
  };
}
