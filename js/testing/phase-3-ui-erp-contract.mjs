import assert from 'node:assert/strict';
import {createUiCommand,createPresentationState,isUiCommand} from '../application/ui-contract.js';
import {createCommandDispatcher} from '../application/command-dispatcher.js';
import './settings-contract.mjs';

const command=createUiCommand('SELECT_MODULE',{module:'Work'});
assert.equal(command.version,1);
assert.equal(command.type,'SELECT_MODULE');
assert.equal(command.payload.module,'Work');
assert.equal(isUiCommand(command),true);
assert.throws(()=>createUiCommand('RUN_BUSINESS_CALCULATION'),/Unsupported UI command/);
assert.equal(createPresentationState(null).dataConfidenceState,'UNKNOWN');
const seen=[];
const dispatch=createCommandDispatcher({SELECT_MODULE:async payload=>{seen.push(payload);return 'ok';}});
assert.equal(await dispatch(command),'ok');
assert.deepEqual(seen,[{module:'Work'}]);
await assert.rejects(()=>dispatch({version:1,type:'SELECT_MODULE',payload:null}),/Invalid UI command/);
await assert.rejects(()=>dispatch(createUiCommand('RETRY')),/No application handler/);
console.log('PHASE_3_UI_ERP_CONTRACT=PASS');
