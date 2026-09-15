<template>
  <section class="admin-page" aria-label="Admin">
    <header class="admin-header">
      <div><small>ADMIN</small><h1>Control &amp; Records</h1><p>Entry, edit and delete area for KFE records, governed by ERP rules.</p></div>
    </header>
    <div class="section-grid">
      <button class="section-card" type="button"><span class="section-icon">🛠️</span><span class="section-copy"><strong>Operations</strong><span>Manage operational records and correct Driver Cockpit data safely.</span></span><span class="chevron">›</span></button>
      <button class="section-card" type="button"><span class="section-icon">💰</span><span class="section-copy"><strong>Finance</strong><span>Maintain loan records, payments, delays and prepayments.</span></span><span class="chevron">›</span></button>
      <button class="section-card" type="button"><span class="section-icon">🎯</span><span class="section-copy"><strong>Target &amp; Break-even</strong><span>Maintain target inputs and ERP-controlled break-even configuration.</span></span><span class="chevron">›</span></button>
      <button class="section-card" type="button"><span class="section-icon">⚙️</span><span class="section-copy"><strong>Settings</strong><span>Backup, restore, themes and controlled testing tools.</span></span><span class="chevron">›</span></button>
    </div>
    <aside class="admin-safety"><span>🛡️</span><div><strong>ERP-controlled changes</strong><p>Invalid or consequential changes are flagged before saving. Admin corrections never edit the database directly.</p></div></aside>
  </section>
</template>

<style scoped>
.admin-page{min-height:100%;box-sizing:border-box;padding:20px 16px 28px;background:#f8fafc;color:#0f172a}.admin-header{margin-bottom:18px}.admin-header small{font-size:.68rem;font-weight:900;letter-spacing:.12em;color:#64748b}.admin-header h1{margin:3px 0 5px;font-size:1.45rem}.admin-header p{margin:0;color:#64748b;font-size:.82rem;line-height:1.4}.section-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.section-card{min-height:150px;text-align:left;border:1px solid #e2e8f0;border-radius:16px;background:#fff;padding:18px;display:flex;flex-direction:column;gap:12px;box-shadow:0 1px 3px rgba(15,23,42,.06);cursor:pointer}.section-icon{font-size:1.7rem}.section-copy{display:flex;flex-direction:column;gap:6px;flex:1}.section-copy strong{font-size:1rem}.section-copy span{font-size:.76rem;line-height:1.35;color:#64748b}.chevron{font-size:1.45rem;color:#94a3b8;line-height:1;align-self:flex-end}.admin-safety{display:flex;gap:11px;align-items:flex-start;margin-top:16px;padding:13px 14px;border:1px solid #cbd5e1;border-radius:12px;background:#fff}.admin-safety strong{font-size:.78rem}.admin-safety p{margin:3px 0 0;color:#64748b;font-size:.7rem;line-height:1.4}@media(max-width:640px){.section-card{min-height:140px;padding:15px}.admin-page{padding-left:12px;padding-right:12px}}
</style>
