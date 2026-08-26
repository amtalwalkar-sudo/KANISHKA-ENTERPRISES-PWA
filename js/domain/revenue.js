// Revenue-owned calculations. No imports from other screens.
export function calculateRevenueTotal(items){if(!Array.isArray(items))return 0;return items.reduce((t,x)=>{const a=Number(x?.amount);return t+(Number.isFinite(a)?Math.max(0,a):0);},0);}
