// Fuel-owned calculations. No imports from other screens.
export function calculateFuelCost(litres,pricePerLitre){const l=Number(litres),p=Number(pricePerLitre);if(!Number.isFinite(l)||!Number.isFinite(p))return 0;return Math.max(0,l)*Math.max(0,p);}
export function calculateFuelEfficiency(km,litres){const d=Number(km),l=Number(litres);if(!Number.isFinite(d)||!Number.isFinite(l)||l<=0)return 0;return Math.max(0,d)/l;}
