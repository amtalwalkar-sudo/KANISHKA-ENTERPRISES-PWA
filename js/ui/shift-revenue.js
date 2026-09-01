const ROOT_ID='kfe-shift-revenue-bridge';
const INPUT_ID='kfe-shift-revenue-input';
function inject(){
  const cards=[...document.querySelectorAll('.work-form-card')];
  const card=cards.find(el=>el.textContent.includes('Shift closing details'));
  if(!card){window.__KFE_SHIFT_REVENUE_PAISE=null;return;}
  if(document.getElementById(INPUT_ID))return;
  const label=document.createElement('label');
  label.id=ROOT_ID;
  label.textContent='Revenue *';
  const input=document.createElement('input');
  input.id=INPUT_ID;input.type='number';input.inputMode='decimal';input.min='0';input.step='0.01';input.required=true;input.placeholder='0.00';
  input.setAttribute('aria-label','Revenue required');
  input.addEventListener('input',()=>{const value=Number(input.value);window.__KFE_SHIFT_REVENUE_PAISE=Number.isFinite(value)&&value>=0?Math.round(value*100):null;});
  label.appendChild(input);
  const note=document.createElement('p');note.className='muted';note.textContent='Revenue is compulsory to close the business shift.';
  const cancel=card.querySelector('button.secondary-action');
  if(cancel){card.insertBefore(label,cancel);card.insertBefore(note,cancel);}else card.append(label,note);
  window.__KFE_SHIFT_REVENUE_PAISE=null;
}
function init(){
  if(!document.body)return;
  if(!document.getElementById('kfe-shift-revenue-style')){const style=document.createElement('style');style.id='kfe-shift-revenue-style';style.textContent='#kfe-shift-revenue-bridge{display:grid;gap:6px;font-weight:700}#kfe-shift-revenue-input{width:100%;min-height:50px;padding:11px 13px;border:1px solid var(--kfe-shell-border);border-radius:12px;background:var(--kfe-shell-bg);color:var(--kfe-shell-text);font-size:16px;box-sizing:border-box}';document.head.appendChild(style);}
  const observer=new MutationObserver(inject);observer.observe(document.body,{childList:true,subtree:true});inject();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
