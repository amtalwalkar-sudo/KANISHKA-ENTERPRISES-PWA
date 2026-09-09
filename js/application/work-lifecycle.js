import {createWorkApplication as createBaseWorkApplication} from './work-application-lifecycle.js';
import {createOutboxRepository} from '../core/repository.js';

export function createWorkApplication({repository,telemetry}){
  return createBaseWorkApplication({repository:createOutboxRepository(repository),telemetry});
}

export * from './work-application-lifecycle.js';
