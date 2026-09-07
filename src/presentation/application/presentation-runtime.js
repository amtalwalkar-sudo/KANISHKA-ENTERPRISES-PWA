import { kfePresentationApi, createKfePresentationApi } from './presentation-api.js';

// Stable presentation-runtime bridge for legacy shell consumers. New
// presentation code should prefer the explicit presentation API, while this
// module preserves a single replaceable runtime entry point during migration.
export { kfePresentationApi, createKfePresentationApi };
export const presentationRuntime = kfePresentationApi;
