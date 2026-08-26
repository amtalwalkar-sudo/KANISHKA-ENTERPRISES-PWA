// KFE silent recovery policy.
// Recovery must never interrupt or alter the driver's active screen during a trip.

const RETRY_DELAYS_MS = [1000, 3000, 10000, 30000];

export async function retrySilently(operation, options = {}) {
  const delays = options.delays || RETRY_DELAYS_MS;
  let lastError;
  for (let attempt = 0; attempt <= delays.length; attempt += 1) {
    try { return await operation(attempt); }
    catch (error) {
      lastError = error;
      if (attempt === delays.length) break;
      await new Promise(resolve => setTimeout(resolve, delays[attempt]));
    }
  }
  throw lastError;
}

export function recoveryPolicy() {
  return Object.freeze({
    foreground: 'preserve-current-ui-state',
    activeTrip: 'never-interrupt-driver',
    backgroundFailure: 'retry-silently',
    persistenceFailure: 'retain-local-state-and-retry',
    notificationFailure: 'do-not-block-business-actions',
    userVisibleErrors: 'only-for-actionable-failures'
  });
}
