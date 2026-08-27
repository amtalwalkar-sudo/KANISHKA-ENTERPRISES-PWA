import {result,DATA} from './shared.js';
export const ALERT_CALCULATION_VERSION=1;
export function evaluateAlerts({maintenanceAlerts=[],loanDueDays=null,profitMissedBusinessDays=0}={}){const alerts=[...maintenanceAlerts];if(loanDueDays!=null&&loanDueDays<=3)alerts.push({kind:'LOAN_EMI_DUE',severity:'HIGH',dataConfidenceState:'ACTUAL'});if(profitMissedBusinessDays>=3)alerts.push({kind:'TAKE_HOME_TARGET_MISSED',severity:'HIGH',dataConfidenceState:'ACTUAL'});return result(alerts,alerts.length?DATA.ACTUAL:DATA.NOT_APPLICABLE,[]);}
export const ALERT_STATES=Object.freeze(['NEW','ACTIVE','ACKNOWLEDGED','CLEARED']);
