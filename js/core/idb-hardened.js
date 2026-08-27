// Hardened IndexedDB schema definition. Used as the single schema source for future migrations.
export const DB_NAME='kfe';
export const DB_VERSION=3;
export const STORES=Object.freeze({state:{keyPath:'id'},rides:{keyPath:'id'},logs:{keyPath:'id'},settings:{keyPath:'id'},outbox:{keyPath:'id'},config:{keyPath:'id'},audit:{keyPath:'id'},idempotency:{keyPath:'id'}});
export const STORE_NAMES=Object.freeze(Object.keys(STORES));
