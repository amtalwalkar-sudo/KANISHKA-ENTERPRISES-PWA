import {updateRecord} from '../core/record.js';
import {FIXED_EXPENSE_STATUS,normalizeFixedExpenseInput,assertNoFixedExpenseOverlap,assertFixedExpenseAmountPaise,assertFixedExpenseFrequency,assertFixedExpenseLifecycle} from '../domain/fixed-expense.js';

const live=rows=>(rows||[]).filter(row=>!row.is_deleted);

export function createFixedExpenseApplication({repository}){
  if(!repository?.entity)throw new TypeError('Fixed expense application requires repository');
  const E=()=>repository.entity('fixed_expenses');
  const list=async()=>live(await E().list());
  const get=id=>E().get(id);
  async function create(input){
    const normalized=normalizeFixedExpenseInput(input);
    assertNoFixedExpenseOverlap(await E().list(),normalized);
    return E().create(normalized,{});
  }
  async function update(id,input){
    const existing=await E().get(id);if(!existing||existing.is_deleted)throw new Error('Fixed expense not found');
    const normalized=normalizeFixedExpenseInput({...existing,...input,amount_paise:input.amount_paise??existing.amount_paise});
    assertNoFixedExpenseOverlap(await E().list(),normalized,id);
    return E().update(existing,normalized);
  }
  async function activate(id){
    const existing=await E().get(id);if(!existing||existing.is_deleted)throw new Error('Fixed expense not found');
    const normalized=normalizeFixedExpenseInput(existing);assertNoFixedExpenseOverlap(await E().list(),normalized,id);
    return E().update(existing,{status:FIXED_EXPENSE_STATUS.ACTIVE});
  }
  async function deactivate(id){
    const existing=await E().get(id);if(!existing||existing.is_deleted)throw new Error('Fixed expense not found');
    if(existing.status===FIXED_EXPENSE_STATUS.INACTIVE)return existing;
    return E().update(existing,{status:FIXED_EXPENSE_STATUS.INACTIVE});
  }
  async function remove(id){
    const existing=await E().get(id);if(!existing||existing.is_deleted)return null;
    return E().softDelete(existing);
  }
  return Object.freeze({list,get,create,update,activate,deactivate,remove,validateAmount:assertFixedExpenseAmountPaise,validateFrequency:assertFixedExpenseFrequency,validateLifecycle:assertFixedExpenseLifecycle});
}
