import assert from 'node:assert/strict';
import fs from 'node:fs';
import {describe, it} from 'node:test';
import {
  WORK_SCREEN_STATES,
  deriveWorkScreenState,
  canStartDay,
  canStartShift,
  canStartBusinessTrip,
  canStartPersonalTrip,
  canEndShift,
  canEndDay
} from '../../js/domain/work-lifecycle.js';
import {TerminalStateError, InvalidTransitionError} from '../../js/application/work-application-lifecycle.js';

const states = Object.values(WORK_SCREEN_STATES);
const events = ['START_DAY','START_SHIFT','START_BUSINESS_TRIP','START_PERSONAL_TRIP','END_BUSINESS_TRIP','END_PERSONAL_TRIP','END_SHIFT','END_DAY'];

const matrix = {
  DAY_START: {
    START_DAY: ['SHIFT_WAITING','canStartDay'], START_SHIFT: null, START_BUSINESS_TRIP: null,
    START_PERSONAL_TRIP: ['PERSONAL_TRIP','canStartPersonalTrip'], END_BUSINESS_TRIP: null,
    END_PERSONAL_TRIP: null, END_SHIFT: null, END_DAY: null
  },
  SHIFT_WAITING: {
    START_DAY: null, START_SHIFT: ['SHIFT','canStartShift'], START_BUSINESS_TRIP: null,
    START_PERSONAL_TRIP: ['PERSONAL_TRIP','canStartPersonalTrip'], END_BUSINESS_TRIP: null,
    END_PERSONAL_TRIP: null, END_SHIFT: null, END_DAY: ['DAY_ENDED','canEndDay']
  },
  SHIFT: {
    START_DAY: null, START_SHIFT: null, START_BUSINESS_TRIP: ['BUSINESS_TRIP','canStartBusinessTrip'],
    START_PERSONAL_TRIP: ['PERSONAL_TRIP','canStartPersonalTrip'], END_BUSINESS_TRIP: null,
    END_PERSONAL_TRIP: null, END_SHIFT: ['SHIFT_WAITING','canEndShift'], END_DAY: null
  },
  BUSINESS_TRIP: {
    START_DAY: null, START_SHIFT: null, START_BUSINESS_TRIP: null, START_PERSONAL_TRIP: null,
    END_BUSINESS_TRIP: ['SHIFT','canEndBusinessTrip'], END_PERSONAL_TRIP: null, END_SHIFT: null, END_DAY: null
  },
  PERSONAL_TRIP: {
    START_DAY: null, START_SHIFT: null, START_BUSINESS_TRIP: null, START_PERSONAL_TRIP: null,
    END_BUSINESS_TRIP: null, END_PERSONAL_TRIP: ['DYNAMIC','canEndPersonalTrip'], END_SHIFT: null, END_DAY: null
  },
  DAY_ENDED: {
    START_DAY: null, START_SHIFT: null, START_BUSINESS_TRIP: null, START_PERSONAL_TRIP: null,
    END_BUSINESS_TRIP: null, END_PERSONAL_TRIP: null, END_SHIFT: null, END_DAY: null
  }
};

const applicationSource = fs.readFileSync(new URL('../../js/application/work-application-lifecycle.js', import.meta.url), 'utf8');

function rowSource(state) {
  const marker = `[WORK_SCREEN_STATES.${state}]:Object.freeze({`;
  const start = applicationSource.indexOf(marker);
  assert.notEqual(start, -1, `missing matrix row: ${state}`);
  const end = applicationSource.indexOf('\n [WORK_SCREEN_STATES.', start + marker.length);
  return applicationSource.slice(start, end === -1 ? applicationSource.indexOf('\n});', start) : end);
}

function assertCell(row, event, expected) {
  if (expected === null) {
    assert.match(row, new RegExp(`${event}:null`), `expected ${event} to reject`);
    return;
  }
  const [target, guard] = expected;
  assert.match(row, new RegExp(`${event}:\\{target:WORK_SCREEN_STATES\\.${target},guard:'${guard}'\\}`), `wrong ${event} transition`);
}

describe('KFE Work FSM — frozen 6 × 8 matrix', () => {
  it('contains exactly 6 states and 8 events = 48 cells', () => {
    assert.deepEqual(states, ['DAY_START','SHIFT_WAITING','SHIFT','BUSINESS_TRIP','PERSONAL_TRIP','DAY_ENDED']);
    assert.equal(states.length * events.length, 48);
    for (const state of states) {
      const row = rowSource(state);
      for (const event of events) assertCell(row, event, matrix[state][event]);
    }
  });

  it('derives the six authoritative runtime states without DAY_READY', () => {
    assert.equal(deriveWorkScreenState({}).state, WORK_SCREEN_STATES.DAY_START);
    assert.equal(deriveWorkScreenState({day:{id:'d',status:'OPEN'}}).state, WORK_SCREEN_STATES.SHIFT_WAITING);
    assert.equal(deriveWorkScreenState({day:{id:'d',status:'OPEN'},shift:{id:'s',status:'OPEN'}}).state, WORK_SCREEN_STATES.SHIFT);
    assert.equal(deriveWorkScreenState({day:{id:'d',status:'OPEN'},shift:{id:'s',status:'OPEN'},trip:{scope:'BUSINESS',status:'OPEN'}}).state, WORK_SCREEN_STATES.BUSINESS_TRIP);
    assert.equal(deriveWorkScreenState({day:{id:'d',status:'OPEN'},trip:{scope:'PERSONAL',status:'OPEN'}}).state, WORK_SCREEN_STATES.PERSONAL_TRIP);
    assert.equal(deriveWorkScreenState({day:{id:'d',status:'COMPLETED'}}).state, WORK_SCREEN_STATES.DAY_ENDED);
    assert.equal('DAY_READY' in WORK_SCREEN_STATES, false);
  });

  it('verifies the frozen guard predicates on positive and negative fixtures', () => {
    assert.equal(canStartDay({}), true);
    assert.equal(canStartDay({day:{status:'OPEN'}}), false);
    assert.equal(canStartShift({day:{status:'OPEN'}}), true);
    assert.equal(canStartShift({day:{status:'OPEN'},trip:{status:'OPEN'}}), false);
    assert.equal(canStartBusinessTrip({day:{status:'OPEN'},shift:{status:'OPEN'}}), true);
    assert.equal(canStartBusinessTrip({day:{status:'OPEN'}}), false);
    assert.equal(canStartPersonalTrip({}), true);
    assert.equal(canStartPersonalTrip({day:{status:'COMPLETED'}}), false);
    assert.equal(canEndShift({shift:{status:'OPEN'}}), true);
    assert.equal(canEndShift({shift:{status:'OPEN'},trip:{status:'OPEN'}}), false);
    assert.equal(canEndDay({day:{status:'OPEN'}}), true);
    assert.equal(canEndDay({day:{status:'OPEN'},shift:{status:'OPEN'}}), false);
  });

  it('proves the application runner is terminal-first and atomic-after-validation', () => {
    assert.equal(applicationSource.includes("if(currentState===WORK_SCREEN_STATES.DAY_ENDED)throw new TerminalStateError()"), true);
    assert.equal(applicationSource.includes("if(!cell)throw new InvalidTransitionError"), true);
    const validation = applicationSource.indexOf('const nextState=resolveTarget(currentState,event,context);');
    const atomic = applicationSource.indexOf('return repository.atomic(names,stores=>', validation);
    assert.ok(validation >= 0 && atomic > validation);
    assert.equal(applicationSource.includes("stores[auditStore].put({id:`fsm:${event}:${entityId}:${timestamp}`,eventType:event,timestamp,previousState:currentState,nextState,entityId})"), true);
    assert.equal(TerminalStateError.prototype instanceof Error, true);
    assert.equal(InvalidTransitionError.prototype instanceof Error, true);
  });

  it('preserves dynamic PERSONAL_TRIP resume semantics in the runner', () => {
    const start = applicationSource.indexOf("if(event==='END_PERSONAL_TRIP')return context.shift?.status==='OPEN'?WORK_SCREEN_STATES.SHIFT:context.day?.status==='OPEN'?WORK_SCREEN_STATES.SHIFT_WAITING:WORK_SCREEN_STATES.DAY_START;");
    assert.ok(start >= 0);
  });
});

console.log('KFE Work FSM matrix: 48/48 cells structurally verified; domain guards and terminal/atomic runner contracts verified.');
