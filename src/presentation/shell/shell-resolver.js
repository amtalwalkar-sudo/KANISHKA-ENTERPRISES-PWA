import { KFE_SHELL_SELECTION_KEY, KFE_SHELL_NAMES, normalizeShellName } from './shell-contract.js';
import { getShell } from './shell-registry.js';
import { readKfeShellSelection, persistKfeShellSelection } from '../../../js/ui/shell-selection.js';

function readSelection() {
  const runtime = normalizeShellName(globalThis.KFE_UI_SHELL);
  if (runtime) return runtime;

  const buildTime = normalizeShellName(import.meta.env?.VITE_KFE_UI_SHELL);
  if (buildTime) return buildTime;

  return normalizeShellName(readKfeShellSelection(KFE_SHELL_SELECTION_KEY)) ?? KFE_SHELL_NAMES.CURRENT;
}

export function resolveKfeShell() {
  const requested = readSelection();
  const shell = getShell(requested) ?? getShell(KFE_SHELL_NAMES.CURRENT);
  if (!shell) throw new Error('KFE current shell is not registered.');

  return Object.freeze({
    requested,
    resolved: shell.name,
    shell,
    fallback: requested !== shell.name,
  });
}

export function selectKfeShell(name) {
  const normalized = normalizeShellName(name);
  if (!normalized || !getShell(normalized)) {
    throw new Error(`Unknown KFE shell: ${name}`);
  }
  return persistKfeShellSelection(KFE_SHELL_SELECTION_KEY, normalized);
}
