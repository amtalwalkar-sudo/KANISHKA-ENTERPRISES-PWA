import {calculateFuelCost,calculateFuelEfficiency} from '../domain/fuel.js';
export function createFuelScreen({state}){return{getViewModel(){const s=state.get('fuel')||{};return{...s,cost:calculateFuelCost(s.litres,s.pricePerLitre),efficiency:calculateFuelEfficiency(s.km,s.litres)};}};}
