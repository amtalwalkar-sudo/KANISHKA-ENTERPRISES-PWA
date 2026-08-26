# Business Runtime Gate Proof

This marker exists only to execute the protected browser-runtime validation workflow on a pull request before the runtime gate is merged to `main`.

The gate validates the production Vite build, Vue runtime boundary, screen view-model publication, UI action contract, repository-backed Work start/end behavior, mileage calculation, and browser console/page errors.
