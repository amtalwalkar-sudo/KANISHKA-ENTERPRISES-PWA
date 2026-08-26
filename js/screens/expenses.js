import {calculateExpenseTotal} from '../domain/expenses.js';
export function createExpensesScreen({state}){return{getViewModel(){const s=state.get('expenses')||{items:[]};return{...s,total:calculateExpenseTotal(s.items)};}};}
