// Work-owned calculations. No imports from other screens.
export function calculateWorkDuration(startMs,endMs){if(!Number.isFinite(startMs)||!Number.isFinite(endMs))return 0;return Math.max(0,endMs-startMs);}
export function calculateWorkKm(startOdometer,endOdometer){if(!Number.isFinite(startOdometer)||!Number.isFinite(endOdometer))return 0;return Math.max(0,endOdometer-startOdometer);}
