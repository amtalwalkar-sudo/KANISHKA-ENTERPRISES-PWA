import { kfePresentationApi } from './presentation-api.js';

/**
 * Compatibility adapter for legacy presentation components during the boundary migration.
 * It exposes only the presentation capability facade, never the repository or persistence layer.
 */
export const application = kfePresentationApi;
export const actions = Object.freeze({ dispatch: kfePresentationApi.dispatch });
