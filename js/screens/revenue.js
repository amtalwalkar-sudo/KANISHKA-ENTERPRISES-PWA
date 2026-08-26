import {calculateRevenueTotal} from '../domain/revenue.js';
export function createRevenueScreen({state}){return{getViewModel(){const s=state.get('revenue')||{items:[]};return{...s,total:calculateRevenueTotal(s.items)};}};}
